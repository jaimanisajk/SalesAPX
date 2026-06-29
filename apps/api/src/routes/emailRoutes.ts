import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { checkEmailDomainDns } from "../services/email/dnsService";
import { memoryEmailAccountsDb } from "../services/email/rotationService";

const router = Router();
const prisma = new PrismaClient();

// Apply auth middleware to all email routes
router.use(requireAuth);

/**
 * GET /api/emails/accounts
 * List all connected email accounts for the organization.
 */
router.get("/accounts", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;

  try {
    const accounts = await prisma.emailAccount.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Reading email accounts from local cache.");
    const accounts = memoryEmailAccountsDb.filter(a => a.orgId === orgId);
    return res.status(200).json({ success: true, data: accounts });
  }
});

/**
 * POST /api/emails/accounts
 * Connect new email account (SMTP/IMAP or OAuth credentials).
 */
router.post("/accounts", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const {
    email,
    name,
    provider,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    imapHost,
    imapPort,
    imapUser,
    imapPass,
    dailyLimit,
  } = req.body;

  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing organization context" });
  }

  if (!email || !name || !provider) {
    return res.status(450).json({ success: false, error: "Missing required fields (email, name, provider)" });
  }

  const accountData = {
    orgId,
    email,
    name,
    provider,
    smtpHost: smtpHost || null,
    smtpPort: smtpPort ? Number(smtpPort) : null,
    smtpUser: smtpUser || null,
    smtpPass: smtpPass || null,
    imapHost: imapHost || null,
    imapPort: imapPort ? Number(imapPort) : null,
    imapUser: imapUser || null,
    imapPass: imapPass || null,
    dailyLimit: dailyLimit ? Number(dailyLimit) : 100,
    sentCountToday: 0,
    warmupStatus: "OFF",
    spfValid: false,
    dkimValid: false,
    dmarcValid: false,
    mxValid: false,
  };

  try {
    // Run initial quick DNS check asynchronously
    const dnsCheck = await checkEmailDomainDns(email);
    accountData.spfValid = dnsCheck.spfValid;
    accountData.dkimValid = dnsCheck.dkimValid;
    accountData.dmarcValid = dnsCheck.dmarcValid;
    accountData.mxValid = dnsCheck.mxValid;
    
    const account = await prisma.emailAccount.create({
      data: accountData,
    });
    
    return res.status(200).json({ success: true, data: account });
  } catch (error: any) {
    console.warn("⚠️ Database connection failed. Saving email account to local cache.");
    
    // Fallback to local cache save
    const mockId = `email_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate DNS check for mock
    const dnsCheck = await checkEmailDomainDns(email);
    const mockAccount = {
      id: mockId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...accountData,
      spfValid: dnsCheck.spfValid,
      dkimValid: dnsCheck.dkimValid,
      dmarcValid: dnsCheck.dmarcValid,
      mxValid: dnsCheck.mxValid,
      lastDnsCheckAt: new Date(),
    };

    memoryEmailAccountsDb.push(mockAccount);
    return res.status(200).json({ success: true, data: mockAccount });
  }
});

/**
 * POST /api/emails/accounts/:id/verify-dns
 * Trigger live DNS inspection checks.
 */
router.post("/accounts/:id/verify-dns", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;

  try {
    // Find account
    let account = null;
    try {
      account = await prisma.emailAccount.findUnique({
        where: { id },
      });
    } catch {
      account = memoryEmailAccountsDb.find(a => a.id === id && a.orgId === orgId);
    }

    if (!account) {
      return res.status(404).json({ success: false, error: "Email account not found" });
    }

    // Inspect records
    const dnsResults = await checkEmailDomainDns(account.email);

    // Update in DB
    try {
      const updated = await prisma.emailAccount.update({
        where: { id },
        data: {
          spfValid: dnsResults.spfValid,
          dkimValid: dnsResults.dkimValid,
          dmarcValid: dnsResults.dmarcValid,
          mxValid: dnsResults.mxValid,
          lastDnsCheckAt: new Date(),
        },
      });
      return res.status(200).json({ success: true, data: updated, diagnostics: dnsResults.records });
    } catch {
      // Local cache update
      const idx = memoryEmailAccountsDb.findIndex(a => a.id === id);
      if (idx !== -1) {
        memoryEmailAccountsDb[idx] = {
          ...memoryEmailAccountsDb[idx],
          spfValid: dnsResults.spfValid,
          dkimValid: dnsResults.dkimValid,
          dmarcValid: dnsResults.dmarcValid,
          mxValid: dnsResults.mxValid,
          lastDnsCheckAt: new Date(),
        };
        return res.status(200).json({ success: true, data: memoryEmailAccountsDb[idx], diagnostics: dnsResults.records });
      }
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/emails/accounts/:id/toggle-warmup
 * Toggle inbox email warmup settings status.
 */
router.post("/accounts/:id/toggle-warmup", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const { status } = req.body; // "OFF" | "WARMUP"

  if (status !== "OFF" && status !== "WARMUP") {
    return res.status(400).json({ success: false, error: "Invalid status value. Use 'OFF' or 'WARMUP'." });
  }

  try {
    const updated = await prisma.emailAccount.update({
      where: { id, orgId },
      data: { warmupStatus: status },
    });
    return res.status(200).json({ success: true, data: updated });
  } catch {
    const idx = memoryEmailAccountsDb.findIndex(a => a.id === id && a.orgId === orgId);
    if (idx !== -1) {
      memoryEmailAccountsDb[idx].warmupStatus = status;
      memoryEmailAccountsDb[idx].updatedAt = new Date();
      return res.status(200).json({ success: true, data: memoryEmailAccountsDb[idx] });
    }
    return res.status(404).json({ success: false, error: "Account not found" });
  }
});

/**
 * PUT /api/emails/accounts/:id
 * Update limits and other details of the account.
 */
router.put("/accounts/:id", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const { dailyLimit, name, isActive } = req.body;

  try {
    const updated = await prisma.emailAccount.update({
      where: { id, orgId },
      data: {
        ...(dailyLimit !== undefined ? { dailyLimit: Number(dailyLimit) } : {}),
        ...(name ? { name } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });
    return res.status(200).json({ success: true, data: updated });
  } catch {
    const idx = memoryEmailAccountsDb.findIndex(a => a.id === id && a.orgId === orgId);
    if (idx !== -1) {
      if (dailyLimit !== undefined) memoryEmailAccountsDb[idx].dailyLimit = Number(dailyLimit);
      if (name) memoryEmailAccountsDb[idx].name = name;
      if (isActive !== undefined) memoryEmailAccountsDb[idx].isActive = Boolean(isActive);
      memoryEmailAccountsDb[idx].updatedAt = new Date();
      return res.status(200).json({ success: true, data: memoryEmailAccountsDb[idx] });
    }
    return res.status(404).json({ success: false, error: "Account not found" });
  }
});

/**
 * DELETE /api/emails/accounts/:id
 * Disconnect an email account.
 */
router.delete("/accounts/:id", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;

  try {
    await prisma.emailAccount.delete({
      where: { id, orgId },
    });
    return res.status(200).json({ success: true, message: "Email account disconnected successfully" });
  } catch {
    const idx = memoryEmailAccountsDb.findIndex(a => a.id === id && a.orgId === orgId);
    if (idx !== -1) {
      memoryEmailAccountsDb.splice(idx, 1);
      return res.status(200).json({ success: true, message: "Email account disconnected from cache" });
    }
    return res.status(404).json({ success: false, error: "Account not found" });
  }
});

export default router;
