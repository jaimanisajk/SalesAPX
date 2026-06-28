import axios from "axios";
import { verifyEmail } from "./hunterService";
import { scoreLead } from "../ai/scoringAgent";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// In-memory cache fallback for leads and logs when DB connection is not available yet
export const memoryLeadsDb: any[] = [];
export const memoryAiLogsDb: any[] = [];

export interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  title: string;
  seniority: string;
  linkedin_url?: string;
  organization?: {
    name: string;
    primary_domain?: string;
    estimated_num_employees?: number;
    annual_revenue?: number;
    industry?: string;
    website?: string;
  };
  city?: string;
  state?: string;
  country?: string;
}

/**
 * Maps standard seniority levels from checkbox groups to Apollo-specific seniority parameters.
 */
function mapSeniorities(seniorities: string[]): string[] {
  const mapping: Record<string, string> = {
    "C-Suite": "c_level",
    "VP": "vp",
    "Director": "director",
    "Manager": "manager",
    "Individual Contributor": "entry"
  };
  return seniorities.map(s => mapping[s] || s.toLowerCase()).filter(Boolean);
}

/**
 * Searches Apollo.io Mixed People Search API
 */
export async function searchApolloLeads(
  icpProfile: any,
  page: number = 1,
  perPage: number = 10
): Promise<ApolloPerson[]> {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey || apiKey === "") {
    console.warn("⚠️ APOLLO_API_KEY is missing. Generating mock Apollo leads matching ICP.");

    // Generate realistic mock leads matching the ICP Profile!
    const mockLeads: ApolloPerson[] = [];
    const companies = [
      { name: "Acme Corp", domain: "acme.com", industry: "SaaS", size: 120, rev: 15000000 },
      { name: "Razorpay", domain: "razorpay.com", industry: "FinTech", size: 1800, rev: 120000000 },
      { name: "Innovate Ltd", domain: "innovatelabs.co", industry: "AI & Analytics", size: 45, rev: 3500000 },
      { name: "Groww", domain: "groww.in", industry: "Finance", size: 950, rev: 85000000 },
      { name: "HackerEarth", domain: "hackerearth.com", industry: "HR Tech", size: 280, rev: 25000000 },
      { name: "TechSolutions", domain: "techsolutions.io", industry: "Cloud Services", size: 65, rev: 8000000 },
    ];

    const firstNames = ["Amit", "Rohan", "Sandeep", "Priya", "Neha", "Divya", "David", "Sarah"];
    const lastNames = ["Sharma", "Patel", "Verma", "Mehta", "Singh", "Nair", "Smith", "Jones"];

    const targetTitles = icpProfile.jobTitles.length > 0 ? icpProfile.jobTitles : ["VP of Product", "CTO", "Head of Sales"];
    const targetIndustries = icpProfile.industries.length > 0 ? icpProfile.industries : ["SaaS", "FinTech"];

    for (let i = 0; i < perPage; i++) {
      const idx = (page - 1) * perPage + i;
      const fName = firstNames[idx % firstNames.length];
      const lName = lastNames[idx % lastNames.length];
      const comp = companies[idx % companies.length];
      const title = targetTitles[idx % targetTitles.length];
      const industry = targetIndustries[idx % targetIndustries.length];
      const seniority = icpProfile.seniorityLevels[idx % icpProfile.seniorityLevels.length] || "VP";

      mockLeads.push({
        id: `mock-apollo-${idx}`,
        first_name: fName,
        last_name: lName,
        name: `${fName} ${lName}`,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}@${comp.domain}`,
        title: title,
        seniority: seniority,
        linkedin_url: `https://www.linkedin.com/in/mock-${fName.toLowerCase()}-${lName.toLowerCase()}`,
        organization: {
          name: comp.name,
          primary_domain: comp.domain,
          estimated_num_employees: comp.size,
          annual_revenue: comp.rev,
          industry: industry,
          website: `https://www.${comp.domain}`,
        },
        city: "Bengaluru",
        state: "Karnataka",
        country: icpProfile.geographies[0] || "India",
      });
    }

    return mockLeads;
  }

  try {
    const apolloParams = {
      api_key: apiKey,
      person_titles: icpProfile.jobTitles,
      person_seniorities: mapSeniorities(icpProfile.seniorityLevels),
      organization_num_employees_ranges: [`${icpProfile.companySizeMin},${icpProfile.companySizeMax}`],
      person_locations: icpProfile.geographies,
      page,
      per_page: perPage,
    };

    const response = await axios.post(
      "https://api.apollo.io/v1/mixed_people/search",
      apolloParams
    );

    const people = response.data?.people || [];
    return people.map((p: any) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      name: p.name,
      email: p.email,
      title: p.title,
      seniority: p.seniority,
      linkedin_url: p.linkedin_url,
      organization: p.organization
        ? {
            name: p.organization.name,
            primary_domain: p.organization.primary_domain,
            estimated_num_employees: p.organization.estimated_num_employees,
            annual_revenue: p.organization.annual_revenue,
            industry: p.organization.industry,
            website: p.organization.website_url,
          }
        : undefined,
      city: p.city,
      state: p.state,
      country: p.country,
    }));
  } catch (error: any) {
    console.error("❌ Apollo API search failed:", error.message);
    throw error;
  }
}

