"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  CheckCircle,
  Copy,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Languages,
  Info,
} from "lucide-react";

interface GeneratedCopy {
  variantA: {
    subject: string;
    body: string;
  };
  variantB: {
    subject: string;
    body: string;
  };
  explanation: string;
}

export default function AICopywriterTuner() {
  const [segment, setSegment] = useState("Founders and Engineering Leads in Seed SaaS companies");
  const [valueProp, setValueProp] = useState("We build AI agents that replace manual outbound prospecting, handling all email sequencing, lead enrichment, and meeting bookings automatically.");
  const [tone, setTone] = useState<"PROFESSIONAL" | "BOLD" | "CASUAL" | "PLAYFUL">("PROFESSIONAL");
  const [length, setLength] = useState<"SHORT" | "MEDIUM" | "LONG">("MEDIUM");
  const [cta, setCta] = useState("Book a 10 min call");

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedCopy | null>(null);
  
  // Clipboard alert
  const [copiedText, setCopiedText] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setResult(null);

    try {
      // Mocking API call: POST /api/copywriter/generate
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      let subA = "Quick question, {{firstName}}";
      let subB = "Automating prospecting at {{companyName || 'your company'}}";

      if (tone === "BOLD") {
        subA = "Stop manually prospecting, {{firstName}}";
        subB = "10x outbound pipeline for {{companyName}}";
      } else if (tone === "CASUAL") {
        subA = "quick question";
        subB = "ai agent question for {{companyName}}";
      }

      let bodyA = `Hi {{firstName || 'there'}},\n\nSaw you are heading up tech at {{companyName}}.\n\n${valueProp}.\n\nWould you be open to a quick call next week to discuss how we could help?\n\nBest,\n{{senderName}}`;
      let bodyB = `Hey {{firstName}},\n\nIs scaling outbound pipelines a focus for {{companyName}} this quarter?\n\nWe build AI agents that handle all prospecting and booking. ${valueProp}.\n\nLet me know if you have 10 mins.\n\nThanks,\n{{senderName}}`;

      setResult({
        variantA: {
          subject: subA,
          body: bodyA,
        },
        variantB: {
          subject: subB,
          body: bodyB,
        },
        explanation: `Variant A uses a standard professional direct request hook focusing on immediate value. Variant B is conversational and soft-CTA oriented, optimized for lower bounce rates.`,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Copywriting Engine</h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate high-performing, personalized email sequences and subject lines optimized for open rates.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Sparkles className="h-3 w-3" /> Powered by Gemini 1.5 Flash
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Side: Parameters panel (Col span 2) */}
        <form onSubmit={handleGenerate} className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <LayoutGrid className="h-4.5 w-4.5 text-indigo-500" />
            Outreach Parameters
          </h2>

          <div className="space-y-4 text-xs font-semibold text-slate-400">
            <div className="space-y-1.5">
              <label>Target Lead Segment Description</label>
              <textarea
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                placeholder="e.g. Sales VPs in seed B2B startups"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label>Value Proposition / Pitch</label>
              <textarea
                value={valueProp}
                onChange={(e) => setValueProp(e.target.value)}
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                placeholder="Describe what we are pitching..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label>Tone of Voice</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 p-2.5 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="BOLD">Bold / Direct</option>
                  <option value="CASUAL">Casual / Conversational</option>
                  <option value="PLAYFUL">Playful</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label>Email Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 p-2.5 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="SHORT">Short (&lt;75 words)</option>
                  <option value="MEDIUM">Medium (&lt;150 words)</option>
                  <option value="LONG">Long (&lt;250 words)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label>Desired CTA (Call to Action)</label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Reply to this email"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "Crafting Copies..." : "Generate AI Variations"}
          </button>
        </form>

        {/* Right Side: Copy Variations View (Col span 3) */}
        <div className="lg:col-span-3 space-y-6">
          {!result && !generating ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 min-h-[400px]">
              <Sparkles className="h-8 w-8 text-slate-700 animate-pulse" />
              <p className="text-sm font-semibold">Ready to draft sales copy templates.</p>
              <p className="text-xs text-slate-650 max-w-xs">Configure your segment and value proposition, then click generate to get started.</p>
            </div>
          ) : generating ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 min-h-[400px]">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-sm font-semibold">SDR Copywriting Agent is drafting copies...</p>
            </div>
          ) : (
            result && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                {/* Variant A & B grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Variant A */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400">Variant A</span>
                      <button
                        onClick={() => copyToClipboard(`Subject: ${result.variantA.subject}\n\n${result.variantA.body}`, "copyA")}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                      >
                        {copiedText === "copyA" ? (
                          <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="p-4 space-y-4 text-xs flex-1 flex flex-col">
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                        <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px] mb-0.5">Subject</span>
                        <span className="text-slate-200 font-bold">{result.variantA.subject}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded border border-slate-855 font-mono text-[11px] leading-relaxed text-slate-300 flex-1 whitespace-pre-line">
                        {result.variantA.body}
                      </div>
                    </div>
                  </div>

                  {/* Variant B */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400">Variant B</span>
                      <button
                        onClick={() => copyToClipboard(`Subject: ${result.variantB.subject}\n\n${result.variantB.body}`, "copyB")}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                      >
                        {copiedText === "copyB" ? (
                          <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="p-4 space-y-4 text-xs flex-1 flex flex-col">
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                        <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px] mb-0.5">Subject</span>
                        <span className="text-slate-200 font-bold">{result.variantB.subject}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded border border-slate-855 font-mono text-[11px] leading-relaxed text-slate-300 flex-1 whitespace-pre-line">
                        {result.variantB.body}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Explanation block */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 flex items-start gap-3">
                  <Info className="h-5 w-5 text-indigo-500 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-200 block">Copywriting strategy analysis:</span>
                    <p className="text-slate-400 leading-relaxed mt-1">{result.explanation}</p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
