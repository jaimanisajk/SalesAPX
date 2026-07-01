import axios from "axios";

export interface HubSpotConfig {
  accessToken?: string;
  enabled: boolean;
}

/**
 * Sync lead data to HubSpot CRM contacts and deals.
 * Automatically triggered when leads become qualified or book calls.
 */
export async function syncLeadToHubSpot(
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    companyName: string;
    fitScore?: number;
  },
  status: "MEETING_READY" | "MEETING_BOOKED",
  config: HubSpotConfig
): Promise<any> {
  if (!config.enabled) {
    return { success: false, reason: "HubSpot sync is disabled in settings." };
  }

  if (!config.accessToken || config.accessToken === "") {
    console.log(`🔌 [MOCK HUBSPOT SYNC] Syncing qualified contact: ${lead.firstName} ${lead.lastName} (${lead.email})`);
    console.log(`   CRM Stage: ${status === "MEETING_BOOKED" ? "Deal Created (Scheduled)" : "Lead Qualified"}`);
    return {
      success: true,
      contactId: "mock_hs_contact_" + Math.random().toString(36).substr(2, 5),
      dealId: status === "MEETING_BOOKED" ? "mock_hs_deal_" + Math.random().toString(36).substr(2, 5) : undefined,
    };
  }

  try {
    // 1. Create or Update HubSpot Contact
    console.log(`🔌 [LIVE HUBSPOT] Syncing contact: ${lead.email}`);
    const contactPayload = {
      properties: {
        email: lead.email,
        firstname: lead.firstName,
        lastname: lead.lastName,
        jobtitle: lead.jobTitle,
        company: lead.companyName,
        apexsdr_fit_score: lead.fitScore?.toString() || "0",
        apexsdr_status: status,
      },
    };

    const contactRes = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      contactPayload,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const hsContactId = contactRes.data?.id;

    // 2. If meeting booked, create a HubSpot Deal and associate it with the contact
    let hsDealId = null;
    if (status === "MEETING_BOOKED") {
      const dealPayload = {
        properties: {
          dealname: `${lead.companyName} <> ApexSDR Outbound Deal`,
          dealstage: "appointmentscheduled",
          pipeline: "default",
          amount: "5000", // Default estimated deal value
        },
      };

      const dealRes = await axios.post(
        "https://api.hubapi.com/crm/v3/objects/deals",
        dealPayload,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      hsDealId = dealRes.data?.id;

      // Associate deal with contact
      if (hsContactId && hsDealId) {
        await axios.put(
          `https://api.hubapi.com/crm/v3/objects/deals/${hsDealId}/associations/contacts/${hsContactId}/3`, // 3 is deal-to-contact association type ID
          {},
          {
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    return {
      success: true,
      contactId: hsContactId,
      dealId: hsDealId,
    };
  } catch (error: any) {
    console.error("❌ HubSpot CRM sync failed:", error.response?.data || error.message);
    throw error;
  }
}
export async function getHubspotConfig(): Promise<HubSpotConfig> {
  return { enabled: true };
}
