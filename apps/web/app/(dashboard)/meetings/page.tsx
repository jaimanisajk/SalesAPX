"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  Video,
  User,
  Building,
  Mail,
  Zap,
} from "lucide-react";

interface MeetingItem {
  id: string;
  leadId: string;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    companyName: string;
  };
  title: string;
  startsAt: string;
  endsAt: string;
  status: "BOOKED" | "CANCELLED" | "RESCHEDULED";
  calBookingUid: string;
  createdAt: string;
}

export default function BookedMeetingsConsole() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      // Mock fetch meetings from GET /api/meetings
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockMeetings: MeetingItem[] = [
        {
          id: "meeting_1",
          leadId: "lead_1",
          lead: {
            id: "lead_1",
            firstName: "Rohan",
            lastName: "Mehta",
            email: "rohan.mehta@groww.in",
            jobTitle: "CTO",
            companyName: "Groww",
          },
          title: "ApexSDR Product Demo & Onboarding",
          startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days from now
          endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2 + 1800000).toISOString(), // 30 mins
          status: "BOOKED",
          calBookingUid: "cal_uid_9981",
          createdAt: new Date().toISOString(),
        },
        {
          id: "meeting_2",
          leadId: "lead_3",
          lead: {
            id: "lead_3",
            firstName: "Amit",
            lastName: "Kumar",
            email: "amit@razorpay.com",
            jobTitle: "VP of Sales",
            companyName: "Razorpay",
          },
          title: "ApexSDR Sales Pipeline Automation Intro",
          startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1).toISOString(), // Yesterday
          endsAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1 + 1800000).toISOString(),
          status: "BOOKED",
          calBookingUid: "cal_uid_9982",
          createdAt: new Date().toISOString(),
        }
      ];

      setMeetings(mockMeetings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const getStatusBadge = (status: MeetingItem["status"]) => {
    switch (status) {
      case "BOOKED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  const activeMeetings = meetings.filter((m) => m.status === "BOOKED" && new Date(m.startsAt) >= new Date());
  const pastMeetings = meetings.filter((m) => m.status === "BOOKED" && new Date(m.startsAt) < new Date());

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Calendar & Meetings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Overview of calls, demos, and syncs automatically scheduled by outbound SDR email campaigns.
          </p>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Upcoming Syncs</span>
            <span className="text-2xl font-extrabold text-white">{activeMeetings.length}</span>
          </div>
          <Calendar className="h-8 w-8 text-indigo-500 bg-indigo-500/10 p-1.5 rounded-lg" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Meetings Booked (Total)</span>
            <span className="text-2xl font-extrabold text-white">{meetings.length}</span>
          </div>
          <CheckCircle className="h-8 w-8 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-lg" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cancellation Rate</span>
            <span className="text-2xl font-extrabold text-white">0%</span>
          </div>
          <XCircle className="h-8 w-8 text-rose-500 bg-rose-500/10 p-1.5 rounded-lg" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 text-slate-500 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold">Loading meetings agenda...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
              <Video className="h-4.5 w-4.5 text-indigo-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming Calendar Bookings</h2>
            </div>

            {activeMeetings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs italic">
                No upcoming meetings scheduled.
              </div>
            ) : (
              <div className="divide-y divide-slate-850">
                {activeMeetings.map((meeting) => (
                  <div key={meeting.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/20 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{meeting.title}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getStatusBadge(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-indigo-400" />
                          {meeting.lead.firstName} {meeting.lead.lastName} ({meeting.lead.jobTitle})
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-slate-500" />
                          {meeting.lead.companyName}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                        <Clock className="h-4 w-4 text-indigo-500" />
                        {new Date(meeting.startsAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{" "}
                        {new Date(meeting.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Cal UID: {meeting.calBookingUid}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past/History Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Completed Meetings</h2>
            </div>

            {pastMeetings.length === 0 ? (
              <div className="p-8 text-center text-slate-650 text-xs italic">
                No past completed meetings logged.
              </div>
            ) : (
              <div className="divide-y divide-slate-850 opacity-70">
                {pastMeetings.map((meeting) => (
                  <div key={meeting.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">{meeting.title}</span>
                        <span className="text-[9px] font-bold px-1.5 bg-slate-950 border border-slate-850 text-slate-400 rounded">
                          COMPLETED
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {meeting.lead.firstName} {meeting.lead.lastName} • {meeting.lead.companyName}
                      </p>
                    </div>

                    <span className="text-xs text-slate-500 font-bold">
                      {new Date(meeting.startsAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
