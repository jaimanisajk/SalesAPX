import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// In-memory cache fallback for ICPProfiles
export const memoryIcpDb: any[] = [
  {
    id: "mock-icp-123",
    orgId: "mock-org-123",
    name: "Standard ICP Profile",
    isDefault: true,
    industries: ["SaaS", "FinTech", "AI & Analytics"],
    jobTitles: ["CTO", "VP of Product", "VP of Engineering", "Head of Growth"],
    seniorityLevels: ["C-Suite", "VP", "Director"],
    companySizeMin: 20,
    companySizeMax: 1000,
    revenueMin: 1000000,
    revenueMax: 50000000,
    geographies: ["India", "United States", "United Kingdom"],
    techStack: ["React", "Node", "PostgreSQL", "AWS"],
    intentKeywords: ["sales automation", "outbound scaling", "AI lead generation"],
    excludeKeywords: ["consulting", "freelance"],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// Apply auth middleware to all ICP routes
router.use(requireAuth);

/**
 * GET /api/icp
 * Fetch default or all ICP profiles for the authenticated user's organization.
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;

  try {
    const profiles = await prisma.iCPProfile.findMany({
      where: { orgId },
      orderBy: { isDefault: "desc" },
    });

    return res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Returning in-memory ICP profiles.");
    const profiles = memoryIcpDb.filter(p => p.orgId === orgId);
    return res.status(200).json({ success: true, data: profiles });
  }
});

/**
 * POST /api/icp
 * Create or update default ICP profile.
 */
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const {
    id,
    name,
    industries,
    jobTitles,
    seniorityLevels,
    companySizeMin,
    companySizeMax,
    revenueMin,
    revenueMax,
    geographies,
    techStack,
    intentKeywords,
    excludeKeywords,
  } = req.body;

  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing organization context" });
  }

  const profileData = {
    orgId,
    name: name || "Default ICP Profile",
    industries: industries || [],
    jobTitles: jobTitles || [],
    seniorityLevels: seniorityLevels || [],
    companySizeMin: companySizeMin !== undefined ? Number(companySizeMin) : 10,
    companySizeMax: companySizeMax !== undefined ? Number(companySizeMax) : 5000,
    revenueMin: revenueMin !== undefined ? Number(revenueMin) : null,
    revenueMax: revenueMax !== undefined ? Number(revenueMax) : null,
    geographies: geographies || [],
    techStack: techStack || [],
    intentKeywords: intentKeywords || [],
    excludeKeywords: excludeKeywords || [],
    isDefault: true,
  };

  try {
    let result;

    if (id) {
      // Update existing
      result = await prisma.iCPProfile.update({
        where: { id },
        data: profileData,
      });
    } else {
      // Reset defaults of other profiles in org
      await prisma.iCPProfile.updateMany({
        where: { orgId },
        data: { isDefault: false },
      });

      // Create new default
      result = await prisma.iCPProfile.create({
        data: profileData,
      });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Performing in-memory ICP save.");

    // Update in-memory db
    let result;
    if (id) {
      const idx = memoryIcpDb.findIndex(p => p.id === id);
      if (idx !== -1) {
        memoryIcpDb[idx] = {
          ...memoryIcpDb[idx],
          ...profileData,
          updatedAt: new Date(),
        };
        result = memoryIcpDb[idx];
      } else {
        return res.status(404).json({ success: false, error: "Profile not found" });
      }
    } else {
      // Mark others not default
      memoryIcpDb.forEach(p => {
        if (p.orgId === orgId) p.isDefault = false;
      });

      const newId = `icp_${Math.random().toString(36).substr(2, 9)}`;
      result = {
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...profileData,
      };
      memoryIcpDb.push(result);
    }

    return res.status(200).json({ success: true, data: result });
  }
});

export default router;
