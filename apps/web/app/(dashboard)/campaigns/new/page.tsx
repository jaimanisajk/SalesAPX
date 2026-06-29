"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Save,
  MessageSquare,
  Linkedin,
  Calendar,
  Clock,
  LayoutGrid,
  Zap,
} from "lucide-react";

interface StepVariant {
  type: "A" | "B";
  subject: string;
  body: string;
}

interface SequenceStep {
  id: string;
  type: "EMAIL" | "DELAY" | "LINKEDIN_CONNECT" | "LINKEDIN_MESSAGE";
  delayDays?: number;
  variants?: StepVariant[];
  linkedinMessage?: string;
}

export default function CampaignSequenceBuilder() {
  const router = useRouter();
  const [name, setName] = useState("Outbound Outreach Campaign");
  const [steps, setSteps] = useState<SequenceStep[]>([
    {
      id: "step_1",
      type: "EMAIL",
      delayDays: 0,
      variants: [
        {
          type: "A",
          subject: "Quick question about {{companyName || 'your company'}}",
          body: "Hi {{firstName || 'there'}},\n\nSaw you are heading up tech at {{companyName}}.\n\nAre you looking to automate your outbound SDR team this quarter?\n\nBest,\n{{senderName}}",
        }
      ]
    }
  ]);

  const [activeStepId, setActiveStepId] = useState<string>("step_1");
  const [activeVariantTab, setActiveVariantTab] = useState<"A" | "B">("A");
  const [saving, setSaving] = useState(false);

  // Settings
  const [sendingWindow, setSendingWindow] = useState("WEEKDAYS_ONLY");
  const [dailyLimit, setDailyLimit] = useState(50);

  // Add steps
  const addEmailStep = () => {
    const newId = `step_${Math.random().toString(36).substr(2, 9)}`;
    const newStep: SequenceStep = {
      id: newId,
      type: "EMAIL",
      variants: [
        {
          type: "A",
          subject: "Following up: AI SDR",
          body: "Hi {{firstName}},\n\nJust bumping this post. Would love to demo ApexSDR for {{companyName}}.\n\nBest,\n{{senderName}}",
        }
      ]
    };
    setSteps((prev) => [...prev, newStep]);
    setActiveStepId(newId);
    setActiveVariantTab("A");
  };

  const addDelayStep = () => {
    const newId = `step_${Math.random().toString(36).substr(2, 9)}`;
    const newStep: SequenceStep = {
      id: newId,
      type: "DELAY",
      delayDays: 3,
    };
    setSteps((prev) => [...prev, newStep]);
    setActiveStepId(newId);
  };

  const addLinkedinStep = (type: "LINKEDIN_CONNECT" | "LINKEDIN_MESSAGE") => {
    const newId = `step_${Math.random().toString(36).substr(2, 9)}`;
    const newStep: SequenceStep = {
      id: newId,
      type,
      linkedinMessage: type === "LINKEDIN_CONNECT" 
        ? "Hi {{firstName}}, would love to connect. I saw your role as {{jobTitle}} at {{companyName}}."
        : "Hi {{firstName}}, following up here to see if you received my email...",
    };
    setSteps((prev) => [...prev, newStep]);
    setActiveStepId(newId);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (activeStepId === id) {
      setActiveStepId(steps[0]?.id || "");
    }
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= steps.length) return;

    setSteps((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
  };

  // Merge tag helper insert
  const insertMergeTag = (tag: string) => {
    const activeStep = steps.find(s => s.id === activeStepId);
    if (!activeStep) return;

    setSteps(prev =>
      prev.map(s => {
        if (s.id !== activeStepId) return s;
        
        if (s.type === "EMAIL" && s.variants) {
          return {
            ...s,
            variants: s.variants.map(v => {
              if (v.type !== activeVariantTab) return v;
              return {
                ...v,
                body: v.body + " " + tag,
              };
            })
          };
        } else if ((s.type === "LINKEDIN_CONNECT" || s.type === "LINKEDIN_MESSAGE") && s.linkedinMessage) {
          return {
            ...s,
            linkedinMessage: s.linkedinMessage + " " + tag,
          };
        }
        
        return s;
      })
    );
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name,
      steps,
      settings: {
        sendingWindow,
        dailyLimit,
      }
    };

    try {
      // Mock API trigger: POST /api/sequences
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log("Saving campaign payload:", payload);
      router.push("/campaigns");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const activeStep = steps.find((s) => s.id === activeStepId);
  const mergeTags = ["{{firstName}}", "{{lastName}}", "{{companyName}}", "{{jobTitle}}", "{{senderName}}"];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Campaign Builder</h1>
          <p className="text-slate-400 text-sm mt-1">
            Construct multi-channel flows, A/B test copies, and configure delivery rules.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveCampaign} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Sequence steps list */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Campaign Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="border-t border-slate-850 pt-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Sequence Steps Flow
              </span>

              {steps.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-800 text-center text-slate-500 text-xs rounded-lg">
                  No steps in flow. Click buttons below to add steps.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {steps.map((step, idx) => {
                    const isActive = step.id === activeStepId;
                    return (
                      <div
                        key={step.id}
                        onClick={() => setActiveStepId(step.id)}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 ${
                          isActive
                            ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-400"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-xs font-bold">
                          <span className="h-5 w-5 bg-slate-900 border border-slate-855 rounded-full flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          {step.type === "EMAIL" && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" /> Email Send
                            </span>
                          )}
                          {step.type === "DELAY" && (
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="h-3.5 w-3.5" /> Wait {step.delayDays} days
                            </span>
                          )}
                          {step.type === "LINKEDIN_CONNECT" && (
                            <span className="flex items-center gap-1.5 text-indigo-400">
                              <Linkedin className="h-3.5 w-3.5" /> LI Invite
                            </span>
                          )}
                          {step.type === "LINKEDIN_MESSAGE" && (
                            <span className="flex items-center gap-1.5 text-indigo-400">
                              <MessageSquare className="h-3.5 w-3.5" /> LI Message
                            </span>
                          )}
                        </div>

                        {/* Order / Remove Controls */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => moveStep(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 hover:text-white disabled:opacity-30"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStep(idx, "down")}
                            disabled={idx === steps.length - 1}
                            className="p-1 hover:text-white disabled:opacity-30"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStep(step.id)}
                            className="p-1 text-slate-650 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Insert steps buttons */}
            <div className="border-t border-slate-850 pt-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Add Steps to Pipeline
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={addEmailStep}
                  className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 p-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Mail className="h-3.5 w-3.5 text-indigo-500" /> + Email
                </button>
                <button
                  type="button"
                  onClick={addDelayStep}
                  className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 p-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> + Delay
                </button>
                <button
                  type="button"
                  onClick={() => addLinkedinStep("LINKEDIN_CONNECT")}
                  className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 p-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Linkedin className="h-3.5 w-3.5 text-indigo-500" /> + LI Invite
                </button>
                <button
                  type="button"
                  onClick={() => addLinkedinStep("LINKEDIN_MESSAGE")}
                  className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 p-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-500" /> + LI Msg
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Step editor panel (Center/Right) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl min-h-[500px] flex flex-col">
            {/* Editor Header info */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <LayoutGrid className="h-4.5 w-4.5 text-indigo-500" />
                Step Configuration
              </h2>
              {activeStep && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-950 border border-slate-850 text-indigo-400 rounded">
                  Type: {activeStep.type}
                </span>
              )}
            </div>

            {/* Editor Workspace */}
            {!activeStep ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-center">
                <Zap className="h-6 w-6 text-slate-700 mb-2 animate-bounce" />
                <p className="text-sm font-semibold">Select a sequence step or add a new one to start writing copies.</p>
              </div>
            ) : (
              <div className="p-6 flex-1 flex flex-col gap-6">
                {/* DELAY Step Editor */}
                {activeStep.type === "DELAY" && (
                  <div className="space-y-4 max-w-sm">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Delay Interval (Days)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={activeStep.delayDays || 1}
                          onChange={(e) =>
                            setSteps((prev) =>
                              prev.map((s) =>
                                s.id === activeStep.id ? { ...s, delayDays: Number(e.target.value) } : s
                              )
                            )
                          }
                          className="bg-slate-950 border border-slate-800 text-slate-200 font-bold text-center rounded-lg p-2.5 w-20"
                          min={1}
                        />
                        <span className="text-xs font-medium text-slate-400">Days to wait before running the next sequence step.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* LINKEDIN Invite/Message step editor */}
                {(activeStep.type === "LINKEDIN_CONNECT" || activeStep.type === "LINKEDIN_MESSAGE") && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Variables Toolbar helper */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Merge tags helper (click to insert)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {mergeTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => insertMergeTag(tag)}
                            className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-350 text-[10px] px-2.5 py-1 rounded"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1 flex flex-col">
                      <label className="text-xs font-semibold text-slate-400">Invite Note content</label>
                      <textarea
                        value={activeStep.linkedinMessage || ""}
                        onChange={(e) =>
                          setSteps((prev) =>
                            prev.map((s) =>
                              s.id === activeStep.id ? { ...s, linkedinMessage: e.target.value } : s
                            )
                          )
                        }
                        className="w-full flex-1 min-h-[150px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                        placeholder="Hi {{firstName}}, would love to connect..."
                      />
                    </div>
                  </div>
                )}

                {/* EMAIL Step Editor */}
                {activeStep.type === "EMAIL" && activeStep.variants && (
                  <div className="space-y-6 flex-1 flex flex-col">
                    {/* A/B Tabs selection */}
                    <div className="flex border-b border-slate-850">
                      <button
                        type="button"
                        onClick={() => setActiveVariantTab("A")}
                        className={`px-4 py-2 text-xs font-bold border-b-2 ${
                          activeVariantTab === "A"
                            ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Variant A
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Auto create Variant B if it doesn't exist
                          setSteps((prev) =>
                            prev.map((s) => {
                              if (s.id === activeStep.id && s.variants && s.variants.length === 1) {
                                return {
                                  ...s,
                                  variants: [
                                    ...s.variants,
                                    {
                                      type: "B",
                                      subject: s.variants[0].subject + " (Variant B)",
                                      body: s.variants[0].body,
                                    }
                                  ]
                                };
                              }
                              return s;
                            })
                          );
                          setActiveVariantTab("B");
                        }}
                        className={`px-4 py-2 text-xs font-bold border-b-2 ${
                          activeVariantTab === "B"
                            ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Variant B (Split Test)
                      </button>
                    </div>

                    {/* Template variables toolbar */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Merge tags helper (click to insert)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {mergeTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => insertMergeTag(tag)}
                            className="bg-slate-950 border border-slate-855 hover:border-slate-700 text-slate-350 text-[10px] px-2.5 py-1 rounded"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subject Line input */}
                    {activeStep.variants.map((v) => {
                      if (v.type !== activeVariantTab) return null;
                      return (
                        <div key={v.type} className="space-y-4 flex-1 flex flex-col">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400">Subject Line</label>
                            <input
                              type="text"
                              value={v.subject}
                              onChange={(e) =>
                                setSteps((prev) =>
                                  prev.map((s) => {
                                    if (s.id !== activeStep.id || !s.variants) return s;
                                    return {
                                      ...s,
                                      variants: s.variants.map((variant) =>
                                        variant.type === activeVariantTab
                                          ? { ...variant, subject: e.target.value }
                                          : variant
                                      )
                                    };
                                  })
                                )
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                              placeholder="e.g. Question about {{companyName}}"
                              required
                            />
                          </div>

                          {/* Email content textarea */}
                          <div className="space-y-1.5 flex-1 flex flex-col">
                            <label className="text-xs font-semibold text-slate-400">Email Body content</label>
                            <textarea
                              value={v.body}
                              onChange={(e) =>
                                setSteps((prev) =>
                                  prev.map((s) => {
                                    if (s.id !== activeStep.id || !s.variants) return s;
                                    return {
                                      ...s,
                                      variants: s.variants.map((variant) =>
                                        variant.type === activeVariantTab
                                          ? { ...variant, body: e.target.value }
                                          : variant
                                      )
                                    };
                                  })
                                )
                              }
                              className="w-full flex-1 min-h-[220px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs leading-relaxed"
                              placeholder="Hi {{firstName}},\n\nWrite your email copy here..."
                              required
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Save Settings footer bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Schedule limit */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span className="text-slate-400 font-semibold">Weekly Window:</span>
            <select
              value={sendingWindow}
              onChange={(e) => setSendingWindow(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-350 p-2 rounded-lg focus:outline-none"
            >
              <option value="WEEKDAYS_ONLY">Weekdays Only (Mon-Fri)</option>
              <option value="ANYTIME">24/7 Delivery</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Daily Send Limit:</span>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="bg-slate-950 border border-slate-850 text-slate-200 text-center w-14 rounded-lg p-2 font-bold"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveCampaign}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving Campaign..." : "Save & Activate Campaign"}
        </button>
      </div>
    </div>
  );
}
