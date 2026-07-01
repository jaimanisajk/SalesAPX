import { PrismaClient, Plan } from "@prisma/client";

const prisma = new PrismaClient();

const PLAN_LIMITS: Record<Plan, number> = {
  STARTER: 250,
  GROWTH: 1000,
  ENTERPRISE: 999999,
};

/**
 * Check if organization is allowed to import/create more leads this month.
 */
export async function checkLeadLimit(orgId: string): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  plan: Plan;
}> {
  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    throw new Error(`Organisation ${orgId} not found.`);
  }

  const limit = PLAN_LIMITS[org.plan];
  const used = org.leadsUsedThisMonth;

  return {
    allowed: used < limit && org.isActive,
    limit,
    used,
    plan: org.plan,
  };
}

/**
 * Increment the leads count used this month for an organization.
 */
export async function incrementLeadUsage(orgId: string, count: number = 1): Promise<void> {
  await prisma.organisation.update({
    where: { id: orgId },
    data: {
      leadsUsedThisMonth: {
        increment: count,
      },
    },
  });
}

/**
 * Mock creation of Stripe Billing Checkout Session URL.
 */
export async function createCheckoutSession(
  orgId: string,
  targetPlan: "GROWTH" | "ENTERPRISE"
): Promise<{ checkoutUrl: string }> {
  console.log(`💳 [BILLING] Initiating Stripe Checkout Session for Org: ${orgId} to Plan: ${targetPlan}`);
  
  // Return a mock checkout page url that triggers upgrade webhook simulation
  const mockSessionId = "stripe_cs_" + Math.random().toString(36).substr(2, 5);
  const checkoutUrl = `http://localhost:3000/settings/billing?session_id=${mockSessionId}&upgrade=${targetPlan}`;
  
  return { checkoutUrl };
}
