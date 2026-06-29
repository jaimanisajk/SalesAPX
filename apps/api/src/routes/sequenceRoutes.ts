import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// In-memory cache fallback for campaigns and sequence enrollments
export const memorySequencesDb: any[] = [
  {
    id: "campaign_1",
    orgId: "mock-org-123",
    name: "Outbound SaaS Founders Sequence",
    status: "ACTIVE",
    steps: [
      {
        id: "step_1",
        type: "EMAIL",
        delayDays: 0,
        variants: [
          {
            type: "A",
            subject: "Quick question about {{companyName || 'your company'}}",
            body: "Hi {{firstName || 'there'}},\n\nSaw you are heading up tech at {{companyName}}. Are you guys currently looking to automate your SDR team?\n\nBest,\n{{senderName}}",
          },
          {
            type: "B",
            subject: "{{firstName}}, automation question",
            body: "Hey {{firstName}},\n\nWanted to check if {{companyName}} is exploring agentic AI tools for sales development this quarter?\n\nThanks,\n{{senderName}}",
          }
        ]
      },
      {
        id: "step_2",
        type: "DELAY",
        delayDays: 3,
      },
      {
        id: "step_3",
        type: "LINKEDIN_CONNECT",
        delayDays: 0,
        message: "Hi {{firstName}}, would love to connect. I saw your recent updates at {{companyName}}.",
      },
      {
        id: "step_4",
        type: "DELAY",
        delayDays: 2,
      },
      {
        id: "step_5",
        type: "EMAIL",
        delayDays: 0,
        variants: [
          {
            type: "A",
            subject: "Following up: AI SDR demo",
            body: "Hi {{firstName}},\n\nJust bumping this in case it got buried. We are seeing companies replace 100% of cold prospecting manual tasks.\n\nLet me know if you have 10 mins.\n\nBest,\n{{senderName}}",
          }
        ]
      }
    ],
    settings: {
      sendingWindow: "WEEKDAYS_ONLY",
      dailyLimit: 50,
    },
    totalEnrolled: 84,
    totalCompleted: 12,
    totalMeetings: 4,
    replyRate: 15.4,
    meetingRate: 4.8,
    createdAt: new Date(Date.now() - 3600000 * 24 * 7), // 7 days ago
    updatedAt: new Date(Date.now() - 3600000 * 24 * 7),
  },
  {
    id: "campaign_2",
    orgId: "mock-org-123",
    name: "Enterprise FinTech Director outreach",
    status: "DRAFT",
    steps: [
      {
        id: "step_1",
        type: "EMAIL",
        delayDays: 0,
        variants: [
          {
            type: "A",
            subject: "Scaling outbound pipelines at {{companyName}}",
            body: "Hi {{firstName}},\n\nSaw your team is scaling up fintech operations at {{companyName}}...",
          }
        ]
      }
    ],
    settings: {
      sendingWindow: "ANYTIME",
      dailyLimit: 100,
    },
    totalEnrolled: 0,
    totalCompleted: 0,
    totalMeetings: 0,
    replyRate: 0.0,
    meetingRate: 0.0,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2),
  }
];

export const memoryEnrollmentsDb: any[] = [];

// Apply authentication middleware
router.use(requireAuth);

/**
 * GET /api/sequences
 * List all campaigns for the organization.
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;

  try {
    const campaigns = await prisma.sequence.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, data: campaigns });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Reading campaigns from local cache.");
    const campaigns = memorySequencesDb.filter(c => c.orgId === orgId);
    return res.status(200).json({ success: true, data: campaigns });
  }
});

/**
 * POST /api/sequences
 * Create a new campaign.
 */
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { name, steps, settings } = req.body;

  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing organization context" });
  }

  if (!name || !steps || !Array.isArray(steps)) {
    return res.status(400).json({ success: false, error: "Invalid campaign parameters" });
  }

  const campaignData = {
    orgId,
    name,
    status: "DRAFT" as const,
    steps: steps as any,
    settings: settings || { sendingWindow: "WEEKDAYS_ONLY", dailyLimit: 50 },
    totalEnrolled: 0,
    totalCompleted: 0,
    totalMeetings: 0,
    replyRate: 0,
    meetingRate: 0,
  };

  try {
    const result = await prisma.sequence.create({
      data: campaignData,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.warn("⚠️ Database connection failed. Saving campaign to local cache.");
    const mockId = `campaign_${Math.random().toString(36).substr(2, 9)}`;
    const mockCampaign = {
      id: mockId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...campaignData,
    };
    memorySequencesDb.push(mockCampaign);
    return res.status(200).json({ success: true, data: mockCampaign });
  }
});

