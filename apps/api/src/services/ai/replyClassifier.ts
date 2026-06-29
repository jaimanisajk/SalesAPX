import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { memoryAiLogsDb } from "../leads/apolloService";

const prisma = new PrismaClient();

export interface ClassificationResult {
  classification: "INTERESTED" | "NEEDS_MORE_INFO" | "OBJECTION" | "NOT_NOW" | "UNSUBSCRIBE" | "OUT_OF_OFFICE" | "WRONG_PERSON" | "POSITIVE_REFERRAL" | "SPAM" | "NEGATIVE";
  sentiment: string;
  keyPoints: string[];
  suggestedAction: string;
  suggestedReplyDraft: string;
}

const CLASSIFICATION_PROMPT = `
You are an expert sales assistant. Your job is to classify an incoming reply from a lead and draft a suggested follow-up response.

ORIGINAL EMAIL SENT:
"{originalEmailContent}"

INCOMING REPLY FROM LEAD:
"{replyContent}"

CLASSIFICATION OPTIONS:
- INTERESTED: Lead wants to meet, asks for a demo, or shows strong positive interest.
- NEEDS_MORE_INFO: Lead asks questions about pricing, features, security, etc.
- OBJECTION: Lead has concerns (e.g. "too expensive", "we use a competitor").
- NOT_NOW: Lead says "not interested right now", "check back in 6 months".
- UNSUBSCRIBE: Lead says "remove me", "stop emailing", "DNC".
- OUT_OF_OFFICE: Automated OOO responder message.
- WRONG_PERSON: Lead says "not my department", "talk to John instead".
- POSITIVE_REFERRAL: Lead gives contact info of another person to reach out to.
- SPAM: Bounce message, system failure message, or unrelated spam.
- NEGATIVE: Explicitly rude or hostile rejection.

RULES FOR SUGGESTED REPLY DRAFT:
1. If classification is INTERESTED, suggest a friendly reply offering a calendar link or proposing times.
2. If NEEDS_MORE_INFO, draft a clear, helpful response addressing potential questions.
3. If WRONG_PERSON or POSITIVE_REFERRAL, ask if they can introduce you to the correct contact.
4. If UNSUBSCRIBE or NOT_NOW, draft a polite acknowledgment confirming removal.
5. Keep the draft brief, highly professional, and natural.

Return ONLY valid JSON in this exact format:
{
  "classification": "<One of the classification options list above>",
  "sentiment": "<positive|neutral|negative>",
  "keyPoints": ["<key point 1>", "<key point 2>"],
  "suggestedAction": "<Action recommendation, e.g., Send Booking Link, Mark DNC, Reschedule>",
  "suggestedReplyDraft": "<Suggested email draft to reply with (use \\n for line breaks)>"
}
`;

/**
 * Classify incoming reply from lead and draft recommended response.
 */
