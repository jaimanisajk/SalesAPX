"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  UserCheck,
  Zap,
  Target,
  Clock,
  Sparkles,
  RefreshCw,
  XCircle,
  FileText,
  BarChart,
} from "lucide-react";

interface LeadPipelineItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  companyName: string;
  status: string; // CONTACTED | REPLIED | QUALIFIED | ON_DNC
  bantScore?: number;
  bantBreakdown?: {
    budget: { score: number; notes: string };
    authority: { score: number; notes: string };
    need: { score: number; notes: string };
    timeline: { score: number; notes: string };
  };
}

export default function SalesPipeline() {
  const [leads, setLeads] = useState<LeadPipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadPipelineItem | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      // Mock fetch pipeline data
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockPipeline: LeadPipelineItem[] = [
        {
          id: "lead_1",
          firstName: "Rohan",
          lastName: "Mehta",
          email: "rohan.mehta@groww.in",
          jobTitle: "CTO",
          companyName: "Groww",
          status: "QUALIFIED",
          bantScore: 82,
          bantBreakdown: {
            budget: { score: 75, notes: "Lead asked about price ranges and suggested a budget window for tooling." },
            authority: { score: 90, notes: "CTO level. Primary decision maker for engineering tools." },
            need: { score: 85, notes: "Needs to automate SDR cold emails and scale outbound pipelines." },
            timeline: { score: 80, notes: "Requested a demo for next Tuesday at 3 PM." },
          },
        },
        {
          id: "lead_2",
          firstName: "Sarah",
          lastName: "Jenkins",
          email: "sarah.j@lattice.com",
          jobTitle: "Director of HR",
          companyName: "Lattice",
          status: "REPLIED",
          bantScore: 53,
          bantBreakdown: {
            budget: { score: 30, notes: "No budget availability mentioned yet." },
            authority: { score: 70, notes: "Director level, likely has influence but needs VP buy-in." },
            need: { score: 65, notes: "Wants to see differences between static outreach tools and AI SDRs." },
            timeline: { score: 50, notes: "Check back in next quarter." },
          },
        },
        {
          id: "lead_3",
          firstName: "Amit",
          lastName: "Kumar",
          email: "amit@razorpay.com",
          jobTitle: "VP of Sales",
          companyName: "Razorpay",
          status: "CONTACTED",
          bantScore: 0,
        },
        {
          id: "lead_4",
          firstName: "John",
          lastName: "Doe",
          email: "john@stripe.com",
          jobTitle: "Marketing Lead",
          companyName: "Stripe",
          status: "ON_DNC",
          bantScore: 10,
          bantBreakdown: {
            budget: { score: 0, notes: "N/A" },
            authority: { score: 10, notes: "Unrelated marketing team contact." },
            need: { score: 0, notes: "N/A" },
            timeline: { score: 30, notes: "Requested immediate removal from list." },
          },
        }
      ];

      setLeads(mockPipeline);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleRecalculate = async (leadId: string) => {
    setRecalculating(true);
    try {
      // Mock recalculation endpoint: POST /api/qualifications/:leadId/recalculate
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== leadId) return l;
          
          const updatedBreakdown = {
            budget: { score: 85, notes: "Budget approved by CFO for sales tech exploration." },
            authority: { score: 90, notes: "CTO level decision power confirmed." },
            need: { score: 90, notes: "Confirmed direct pain points with outbound manual pipelines." },
            timeline: { score: 95, notes: "Demo booked and set for next week." },
          };
          const total = Math.round((85 + 90 + 90 + 95) / 4);

          const updatedLead = {
            ...l,
            bantScore: total,
            status: "QUALIFIED",
            bantBreakdown: updatedBreakdown,
          };

          if (selectedLead?.id === leadId) {
            setSelectedLead(updatedLead);
          }

          return updatedLead;
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  const getStatusList = (status: string) => {
    return leads.filter((l) => l.status === status);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    if (score >= 40) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  };

  const stages = [
    { key: "CONTACTED", label: "Contacted", color: "bg-blue-500" },
    { key: "REPLIED", label: "Replied / Reviewing", color: "bg-amber-500" },
    { key: "QUALIFIED", label: "AI Qualified (BANT)", color: "bg-emerald-500" },
    { key: "ON_DNC", label: "DNC / Unsubscribed", color: "bg-rose-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Sales Pipeline</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track leads flowing through outreach campaigns, automatically categorized using BANT criteria models.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 text-slate-500 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold">Loading pipeline board...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {stages.map((stage) => {
            const list = getStatusList(stage.key);
            return (
              <div key={stage.key} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col min-h-[450px]">
                {/* Stage Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{stage.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold px-2 py-0.5 bg-slate-900 border border-slate-850 rounded">
                    {list.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1 max-h-[500px]">
                  {list.length === 0 ? (
                    <div className="py-12 text-center text-slate-600 text-xs border border-dashed border-slate-850 rounded-lg">
                      No leads in stage
                    </div>
                  ) : (
                    list.map((lead) => {
                      const hasBant = lead.bantScore && lead.bantScore > 0;
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="bg-slate-950 border border-slate-850 hover:border-slate-750 p-3.5 rounded-lg cursor-pointer transition-all duration-200 space-y-2 shadow"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-200 text-xs leading-tight">
                              {lead.firstName} {lead.lastName}
                            </span>
                            {hasBant && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getScoreColor(lead.bantScore || 0)}`}>
                                BANT: {lead.bantScore}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[10px] text-indigo-400 font-bold leading-none">
                            {lead.jobTitle} at <span className="text-slate-350">{lead.companyName}</span>
                          </p>

                          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1.5 border-t border-slate-900">
                            <span>{lead.email}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Slide-Over / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end animate-in fade-in duration-200">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full p-6 flex flex-col shadow-2xl space-y-6 overflow-y-auto animate-in slide-in-from-right-6 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                  Lead Profile Scorecard
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-2">
                  {selectedLead.firstName} {selectedLead.lastName}
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  {selectedLead.jobTitle} at <span className="text-slate-200">{selectedLead.companyName}</span>
                </p>
                <p className="text-[10px] text-slate-500">{selectedLead.email}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* BANT Metrics overview */}
            {!selectedLead.bantBreakdown ? (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-850 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                <BarChart className="h-6 w-6 text-slate-700 animate-pulse" />
                <p className="font-semibold">BANT qualification details unavailable.</p>
                <p className="text-slate-650">No replies from this lead have been received yet to process conversation intent.</p>
                <button
                  type="button"
                  onClick={() => handleRecalculate(selectedLead.id)}
                  disabled={recalculating}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg mt-2 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                  Trigger Manual Qualification Check
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top overall score wheel */}
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl flex items-center justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">BANT Status</span>
                    <span className={`text-sm font-extrabold px-3 py-1 rounded-full uppercase border ${getScoreColor(selectedLead.bantScore || 0)}`}>
                      {selectedLead.bantScore && selectedLead.bantScore >= 60 ? "Qualified" : "Marketing Review"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average score</span>
                    <span className="text-3xl font-extrabold text-white">{selectedLead.bantScore} <span className="text-xs text-slate-500">/ 100</span></span>
                  </div>
                </div>

                {/* Score meters grid */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Budget */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-emerald-400 bg-emerald-500/10 p-0.5 rounded" />
                        Budget Fit
                      </span>
                      <span className="font-extrabold text-slate-300">{selectedLead.bantBreakdown.budget.score} / 100</span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${selectedLead.bantBreakdown.budget.score}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium italic">"{selectedLead.bantBreakdown.budget.notes}"</p>
                  </div>

                  {/* Authority */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-indigo-400 bg-indigo-500/10 p-0.5 rounded" />
                        Decision Power
                      </span>
                      <span className="font-extrabold text-slate-300">{selectedLead.bantBreakdown.authority.score} / 100</span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${selectedLead.bantBreakdown.authority.score}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium italic">"{selectedLead.bantBreakdown.authority.notes}"</p>
                  </div>

                  {/* Need */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-amber-400 bg-amber-500/10 p-0.5 rounded" />
                        Pain Intensity
                      </span>
                      <span className="font-extrabold text-slate-300">{selectedLead.bantBreakdown.need.score} / 100</span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${selectedLead.bantBreakdown.need.score}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium italic">"{selectedLead.bantBreakdown.need.notes}"</p>
                  </div>

                  {/* Timeline */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-400 bg-blue-500/10 p-0.5 rounded" />
                        Timeline urgency
                      </span>
                      <span className="font-extrabold text-slate-300">{selectedLead.bantBreakdown.timeline.score} / 100</span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${selectedLead.bantBreakdown.timeline.score}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium italic">"{selectedLead.bantBreakdown.timeline.notes}"</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                    Last scored by Agent today
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRecalculate(selectedLead.id)}
                    disabled={recalculating}
                    className="bg-slate-950 border border-slate-800 hover:bg-slate-850 disabled:opacity-50 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                    {recalculating ? "Recalculating..." : "Recalculate"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
