import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { memoryAiLogsDb } from "../leads/apolloService";

const prisma = new PrismaClient();

export interface BantResult {
  budgetScore: number;
  budgetNotes: string;
  authorityScore: number;
  authorityNotes: string;
  needScore: number;
  needNotes: string;
  timelineScore: number;
  timelineNotes: string;
  totalScore: number;
  isQualified: boolean;
}

const BANT_PROMPT = `
You are an expert sales qualifier. Your job is to analyze a conversation thread between a lead and our sales development team.
You must extract BANT (Budget, Authority, Need, Timeline) qualification scores (0-100 scale) and notes from the conversation.

CONVERSATION THREAD HISTORY:
{conversationHistory}

CRITERIA DEFINITIONS:
- Budget: Does the lead mention budget availability, pricing inquiries, funding state, or spending limits?
- Authority: Is this lead a decision-maker (C-Suite, VP, Director)? Do they mention having budget authority or need to pull in other executives?
- Need: Does the lead express specific pain points, requirements, competitor issues, or features they are looking for?
- Timeline: Does the lead mention scheduling a demo, timelines for execution, onboarding dates, or target quarters (e.g. "next month", "Q3")?

SCORING INSTRUCTIONS:
- 0: No information whatsoever.
- 50: Indirect mention or soft hints.
- 80+: Explicit confirmation or details.

Return ONLY valid JSON in this exact format:
{
  "budgetScore": <number 0-100>,
  "budgetNotes": "<Notes explaining budget details found, or 'No budget details mentioned'>",
  "authorityScore": <number 0-100>,
  "authorityNotes": "<Notes explaining decision power, title fit, or others involved>",
  "needScore": <number 0-100>,
  "needNotes": "<Notes detailing pain points, features asked, or problems to solve>",
  "timelineScore": <number 0-100>,
  "timelineNotes": "<Notes explaining scheduling mentions, evaluation window, or launch date>",
  "totalScore": <average of the four scores above, number 0-100>,
  "isQualified": <true if totalScore >= 60, else false>
}
`;

/**
 * Perform BANT qualification check on conversation history using Google Gemini 1.5 Flash.
 */
export async function scoreBantQualification(
  conversationHistory: any[],
  leadId: string,
  orgId: string
): Promise<BantResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const startTime = Date.now();

  const formattedHistory = conversationHistory
    .map(msg => `[${msg.sender === "LEAD" ? "LEAD" : "SDR"}] ${msg.content}`)
    .join("\n\n");

  const formattedPrompt = BANT_PROMPT.replace("{conversationHistory}", formattedHistory);

  if (!apiKey || apiKey === "") {
    console.warn("⚠️ GOOGLE_AI_API_KEY is missing. Calculating mock BANT scores.");

    // Smart heuristic mock BANT calculation
    const historyText = formattedHistory.toLowerCase();
    
    let budget = 30;
    let budgetNotes = "No specific pricing or budget constraints mentioned.";
    if (historyText.includes("cost") || historyText.includes("price") || historyText.includes("budget") || historyText.includes("pricing")) {
      budget = 75;
      budgetNotes = "Lead inquired about pricing details or cost model.";
    }

    let authority = 50;
    let authorityNotes = "Lead title indicates a manager or technical role.";
    if (historyText.includes("cto") || historyText.includes("vp") || historyText.includes("founder") || historyText.includes("director") || historyText.includes("i decide")) {
      authority = 90;
      authorityNotes = "Lead is a high-level executive (CTO/VP) with primary purchasing authority.";
    } else if (historyText.includes("my manager") || historyText.includes("check with team")) {
      authority = 40;
      authorityNotes = "Lead needs to consult other stakeholders or decision makers.";
    }

    let need = 40;
    let needNotes = "General interest in prospecting automation.";
    if (historyText.includes("solve") || historyText.includes("manually") || historyText.includes("scaling") || historyText.includes("competitor") || historyText.includes("problem")) {
      need = 85;
      needNotes = "Lead expressed specific pain points regarding manual prospecting limits.";
    }

    let timeline = 30;
    let timelineNotes = "No specific timeline mentioned.";
    if (historyText.includes("tuesday") || historyText.includes("demo") || historyText.includes("call") || historyText.includes("next week") || historyText.includes("tomorrow")) {
      timeline = 85;
      timelineNotes = "Lead suggested specific meeting slot or demo timing.";
    } else if (historyText.includes("next quarter") || historyText.includes("6 months")) {
      timeline = 50;
      timelineNotes = "Outreach pushed out to a future quarter.";
    }

    const totalScore = Math.round((budget + authority + need + timeline) / 4);
    const isQualified = totalScore >= 60;

    const mockResult: BantResult = {
      budgetScore: budget,
      budgetNotes,
      authorityScore: authority,
      authorityNotes,
      needScore: need,
      needNotes,
      timelineScore: timeline,
      timelineNotes,
      totalScore,
      isQualified,
    };

    // Log mock AI execution
    const logData = {
      orgId,
      leadId,
      agentType: "QUALIFICATION",
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
    const parsed: BantResult = JSON.parse(rawJsonText.trim());

    const logData = {
      orgId,
      leadId,
      agentType: "QUALIFICATION",
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
    console.error("❌ Gemini BANT qualification scoring failed:", error.message);

    const logData = {
      orgId,
      leadId,
      agentType: "QUALIFICATION",
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
      budgetScore: 50,
      budgetNotes: "Error running qualification agent.",
      authorityScore: 50,
      authorityNotes: "Error running qualification agent.",
      needScore: 50,
      needNotes: "Error running qualification agent.",
      timelineScore: 50,
      timelineNotes: "Error running qualification agent.",
      totalScore: 50,
      isQualified: false,
    };
  }
}
