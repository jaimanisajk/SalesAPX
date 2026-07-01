import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { syncLeadToHubSpot } from "../services/integrations/hubspotService";
import { sendSlackNotification } from "../services/integrations/slackService";

const router = Router();
const prisma = new PrismaClient();

/**
 * Fetch integration settings for the organization
 */
router.get("/", async (req: Request, res: Response) => {
  const orgId = (req.query.orgId as string) || "default-org-id";

  try {
    let settings = await prisma.integrationSetting.findUnique({
      where: { orgId },
    });

    if (!settings) {
      settings = await prisma.integrationSetting.create({
        data: {
          orgId,
          hubspotEnabled: false,
          hubspotToken: "",
          slackEnabled: false,
          slackWebhookUrl: "",
        },
      });
    }

    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update integration settings for the organization
 */
router.post("/", async (req: Request, res: Response) => {
  const orgId = req.body.orgId || "default-org-id";
  const { hubspotEnabled, hubspotToken, slackEnabled, slackWebhookUrl } = req.body;

  try {
    const settings = await prisma.integrationSetting.upsert({
      where: { orgId },
      update: {
        hubspotEnabled,
        hubspotToken,
        slackEnabled,
        slackWebhookUrl,
      },
      create: {
        orgId,
        hubspotEnabled: !!hubspotEnabled,
        hubspotToken: hubspotToken || "",
        slackEnabled: !!slackEnabled,
        slackWebhookUrl: slackWebhookUrl || "",
      },
    });

    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Trigger mock HubSpot integration test contact upload
 */
router.post("/test-hubspot", async (req: Request, res: Response) => {
  const orgId = req.body.orgId || "default-org-id";
  const { token, enabled } = req.body;

  const mockLead = {
    id: "test-hs-lead-id",
    firstName: "Alice",
    lastName: "Smith",
    email: "alice.smith@designco.com",
    jobTitle: "VP of Product",
    companyName: "DesignCo",
    fitScore: 88,
  };

  try {
    const result = await syncLeadToHubSpot(mockLead, "MEETING_READY", {
      accessToken: token,
      enabled: enabled ?? true,
    });
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Trigger mock Slack integration test notification
 */
router.post("/test-slack", async (req: Request, res: Response) => {
  const { webhookUrl, enabled } = req.body;

  const mockLead = {
    firstName: "Bob",
    lastName: "Taylor",
    email: "bob.taylor@techcorp.io",
    jobTitle: "VP Engineering",
    companyName: "TechCorp",
    fitScore: 92,
  };

  const details = {
    replySnippet: "Hey, this tool looks interesting. Can we jump on a brief call tomorrow at 10 AM?",
    suggestedReply: "Hi Bob,\n\nThanks for reaching out! Here is our scheduling link: cal.com/apexsdr-demo\n\nBest,\nSDR Team",
    bantSummary: "Budget: High, timeline: 2 months. Strongly qualified CTO buyer fit.",
  };

  try {
    const result = await sendSlackNotification(mockLead, "REPLY_RECEIVED", details, {
      webhookUrl,
      enabled: enabled ?? true,
    });
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
