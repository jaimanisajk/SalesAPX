import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { processCalWebhook, memoryMeetingsDb } from "../services/booking/bookingWebhook";

const router = Router();
const prisma = new PrismaClient();

/**
 * PUBLIC/WEBHOOK: POST /api/meetings/webhook
 * Receives booking updates from Cal.com webhook subscriptions.
 */
router.post("/webhook", async (req: Response & any, res: Response) => {
  const { triggerEvent, payload } = req.body;

  if (!triggerEvent || !payload) {
    return res.status(400).json({ success: false, error: "Missing webhook payload details" });
  }

  try {
    const result = await processCalWebhook({ triggerEvent, payload });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Cal.com webhook processor error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Apply auth below
router.use(requireAuth);

/**
 * GET /api/meetings
 * List all registered booked meetings for the organization.
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;

  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing organization context" });
  }

  try {
    const meetings = await prisma.meeting.findMany({
      where: { orgId },
      include: {
        lead: true,
      },
      orderBy: { scheduledAt: "asc" },
    });
    return res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    console.warn("⚠️ Database query failed. Reading booked meetings from local cache.");
    const filtered = memoryMeetingsDb.filter(m => m.orgId === orgId);
    return res.status(200).json({ success: true, data: filtered });
  }
});

export default router;
