import axios from "axios";

export interface HunterVerificationResult {
  email: string;
  result: "deliverable" | "undeliverable" | "risky" | "unknown";
  score: number;
  domain: string;
  disposable: boolean;
  webmail: boolean;
}

/**
 * Verify email address using Hunter.io API
 */
export async function verifyEmail(email: string): Promise<HunterVerificationResult> {
  const apiKey = process.env.HUNTER_API_KEY;

  if (!apiKey || apiKey === "") {
    console.warn("⚠️ HUNTER_API_KEY is missing. Using mock verification.");
    
    // Simple deterministic mock behavior for local development
    const isInvalid = email.includes("invalid") || email.endsWith(".local");
    return {
      email,
      result: isInvalid ? "undeliverable" : "deliverable",
      score: isInvalid ? 10 : 95,
      domain: email.split("@")[1] || "example.com",
      disposable: false,
      webmail: email.endsWith("@gmail.com") || email.endsWith("@yahoo.com"),
    };
  }

  try {
    const response = await axios.get("https://api.hunter.io/v2/email-verifier", {
      params: {
        email,
        api_key: apiKey,
      },
    });

    const data = response.data?.data;
    return {
      email: data.email,
      result: data.result,
      score: data.score,
      domain: data.domain,
      disposable: data.disposable,
      webmail: data.webmail,
    };
  } catch (error: any) {
    console.error(`❌ Hunter.io API call failed for ${email}:`, error.message);
    // Safe fallback so lead import doesn't crash entirely if API limit is hit
    return {
      email,
      result: "risky",
      score: 50,
      domain: email.split("@")[1] || "unknown.com",
      disposable: false,
      webmail: false,
    };
  }
}
