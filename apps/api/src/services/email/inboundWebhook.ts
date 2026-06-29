import { PrismaClient } from "@prisma/client";
import { classifyIncomingReply } from "../ai/replyClassifier";
import { memoryLeadsDb } from "../leads/apolloService";

const prisma = new PrismaClient();

// Memory database fallback for inbox items
export const memoryInboxDb: any[] = [
  {
    id: "inbox_1",
    orgId: "mock-org-123",
    leadId: "lead_1",
    lead: {
      id: "lead_1",
      firstName: "Rohan",
      lastName: "Mehta",
      email: "rohan.mehta@groww.in",
      jobTitle: "CTO",
      companyName: "Groww",
    },
    type: "HOT_REPLY",
    priority: "HIGH",
    title: "Rohan Mehta replied: Interested",
    description: "Hey Rohan, saw your email. I'd love to see a demo. What does your calendar look like?",
    aiSuggestion: "Hi Rohan,\n\nThrilled to hear you are interested! You can pick a convenient time on my calendar here: https://calendly.com/sdr-team\n\nLooking forward to speaking!\n\nBest,\nSDR Team",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000 * 1), // 1 hour ago
  }
];

export interface InboundPayload {
  fromEmail: string;
  toEmail: string;
  subject: string;
  content: string;
  messageId?: string;
  inReplyTo?: string;
}

/**
 * Core processor for incoming lead reply webhook.
 * Identifies sender, matches sequence thread, runs AI classifier, and registers Inbox tasks.
 */
export async function processInboundReply(payload: InboundPayload): Promise<any> {
  console.log(`📥 Incoming webhook reply from ${payload.fromEmail} to ${payload.toEmail}`);
  
  let orgId = "mock-org-123";
  let lead: any = null;
  let emailAccount: any = null;
  let lastActivity: any = null;

  // 1. Resolve organization and lead details
  try {
    emailAccount = await prisma.emailAccount.findUnique({
      where: { email: payload.toEmail },
    });
    if (emailAccount) orgId = emailAccount.orgId;

    lead = await prisma.lead.findUnique({
      where: {
        orgId_email: {
          orgId,
          email: payload.fromEmail,
        },
      },
    });

    if (lead) {
      // Find last activity
      lastActivity = await prisma.outreachActivity.findFirst({
        where: { leadId: lead.id, channel: "EMAIL" },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch {
    // Local memory search
    lead = memoryLeadsDb.find(l => l.orgId === orgId && l.email === payload.fromEmail);
  }

  // If lead is not found, provision a mock lead so the webhook is demoable
  if (!lead) {
    console.log(`👤 Lead not found in DB. Creating temporary mock lead for reply processing.`);
    lead = {
      id: `lead_inbound_${Math.random().toString(36).substr(2, 9)}`,
      orgId,
      firstName: payload.fromEmail.split("@")[0].split(".")[0] || "Reply",
      lastName: payload.fromEmail.split("@")[0].split(".")[1] || "Lead",
      email: payload.fromEmail,
      jobTitle: "SDR Target",
      companyName: payload.fromEmail.split("@")[1]?.split(".")[0] || "External",
      status: "PENDING_REVIEW",
    };
    memoryLeadsDb.push(lead);
  }

  // 2. Execute AI Classification
  const classification = await classifyIncomingReply(
    payload.content,
    lastActivity?.messageContent || "",
    orgId
  );

  console.log(`🤖 AI Reply Classification: ${classification.classification} (Sentiment: ${classification.sentiment})`);

  // 3. Update Lead Status and Enrollments based on classification
  let leadStatus = "REPLIED";
  if (classification.classification === "UNSUBSCRIBE" || classification.classification === "NEGATIVE") {
    leadStatus = "ON_DNC";
    await updateLeadDncStatus(lead.id, true);
  } else if (classification.classification === "INTERESTED") {
    leadStatus = "INTERESTED";
  }

  await updateLeadStatus(lead.id, leadStatus);

  // Pause sequence enrollments if lead replied
  await pauseActiveSequenceEnrollments(lead.id, `Replied: ${classification.classification}`);

  // 4. Create Reply Record
  const replyData = {
    leadId: lead.id,
    activityId: lastActivity?.id || null,
    channel: "EMAIL" as const,
    content: payload.content,
    classification: classification.classification,
    sentiment: classification.sentiment,
    keyPoints: classification.keyPoints,
    suggestedAction: classification.suggestedAction,
    aiResponse: classification.suggestedReplyDraft,
  };

  let savedReply: any = null;
  try {
    savedReply = await prisma.reply.create({
      data: replyData,
    });
  } catch {
    savedReply = {
      id: `reply_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      ...replyData,
    };
  }

  // 5. Create InboxItem for Human-in-the-Loop approval
  const isHotReply = ["INTERESTED", "NEEDS_MORE_INFO", "OBJECTION", "WRONG_PERSON", "POSITIVE_REFERRAL"].includes(
    classification.classification
  );

  if (isHotReply) {
    const inboxData = {
      orgId,
      leadId: lead.id,
      replyId: savedReply.id,
      type: "HOT_REPLY" as const,
      priority: classification.classification === "INTERESTED" ? ("HIGH" as const) : ("MEDIUM" as const),
      title: `${lead.firstName} ${lead.lastName} (${lead.companyName}) replied: ${classification.classification.replace(/_/g, " ")}`,
      description: payload.content,
      aiSuggestion: classification.suggestedReplyDraft,
      status: "PENDING" as const,
    };

    try {
      await prisma.inboxItem.create({
        data: inboxData,
      });
    } catch {
      // Memory db push
      const mockInboxItem = {
        id: `inbox_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        lead,
        ...inboxData,
      };
      memoryInboxDb.push(mockInboxItem);
      console.log(`📁 Saved Hot Reply to Local Inbox Cache.`);
    }
  }

  return { success: true, classification };
}

// Helper methods with db/cache safety
async function updateLeadStatus(leadId: string, status: any) {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });
  } catch {
    const idx = memoryLeadsDb.findIndex(l => l.id === leadId);
    if (idx !== -1) memoryLeadsDb[idx].status = status;
  }
}

async function updateLeadDncStatus(leadId: string, isOnDNC: boolean) {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { isOnDNC, status: "ON_DNC" },
    });
  } catch {
    const idx = memoryLeadsDb.findIndex(l => l.id === leadId);
    if (idx !== -1) {
      memoryLeadsDb[idx].isOnDNC = isOnDNC;
      memoryLeadsDb[idx].status = "ON_DNC";
    }
  }
}

async function pauseActiveSequenceEnrollments(leadId: string, reason: string) {
  try {
    await prisma.sequenceEnrollment.updateMany({
      where: { leadId, status: "ACTIVE" },
      data: { status: "PAUSED", pausedReason: reason },
    });
  } catch {
    const { memoryEnrollmentsDb } = require("../../routes/sequenceRoutes");
    memoryEnrollmentsDb.forEach((e: any) => {
      if (e.leadId === leadId && e.status === "ACTIVE") {
        e.status = "PAUSED";
        e.pausedReason = reason;
      }
    });
  }
}
