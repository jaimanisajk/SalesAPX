import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { generateOutboundCopy } from "../services/ai/copywritingService";

const router = Router();

// Apply auth middleware to all copywriter routes
router.use(requireAuth);

/**
 * POST /api/copywriter/generate
 * Generate cold outreach email copy using Google Gemini 1.5 Flash
 */
router.post("/generate", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { leadSegmentDescription, valueProposition, tone, cta, lengthLimit } = req.body;

  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing organization context" });
  }

  if (!leadSegmentDescription || !valueProposition) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters (leadSegmentDescription, valueProposition)",
    });
  }

  const inputs = {
    leadSegmentDescription,
    valueProposition,
    tone: tone || "PROFESSIONAL",
    cta: cta || "Reply to this email",
    lengthLimit: lengthLimit || "MEDIUM",
  };

  try {
    const copyResult = await generateOutboundCopy(inputs, orgId);
    return res.status(200).json({ success: true, data: copyResult });
  } catch (error: any) {
    console.error("❌ Copywriting router failed:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
