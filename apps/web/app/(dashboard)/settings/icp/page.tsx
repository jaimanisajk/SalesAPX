"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Save, ShieldAlert, Plus, X, ListFilter } from "lucide-react";

interface ICPProfile {
  id?: string;
  name: string;
  isDefault: boolean;
  industries: string[];
  jobTitles: string[];
  seniorityLevels: string[];
  companySizeMin: number;
  companySizeMax: number;
  revenueMin?: number;
  revenueMax?: number;
  geographies: string[];
  techStack: string[];
  intentKeywords: string[];
  excludeKeywords: string[];
}

export default function ICPProfileBuilder() {
  const [profile, setProfile] = useState<ICPProfile>({
    name: "Enterprise SaaS & Fintech ICP",
    isDefault: true,
    industries: ["SaaS", "FinTech", "AI & Machine Learning", "E-commerce"],
    jobTitles: ["CTO", "VP of Product", "VP of Engineering", "Head of Sales", "Founder"],
    seniorityLevels: ["C-Suite", "VP", "Director"],
    companySizeMin: 50,
    companySizeMax: 1000,
    revenueMin: 5000000,
    revenueMax: 50000000,
    geographies: ["United States", "India", "United Kingdom"],
    techStack: ["React", "AWS", "Salesforce", "HubSpot", "Node.js"],
    intentKeywords: ["sales automation", "crm integration", "outbound marketing"],
    excludeKeywords: ["consultancy", "agencies", "freelance"],
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Temporary state for tag inputs
  const [newIndustry, setNewIndustry] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newGeo, setNewGeo] = useState("");
  const [newTech, setNewTech] = useState("");
  const [newIntent, setNewIntent] = useState("");
  const [newExclude, setNewExclude] = useState("");

  const seniorityOptions = ["C-Suite", "VP", "Director", "Manager", "Individual Contributor"];

  // Fetch current profile (Mocked api call)
  useEffect(() => {
    // Simulated load from API
    console.log("Fetching ICP profile...");
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      // Mocking API call POST /api/icp
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSeniorityChange = (level: string) => {
    setProfile((prev) => {
      const current = [...prev.seniorityLevels];
      const idx = current.indexOf(level);
      if (idx !== -1) {
        current.splice(idx, 1);
      } else {
        current.push(level);
      }
      return { ...prev, seniorityLevels: current };
    });
  };

  // Tag list helper operations
  const addTag = (
    field: keyof Pick<
      ICPProfile,
      "industries" | "jobTitles" | "geographies" | "techStack" | "intentKeywords" | "excludeKeywords"
    >,
    value: string,
    setVal: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = value.trim();
    if (trimmed && !profile[field].includes(trimmed)) {
      setProfile((prev) => ({
        ...prev,
        [field]: [...prev[field], trimmed],
      }));
      setVal("");
    }
  };

  const removeTag = (
    field: keyof Pick<
      ICPProfile,
      "industries" | "jobTitles" | "geographies" | "techStack" | "intentKeywords" | "excludeKeywords"
    >,
    tag: string
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: prev[field].filter((t) => t !== tag),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ICP Profile Builder</h1>
          <p className="text-slate-400 text-sm mt-1">
            Define your B2B Ideal Customer Profile. The AI uses this configuration to query leads and score fit.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Sparkles className="h-3 w-3" />
          Active Configuration
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-indigo-500" />
            General Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Profile Name
              </label>
              <input
                id="name"
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div className="flex items-center md:pt-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isDefault}
                  onChange={(e) => setProfile((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-sm font-medium text-slate-300">Set as default lead scoring profile</span>
              </label>
            </div>
          </div>
        </div>

        {/* Firmographics Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Firmographics & Role targeting
          </h2>

          <div className="space-y-6">
            {/* Seniority Checkboxes */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Seniority Levels
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                {seniorityOptions.map((level) => {
                  const isChecked = profile.seniorityLevels.includes(level);
                  return (
                    <label
                      key={level}
                      onClick={() => handleSeniorityChange(level)}
                      className={`flex items-center justify-center p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                        isChecked
                          ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-400"
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {level}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Slider/Range Inputs for Company Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Company Size (Employees)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={profile.companySizeMin}
                    onChange={(e) => setProfile((p) => ({ ...p, companySizeMin: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Min"
                  />
                  <span className="text-slate-600">to</span>
                  <input
                    type="number"
                    value={profile.companySizeMax}
                    onChange={(e) => setProfile((p) => ({ ...p, companySizeMax: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Annual Revenue (USD)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={profile.revenueMin || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, revenueMin: Number(e.target.value) || undefined }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Min Revenue"
                  />
                  <span className="text-slate-600">to</span>
                  <input
                    type="number"
                    value={profile.revenueMax || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, revenueMax: Number(e.target.value) || undefined }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Max Revenue"
                  />
                </div>
              </div>
            </div>

            {/* Target Job Titles Tags */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Target Job Titles
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("jobTitles", newTitle, setNewTitle))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. VP of Product (Press Enter to add)"
                />
                <button
                  type="button"
                  onClick={() => addTag("jobTitles", newTitle, setNewTitle)}
                  className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {profile.jobTitles.map((title) => (
                  <span
                    key={title}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300"
                  >
                    {title}
                    <button type="button" onClick={() => removeTag("jobTitles", title)} className="text-slate-500 hover:text-slate-300">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-indigo-500" />
            Segmentation & Keywords
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Industries */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Target Industries
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("industries", newIndustry, setNewIndustry))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  placeholder="e.g. Fintech"
                />
                <button
                  type="button"
                  onClick={() => addTag("industries", newIndustry, setNewIndustry)}
                  className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-3 py-2 rounded-lg text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {profile.industries.map((ind) => (
                  <span
                    key={ind}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-950 border border-slate-800 text-slate-300"
                  >
                    {ind}
                    <button type="button" onClick={() => removeTag("industries", ind)} className="text-slate-500 hover:text-slate-300">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Target Geographies */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Geographies
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGeo}
                  onChange={(e) => setNewGeo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("geographies", newGeo, setNewGeo))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  placeholder="e.g. United States"
                />
                <button
                  type="button"
                  onClick={() => addTag("geographies", newGeo, setNewGeo)}
                  className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-3 py-2 rounded-lg text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {profile.geographies.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-950 border border-slate-800 text-slate-300"
                  >
                    {g}
                    <button type="button" onClick={() => removeTag("geographies", g)} className="text-slate-500 hover:text-slate-300">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tech Stack */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tech Stack Keywords
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("techStack", newTech, setNewTech))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  placeholder="e.g. HubSpot"
                />
                <button
                  type="button"
                  onClick={() => addTag("techStack", newTech, setNewTech)}
                  className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-3 py-2 rounded-lg text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {profile.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-950 border border-slate-800 text-slate-300"
                  >
                    {tech}
                    <button type="button" onClick={() => removeTag("techStack", tech)} className="text-slate-500 hover:text-slate-300">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Intent Keywords */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Intent Keywords
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIntent}
                  onChange={(e) => setNewIntent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("intentKeywords", newIntent, setNewIntent))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  placeholder="Topics they research"
                />
                <button
                  type="button"
                  onClick={() => addTag("intentKeywords", newIntent, setNewIntent)}
                  className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-3 py-2 rounded-lg text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {profile.intentKeywords.map((ik) => (
                  <span
                    key={ik}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-950 border border-slate-800 text-slate-300"
                  >
                    {ik}
                    <button type="button" onClick={() => removeTag("intentKeywords", ik)} className="text-slate-500 hover:text-slate-300">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Exclude Keywords */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="h-4 w-4" /> Exclude Keywords
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExclude}
                onChange={(e) => setNewExclude(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("excludeKeywords", newExclude, setNewExclude))}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500/30"
                placeholder="Domains or companies to ignore (e.g. consulting)"
              />
              <button
                type="button"
                onClick={() => addTag("excludeKeywords", newExclude, setNewExclude)}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-2 rounded-lg text-sm"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {profile.excludeKeywords.map((ex) => (
                <span
                  key={ex}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-950 border border-rose-900/30 text-rose-300"
                >
                  {ex}
                  <button type="button" onClick={() => removeTag("excludeKeywords", ex)} className="text-rose-500 hover:text-rose-300">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Save button panel */}
        <div className="flex items-center justify-end gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
          {saveSuccess && (
            <span className="text-emerald-400 text-sm font-semibold animate-pulse">
              ✓ ICP Profile Saved Successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