export async function classifyIncomingReply(
  replyContent: string,
  originalEmailContent: string = "",
  orgId: string
): Promise<ClassificationResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const startTime = Date.now();

  const formattedPrompt = CLASSIFICATION_PROMPT
    .replace("{originalEmailContent}", originalEmailContent)
    .replace("{replyContent}", replyContent);

  if (!apiKey || apiKey === "") {
    console.warn("⚠️ GOOGLE_AI_API_KEY is missing. Running heuristic reply classifier.");

    // Smart heuristic mock classification
    const cleanContent = replyContent.toLowerCase();
    let classification: ClassificationResult["classification"] = "NEEDS_MORE_INFO";
    let sentiment = "neutral";
    let action = "Reply with details";
    let draft = "Hi,\n\nThanks for reaching out. Let me know what specific details you would like to go over.\n\nBest,\nSales Team";

    if (
      cleanContent.includes("interested") ||
      cleanContent.includes("call") ||
      cleanContent.includes("demo") ||
      cleanContent.includes("meeting") ||
      cleanContent.includes("calendar") ||
      cleanContent.includes("schedule")
    ) {
      classification = "INTERESTED";
      sentiment = "positive";
      action = "Send Booking Link";
      draft = "Hi,\n\nThrilled to hear you are interested! You can pick a convenient time on my calendar here: {{calendarLink || 'https://calendly.com'}}\n\nLooking forward to speaking!\n\nBest,\n{{senderName}}";
    } else if (
      cleanContent.includes("remove") ||
      cleanContent.includes("unsubscribe") ||
      cleanContent.includes("stop") ||
      cleanContent.includes("don't email") ||
      cleanContent.includes("dnc")
    ) {
      classification = "UNSUBSCRIBE";
      sentiment = "negative";
      action = "Mark DNC";
      draft = "Hi,\n\nUnderstood completely. I have removed you from our mailing list and you won't hear from us again. Wish you the best.\n\nBest,\n{{senderName}}";
    } else if (cleanContent.includes("vacation") || cleanContent.includes("out of office") || cleanContent.includes("ooo")) {
      classification = "OUT_OF_OFFICE";
      sentiment = "neutral";
      action = "Pause Campaign";
      draft = "";
    } else if (cleanContent.includes("not the right person") || cleanContent.includes("wrong person") || cleanContent.includes("not me")) {
      classification = "WRONG_PERSON";
      sentiment = "neutral";
      action = "Ask for Referral";
      draft = "Hi,\n\nThanks for letting me know. Is there anyone else on your team handling sales enablement that you could point me towards?\n\nBest,\n{{senderName}}";
    }

    const mockResult: ClassificationResult = {
      classification,
      sentiment,
      keyPoints: ["Lead responded to sequence", "Extracted intent: " + classification.toLowerCase()],
      suggestedAction: action,
      suggestedReplyDraft: draft,
    };

    // Log mock AI execution
    const logData = {
      orgId,
      agentType: "CLASSIFICATION",
      model: "gemini-1.5-flash-mock",
      inputTokens: formattedPrompt.length / 4,
      outputTokens: JSON.stringify(mockResult).length / 4,
      costUSD: 0.0,
      latencyMs: Date.now() - startTime,
      success: true,
      error: null,
    };

    try {
      await prisma.aILog.create({ data: logData });
    } catch {
      memoryAiLogsDb.push({ id: `log_${Math.random().toString(36).substr(2, 9)}`, createdAt: new Date(), ...logData });
    }

    return mockResult;
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: formattedPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }
    );

    const rawJsonText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed: ClassificationResult = JSON.parse(rawJsonText.trim());

    const logData = {
      orgId,
      agentType: "CLASSIFICATION",
      model: "gemini-1.5-flash",
      inputTokens: response.data?.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.data?.usageMetadata?.candidatesTokenCount || 0,
      costUSD: 0.0,
      latencyMs: Date.now() - startTime,
      success: true,
      error: null,
    };

    try {
      await prisma.aILog.create({ data: logData });
    } catch {
      memoryAiLogsDb.push({ id: `log_${Math.random().toString(36).substr(2, 9)}`, createdAt: new Date(), ...logData });
    }

    return parsed;
  } catch (error: any) {
    console.error("❌ Gemini response classification failed:", error.message);

    const logData = {
      orgId,
      agentType: "CLASSIFICATION",
      model: "gemini-1.5-flash",
      inputTokens: 0,
      outputTokens: 0,
      costUSD: 0,
      latencyMs: Date.now() - startTime,
      success: false,
      error: error.message,
    };

    try {
      await prisma.aILog.create({ data: logData });
    } catch {
      memoryAiLogsDb.push({ id: `log_${Math.random().toString(36).substr(2, 9)}`, createdAt: new Date(), ...logData });
    }

    return {
      classification: "NEEDS_MORE_INFO",
      sentiment: "neutral",
      keyPoints: ["AI Classification failed"],
      suggestedAction: "Human Review Required",
      suggestedReplyDraft: "Hi,\n\nThanks for getting in touch. Let's schedule a time to speak.",
    };
  }
}
