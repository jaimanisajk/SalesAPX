import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Memory database fallback for EmailAccounts when PostgreSQL is not ready
export const memoryEmailAccountsDb: any[] = [
  {
    id: "mock-email-1",
    orgId: "mock-org-123",
    email: "rohan@apex-sdr.com",
    name: "Rohan Mehta",
    provider: "GMAIL",
    dailyLimit: 50,
    sentCountToday: 12,
    warmupStatus: "WARMUP",
    spfValid: true,
    dkimValid: true,
    dmarcValid: true,
    mxValid: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(Date.now() - 3600000 * 3), // 3 hours ago
  },
  {
    id: "mock-email-2",
    orgId: "mock-org-123",
    email: "rohan.mehta@apex-outbound.com",
    name: "Rohan (Sales)",
    provider: "SMTP",
    smtpHost: "smtp.mailgun.org",
    smtpPort: 587,
    smtpUser: "postmaster@apex-outbound.com",
    dailyLimit: 100,
    sentCountToday: 42,
    warmupStatus: "OFF",
    spfValid: true,
    dkimValid: true,
    dmarcValid: true,
    mxValid: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(Date.now() - 3600000 * 1), // 1 hour ago
  }
];

/**
 * Rotator: Get the next available email account for outbound sending using a Round-Robin algorithm.
 * Selects the active account that has not hit its limit and was used longest ago (based on updatedAt).
 */
export async function getNextSendingAccount(orgId: string): Promise<any | null> {
  try {
    // 1. Database execution
    const account = await prisma.emailAccount.findFirst({
      where: {
        orgId,
        isActive: true,
        sentCountToday: {
          lt: prisma.emailAccount.fields.dailyLimit, // sentCountToday < dailyLimit
        },
      },
      orderBy: {
        updatedAt: "asc", // Round-Robin: select least recently updated
      },
    });

    if (account) {
      // Touch updatedAt to send it to the back of the round-robin queue
      await prisma.emailAccount.update({
        where: { id: account.id },
        data: { updatedAt: new Date() },
      });
      return account;
    }
  } catch (error) {
    console.warn("⚠️ Database connection failed. Running Round-Robin on local in-memory accounts cache.");
    
    // 2. Local memory fallback execution
    const activeAccounts = memoryEmailAccountsDb.filter(
      acc => acc.orgId === orgId && acc.isActive && acc.sentCountToday < acc.dailyLimit
    );

    if (activeAccounts.length === 0) return null;

    // Order by updatedAt ascending (least recently used)
    activeAccounts.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
    const selected = activeAccounts[0];

    // Touch updatedAt in memory cache
    selected.updatedAt = new Date();
    return selected;
  }

  return null;
}

/**
 * Increment sent count for an email account and track limits.
 */
export async function recordEmailSent(accountId: string): Promise<void> {
  try {
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        sentCountToday: { increment: 1 },
      },
    });
  } catch {
    const acc = memoryEmailAccountsDb.find(a => a.id === accountId);
    if (acc) {
      acc.sentCountToday += 1;
      console.log(`📈 Incremented sent count in-memory for ${acc.email}. Total today: ${acc.sentCountToday}`);
    }
  }
}
