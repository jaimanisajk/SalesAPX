"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  Flame,
  CheckCircle,
  XCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CornerUpLeft,
  Send,
  Eye,
  Info,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface InboxItem {
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
  type: "LEAD_APPROVAL" | "HOT_REPLY" | "OBJECTION_REVIEW" | "QUALIFIED_LEAD" | "MESSAGE_PREVIEW";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  title: string;
  description: string;
  aiSuggestion?: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
}

export default function HumanInTheLoopInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<InboxItem | null>(null);
  
  // Suggested draft response edit box state
  const [replyDraft, setReplyDraft] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveSuccess, setResolveSuccess] = useState(false);

  // Fetch inbox items
  const fetchInbox = async () => {
    setLoading(true);
    try {
      // Mock fetch from GET /api/inbox
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const localMockInbox: InboxItem[] = [
        {
          id: "inbox_1",
          leadId: "lead_1",
          lead: {
            id: "lead_1",
            firstName: "Rohan",
            lastName: "Mehta",
            email: "rohan.mehta@groww.in",
            jobTitle: "CTO",
            companyName: "Groww",
          },
          type: "HOT_REPLY",
          priority: "HIGH",
          title: "Rohan Mehta (Groww) replied: INTERESTED",
          description: "Hey Rohan, saw your email. I'd love to see a demo of ApexSDR. What does your calendar look like next Tuesday at 3 PM?",
          aiSuggestion: "Hi Rohan,\n\nThrilled to hear you are interested! Next Tuesday at 3 PM works perfectly for our team. You can pick a convenient time on my calendar here: https://calendly.com/sdr-team\n\nLooking forward to speaking!\n\nBest,\nSDR Team",
          status: "PENDING",
          createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        },
        {
          id: "inbox_2",
          leadId: "lead_2",
          lead: {
            id: "lead_2",
            firstName: "Sarah",
            lastName: "Jenkins",
            email: "sarah.j@lattice.com",
            jobTitle: "Director of HR",
            companyName: "Lattice",
          },
          type: "OBJECTION_REVIEW",
          priority: "MEDIUM",
          title: "Sarah Jenkins (Lattice) replied: OBJECTION",
          description: "We are currently using a competitor (Lattice HR tools internally) and not looking to switch. Is there anything distinct about your tool?",
          aiSuggestion: "Hi Sarah,\n\nThanks for letting me know! Lattice is a fantastic tool. What makes ApexSDR distinct is our completely autonomous SDR agents that prospects, writes, sends, qualifies, and books meetings automatically, rather than just acting as a static sequence tool.\n\nHappy to show a 5-min demo if you are open to it.\n\nBest,\nSDR Team",
          status: "PENDING",
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        }
      ];

      setItems(localMockInbox);
      if (localMockInbox.length > 0) {
        setActiveItem(localMockInbox[0]);
        setReplyDraft(localMockInbox[0].aiSuggestion || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleSelect = (item: InboxItem) => {
    setActiveItem(item);
    setReplyDraft(item.aiSuggestion || "");
    setResolveSuccess(false);
  };

  const handleResolve = async (action: "SEND_REPLY" | "DISMISS") => {
    if (!activeItem) return;
    setResolving(true);
    setResolveSuccess(false);

    try {
      // Mock API call: POST /api/inbox/:id/resolve
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setItems((prev) => prev.filter((i) => i.id !== activeItem.id));
      setResolveSuccess(true);
      
      const remaining = items.filter((i) => i.id !== activeItem.id);
      if (remaining.length > 0) {
        setActiveItem(remaining[0]);
        setReplyDraft(remaining[0].aiSuggestion || "");
      } else {
        setActiveItem(null);
        setReplyDraft("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  const getPriorityColor = (priority: InboxItem["priority"]) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "HIGH":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "MEDIUM":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Agent Inbox</h1>
          <p className="text-slate-400 text-sm mt-1">
            Human-in-the-loop validation center. Approve suggested AI replies before they are sent to prospective leads.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch min-h-[500px]">
        {/* Left Side: Tasks queue list (Col span 1) */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Inbox className="h-4 w-4 text-indigo-500" />
              Incoming Hot Replies
            </span>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded">
              {items.length} Pending
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-xs font-semibold">Loading inbox...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-center gap-3">
              <CheckCircle className="h-8 w-8 text-slate-700" />
              <p className="text-sm font-semibold">Inbox all cleared!</p>
              <p className="text-xs text-slate-650">No replies requiring immediate human action.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
              {items.map((item) => {
                const isActive = activeItem?.id === item.id;
                const isHot = item.type === "HOT_REPLY" && item.priority === "HIGH";

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`p-4 cursor-pointer hover:bg-slate-850/50 transition-colors space-y-2.5 relative ${
                      isActive ? "bg-indigo-600/5 border-l-2 border-indigo-500 pl-3.5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isHot && <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse" />}
                        <span className="font-bold text-slate-200 text-xs">
                          {item.lead.firstName} {item.lead.lastName}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-semibold line-clamp-1">{item.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 italic">"{item.description}"</p>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span className="font-bold uppercase tracking-wider">{item.type.replace(/_/g, " ")}</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Center / Right: Detail inspector (Col span 2) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl min-h-[480px]">
          {!activeItem ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-center gap-3">
              <Inbox className="h-10 w-10 text-slate-700" />
              <p className="text-sm font-semibold">Select an item from the queue to review details.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col divide-y divide-slate-800">
              {/* Lead Details Header */}
              <div className="p-5 flex items-start justify-between bg-slate-900/50">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {activeItem.lead.firstName} {activeItem.lead.lastName}
                  </h3>
                  <p className="text-xs text-indigo-400 font-semibold">
                    {activeItem.lead.jobTitle} at <span className="text-slate-300">{activeItem.lead.companyName}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{activeItem.lead.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="h-3.5 w-3.5" />
                    Pending Approval
                  </span>
                </div>
              </div>

              {/* Raw Reply box */}
              <div className="p-5 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Raw Reply Content
                </span>
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-xs leading-relaxed text-slate-350 whitespace-pre-line italic">
                  "{activeItem.description}"
                </div>
              </div>

              {/* AI Draft Suggestion response */}
              <div className="p-5 space-y-3 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CornerUpLeft className="h-4 w-4" />
                    AI Suggested Reply Draft
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Edit below if customization is required
                  </span>
                </div>
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  className="w-full flex-1 min-h-[160px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs leading-relaxed text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                  placeholder="Draft your email response here..."
                />
              </div>

              {/* Action approvals bar */}
              <div className="p-4 bg-slate-950 flex items-center justify-between gap-4">
                <button
                  onClick={() => handleResolve("DISMISS")}
                  disabled={resolving}
                  className="bg-slate-900 border border-slate-850 hover:bg-slate-800 disabled:opacity-50 text-slate-400 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="h-4 w-4 text-rose-500" />
                  Dismiss Task
                </button>
                <div className="flex items-center gap-3">
                  {resolveSuccess && (
                    <span className="text-emerald-400 text-xs font-semibold animate-pulse">
                      ✓ Reply sent successfully!
                    </span>
                  )}
                  <button
                    onClick={() => handleResolve("SEND_REPLY")}
                    disabled={resolving}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {resolving ? "Sending..." : "Approve & Send"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