/**
 * GET /api/sequences/:id
 * Fetch single campaign details.
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;

  try {
    const campaign = await prisma.sequence.findFirst({
      where: { id, orgId },
    });

    if (!campaign) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    return res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Searching campaign in local cache.");
    const campaign = memorySequencesDb.find(c => c.id === id && c.orgId === orgId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: "Campaign not found in cache" });
    }
    return res.status(200).json({ success: true, data: campaign });
  }
});

/**
 * PUT /api/sequences/:id
 * Update sequence steps, name, or settings.
 */
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const { name, steps, settings, status } = req.body;

  try {
    const updated = await prisma.sequence.update({
      where: { id, orgId },
      data: {
        ...(name ? { name } : {}),
        ...(steps ? { steps: steps as any } : {}),
        ...(settings ? { settings } : {}),
        ...(status ? { status } : {}),
      },
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Updating campaign in local cache.");
    const idx = memorySequencesDb.findIndex(c => c.id === id && c.orgId === orgId);
    if (idx !== -1) {
      if (name) memorySequencesDb[idx].name = name;
      if (steps) memorySequencesDb[idx].steps = steps;
      if (settings) memorySequencesDb[idx].settings = settings;
      if (status) memorySequencesDb[idx].status = status;
      memorySequencesDb[idx].updatedAt = new Date();
      return res.status(200).json({ success: true, data: memorySequencesDb[idx] });
    }
    return res.status(404).json({ success: false, error: "Campaign not found in cache" });
  }
});

/**
 * POST /api/sequences/:id/enroll
 * Enroll batch of approved leads into the sequence.
 */
router.post("/:id/enroll", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const { leadIds } = req.body; // Array of lead IDs to enroll

  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ success: false, error: "Missing leadIds to enroll" });
  }

  try {
    // 1. Resolve sequence
    const campaign = await prisma.sequence.findFirst({
      where: { id, orgId },
    });

    if (!campaign) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    // 2. Write sequence enrollments in DB
    const enrollments = [];
    for (const leadId of leadIds) {
      // Check if already enrolled to prevent double enrolling
      const existing = await prisma.sequenceEnrollment.findUnique({
        where: {
          leadId_sequenceId: { leadId, sequenceId: id },
        },
      });

      if (existing) continue;

      const enr = await prisma.sequenceEnrollment.create({
        data: {
          leadId,
          sequenceId: id,
          status: "ACTIVE",
          currentStepIndex: 0,
        },
      });
      
      // Update lead status to IN_SEQUENCE
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: "IN_SEQUENCE" },
      });

      enrollments.push(enr);
    }

    // 3. Update enrolled counters
    await prisma.sequence.update({
      where: { id },
      data: {
        totalEnrolled: { increment: enrollments.length },
        status: "ACTIVE", // Activate sequence automatically when leads are enrolled
      },
    });

    return res.status(200).json({
      success: true,
      message: `Enrolled ${enrollments.length} leads successfully`,
      data: enrollments,
    });
  } catch (error: any) {
    console.warn("⚠️ Database connection failed. Enrolling leads in local cache.");

    // Local cache enrollment fallback
    const campaign = memorySequencesDb.find(c => c.id === id && c.orgId === orgId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    let enrolledCount = 0;
    leadIds.forEach(leadId => {
      const existing = memoryEnrollmentsDb.find(e => e.leadId === leadId && e.sequenceId === id);
      if (!existing) {
        memoryEnrollmentsDb.push({
          id: `enr_${Math.random().toString(36).substr(2, 9)}`,
          leadId,
          sequenceId: id,
          status: "ACTIVE",
          currentStepIndex: 0,
          startedAt: new Date(),
        });
        
        // Update lead in memoryLeadsDb
        const { memoryLeadsDb } = require("./leadRoutes");
        const leadIdx = memoryLeadsDb.findIndex((l: any) => l.id === leadId);
        if (leadIdx !== -1) {
          memoryLeadsDb[leadIdx].status = "IN_SEQUENCE";
        }
        
        enrolledCount++;
      }
    });

    campaign.totalEnrolled += enrolledCount;
    campaign.status = "ACTIVE";

    return res.status(200).json({
      success: true,
      message: `Enrolled ${enrolledCount} leads in cache successfully`,
    });
  }
});

export default router;