/**
 * Paginate, enrich, score, and import leads from Apollo based on ICP
 */
export async function importLeadsFromApollo(
  icpProfile: any,
  orgId: string,
  count: number = 10
): Promise<any[]> {
  console.log(`🚀 Starting Apollo Import for Org: ${orgId}, target count: ${count}`);
  
  const importedLeads: any[] = [];
  let page = 1;
  const perPage = Math.min(count, 20);
  
  try {
    while (importedLeads.length < count) {
      const rawLeads = await searchApolloLeads(icpProfile, page, perPage);
      if (rawLeads.length === 0) break;
      
      for (const raw of rawLeads) {
        if (importedLeads.length >= count) break;

        // Check if lead already exists in PostgreSQL
        let dbLead = null;
        try {
          dbLead = await prisma.lead.findUnique({
            where: {
              orgId_email: {
                orgId,
                email: raw.email,
              },
            },
          });
        } catch {
          // Fallback to memory DB check
          dbLead = memoryLeadsDb.find(l => l.orgId === orgId && l.email === raw.email);
        }

        if (dbLead) {
          console.log(`⏭️ Lead with email ${raw.email} already exists. Skipping.`);
          continue;
        }

        // Enrich and verify email with Hunter.io
        const verification = await verifyEmail(raw.email);
        if (verification.result === "undeliverable") {
          console.log(`⚠️ Email ${raw.email} undeliverable according to Hunter.io. Skipping.`);
          continue;
        }

        // Map raw Apollo Person to DB Lead structure
        const leadData = {
          orgId,
          firstName: raw.first_name || "",
          lastName: raw.last_name || "",
          email: raw.email,
          phone: null,
          linkedinUrl: raw.linkedin_url || null,
          jobTitle: raw.title || "Unknown Title",
          seniorityLevel: raw.seniority || null,
          companyName: raw.organization?.name || "Unknown Company",
          companyDomain: raw.organization?.primary_domain || null,
          companySize: raw.organization?.estimated_num_employees || null,
          companyRevenue: raw.organization?.annual_revenue || null,
          industry: raw.organization?.industry || null,
          geography: raw.country || null,
          timezone: null,
          techStack: [] as string[],
          fitScore: 0,
          fitScoreReasons: [] as string[],
          intentScore: 0,
          status: "PENDING_REVIEW" as any,
          source: "APOLLO" as const,
          enrichedData: { hunter: verification } as any,
          companyData: (raw.organization || null) as any,
        };

        // Score lead with AI scoring agent
        const scoreResult = await scoreLead(leadData, icpProfile, orgId);
        
        leadData.fitScore = scoreResult.score;
        leadData.fitScoreReasons = scoreResult.reasons;
        if (scoreResult.recommendation === "REJECT") {
          leadData.status = "REJECTED";
        }

        let savedLead: any;
        try {
          // Write to database
          savedLead = await prisma.lead.create({
            data: leadData,
          });
          
          // Increment leads used this month
          await prisma.organisation.update({
            where: { id: orgId },
            data: { leadsUsedThisMonth: { increment: 1 } },
          });
        } catch (dbError) {
          // Fallback to mock DB save
          const mockId = `lead_${Math.random().toString(36).substr(2, 9)}`;
          savedLead = {
            id: mockId,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...leadData,
          };
          memoryLeadsDb.push(savedLead);
          console.log(`📁 Saved lead ${raw.email} to Local Cache due to DB connection unavailability.`);
        }

        importedLeads.push(savedLead);
      }

      page++;
      // Guard to prevent infinite loop
      if (page > 5) break;
    }
  } catch (error: any) {
    console.error("❌ Error running Apollo import service:", error.message);
  }

  return importedLeads;
}
