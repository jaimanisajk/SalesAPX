import axios from "axios";

export interface SlackConfig {
  webhookUrl?: string;
  enabled: boolean;
}

/**
 * Send interactive notifications to a company Slack channel when outbound pipelines trigger positive outcomes.
 */
export async function sendSlackNotification(
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    companyName: string;
    fitScore?: number;
  },
  event: "REPLY_RECEIVED" | "MEETING_BOOKED",
  eventDetails: {
    replySnippet?: string;
    suggestedReply?: string;
    meetingTime?: string;
    bantSummary?: string;
  },
  config: SlackConfig
): Promise<any> {
  if (!config.enabled) {
    return { success: false, reason: "Slack alerts disabled in settings." };
  }

  // Format Slack Block Kit layout
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: event === "MEETING_BOOKED" ? "📅 New Calendar Meeting Booked!" : "🔥 Hot Lead Reply Received!",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Lead:* ${lead.firstName} ${lead.lastName}\n*Email:* ${lead.email}`,
        },
        {
          type: "mrkdwn",
          text: `*Company:* ${lead.companyName}\n*Role:* ${lead.jobTitle}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Lead Fit Rating Score:* \`${lead.fitScore || "N/A"}/100\` fit evaluation gauge.`,
      },
    },
  ];

  if (event === "REPLY_RECEIVED" && eventDetails.replySnippet) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Lead Reply Snippet:*\n> _"${eventDetails.replySnippet.substring(0, 150)}..."_`,
      },
    });

    if (eventDetails.suggestedReply) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*AI-Drafted Response (Pending Approval):*\n\`\`\`${eventDetails.suggestedReply.substring(0, 200)}\`\`\``,
        },
      });
    }
  }

  if (event === "MEETING_BOOKED" && eventDetails.meetingTime) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Meeting Time Scheduled:*\n📆 *${eventDetails.meetingTime}*`,
      },
    });
  }

  if (eventDetails.bantSummary) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*BANT Qualification Breakdown Summary:*\n_${eventDetails.bantSummary}_`,
      },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "⚡ Powered by *ApexSDR AI Agent Pipeline* | Outbound Sales Autopilot",
      },
    ],
  });

  if (!config.webhookUrl || config.webhookUrl === "") {
    console.log(`🔌 [MOCK SLACK ALERT] Sending Block Kit Notification for event: ${event}`);
    console.log(JSON.stringify(blocks, null, 2));
    return { success: true, mockMode: true };
  }

  try {
    await axios.post(config.webhookUrl, { blocks });
    console.log(`🔌 [LIVE SLACK] Dispatched Webhook alert for ${lead.email}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Slack notification dispatch failed:", error.response?.data || error.message);
    throw error;
  }
}
export async function getSlackConfig(): Promise<SlackConfig> {
  return { enabled: true };
}
