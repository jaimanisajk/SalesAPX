"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Check,
  X,
  Plus,
  Filter,
  FileSpreadsheet,
  Linkedin,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Search,
  Sparkles,
  Play,
  Settings,
  HelpCircle,
} from "lucide-react";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  companyName: string;
  companyDomain?: string;
  companySize?: number;
  industry?: string;
  geography?: string;
  fitScore: number;
  fitScoreReasons: string[];
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "IN_SEQUENCE" | "REPLIED" | "INTERESTED" | "QUALIFYING" | "MEETING_READY" | "MEETING_BOOKED" | "DISQUALIFIED" | "NOT_NOW" | "ON_DNC";
  source: "APOLLO" | "LINKEDIN" | "HUNTER" | "MANUAL" | "CSV_IMPORT" | "PEOPLE_DATA_LABS";
  createdAt: string;
  linkedinUrl?: string;
}

export default function LeadApprovalQueue() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Lead["status"] | "ALL">("PENDING_REVIEW");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedLeadDetail, setSelectedLeadDetail] = useState<Lead | null>(null);
  
  // CSV Import Modal State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    jobTitle: "Job Title",
    companyName: "Company",
    companySize: "Size",
    industry: "Industry",
    geography: "Country",
  });
  const [csvUploading, setCsvUploading] = useState(false);

  // Apollo Trigger State
  const [triggeringApollo, setTriggeringApollo] = useState(false);
  const [importCount, setImportCount] = useState(5);

  const tabs: { label: string; value: Lead["status"] | "ALL" }[] = [
    { label: "Pending Review", value: "PENDING_REVIEW" },
    { label: "Approved", value: "APPROVED" },
    { label: "In Sequence", value: "IN_SEQUENCE" },
    { label: "Interested", value: "INTERESTED" },
    { label: "Meeting Booked", value: "MEETING_BOOKED" },
    { label: "DNC", value: "ON_DNC" },
  ];

  // Fetch leads (Mocked backend endpoint resolver)
  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Mocking fetch from API endpoint GET /api/leads
      await new Promise((resolve) => setTimeout(resolve, 800));
      const queryUrl = activeTab === "ALL" ? "/api/leads" : `/api/leads?status=${activeTab}`;
      console.log("Mock fetching leads from API:", queryUrl);

      // Local initial mock database loader
      const localMockData: Lead[] = [
        {
          id: "lead_1",
          firstName: "Rohan",
          lastName: "Mehta",
          email: "rohan.mehta@groww.in",
          jobTitle: "CTO",
          companyName: "Groww",
          companyDomain: "groww.in",
          companySize: 950,
          industry: "FinTech",
          geography: "India",
          fitScore: 88,
          fitScoreReasons: ["Job title matches target 'CTO'", "Company size is in ideal range", "Located in key region: India"],
          status: "PENDING_REVIEW",
          source: "APOLLO",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          linkedinUrl: "https://www.linkedin.com/in/rohanmehta-groww",
        },
        {
          id: "lead_2",
          firstName: "Sarah",
          lastName: "Jenkins",
          email: "sarah.j@lattice.com",
          jobTitle: "Director of HR",
          companyName: "Lattice",
          companyDomain: "lattice.com",
          companySize: 450,
          industry: "SaaS",
          geography: "United States",
          fitScore: 78,
          fitScoreReasons: ["Title is relevant ('Director')", "SaaS industry is target segment", "Size within limits"],
          status: "PENDING_REVIEW",
          source: "APOLLO",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          linkedinUrl: "https://www.linkedin.com/in/sarahjenkins-lattice",
        },
        {
          id: "lead_3",
          firstName: "Divya",
          lastName: "Nair",
          email: "divya.n@razorpay.com",
          jobTitle: "VP of Product",
          companyName: "Razorpay",
          companyDomain: "razorpay.com",
          companySize: 1800,
          industry: "FinTech",
          geography: "India",
          fitScore: 92,
          fitScoreReasons: ["High match title: VP of Product", "High match industry: FinTech", "Ideal employee size"],
          status: "APPROVED",
          source: "APOLLO",
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          linkedinUrl: "https://www.linkedin.com/in/divyanair-razorpay",
        },
        {
          id: "lead_4",
          firstName: "David",
          lastName: "Miller",
          email: "david@consultinggroup.local",
          jobTitle: "Junior Designer",
          companyName: "Freelance",
          companyDomain: "consultinggroup.local",
          companySize: 2,
          industry: "Consulting",
          geography: "Germany",
          fitScore: 15,
          fitScoreReasons: ["Title is non-decisionmaker", "Company size is below target limit", "Excluded industry keyword: consulting"],
          status: "REJECTED",
          source: "APOLLO",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        }
      ];

      const filtered = activeTab === "ALL" 
        ? localMockData 
        : localMockData.filter(l => l.status === activeTab);
      
      setLeads(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    setSelectedLeads([]);
  }, [activeTab]);

  // Bulk Actions
  const handleBulkApproval = async () => {
    if (selectedLeads.length === 0) return;
    setLoading(true);
    try {
      // API call: POST /api/leads/approve { leadIds: selectedLeads }
      await new Promise(resolve => setTimeout(resolve, 600));
      setLeads(prev => prev.filter(l => !selectedLeads.includes(l.id)));
      setSelectedLeads([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRejection = async () => {
    if (selectedLeads.length === 0) return;
    setLoading(true);
    try {
      // API call: POST /api/leads/reject { leadIds: selectedLeads }
      await new Promise(resolve => setTimeout(resolve, 600));
      setLeads(prev => prev.filter(l => !selectedLeads.includes(l.id)));
      setSelectedLeads([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAllHighScores = async () => {
    const highScores = leads
      .filter((l) => l.fitScore >= 70 && l.status === "PENDING_REVIEW")
      .map((l) => l.id);

    if (highScores.length === 0) return;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLeads((prev) => prev.filter((l) => !highScores.includes(l.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Single Action
  const handleSingleStatusChange = async (id: string, newStatus: Lead["status"]) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setLeads(prev => prev.filter(l => l.id !== id));
      if (selectedLeadDetail && selectedLeadDetail.id === id) {
        setSelectedLeadDetail(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Apollo Scraper
  const handleApolloTrigger = async () => {
    setTriggeringApollo(true);
    try {
      // API call: POST /api/leads/import/apollo { count: importCount }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await fetchLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setTriggeringApollo(false);
    }
  };

  // CSV parsing simulation
  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvRawText(text);
    const rows = text.split("\n").filter(r => r.trim() !== "");
    if (rows.length > 0) {
      const headers = rows[0].split(",").map(h => h.trim());
      setCsvHeaders(headers);
    }
  };

  const handleCsvUpload = async () => {
    setCsvUploading(true);
    try {
      // Simulate API POST /api/leads/import/csv
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setShowCsvModal(false);
      setCsvRawText("");
      setCsvFileName("");
      fetchLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setCsvUploading(false);
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((li) => li !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((l) => l.id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Lead Approval Queue</h1>
          <p className="text-slate-400 text-sm mt-1">
            Qualify and approve leads imported by AI agents before they are enrolled in sequences.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Apollo Pull Trigger */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1.5 gap-2">
            <span className="text-xs text-slate-400 font-semibold pl-2">Import Limit:</span>
            <input
              type="number"
              value={importCount}
              onChange={(e) => setImportCount(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs w-12 text-center rounded p-1"
            />
            <button
              onClick={handleApolloTrigger}
              disabled={triggeringApollo}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            >
              {triggeringApollo ? (
                <>Scraping...</>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Scrape Apollo
                </>
              )}
            </button>
          </div>

          {/* CSV Import Button */}
          <button
            onClick={() => setShowCsvModal(true)}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            Upload CSV
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex overflow-x-auto border-b border-slate-800 gap-2 pb-px scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${
                isActive
                  ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Selection Control Panel */}
      {selectedLeads.length > 0 && (
        <div className="flex items-center justify-between bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 animate-in slide-in-from-top-4 duration-300">
          <span className="text-xs font-bold text-indigo-400">
            {selectedLeads.length} leads selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkApproval}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/10"
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              onClick={handleBulkRejection}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Quick Score Action (Pending Review Tab only) */}
      {activeTab === "PENDING_REVIEW" && selectedLeads.length === 0 && leads.length > 0 && (
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-slate-400 font-semibold">
              Filter: You have leads matching your ICP with High scores ready to go.
            </span>
          </div>
          <button
            onClick={handleApproveAllHighScores}
            className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Check className="h-3.5 w-3.5" /> Approve All High Match (&gt;70)
          </button>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-sm font-semibold">Loading lead records...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Users className="h-8 w-8 text-slate-700 mx-auto" />
            <p className="text-sm font-semibold">No leads found in this queue.</p>
            <p className="text-xs text-slate-600">Trigger Apollo search or upload a CSV to import leads.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-medium">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === leads.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </th>
                  <th scope="col" className="px-6 py-4">Lead</th>
                  <th scope="col" className="px-6 py-4">Job Title</th>
                  <th scope="col" className="px-6 py-4">Company</th>
                  <th scope="col" className="px-6 py-4 text-center">Fit Score</th>
                  <th scope="col" className="px-6 py-4">Source</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900">
                {leads.map((lead) => {
                  const isSelected = selectedLeads.includes(lead.id);
                  const isHighFit = lead.fitScore >= 70;
                  const isLowFit = lead.fitScore < 40;

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-850/50 transition-colors cursor-pointer ${
                        isSelected ? "bg-indigo-600/5" : ""
                      }`}
                      onClick={() => setSelectedLeadDetail(lead)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLead(lead.id)}
                          className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        <div className="flex flex-col">
                          <span>{lead.firstName} {lead.lastName}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{lead.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{lead.jobTitle}</td>
                      <td className="px-6 py-4 text-slate-300">
                        <div className="flex flex-col">
                          <span>{lead.companyName}</span>
                          {lead.companySize && (
                            <span className="text-[10px] text-slate-500">{lead.companySize} employees</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                            isHighFit
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : isLowFit
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {lead.fitScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] uppercase font-semibold text-slate-500 border border-slate-800">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          {lead.status === "PENDING_REVIEW" && (
                            <>
                              <button
                                onClick={() => handleSingleStatusChange(lead.id, "APPROVED")}
                                className="p-1 text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded transition-all"
                                title="Approve Lead"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleSingleStatusChange(lead.id, "REJECTED")}
                                className="p-1 text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded transition-all"
                                title="Reject Lead"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <ChevronRight className="h-4 w-4 text-slate-600 mt-1" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Detail Panel */}
      {selectedLeadDetail && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Lead Details</h3>
              <p className="text-xs text-slate-500">ID: {selectedLeadDetail.id}</p>
            </div>
            <button
              onClick={() => setSelectedLeadDetail(null)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-white">
                  {selectedLeadDetail.firstName} {selectedLeadDetail.lastName}
                </h4>
                <p className="text-sm text-indigo-400">{selectedLeadDetail.jobTitle}</p>
                <p className="text-xs text-slate-400">{selectedLeadDetail.companyName}</p>
              </div>
              {selectedLeadDetail.linkedinUrl && (
                <a
                  href={selectedLeadDetail.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20 transition-all"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>

            {/* Fit score breakdown */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  AI Fit score analysis
                </span>
                <span className="text-xl font-black text-indigo-400 bg-indigo-500/10 px-3 py-0.5 rounded border border-indigo-500/20">
                  {selectedLeadDetail.fitScore}/100
                </span>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Scoring Rationale
                </span>
                <ul className="space-y-1.5">
                  {selectedLeadDetail.fitScoreReasons.map((reason, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* General Data Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/50 border border-slate-850 rounded-lg p-3">
                <p className="text-slate-500 font-semibold mb-0.5">Email Address</p>
                <p className="text-slate-300 break-all">{selectedLeadDetail.email}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-850 rounded-lg p-3">
                <p className="text-slate-500 font-semibold mb-0.5">Geography</p>
                <p className="text-slate-300">{selectedLeadDetail.geography || "Not enrichable"}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-850 rounded-lg p-3">
                <p className="text-slate-500 font-semibold mb-0.5">Company Industry</p>
                <p className="text-slate-300">{selectedLeadDetail.industry || "Not specified"}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-850 rounded-lg p-3">
                <p className="text-slate-500 font-semibold mb-0.5">Company Size</p>
                <p className="text-slate-300">
                  {selectedLeadDetail.companySize ? `${selectedLeadDetail.companySize} employees` : "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions bottom bar */}
          <div className="p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
            {selectedLeadDetail.status === "PENDING_REVIEW" && (
              <>
                <button
                  onClick={() => handleSingleStatusChange(selectedLeadDetail.id, "REJECTED")}
                  className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
                >
                  Reject Lead
                </button>
                <button
                  onClick={() => handleSingleStatusChange(selectedLeadDetail.id, "APPROVED")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
                >
                  Approve Lead
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowCsvModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
                Upload CSV Leads
              </h3>
              <button
                onClick={() => setShowCsvModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Paste CSV Raw text (comma-separated, first row headers)
                </label>
                <textarea
                  value={csvRawText}
                  onChange={handleCsvChange}
                  className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="firstName,lastName,email,jobTitle,companyName,companySize&#10;John,Doe,john@company.com,CTO,Company Inc,50&#10;Jane,Smith,jane@tech.co,VP of Growth,Tech Co,120"
                />
              </div>

              {csvHeaders.length > 0 && (
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Map CSV Columns to Lead Fields
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(csvMapping).map((field) => (
                      <div key={field} className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 capitalize">
                          {field.replace(/([A-Z])/g, " $1")}
                        </label>
                        <select
                          value={csvMapping[field]}
                          onChange={(e) => setCsvMapping((m) => ({ ...m, [field]: e.target.value }))}
                          className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg p-2 focus:outline-none"
                        >
                          <option value="">-- Ignore Field --</option>
                          {csvHeaders.map((head) => (
                            <option key={head} value={head}>
                              {head}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
              <button
                onClick={() => setShowCsvModal(false)}
                className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 text-xs font-bold px-4 py-2.5 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCsvUpload}
                disabled={csvUploading || !csvRawText}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all"
              >
                {csvUploading ? "Uploading..." : "Import Leads"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
