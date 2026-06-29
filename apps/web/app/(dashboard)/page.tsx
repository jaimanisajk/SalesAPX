"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  GitFork,
  CheckCircle,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Zap,
  DollarSign,
  Layers,
  Activity,
  Cpu,
} from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  totals: {
    leads: number;
    contacted: number;
    replied: number;
    meetingsBooked: number;
    onDnc: number;
  };
  rates: {
    openRate: number;
    replyRate: number;
    meetingRate: number;
  };
  aiUsage: {
    callsCount: number;
    costUSD: number;
  };
}

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Mock fetch GET /api/analytics
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      setData({
        totals: {
          leads: 124,
          contacted: 86,
          replied: 16,
          meetingsBooked: 4,
          onDnc: 2,
        },
        rates: {
          openRate: 72.4,
          replyRate: 18.6,
          meetingRate: 25.0,
        },
        aiUsage: {
          callsCount: 68,
          costUSD: 0.081,
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-purple-900/50 p-8 border border-indigo-500/20 backdrop-blur-md">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-3 w-3" />
              AI SDR Agents Pipeline Active
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Welcome back, {user?.firstName || "SDR Leader"}!
            </h1>
            <p className="text-slate-300 max-w-xl text-sm md:text-base">
              Your outbound engines are currently running round-robin rotation limits. Review hot replies and BANT qualified targets below.
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-3">
            <Link
              href="/campaigns/new"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-205 shadow-lg shadow-indigo-600/30 gap-2 font-bold"
            >
              <Zap className="h-4 w-4" />
              Deploy New Sequence
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 text-slate-500 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold">Gathering organizational statistics...</span>
        </div>
      ) : (
        data && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Leads */}
              <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-700/80 group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-450">Leads Generated</span>
                  <div className="p-2 bg-slate-800 border border-slate-700 text-indigo-400 rounded-lg group-hover:bg-indigo-600/10 group-hover:border-indigo-500/20 transition-all">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight text-white">{data.totals.leads}</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <TrendingUp className="h-3 w-3 mr-1" /> +12.4%
                  </span>
                </div>
              </div>

              {/* Contacted */}
              <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-700/80 group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-450">Contacted (Outbound)</span>
                  <div className="p-2 bg-slate-800 border border-slate-700 text-indigo-400 rounded-lg group-hover:bg-indigo-600/10 group-hover:border-indigo-500/20 transition-all">
                    <GitFork className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight text-white">{data.totals.contacted}</span>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                    Active Drips
                  </span>
                </div>
              </div>

              {/* Replied */}
              <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-700/80 group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-450">Positive Replies</span>
                  <div className="p-2 bg-slate-800 border border-slate-700 text-indigo-400 rounded-lg group-hover:bg-indigo-600/10 group-hover:border-indigo-500/20 transition-all">
                    <CheckCircle className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight text-white">{data.totals.replied}</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {data.rates.replyRate}% Reply rate
                  </span>
                </div>
              </div>

              {/* Meetings Booked */}
              <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-700/80 group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-450">Meetings Booked</span>
                  <div className="p-2 bg-slate-800 border border-slate-700 text-indigo-400 rounded-lg group-hover:bg-indigo-600/10 group-hover:border-indigo-500/20 transition-all">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight text-white">{data.totals.meetingsBooked}</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {data.rates.meetingRate}% Book rate
                  </span>
                </div>
              </div>
            </div>

            {/* Downward Row: Performance metrics & AI Costs details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance charts */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-indigo-500" />
                  Campaign Conversion rates
                </h2>
                
                <div className="grid grid-cols-3 gap-4 text-center py-4">
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Open Rate</span>
                    <span className="text-2xl font-extrabold text-white">{data.rates.openRate}%</span>
                  </div>
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Reply Rate</span>
                    <span className="text-2xl font-extrabold text-white">{data.rates.replyRate}%</span>
                  </div>
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Meeting Book Rate</span>
                    <span className="text-2xl font-extrabold text-white">{data.rates.meetingRate}%</span>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Active outboxes warming up</span>
                  <Link href="/settings/emails" className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
                    Manage Email Accounts <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* AI Token Audit Usage details */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="h-4.5 w-4.5 text-indigo-500" />
                    AI Agent Token Audits
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Overview of API executions for Apollo lead enrichments, Gemini BANT qualifications, and cold email copywriting generations.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">API Queries Run</span>
                      <span className="text-xl font-extrabold text-white mt-1 block">{data.aiUsage.callsCount}</span>
                    </div>
                    <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total cost USD</span>
                      <span className="text-xl font-extrabold text-indigo-450 mt-1 block">${data.aiUsage.costUSD.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Model: gemini-1.5-flash</span>
                  <span className="text-emerald-450 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                    Quota healthy
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
