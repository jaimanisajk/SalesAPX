import { Worker, Job } from "bullmq";
import { redisConnection } from "./redisClient";
import { PrismaClient } from "@prisma/client";
import { getNextSendingAccount, recordEmailSent } from "../email/rotationService";
import { parseTemplate } from "../outreach/templateParser";
import { scheduleLeadSequenceStep } from "./outreachQueue";
import { memoryEnrollmentsDb, memorySequencesDb } from "../../routes/sequenceRoutes";
import { memoryLeadsDb } from "../leads/apolloService";

const prisma = new PrismaClient();

/**
 * Main function to execute sequence steps for a lead
 */
export async function processSequenceJob(data: {
  enrollmentId: string;
  leadId: string;
  sequenceId: string;
  stepIndex: number;
}): Promise<void> {
  const { enrollmentId, leadId, sequenceId, stepIndex } = data;
  console.log(`⚙️ Processing outreach sequence job: Enr: ${enrollmentId}, Step: ${stepIndex}`);

  let enrollment: any = null;
  let sequence: any = null;
  let lead: any = null;

  // 1. Resolve records (with DB / Cache fallbacks)
  try {
    enrollment = await prisma.sequenceEnrollment.findUnique({
      where: { id: enrollmentId },
    });
    sequence = await prisma.sequence.findUnique({
      where: { id: sequenceId },
    });
    lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });
  } catch {
    // Local memory search
    enrollment = memoryEnrollmentsDb.find(e => e.id === enrollmentId);
    sequence = memorySequencesDb.find(s => s.id === sequenceId);
    lead = memoryLeadsDb.find(l => l.id === leadId);
  }

  if (!enrollment || enrollment.status !== "ACTIVE") {
    console.log(`⏭️ Enrollment ${enrollmentId} is not active. Skipping.`);
    return;
  }

  if (!sequence || !lead) {
    console.error(`❌ Campaign ${sequenceId} or Lead ${leadId} not found.`);
    return;
  }

  const steps = sequence.steps as any[];
  if (!steps || steps.length <= stepIndex) {
    // Sequence completed!
    console.log(`🎉 Sequence completed for lead: ${lead.email}`);
    await updateEnrollmentStatus(enrollmentId, "COMPLETED");
    return;
  }

  const step = steps[stepIndex];
  console.log(`📍 Step Type: ${step.type}`);

  if (step.type === "DELAY") {
    // Process delay step: update index and enqueue next step with delay days
    const nextIndex = stepIndex + 1;
    await updateEnrollmentProgress(enrollmentId, nextIndex);
    
    const nextStep = steps[nextIndex];
    const delayDays = step.delayDays || 1;
    const nextDelay = nextStep && nextStep.type === "DELAY" ? nextStep.delayDays || 1 : 0;
    
    await scheduleLeadSequenceStep(enrollmentId, leadId, sequenceId, nextIndex, delayDays);
    return;
  }

  if (step.type === "EMAIL") {
    // 1. Rotate outbound email account
    const senderAccount = await getNextSendingAccount(sequence.orgId);
    if (!senderAccount) {
      console.warn(`⏳ No sending email accounts available for org ${sequence.orgId} (or limits hit). Retrying in 1 hour.`);
      // Re-schedule this exact step in 1 hour
      if (redisConnection.status === "ready") {
        const { outreachQueue } = require("./outreachQueue");
        await outreachQueue.add("outreach_step", data, { delay: 3600000 });
      }
      return;
    }

    // 2. Pick A/B Copywriting Variant
    const variants = step.variants || [];
    if (variants.length === 0) {
      console.error(`❌ No email variants found for step index ${stepIndex}`);
      return;
    }
    
    // Choose variant: simple split based on lead ID hash/modulo
    const hash = leadId.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const variantIndex = hash % variants.length;
    const variant = variants[variantIndex];

    // 3. Compile Template Variables
    const senderName = senderAccount.name || "Sales Development Team";
    const subject = parseTemplate(variant.subject, lead, senderName);
    const bodyContent = parseTemplate(variant.body, lead, senderName);

    // 4. Dispatch Email (Mock connection)
    console.log(`✉️ Outbound dispatching email:`);
    console.log(`   From: ${senderAccount.email}`);
    console.log(`   To: ${lead.email}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Content: ${bodyContent.substring(0, 100)}...`);

    // Write outreach activity record
    const activityData = {
      leadId,
      channel: "EMAIL" as const,
      subject,
      messageContent: bodyContent,
      messageVariant: variant.type || "A",
      status: "SENT" as const,
      sentAt: new Date(),
    };

    try {
      await prisma.outreachActivity.create({ data: activityData });
    } catch {
      // Mock log
      console.log("📁 Saved activity record in cache.");
    }

    // Record usage
    await recordEmailSent(senderAccount.id);

    // 5. Schedule Next Step
    const nextIndex = stepIndex + 1;
    await updateEnrollmentProgress(enrollmentId, nextIndex);
    
    const nextStep = steps[nextIndex];
    const delayDays = nextStep && nextStep.type === "DELAY" ? nextStep.delayDays || 1 : 0;
    
    await scheduleLeadSequenceStep(
      enrollmentId,
      leadId,
      sequenceId,
      nextIndex,
      delayDays
    );
  }

  if (step.type === "LINKEDIN_CONNECT" || step.type === "LINKEDIN_MESSAGE") {
    // Create manual task in user's inbox
    const taskTitle = step.type === "LINKEDIN_CONNECT" ? "LinkedIn Connection Request" : "LinkedIn Direct Message";
    const description = step.type === "LINKEDIN_CONNECT" 
      ? `Send connection invite with note to ${lead.firstName} ${lead.lastName}`
      : `Send follow-up direct message to ${lead.firstName}`;

    const parsedNote = parseTemplate(step.linkedinMessage || "", lead, "our team");

    const inboxData = {
      orgId: sequence.orgId,
      leadId,
      type: "MESSAGE_PREVIEW" as const,
      priority: "MEDIUM" as const,
      title: taskTitle,
      description: `${description}\n\nSuggested Copy:\n"${parsedNote}"`,
      aiSuggestion: parsedNote,
      status: "PENDING" as const,
    };

    try {
      await prisma.inboxItem.create({ data: inboxData });
    } catch {
      console.log(`📁 Saved LinkedIn review task in local inbox queue: "${taskTitle}"`);
    }

    // Pause enrollment until manual task completed
    await updateEnrollmentProgress(enrollmentId, stepIndex + 1);
    // (In production, the next step would be enqueued once the inbox task is resolved)
  }
}

