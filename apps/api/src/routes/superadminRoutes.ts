import { Router, Request, Response } from "express";
import { PrismaClient, Plan } from "@prisma/client";
import { createCheckoutSession } from "../services/billing/billingService";

const router = Router();
const prisma = new PrismaClient();

/**
 * Superadmin: Fetch all platform organizations
 */
router.get("/organisations", async (req: Request, res: Response) => {
  try {
    const orgs = await prisma.organisation.findMany({
      include: {
        users: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, organisations: orgs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Superadmin: Update organization settings
 */
router.post("/organisations/:id/settings", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { plan, isActive, seats, monthlyLeadLimit } = req.body;

  try {
    const org = await prisma.organisation.update({
      where: { id },
      data: {
        plan: plan as Plan,
        isActive: isActive !== undefined ? !!isActive : undefined,
        seats: seats !== undefined ? Number(seats) : undefined,
        monthlyLeadLimit: monthlyLeadLimit !== undefined ? Number(monthlyLeadLimit) : undefined,
      },
    });

    res.json({ success: true, organisation: org });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Superadmin: Fetch global platform metrics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const totalOrgs = await prisma.organisation.count();
    const totalUsers = await prisma.user.count();
    const totalLeads = await prisma.lead.count();

    const aiLogsAggregate = await prisma.aILog.aggregate({
      _sum: {
        costUSD: true,
      },
      _count: {
        id: true,
      },
    });

    res.json({
      success: true,
      stats: {
        totalOrgs,
        totalUsers,
        totalLeads,
        totalAICalls: aiLogsAggregate._count.id || 0,
        totalAICostUSD: aiLogsAggregate._sum.costUSD || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Tenant Billing: Upgrade checkout trigger
 */
router.post("/billing/checkout", async (req: Request, res: Response) => {
  const orgId = req.body.orgId || "default-org-id";
  const { plan } = req.body;

  try {
    const session = await createCheckoutSession(orgId, plan);
    res.json({ success: true, checkoutUrl: session.checkoutUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Tenant Billing: Handle mock Stripe checkout callback to perform upgrade
 */
router.post("/billing/upgrade-confirm", async (req: Request, res: Response) => {
  const orgId = req.body.orgId || "default-org-id";
  const { plan } = req.body;

  try {
    const org = await prisma.organisation.update({
      where: { id: orgId },
      data: {
        plan: plan as Plan,
        monthlyLeadLimit: plan === "GROWTH" ? 1000 : plan === "ENTERPRISE" ? 999999 : 250,
      },
    });
    res.json({ success: true, organisation: org });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
