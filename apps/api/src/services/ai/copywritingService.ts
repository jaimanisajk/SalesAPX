import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { memoryAiLogsDb } from "../leads/apolloService";

const prisma = new PrismaClient();

export interface CopywritingInputs {
  leadSegmentDescription: string;
  valueProposition: string;
  tone: "PROFESSIONAL" | "BOLD" | "CASUAL" | "PLAYFUL";
  cta: string;
  lengthLimit: "SHORT" | "MEDIUM" | "LONG";
}

export interface GeneratedCopyResult {
  variantA: {
    subject: string;
    body: string;
  };
  variantB: {
    subject: string;
    body: string;
  };
  explanation: string;
}

const COPYWRITING_PROMPT = `
You are an expert cold email copywriter who specializes in outbound B2B sales.
Your job is to generate two cold email variants (Variant A and Variant B) for A/B testing, targeting a specific lead segment.

SEGMENT INFORMATION:
Target Segment: {leadSegmentDescription}
What We Sell / Value Prop: {valueProposition}
Tone of voice: {tone}
Desired Call to Action (CTA): {cta}
Length limit: {lengthLimit} (SHORT should be under 75 words, MEDIUM under 150 words, LONG under 250 words)

RULES:
1. Comprise highly personalized hooks.
2. Use merge tags: {{firstName}}, {{lastName}}, {{companyName}}, {{jobTitle}}, and {{senderName}}.
3. Ensure subject lines are punchy, short (under 6 words), and have high open rates.
4. Do NOT use cheesy sales language. Write like a peer explaining a useful product.

Return ONLY valid JSON in this exact format:
{
  "variantA": {
    "subject": "<Subject Line A>",
    "body": "<Email Body A (incorporating merge tags, use \\n for line breaks)>"
  },
  "variantB": {
    "subject": "<Subject Line B (different angle than A)>",
    "body": "<Email Body B (different angle than A, incorporating merge tags, use \\n for line breaks)>"
  },
  "explanation": "<Brief explanation of why these copies were structured this way>"
}
`;

/**
 * Generate cold email copywriting options matching value prop and tone.
 */
export async function generateOutboundCopy(
  inputs: CopywritingInputs,
  orgId: string
): Promise<GeneratedCopyResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const startTime = Date.now();

  const formattedPrompt = COPYWRITING_PROMPT
    .replace("{leadSegmentDescription}", inputs.leadSegmentDescription)
    .replace("{valueProposition}", inputs.valueProposition)
    .replace("{tone}", inputs.tone)
    .replace("{cta}", inputs.cta)
    .replace("{lengthLimit}", inputs.lengthLimit);

  if (!apiKey || apiKey === "") {
    console.warn("⚠️ GOOGLE_AI_API_KEY is missing. Returning heuristic mock email copy templates.");

    // Smart heuristic mock generators matching requested tone and prop!
    let subA = `Quick question, {{firstName}}`;
    let subB = `Automating prospecting at {{companyName || 'your company'}}`;

    if (inputs.tone === "BOLD") {
      subA = `Stop manually prospecting, {{firstName}}`;
      subB = `10x outbound pipeline for {{companyName}}`;
    }

    let bodyA = `Hi {{firstName || 'there'}},\n\nSaw you are heading up tech at {{companyName}}.\n\n${inputs.valueProposition}.\n\nWould you be open to a quick call to discuss how we could help?\n\nBest,\n{{senderName}}`;
    let bodyB = `Hey {{firstName}},\n\nIs scaling outbound pipelines a focus for {{companyName}} this quarter?\n\nWe build AI agents that handle all prospecting and booking. ${inputs.valueProposition}.\n\n${inputs.cta || 'Let me know if you have 10 mins.'}\n\nThanks,\n{{senderName}}`;

    const mockResult: GeneratedCopyResult = {
      variantA: {
        subject: subA,
        body: bodyA,
      },
      variantB: {
        subject: subB,
        body: bodyB,
      },
      explanation: `Generated heuristic ${inputs.tone.toLowerCase()} cold outreach copy emphasizing value prop: "${inputs.valueProposition.substring(0, 40)}..."`,
    };

    // Log mock AI execution
    const logData = {
      orgId,
      agentType: "COPYWRITING",
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
    const parsed: GeneratedCopyResult = JSON.parse(rawJsonText.trim());

    const logData = {
      orgId,
      agentType: "COPYWRITING",
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
    console.error("❌ Gemini copywriting generation failed:", error.message);

    const logData = {
      orgId,
      agentType: "COPYWRITING",
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

    throw error;
  }
}