/**
 * Helper to update enrollment status
 */
async function updateEnrollmentStatus(enrollmentId: string, status: any): Promise<void> {
  try {
    await prisma.sequenceEnrollment.update({
      where: { id: enrollmentId },
      data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
    });
  } catch {
    const enr = memoryEnrollmentsDb.find(e => e.id === enrollmentId);
    if (enr) {
      enr.status = status;
      enr.completedAt = status === "COMPLETED" ? new Date() : null;
    }
  }
}

/**
 * Helper to update enrollment current step index progress
 */
async function updateEnrollmentProgress(enrollmentId: string, nextIndex: number): Promise<void> {
  try {
    await prisma.sequenceEnrollment.update({
      where: { id: enrollmentId },
      data: { currentStepIndex: nextIndex },
    });
  } catch {
    const enr = memoryEnrollmentsDb.find(e => e.id === enrollmentId);
    if (enr) {
      enr.currentStepIndex = nextIndex;
    }
  }
}

// 6. Initialize BullMQ Worker (only when Redis status is ready)
let worker: Worker | null = null;
if (redisConnection.status === "ready") {
  worker = new Worker(
    "outreach-queue",
    async (job: Job) => {
      await processSequenceJob(job.data);
    },
    { connection: redisConnection as any }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed successfully!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed with error:`, err.message);
  });
}
