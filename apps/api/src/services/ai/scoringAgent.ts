import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { memoryAiLogsDb } from "../leads/apolloService";

const prisma = new PrismaClient();

interface ScoringResult {
  score: number;
  reasons: string[];
  recommendation: "APPROVE" | "HOLD" | "REJECT";
  flags: string[];
}

const SCORING_PROMPT = `
You are an expert B2B sales analyst. Your job is to score how well a lead matches an Ideal Customer Profile (ICP).

ICP DEFINITION:
Industries: {industries}
Target Job Titles: {jobTitles}
Seniority Levels: {seniorityLevels}
Company Size: {companySizeMin} to {companySizeMax} employees
Geography: {geographies}
Tech Stack They Should Use: {techStack}
Intent Keywords: {intentKeywords}

LEAD DATA:
Name: {firstName} {lastName}
Job Title: {jobTitle}
Seniority: {seniority}
Company: {companyName}
Industry: {industry}
Company Size: {companySize} employees
Geography: {geography}
Known Tech Stack: {leadTechStack}

Score this lead from 0 to 100 based on ICP fit.
Return ONLY valid JSON in this exact format:
{
  "score": <number 0-100>,
  "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
  "recommendation": "<APPROVE|HOLD|REJECT>",
  "flags": ["<any red flags>"]
}
`;

/**
 * Score lead based on ICP profile using Google Gemini 1.5 Flash API
 */
export async function scoreLead(
  lead: any,
  icpProfile: any,
  orgId: string
): Promise<ScoringResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  const leadTechStack = lead.techStack?.join(", ") || "Unknown";
  const industries = icpProfile.industries?.join(", ") || "Any";
  const jobTitles = icpProfile.jobTitles?.join(", ") || "Any";
  const seniorityLevels = icpProfile.seniorityLevels?.join(", ") || "Any";
  const geographies = icpProfile.geographies?.join(", ") || "Any";
  const techStack = icpProfile.techStack?.join(", ") || "Any";
  const intentKeywords = icpProfile.intentKeywords?.join(", ") || "Any";

  const formattedPrompt = SCORING_PROMPT
    .replace("{industries}", industries)
    .replace("{jobTitles}", jobTitles)
    .replace("{seniorityLevels}", seniorityLevels)
    .replace("{companySizeMin}", String(icpProfile.companySizeMin || 10))
    .replace("{companySizeMax}", String(icpProfile.companySizeMax || 5000))
    .replace("{geographies}", geographies)
    .replace("{techStack}", techStack)
    .replace("{intentKeywords}", intentKeywords)
    .replace("{firstName}", lead.firstName || "")
    .replace("{lastName}", lead.lastName || "")
    .replace("{jobTitle}", lead.jobTitle || "")
    .replace("{seniority}", lead.seniorityLevel || "Unknown")
    .replace("{companyName}", lead.companyName || "")
    .replace("{industry}", lead.industry || "Unknown")
    .replace("{companySize}", String(lead.companySize || "Unknown"))
    .replace("{geography}", lead.geography || "Unknown")
    .replace("{leadTechStack}", leadTechStack);

  const startTime = Date.now();

  if (!apiKey || apiKey === "") {
    console.warn("⚠️ GOOGLE_AI_API_KEY is missing. Returning heuristic mock lead score.");

    // Simple heuristic-based score calculation for mock environment
    let score = 50;
    const reasons: string[] = [];
    const flags: string[] = [];

    // Check Job Title
    const matchesTitle = icpProfile.jobTitles.some((t: string) => 
      lead.jobTitle?.toLowerCase().includes(t.toLowerCase())
    );
    if (matchesTitle) {
      score += 25;
      reasons.push(`Matches target job title filter: '${lead.jobTitle}'`);
    } else {
      reasons.push(`Job title '${lead.jobTitle}' is outside target profile`);
    }

    // Check Company Size
    if (lead.companySize) {
      const min = icpProfile.companySizeMin || 10;
      const max = icpProfile.companySizeMax || 5000;
      if (lead.companySize >= min && lead.companySize <= max) {
        score += 15;
        reasons.push(`Company size ${lead.companySize} is in ideal range (${min}-${max})`);
      } else {
        score -= 10;
        reasons.push(`Company size ${lead.companySize} is outside ideal range`);
      }
    }

    // Check Geography
    const matchesGeo = icpProfile.geographies.some((g: string) => 
      lead.geography?.toLowerCase().includes(g.toLowerCase())
    );
    if (matchesGeo) {
      score += 10;
      reasons.push(`Located in target region: '${lead.geography}'`);
    }

    score = Math.max(0, Math.min(100, score));
    const recommendation = score >= 70 ? "APPROVE" : score >= 50 ? "HOLD" : "REJECT";

    const mockResult: ScoringResult = {
      score,
      reasons,
      recommendation,
      flags,
    };

    // Log the mock AI execution call in database/memory
    const logData = {
      orgId,
      leadId: lead.id || null,
      agentType: "SCORING",
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
    const parsed: ScoringResult = JSON.parse(rawJsonText.trim());

    const logData = {
      orgId,
      leadId: lead.id || null,
      agentType: "SCORING",
      model: "gemini-1.5-flash",
      inputTokens: response.data?.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.data?.usageMetadata?.candidatesTokenCount || 0,
      costUSD: 0.0, // Flash is practically free / very low cost
      latencyMs: Date.now() - startTime,
      success: true,
      error: null,
    };

    try {
      await prisma.aILog.create({ data: logData });
    } catch {
      memoryAiLogsDb.push({ id: `log_${Math.random().toString(36).substr(2, 9)}`, createdAt: new Date(), ...logData });
    }

    return {
      score: parsed.score || 50,
      reasons: parsed.reasons || ["Generated by AI"],
      recommendation: parsed.recommendation || "HOLD",
      flags: parsed.flags || [],
    };
  } catch (error: any) {
    console.error("❌ Gemini AI Lead scoring failed:", error.message);

    const logData = {
      orgId,
      leadId: lead.id || null,
      agentType: "SCORING",
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
      score: 50,
      reasons: ["Failed to score lead using AI: " + error.message],
      recommendation: "HOLD",
      flags: ["AI_SCORING_ERROR"],
    };
  }
}
