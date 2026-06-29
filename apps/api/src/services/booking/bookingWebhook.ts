import { PrismaClient } from "@prisma/client";
import { memoryLeadsDb } from "../leads/apolloService";

const prisma = new PrismaClient();

// Memory database fallback for booked meetings
export const memoryMeetingsDb: any[] = [
  {
    id: "meeting_1",
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
    title: "ApexSDR Product Demo & Onboarding",
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2), // 2 days from now
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2 + 1800000), // 30 mins
    status: "BOOKED",
    calBookingUid: "cal_uid_9981",
    createdAt: new Date(),
  }
];

export interface CalWebhookPayload {
  triggerEvent: "BOOKING_CREATED" | "BOOKING_CANCELLED" | "BOOKING_RESCHEDULED";
  payload: {
    uid: string;
    title: string;
    startTime: string;
    endTime: string;
    attendees: Array<{
      email: string;
      name: string;
    }>;
  };
}

/**
 * Handle Cal.com incoming booking webhooks.
 * Registers meeting, updates lead status to MEETING_BOOKED, and stops active sequences.
 */
export async function processCalWebhook(payload: CalWebhookPayload): Promise<any> {
  console.log(`📅 Cal.com Webhook received Event: ${payload.triggerEvent}`);
  const { uid, title, startTime, endTime, attendees } = payload.payload;
  
  const attendee = attendees?.[0];
  if (!attendee) {
    console.error("❌ Webhook does not contain attendee information.");
    return { success: false, error: "Missing attendee" };
  }

  const attendeeEmail = attendee.email;
  let orgId = "mock-org-123";
  let lead: any = null;

  // 1. Locate Lead
  try {
    lead = await prisma.lead.findFirst({
      where: { email: attendeeEmail },
    });
    if (lead) orgId = lead.orgId;
  } catch {
    lead = memoryLeadsDb.find(l => l.email === attendeeEmail);
  }

  if (!lead) {
    console.warn(`👤 Lead not found for booked email ${attendeeEmail}. Creating temporary lead.`);
    lead = {
      id: `lead_booking_${Math.random().toString(36).substr(2, 9)}`,
      orgId,
      firstName: attendee.name.split(" ")[0] || "Booked",
      lastName: attendee.name.split(" ").slice(1).join(" ") || "Lead",
      email: attendeeEmail,
      jobTitle: "Prospect",
      companyName: attendeeEmail.split("@")[1]?.split(".")[0] || "Unknown",
      status: "MEETING_BOOKED",
    };
    memoryLeadsDb.push(lead);
  }

  // 2. Perform actions based on webhook trigger event
  const isCreated = payload.triggerEvent === "BOOKING_CREATED" || payload.triggerEvent === "BOOKING_RESCHEDULED";
  const newStatus = isCreated ? ("SCHEDULED" as const) : ("CANCELLED" as const);

  // Update Lead status
  const leadStatus = isCreated ? "MEETING_BOOKED" : "REPLIED";
  await updateLeadStatus(lead.id, leadStatus);

  // Pause sequence enrollments if booked
  if (isCreated) {
    await pauseActiveEnrollments(lead.id, `Meeting booked: ${title}`);
  }

  // 3. Register or Update Meeting record
  const meetingData = {
    orgId,
    leadId: lead.id,
    title,
    scheduledAt: new Date(startTime),
    status: newStatus,
    calendarEventId: uid,
  };

  try {
    const existing = await prisma.meeting.findFirst({
      where: { calendarEventId: uid },
    });

    if (existing) {
      await prisma.meeting.update({
        where: { id: existing.id },
        data: {
          scheduledAt: meetingData.scheduledAt,
          status: meetingData.status,
        },
      });
    } else {
      await prisma.meeting.create({
        data: meetingData,
      });
    }
  } catch {
    // Memory Cache
    const existingIdx = memoryMeetingsDb.findIndex(m => m.calBookingUid === uid);
    if (existingIdx !== -1) {
      memoryMeetingsDb[existingIdx].scheduledAt = meetingData.scheduledAt;
      memoryMeetingsDb[existingIdx].status = meetingData.status;
    } else {
      memoryMeetingsDb.push({
        id: `meeting_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        lead,
        startsAt: startTime,
        endsAt: endTime,
        calBookingUid: uid,
        ...meetingData,
      });
    }
    console.log(`📁 Booked meeting registered in local memory queue.`);
  }

  return { success: true, newStatus };
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

async function pauseActiveEnrollments(leadId: string, reason: string) {
  try {
    await prisma.sequenceEnrollment.updateMany({
      where: { leadId, status: "ACTIVE" },
      data: { status: "COMPLETED", exitReason: reason },
    });
  } catch {
    const { memoryEnrollmentsDb } = require("../../routes/sequenceRoutes");
    memoryEnrollmentsDb.forEach((e: any) => {
      if (e.leadId === leadId && e.status === "ACTIVE") {
        e.status = "COMPLETED";
        e.exitReason = reason;
      }
    });
  }
}
