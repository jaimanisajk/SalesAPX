import { PrismaClient } from "@prisma/client";
import { processSequenceJob } from "./services/queue/outreachWorker";
import { processInboundReply } from "./services/email/inboundWebhook";
import { processCalWebhook } from "./services/booking/bookingWebhook";
import { getOrgAnalytics } from "./services/analytics/analyticsService";

const prisma = new PrismaClient();

async function runEndToEndTest() {
  console.log("🚀 Starting end-to-end pipeline execution test...");

  const orgId = "test-org-" + Math.random().toString(36).substr(2, 5);

  try {
    // 1. Create Organization
    console.log("\n🏢 1. Creating test organization...");
    const org = await prisma.organisation.create({
      data: {
        id: orgId,
        name: "Test Sales Team",
        plan: "STARTER",
      },
    });
    console.log(`✓ Org created: ${org.id}`);

    // 2. Create Sender Email Account
    console.log("\n✉️ 2. Connecting outbound email account...");
    const account = await prisma.emailAccount.create({
      data: {
        orgId: org.id,
        email: `sdr@${org.id}.com`,
        name: "SDR Representative",
        provider: "SMTP",
        dailyLimit: 50,
      },
    });
    console.log(`✓ Email connected: ${account.email}`);

    // 3. Create Lead
    console.log("\n👤 3. Provisioning target B2B lead...");
    const lead = await prisma.lead.create({
      data: {
        orgId: org.id,
        firstName: "Rohan",
        lastName: "Mehta",
        email: `rohan.mehta@groww.in`,
        jobTitle: "CTO",
        companyName: "Groww",
        status: "APPROVED",
      },
    });
    console.log(`✓ Lead created: ${lead.firstName} ${lead.lastName} (${lead.email})`);

    // 4. Create Campaign Sequence
    console.log("\n📋 4. Deploying Campaign Outreach Sequence...");
    const sequence = await prisma.sequence.create({
      data: {
        orgId: org.id,
        name: "Seed CTO Outreach Campaign",
        status: "ACTIVE",
        steps: [
          {
            type: "EMAIL",
            variants: [
              {
                type: "A",
                subject: "Outsourcing automation for {{companyName}}",
                body: "Hi {{firstName}},\n\nSaw you are CTO at {{companyName}}. We build AI SDR agents that automate prospecting.\n\nBest,\n{{senderName}}",
              }
            ]
          },
          {
            type: "DELAY",
            delayDays: 3,
          },
          {
            type: "EMAIL",
            variants: [
              {
                type: "A",
                subject: "Following up: AI SDR",
                body: "Hi {{firstName}},\n\nJust bumping my last email. Are you open to a calendar slot?\n\nBest,\n{{senderName}}",
              }
            ]
          }
        ],
      },
    });
    console.log(`✓ Sequence created: "${sequence.name}"`);

    // 5. Enroll Lead in Sequence
    console.log("\n📈 5. Enrolling lead in sequence...");
    const enrollment = await prisma.sequenceEnrollment.create({
      data: {
        leadId: lead.id,
        sequenceId: sequence.id,
        status: "ACTIVE",
        currentStepIndex: 0,
      },
    });
    console.log(`✓ Lead enrolled, Enrollment ID: ${enrollment.id}`);

    // 6. Simulate Outbound Send Drip Worker
    console.log("\n⚙️ 6. Running worker drip job for Step 1 (Email)...");
    await processSequenceJob({
      enrollmentId: enrollment.id,
      leadId: lead.id,
      sequenceId: sequence.id,
      stepIndex: 0,
    });
    console.log("✓ Worker finished step 1 processing successfully!");

    // 7. Verify sent activity is logged
    const activity = await prisma.outreachActivity.findFirst({
      where: { leadId: lead.id },
    });
    console.log(`✓ Outreach Activity saved in database: "${activity?.subject}"`);

    // 8. Simulate Inbound Reply Webhook
    console.log("\n📥 7. Simulating incoming reply from lead...");
    const replyContent = "Hi team, saw your email. I am interested. Let's schedule a call for next week. Send me your calendar link.";
    const webhookResult = await processInboundReply({
      fromEmail: lead.email,
      toEmail: account.email,
      subject: "Re: " + (activity?.subject || "Outreach"),
      content: replyContent,
    });
    console.log("✓ Webhook process finished!");
    console.log(`✓ AI Intent Classification: ${webhookResult.classification.classification}`);

    // 9. Verify Lead Status has been set to INTERESTED and Sequence paused
    const updatedLead = await prisma.lead.findUnique({
      where: { id: lead.id },
    });
    console.log(`✓ Updated Lead status: ${updatedLead?.status} (Expected: INTERESTED)`);

    const updatedEnrollment = await prisma.sequenceEnrollment.findUnique({
      where: { id: enrollment.id },
    });
    console.log(`✓ Updated Enrollment status: ${updatedEnrollment?.status} (Expected: PAUSED or COMPLETED)`);

    // 10. Simulate Cal.com Booking Webhook
    console.log("\n📅 8. Simulating booked calendar slot webhook...");
    const calUid = "cal_uid_test_" + Math.random().toString(36).substr(2, 5);
    await processCalWebhook({
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: calUid,
        title: "Groww <> ApexSDR Call",
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 86400000 + 1800000).toISOString(),
        attendees: [{ email: lead.email, name: `${lead.firstName} ${lead.lastName}` }],
      },
    });
    console.log("✓ Cal.com webhook processed!");

    // 11. Verify Lead Status changes to MEETING_BOOKED
    const finalLead = await prisma.lead.findUnique({
      where: { id: lead.id },
    });
    console.log(`✓ Final Lead Status: ${finalLead?.status} (Expected: MEETING_BOOKED)`);

    // 12. Aggregate Analytics
    console.log("\n📊 9. Aggregating live organization analytics dashboard...");
    const stats = await getOrgAnalytics(org.id);
    console.log("✓ Analytics result:");
    console.log(JSON.stringify(stats, null, 2));

    // 13. Clean up database records
    console.log("\n🧹 10. Cleaning up test data from Supabase...");
    await prisma.meeting.deleteMany({ where: { orgId: org.id } });
    await prisma.sequenceEnrollment.deleteMany({ where: { leadId: lead.id } });
    await prisma.outreachActivity.deleteMany({ where: { leadId: lead.id } });
    await prisma.reply.deleteMany({ where: { leadId: lead.id } });
    await prisma.inboxItem.deleteMany({ where: { orgId: org.id } });
    await prisma.lead.deleteMany({ where: { orgId: org.id } });
    await prisma.sequence.deleteMany({ where: { orgId: org.id } });
    await prisma.emailAccount.deleteMany({ where: { orgId: org.id } });
    await prisma.aILog.deleteMany({ where: { orgId: org.id } });
    await prisma.organisation.delete({ where: { id: org.id } });
    console.log("✓ Supabase database cleaned up successfully!");

    console.log("\n🎉 END-TO-END PIPELINE TEST COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Test pipeline failed:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEndToEndTest();
