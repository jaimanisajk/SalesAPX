import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { processInboundReply, memoryInboxDb } from "../services/email/inboundWebhook";

const router = Router();
const prisma = new PrismaClient();

/**
 * PUBLIC/WEBHOOK: POST /api/inbox/webhook
 * Receives incoming email replies from external ESP webhooks.
 * Bypasses auth token checks because it is called externally.
 */
router.post("/webhook", async (req: Response & any, res: Response) => {
  const { from, to, subject, text, html } = req.body;

  // Normalize Brevo/SendGrid webhook payloads
  const fromEmail = from || req.body.sender || req.body.fromEmail;
  const toEmail = to || req.body.recipient || req.body.toEmail;
  const bodyContent = text || html || req.body.content || "";

  if (!fromEmail || !toEmail) {
    return res.status(400).json({ success: false, error: "Missing sender or recipient details" });
  }

  try {
    const result = await processInboundReply({
      fromEmail,
      toEmail,
      subject: subject || "Reply to Sequence",
      content: bodyContent,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Incoming webhook processing failed:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Apply auth middleware to all human inbox management routes below
router.use(requireAuth);

/**
 * GET /api/inbox
 * Get active inbox items for the user's organization.
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const status = req.query.status as string;

  try {
    const items = await prisma.inboxItem.findMany({
      where: {
        orgId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        lead: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Reading inbox items from local cache.");
    const filtered = memoryInboxDb.filter(
      item => item.orgId === orgId && (!status || item.status === status)
    );
    return res.status(200).json({ success: true, data: filtered });
  }
});

/**
 * POST /api/inbox/:id/resolve
 * Resolve inbox item (approve/send draft reply, edit, or dismiss).
 */
router.post("/:id/resolve", async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const { action, editedReplyContent } = req.body; // "SEND_REPLY" | "DISMISS"

  if (!action) {
    return res.status(400).json({ success: false, error: "Missing resolution action" });
  }

  try {
    const item = await prisma.inboxItem.findFirst({
      where: { id, orgId },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: "Inbox item not found" });
    }

    if (action === "SEND_REPLY" && editedReplyContent) {
      // In production, we would invoke the email dispatch service:
      // await sendEmail({ to: lead.email, content: editedReplyContent });
      console.log(`✉️ Dispatched human-approved follow-up email:`);
      console.log(`   Content: ${editedReplyContent}`);
    }

    const updated = await prisma.inboxItem.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.warn("⚠️ Database connection failed. Resolving inbox item in local cache.");
    const idx = memoryInboxDb.findIndex(item => item.id === id && item.orgId === orgId);
    if (idx !== -1) {
      if (action === "SEND_REPLY" && editedReplyContent) {
        console.log(`✉️ Dispatched human-approved follow-up email from cache:`);
        console.log(`   Content: ${editedReplyContent}`);
      }
      memoryInboxDb[idx].status = "RESOLVED";
      memoryInboxDb[idx].resolvedAt = new Date();
      return res.status(200).json({ success: true, data: memoryInboxDb[idx] });
    }
    return res.status(404).json({ success: false, error: "Inbox item not found in cache" });
  }
});

export default router;
