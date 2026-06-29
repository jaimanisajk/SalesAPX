"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Plus,
  Play,
  Mail,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Users,
  Eye,
  Calendar,
  AlertCircle,
  MoreVertical,
} from "lucide-react";

interface Sequence {
  id: string;
  name: string;
  status: "ACTIVE" | "DRAFT" | "PAUSED" | "ARCHIVED";
  totalEnrolled: number;
  totalCompleted: number;
  totalMeetings: number;
  replyRate: number;
  meetingRate: number;
  createdAt: string;
  updatedAt: string;
}

export default function CampaignsConsole() {
  const [campaigns, setCampaigns] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch campaigns from Mock API
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const localMockCampaigns: Sequence[] = [
        {
          id: "campaign_1",
          name: "Outbound SaaS Founders Sequence",
          status: "ACTIVE",
          totalEnrolled: 84,
          totalCompleted: 12,
          totalMeetings: 4,
          replyRate: 15.4,
          meetingRate: 4.8,
          createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
        },
        {
          id: "campaign_2",
          name: "Enterprise FinTech Director outreach",
          status: "DRAFT",
          totalEnrolled: 0,
          totalCompleted: 0,
          totalMeetings: 0,
          replyRate: 0.0,
          meetingRate: 0.0,
          createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        }
      ];

      setCampaigns(localMockCampaigns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const getStatusColor = (status: Sequence["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "DRAFT":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "PAUSED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "ARCHIVED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Outreach Campaigns</h1>
          <p className="text-slate-400 text-sm mt-1">
            Build multi-step cold email and social selling tracks. Monitor reply rates and meetings booked.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </Link>
      </div>

      {/* Grid statistics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-md">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Campaigns
          </span>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-black text-white">
              {campaigns.filter((c) => c.status === "ACTIVE").length}
            </span>
            <Play className="h-5 w-5 text-indigo-500" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-md">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Leads Enrolled
          </span>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-black text-white">
              {campaigns.reduce((sum, c) => sum + c.totalEnrolled, 0)}
            </span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-md">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Avg Reply Rate
          </span>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-black text-white">
              {(campaigns.reduce((sum, c) => sum + c.replyRate, 0) / (campaigns.filter(c => c.totalEnrolled > 0).length || 1)).toFixed(1)}%
            </span>
            <MessageSquare className="h-5 w-5 text-indigo-500" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-md">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Meetings Booked
          </span>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-black text-white">
              {campaigns.reduce((sum, c) => sum + c.totalMeetings, 0)}
            </span>
            <UserCheck className="h-5 w-5 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">All Campaigns</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold">Loading campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Send className="h-8 w-8 text-slate-700 mx-auto" />
            <p className="text-sm font-semibold">No sequences created yet.</p>
            <p className="text-xs text-slate-600">Get started by creating your first outreach template flows.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-medium">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Campaign Name</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-center">Enrolled</th>
                  <th scope="col" className="px-6 py-4 text-center">Reply Rate</th>
                  <th scope="col" className="px-6 py-4 text-center">Meetings</th>
                  <th scope="col" className="px-6 py-4">Created Date</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-200 text-sm">
                      {camp.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(camp.status)}`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-350 font-bold">{camp.totalEnrolled}</td>
                    <td className="px-6 py-4 text-center font-bold">
                      <span className={camp.replyRate >= 10 ? "text-indigo-400" : "text-slate-400"}>
                        {camp.replyRate > 0 ? `${camp.replyRate}%` : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-400">
                      {camp.totalMeetings > 0 ? camp.totalMeetings : "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(camp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link
                          href={`/campaigns/${camp.id}`}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-bold uppercase transition-all"
                        >
                          Edit
                        </Link>
                        <button className="p-1 hover:bg-slate-800 rounded">
                          <MoreVertical className="h-4 w-4 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
