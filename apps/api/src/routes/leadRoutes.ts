import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { importLeadsFromApollo, memoryLeadsDb } from "../services/leads/apolloService";
import { scoreLead } from "../services/ai/scoringAgent";

const router = Router();
const prisma = new PrismaClient();

// Seed initial mock data in memory DB if it is empty
if (memoryLeadsDb.length === 0) {
  const mockInitialLeads = [
    {
      id: "lead_1",
      orgId: "mock-org-123",
      firstName: "Rohan",
      lastName: "Mehta",
      email: "rohan.mehta@groww.in",
      jobTitle: "CTO",
      companyName: "Groww",
      companyDomain: "groww.in",
      companySize: 950,
      industry: "FinTech",
      geography: "India",
      fitScore: 88,
      fitScoreReasons: ["Job title matches target 'CTO'", "Company size is in ideal range", "Located in key region: India"],
      status: "PENDING_REVIEW",
      source: "APOLLO",
      createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      updatedAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      id: "lead_2",
      orgId: "mock-org-123",
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "sarah.j@lattice.com",
      jobTitle: "Director of HR",
      companyName: "Lattice",
      companyDomain: "lattice.com",
      companySize: 450,
      industry: "SaaS",
      geography: "United States",
      fitScore: 78,
      fitScoreReasons: ["Title is relevant ('Director')", "SaaS industry is target segment", "Size within limits"],
      status: "PENDING_REVIEW",
      source: "APOLLO",
      createdAt: new Date(Date.now() - 3600000 * 5),
      updatedAt: new Date(Date.now() - 3600000 * 5),
    },
    {
      id: "lead_3",
      orgId: "mock-org-123",
      firstName: "Divya",
      lastName: "Nair",
      email: "divya.n@razorpay.com",
      jobTitle: "VP of Product",
      companyName: "Razorpay",
      companyDomain: "razorpay.com",
      companySize: 1800,
      industry: "FinTech",
      geography: "India",
      fitScore: 92,
      fitScoreReasons: ["High match title: VP of Product", "High match industry: FinTech", "Ideal employee size"],
      status: "APPROVED",
      source: "APOLLO",
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date(Date.now() - 3600000 * 12),
    },
    {
      id: "lead_4",
      orgId: "mock-org-123",
      firstName: "David",
      lastName: "Miller",
      email: "david@consultinggroup.local",
      jobTitle: "Junior Designer",
      companyName: "Freelance",
      companyDomain: "consultinggroup.local",
      companySize: 2,
      industry: "Consulting",
      geography: "Germany",
      fitScore: 15,
      fitScoreReasons: ["Title is non-decisionmaker", "Company size is below target limit", "Excluded industry keyword: consulting"],
      status: "REJECTED",
      source: "APOLLO",
      createdAt: new Date(Date.now() - 3600000 * 24),
      updatedAt: new Date(Date.now() - 3600000 * 24),
    }
  ];
  memoryLeadsDb.push(...mockInitialLeads);
}

// Apply auth to all lead routes
router.use(requireAuth);

/**
 * GET /api/leads
 * Get leads filtered by status and orgId
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const status = req.query.status as string;

  try {
    const leads = await prisma.lead.findMany({
      where: {
        orgId,
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, data: leads });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Reading leads from local cache.");
    const filteredLeads = memoryLeadsDb.filter(
      l => l.orgId === orgId && (!status || l.status === status)
    );
    return res.status(200).json({ success: true, data: filteredLeads });
  }
});

/**
 * POST /api/leads/approve
 * Bulk approve leads
 */
router.post("/approve", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { leadIds } = req.body;

  if (!leadIds || !Array.isArray(leadIds)) {
    return res.status(400).json({ success: false, error: "Invalid leadIds list" });
  }

  try {
    await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        orgId,
      },
      data: { status: "APPROVED" },
    });
    return res.status(200).json({ success: true, message: `Successfully approved ${leadIds.length} leads` });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Approving leads in local cache.");
    leadIds.forEach(id => {
      const idx = memoryLeadsDb.findIndex(l => l.id === id && l.orgId === orgId);
      if (idx !== -1) {
        memoryLeadsDb[idx].status = "APPROVED";
      }
    });
    return res.status(200).json({ success: true, message: `Successfully approved ${leadIds.length} leads in cache` });
  }
});

/**
 * POST /api/leads/reject
 * Bulk reject leads
 */
