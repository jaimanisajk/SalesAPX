"use client";

import React, { useState, useEffect } from "react";
import {
  Slack,
  Database,
  CheckCircle,
  XCircle,
  Save,
  AlertTriangle,
  Play,
  Settings,
  Sparkles,
  Link2,
} from "lucide-react";

interface SettingsData {
  hubspotEnabled: boolean;
  hubspotToken: string;
  slackEnabled: boolean;
  slackWebhookUrl: string;
}

export default function IntegrationsSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    hubspotEnabled: false,
    hubspotToken: "",
    slackEnabled: false,
    slackWebhookUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testHsLoading, setTestHsLoading] = useState(false);
  const [testSlackLoading, setTestSlackLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch GET /api/integrations
      // Since it's local Next.js client, fetch matches express port or next middleware proxy
      const res = await fetch("http://localhost:3001/api/integrations?orgId=default-org-id");
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings({
          hubspotEnabled: data.settings.hubspotEnabled,
          hubspotToken: data.settings.hubspotToken,
          slackEnabled: data.settings.slackEnabled,
          slackWebhookUrl: data.settings.slackWebhookUrl,
        });
      }
    } catch (err) {
      console.error(err);
      showToast("Could not load integrations settings. Using mock values.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("http://localhost:3001/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: "default-org-id",
          ...settings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Integrations configuration saved successfully!");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestHubSpot = async () => {
    setTestHsLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/integrations/test-hubspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: settings.hubspotToken,
          enabled: settings.hubspotEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.result.mockMode || !settings.hubspotToken) {
          showToast("HubSpot mock lead sync test completed successfully!");
        } else {
          showToast(`HubSpot Live Sync created Contact ID: ${data.result.contactId}`);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || "HubSpot test connection failed.", "error");
    } finally {
      setTestHsLoading(false);
    }
  };

  const handleTestSlack = async () => {
    setTestSlackLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/integrations/test-slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: settings.slackWebhookUrl,
          enabled: settings.slackEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.result.mockMode || !settings.slackWebhookUrl) {
          showToast("Slack mock Block Kit layout printed in logs!");
        } else {
          showToast("Slack notification broadcasted successfully!");
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || "Slack webhook test failed.", "error");
    } finally {
      setTestSlackLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl transition-all animate-bounce ${
            toast.type === "error"
              ? "bg-rose-950/90 border-rose-500/30 text-rose-200"
              : "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
          }`}
        >
          {toast.type === "error" ? <XCircle className="h-4.5 w-4.5 text-rose-400" /> : <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />}
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Link2 className="h-7 w-7 text-indigo-500" /> Integrations settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Connect outbound outreach outcomes, qualifications Fit Scores, and booked appointments with CRMs and chat workspaces.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 text-slate-500 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold">Loading settings configs...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HubSpot Panel */}
            <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-750 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-white">HubSpot CRM</h2>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contacts & Deals Sync</span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.hubspotEnabled}
                      onChange={(e) => setSettings({ ...settings, hubspotEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 peer-checked:after:bg-white" />
                  </label>
                </div>

                <p className="text-slate-450 text-xs leading-relaxed">
                  Automatically synchronize qualified BANT prospects to HubSpot. When a meeting is confirmed via Cal.com webhooks, creates associated Deals.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Token / Private App Key</label>
                  <input
                    type="password"
                    placeholder="pat-na-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={settings.hubspotToken}
                    onChange={(e) => setSettings({ ...settings, hubspotToken: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono placeholder:text-slate-700"
                  />
                  {!settings.hubspotToken && (
                    <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Credentials absent: System operates in mock local logs mode.
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestHubSpot}
                disabled={testHsLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 disabled:opacity-50 transition-all cursor-pointer"
              >
                {testHsLoading ? (
                  <div className="h-3.5 w-3.5 rounded-full border border-slate-400 border-t-transparent animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Trigger HubSpot Mock Contact Sync Test
              </button>
            </div>

            {/* Slack Panel */}
            <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-750 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                      <Slack className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-white">Slack Workspace</h2>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Real-time alerts</span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.slackEnabled}
                      onChange={(e) => setSettings({ ...settings, slackEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white" />
                  </label>
                </div>

                <p className="text-slate-450 text-xs leading-relaxed">
                  Post formatted summaries to Slack channels when prospects reply positively or schedule calendar meetings. Features intent highlights and AI suggestions.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incoming Webhook URL</label>
                  <input
                    type="text"
                    placeholder="https://hooks.slack.com/services/YOUR_SLACK_WEBHOOK_URL"
                    value={settings.slackWebhookUrl}
                    onChange={(e) => setSettings({ ...settings, slackWebhookUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono placeholder:text-slate-700"
                  />
                  {!settings.slackWebhookUrl && (
                    <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Credentials absent: System operates in mock local logs mode.
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestSlack}
                disabled={testSlackLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 disabled:opacity-50 transition-all cursor-pointer"
              >
                {testSlackLoading ? (
                  <div className="h-3.5 w-3.5 rounded-full border border-slate-400 border-t-transparent animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Trigger Slack Block Kit Alert Notification Test
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving configs..." : "Save Configuration"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
