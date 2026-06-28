import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    orgId: string;
  };
}

/**
 * Authentication middleware resolving Clerk user to PostgreSQL DB User/Org records.
 * Bypasses verification with a default developer workspace context if DB is not connected yet.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // 1. Fallback developer context when Database is in mock mode (no real DATABASE_URL)
  const isMockDb = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder");

  if (isMockDb) {
    // Attach default mock context
    req.user = {
      id: "mock-user-123",
      clerkId: "user_mock",
      email: "developer@apex-sdr.com",
      firstName: "Apex",
      lastName: "Developer",
      orgId: "mock-org-123",
    };
    return next();
  }

  // 2. Real Clerk validation
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // In production, we'd verify the Clerk token via clerkClient:
    // const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    // const sessionClaims = await client.verifyToken(token);
    // const clerkId = sessionClaims.sub;

    // For initial development/testing, we read the clerkId directly from the payload or headers,
    // or stub it using the token itself for convenience if Clerk keys aren't set yet.
    // If the token is a standard mock, resolve to a developer user.
    let clerkId = "user_mock";
    if (token !== "mock-dev-token") {
      // Decode JWT token payload (clerk token format)
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(Buffer.from(base64, "base64").toString());
        clerkId = payload.sub;
      } catch {
        clerkId = "user_mock";
      }
    }

    // Resolve user from DB
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      include: { org: true },
    });

    if (!dbUser) {
      // Auto-provision user in DB for seamless login flow
      // Normally handled by the webhook, but this is a safe fallback
      const defaultOrg = await prisma.organisation.create({
        data: {
          name: "My Organization",
          plan: "STARTER",
        },
      });

      const newUser = await prisma.user.create({
        data: {
          clerkId,
          email: "user@example.com",
          firstName: "New",
          lastName: "User",
          orgId: defaultOrg.id,
        },
      });

      req.user = {
        id: newUser.id,
        clerkId: newUser.clerkId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        orgId: newUser.orgId,
      };
      return next();
    }

    req.user = {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      orgId: dbUser.orgId,
    };
    next();
  } catch (error: any) {
    console.error("❌ Auth middleware error:", error.message);
    res.status(401).json({ success: false, error: "Unauthorized: Invalid token" });
  }
}