router.post("/reject", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { leadIds } = req.body;

  if (!leadIds || !Array.isArray(leadIds)) {
    return res.status(400).json({ success: false, error: "Invalid leadIds list" });
  }

  try {
    await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        orgId,
      },
      data: { status: "REJECTED" },
    });
    return res.status(200).json({ success: true, message: `Successfully rejected ${leadIds.length} leads` });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Rejecting leads in local cache.");
    leadIds.forEach(id => {
      const idx = memoryLeadsDb.findIndex(l => l.id === id && l.orgId === orgId);
      if (idx !== -1) {
        memoryLeadsDb[idx].status = "REJECTED";
      }
    });
    return res.status(200).json({ success: true, message: `Successfully rejected ${leadIds.length} leads in cache` });
  }
});

/**
 * POST /api/leads/import/apollo
 * Trigger Apollo lead search and import matching ICP
 */
router.post("/import/apollo", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { icpProfileId, count } = req.body;

  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing organization context" });
  }

  try {
    // Resolve ICP profile
    let icpProfile = null;
    try {
      icpProfile = await prisma.iCPProfile.findUnique({
        where: { id: icpProfileId },
      });
    } catch {
      // Find from memory
      const { memoryIcpDb } = require("./icpRoutes");
      icpProfile = memoryIcpDb.find((p: any) => p.id === icpProfileId && p.orgId === orgId);
    }

    if (!icpProfile) {
      // Use fallback default configuration
      icpProfile = {
        industries: ["SaaS", "FinTech"],
        jobTitles: ["CTO", "VP of Product"],
        seniorityLevels: ["C-Suite", "VP"],
        companySizeMin: 10,
        companySizeMax: 1000,
        geographies: ["India", "United States"],
        techStack: [],
        intentKeywords: [],
        excludeKeywords: [],
      };
    }

    const targetCount = count ? Number(count) : 5;
    const leads = await importLeadsFromApollo(icpProfile, orgId, targetCount);

    return res.status(200).json({ success: true, message: `Imported ${leads.length} leads successfully`, data: leads });
  } catch (error: any) {
    console.error("❌ Lead import handler failed:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/leads/import/csv
 * Bulk import leads from CSV data
 */
router.post("/import/csv", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { leads, icpProfileId } = req.body;

  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing organization context" });
  }

  if (!leads || !Array.isArray(leads)) {
    return res.status(400).json({ success: false, error: "Invalid CSV leads data structure" });
  }

  try {
    // Resolve ICP profile
    let icpProfile = null;
    try {
      icpProfile = await prisma.iCPProfile.findUnique({
        where: { id: icpProfileId },
      });
    } catch {
      const { memoryIcpDb } = require("./icpRoutes");
      icpProfile = memoryIcpDb.find((p: any) => p.id === icpProfileId && p.orgId === orgId);
    }

    if (!icpProfile) {
      icpProfile = {
        industries: [],
        jobTitles: [],
        seniorityLevels: [],
        companySizeMin: 1,
        companySizeMax: 100000,
        geographies: [],
        techStack: [],
        intentKeywords: [],
        excludeKeywords: [],
      };
    }

    const imported: any[] = [];

    for (const leadData of leads) {
      const email = leadData.email;
      if (!email) continue;

      const fullLead = {
        orgId,
        firstName: leadData.firstName || "",
        lastName: leadData.lastName || "",
        email,
        phone: leadData.phone || null,
        linkedinUrl: leadData.linkedinUrl || null,
        jobTitle: leadData.jobTitle || "Unknown Title",
        companyName: leadData.companyName || "Unknown Company",
        companyDomain: leadData.companyDomain || null,
        companySize: leadData.companySize ? Number(leadData.companySize) : null,
        industry: leadData.industry || null,
        geography: leadData.geography || null,
        fitScore: 0,
        fitScoreReasons: [] as string[],
        status: "PENDING_REVIEW" as any,
        source: "CSV_IMPORT" as const,
      };

      // Score CSV lead
      const scoreResult = await scoreLead(fullLead, icpProfile, orgId);
      fullLead.fitScore = scoreResult.score;
      fullLead.fitScoreReasons = scoreResult.reasons;
      if (scoreResult.recommendation === "REJECT") {
        fullLead.status = "REJECTED";
      }

      let savedLead;
      try {
        savedLead = await prisma.lead.create({ data: fullLead });
      } catch {
        // Local Cache save
        const mockId = `lead_csv_${Math.random().toString(36).substr(2, 9)}`;
        savedLead = {
          id: mockId,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...fullLead,
        };
        memoryLeadsDb.push(savedLead);
      }
      imported.push(savedLead);
    }

    return res.status(200).json({ success: true, message: `Imported ${imported.length} leads from CSV`, data: imported });
  } catch (error: any) {
    console.error("❌ CSV import handler failed:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
