import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { getOrgAnalytics } from "../services/analytics/analyticsService";

const router = Router();

// Apply auth to all analytics routes
router.use(requireAuth);

/**
 * GET /api/analytics
 * Retrieve organization performance metrics and AI agent costs.
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;

  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing organization context" });
  }

  try {
    const stats = await getOrgAnalytics(orgId);
    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error("❌ Analytics router fetch failed:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
