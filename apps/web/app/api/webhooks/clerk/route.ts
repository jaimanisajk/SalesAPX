import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get raw body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Error: CLERK_WEBHOOK_SECRET is missing", {
      status: 500,
    });
  }

  // Create a new Svix instance with secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred during verification", {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses?.[0]?.email_address;
    const firstName = first_name || "";
    const lastName = last_name || "";

    if (!email) {
      return new Response("Error: No email provided", { status: 400 });
    }

    try {
      // 1. Create a default Organization for this User
      const orgName = firstName ? `${firstName}'s Workspace` : "My Workspace";
      const org = await prisma.organisation.create({
        data: {
          name: orgName,
          plan: "STARTER",
          monthlyLeadLimit: 250,
          isActive: true,
        },
      });

      // 2. Create the User associated with this Organization
      const user = await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName,
          lastName,
          role: "OWNER",
          orgId: org.id,
          isActive: true,
        },
      });

      // 3. Create default EmailSettings for the organization
      await prisma.emailSettings.create({
        data: {
          orgId: org.id,
          fromName: `${firstName} ${lastName}`.trim() || "ApexSDR Outbound",
          fromEmail: email,
          provider: "BREVO",
          dailyLimit: 100,
          warmupEnabled: true,
        },
      });

      return NextResponse.json({ success: true, user, org });
    } catch (dbError) {
      console.error("Error writing to database:", dbError);
      return new Response("Database operation failed", { status: 500 });
    }
  }

  return new Response("Webhook processed", { status: 200 });
}
