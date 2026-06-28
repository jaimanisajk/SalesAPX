"use client";

import React from "react";
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
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();

  const stats = [
    {
      name: "Leads Approved",
      value: "1,248",
      change: "+12.3%",
      changeType: "increase",
      icon: Users,
    },
    {
      name: "Active In Sequence",
      value: "842",
      change: "+8.4%",
      changeType: "increase",
      icon: GitFork,
    },
    {
      name: "Positive Replies",
      value: "94",
      change: "+24.5%",
      changeType: "increase",
      icon: CheckCircle,
    },
    {
      name: "Meetings Booked",
      value: "28",
      change: "+18.2%",
      changeType: "increase",
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-purple-900/50 p-8 border border-indigo-500/20 backdrop-blur-md">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-3 w-3" />
              AI SDR Pipeline Active
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Welcome back, {user?.firstName || "SDR Leader"}!
            </h1>
            <p className="text-slate-300 max-w-xl text-sm md:text-base">
              Your AI agents are currently prospecting, customizing messages, and qualifying leads. You have 3 hot replies requiring manual review.
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-3">
            <button className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 shadow-lg shadow-indigo-600/30 gap-2">
              <Zap className="h-4 w-4" />
              Deploy New Sequence
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all duration-200 hover:border-slate-700/80 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                {stat.name}
              </span>
              <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 group-hover:bg-indigo-600/10 group-hover:border-indigo-500/20 transition-all">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-white">
                {stat.value}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Active Campaigns */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Active Campaigns</h2>
            <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
              View All <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-800">
            {[
              {
                name: "US Mid-Market SaaS Founders",
                enrolled: 450,
                replyRate: "18.4%",
                meetings: 12,
                status: "ACTIVE",
              },
              {
                name: "India FinTech Series A/B C-Suite",
                enrolled: 250,
                replyRate: "22.1%",
                meetings: 9,
                status: "ACTIVE",
              },
              {
                name: "UK HR-Tech VPs & Directors",
                enrolled: 142,
                replyRate: "14.8%",
                meetings: 7,
                status: "ACTIVE",
              },
            ].map((sequence, idx) => (
              <div key={idx} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">{sequence.name}</p>
                  <p className="text-xs text-slate-500">{sequence.enrolled} leads enrolled</p>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{sequence.replyRate}</p>
                    <p className="text-xs text-slate-500">Reply Rate</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{sequence.meetings}</p>
                    <p className="text-xs text-slate-500">Meetings</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {sequence.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Leads / Inbox Quick-View */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Action Required</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              3 Urgent
            </span>
          </div>
          <div className="space-y-4">
            {[
              {
                name: "Karan Sharma",
                company: "Razorpay",
                title: "VP of Product",
                snippet: "This looks interesting. Can we connect on Thursday?",
                time: "10m ago",
                priority: "HIGH",
              },
              {
                name: "Sarah Jenkins",
                company: "Lattice",
                title: "Director of HR",
                snippet: "What are the pricing details? Send a brief deck first.",
                time: "1h ago",
                priority: "MEDIUM",
              },
              {
                name: "Amit Patel",
                company: "Groww",
                title: "CTO",
                snippet: "Who handles security compliance? Need details.",
                time: "2h ago",
                priority: "MEDIUM",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 border border-slate-850 rounded-lg hover:border-slate-800 transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-200">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.title} at {item.company}</p>
                  </div>
                  <span className="text-[10px] text-slate-500">{item.time}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 italic">
                  "{item.snippet}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
