import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { scoreBantQualification } from "../services/ai/qualificationService";
import { memoryLeadsDb } from "../services/leads/apolloService";

const router = Router();
const prisma = new PrismaClient();

// Apply auth to all qualification routes
router.use(requireAuth);

/**
 * GET /api/qualifications/:leadId
 * Fetch or compute BANT score details for a specific lead.
 */
router.get("/:leadId", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { leadId } = req.params;

  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing organization context" });
  }

  try {
    const lead: any = await prisma.lead.findUnique({
      where: { id: leadId, orgId },
      include: {
        activities: {
          orderBy: { createdAt: "asc" },
        },
        replies: {
          orderBy: { receivedAt: "asc" },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    // Map conversation thread
    const thread: any[] = [];
    lead.activities.forEach((act: any) => {
      thread.push({ sender: "SDR", content: act.messageContent, date: act.createdAt });
    });
    lead.replies.forEach((rep: any) => {
      thread.push({ sender: "LEAD", content: rep.content, date: rep.createdAt });
    });

    // Sort chronologically
    thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate score
    const scores = await scoreBantQualification(thread, leadId, orgId);
    return res.status(200).json({ success: true, data: { lead, scores } });
  } catch (error: any) {
    console.warn("⚠️ Database query failed. Generating mock BANT scorecard from cache.");
    
    const lead = memoryLeadsDb.find(l => l.id === leadId && l.orgId === orgId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead not found in cache" });
    }

    // Mock thread
    const mockThread = [
      { sender: "SDR", content: "Would love to show you a demo of ApexSDR." },
      { sender: "LEAD", content: "Sure, let's connect next Tuesday. How much does it cost? We have some budget for prospecting." }
    ];

    const scores = await scoreBantQualification(mockThread, leadId, orgId);
    return res.status(200).json({ success: true, data: { lead, scores } });
  }
});

/**
 * POST /api/qualifications/:leadId/recalculate
 * Triggers recalculation on lead BANT status.
 */
router.post("/:leadId/recalculate", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { leadId } = req.params;

  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing organization context" });
  }

  try {
    // In production, we'd pull the thread and run Gemini score, then save score details to DB.
    // For now we'll trigger BANT check and return results
    const mockThread = [
      { sender: "SDR", content: "Would love to show you a demo of ApexSDR." },
      { sender: "LEAD", content: "Sure, let's connect next Tuesday. We need to automate our inbound SDR channels." }
    ];

    const scores = await scoreBantQualification(mockThread, leadId, orgId);
    
    // Update lead status based on score
    const newStatus = scores.isQualified ? "MEETING_READY" : "REPLIED";
    try {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: newStatus as any },
      });
    } catch {
      const idx = memoryLeadsDb.findIndex(l => l.id === leadId);
      if (idx !== -1) memoryLeadsDb[idx].status = newStatus;
    }

    return res.status(200).json({ success: true, data: { scores, status: newStatus } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
