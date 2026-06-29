"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ShieldAlert,
  Server,
  Key,
  Trash2,
  CheckCircle,
  HelpCircle,
  Settings,
  Sparkles,
  Info,
  X,
} from "lucide-react";

interface EmailAccount {
  id: string;
  email: string;
  name: string;
  provider: "GMAIL" | "OUTLOOK" | "SMTP";
  dailyLimit: number;
  sentCountToday: number;
  warmupStatus: "OFF" | "WARMUP";
  spfValid: boolean;
  dkimValid: boolean;
  dmarcValid: boolean;
  mxValid: boolean;
  lastDnsCheckAt?: string;
  isActive: boolean;
}

export default function EmailSettingsConsole() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Connect Inbox Modal State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectTab, setConnectTab] = useState<"GMAIL" | "OUTLOOK" | "SMTP">("GMAIL");
  
  // SMTP form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [imapUser, setImapUser] = useState("");
  const [imapPass, setImapPass] = useState("");
  const [limit, setLimit] = useState(100);
  const [saving, setSaving] = useState(false);

  // Diagnostics panel state
  const [selectedDiagnostics, setSelectedDiagnostics] = useState<EmailAccount | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [diagRecordData, setDiagRecordData] = useState<any>(null);

  // Fetch accounts (Mocked endpoint GET /api/emails/accounts)
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const localMockAccounts: EmailAccount[] = [
        {
          id: "email_1",
          email: "rohan@apex-sdr.com",
          name: "Rohan Mehta",
          provider: "GMAIL",
          dailyLimit: 50,
          sentCountToday: 12,
          warmupStatus: "WARMUP",
          spfValid: true,
          dkimValid: true,
          dmarcValid: true,
          mxValid: true,
          lastDnsCheckAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          isActive: true,
        },
        {
          id: "email_2",
          email: "rohan.mehta@apex-outbound.com",
          name: "Rohan (Sales)",
          provider: "SMTP",
          dailyLimit: 100,
          sentCountToday: 42,
          warmupStatus: "OFF",
          spfValid: true,
          dkimValid: false,
          dmarcValid: true,
          mxValid: true,
          lastDnsCheckAt: new Date(Date.now() - 3600000 * 6).toISOString(),
          isActive: true,
        }
      ];

      setAccounts(localMockAccounts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Connect SMTP/IMAP Account
  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Mock POST /api/emails/accounts
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const newAcc: EmailAccount = {
        id: `email_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name,
        provider: connectTab,
        dailyLimit: limit,
        sentCountToday: 0,
        warmupStatus: "OFF",
        spfValid: connectTab !== "SMTP",
        dkimValid: connectTab !== "SMTP",
        dmarcValid: connectTab !== "SMTP",
        mxValid: true,
        lastDnsCheckAt: new Date().toISOString(),
        isActive: true,
      };

      setAccounts((prev) => [newAcc, ...prev]);
      setShowConnectModal(false);
      
      // Reset form
      setName("");
      setEmail("");
      setSmtpHost("");
      setSmtpUser("");
      setSmtpPass("");
      setImapHost("");
      setImapUser("");
      setImapPass("");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Warmup Status
  const handleToggleWarmup = async (id: string, currentStatus: "OFF" | "WARMUP") => {
    const newStatus = currentStatus === "OFF" ? "WARMUP" : "OFF";
    try {
      // API call: POST /api/emails/accounts/:id/toggle-warmup
      setAccounts(prev =>
        prev.map(a => (a.id === id ? { ...a, warmupStatus: newStatus } : a))
      );
      if (selectedDiagnostics && selectedDiagnostics.id === id) {
        setSelectedDiagnostics(prev => prev ? { ...prev, warmupStatus: newStatus } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger live DNS records inspection
  const handleVerifyDns = async (id: string) => {
    setRunningDiagnostics(true);
    setDiagRecordData(null);
    try {
      // API Call: POST /api/emails/accounts/:id/verify-dns
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setAccounts(prev =>
        prev.map(a =>
          a.id === id
            ? {
                ...a,
                spfValid: true,
                dkimValid: true,
                dmarcValid: true,
                mxValid: true,
                lastDnsCheckAt: new Date().toISOString(),
              }
            : a
        )
      );

      const target = accounts.find(a => a.id === id);
      if (target) {
        const updatedTarget = {
          ...target,
          spfValid: true,
          dkimValid: true,
          dmarcValid: true,
          mxValid: true,
          lastDnsCheckAt: new Date().toISOString(),
        };
        setSelectedDiagnostics(updatedTarget);
      }

      setDiagRecordData({
        spf: "v=spf1 include:_spf.google.com ~all",
        dkim: "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA",
        dmarc: "v=DMARC1; p=none; rua=mailto:dmarc@apex-sdr.com",
        mx: ["aspmx.l.google.com", "alt1.aspmx.l.google.com"],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  // Disconnect Inbox Account
  const handleDisconnectAccount = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this email address? This will halt any active campaigns using it.")) return;
    try {
      // API call: DELETE /api/emails/accounts/:id
      setAccounts(prev => prev.filter(a => a.id !== id));
      if (selectedDiagnostics && selectedDiagnostics.id === id) {
        setSelectedDiagnostics(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mock triggers for Google / Microsoft OAuth flow redirect
  const handleOAuthConnect = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const fakeOAuthEmail = connectTab === "GMAIL" ? "growth@apex-growth.com" : "outbound@apex-enterprise.onmicrosoft.com";
    const newAcc: EmailAccount = {
      id: `email_${Math.random().toString(36).substr(2, 9)}`,
      email: fakeOAuthEmail,
      name: "Outbound SDR",
      provider: connectTab,
      dailyLimit: 80,
      sentCountToday: 0,
      warmupStatus: "WARMUP",
      spfValid: true,
      dkimValid: true,
      dmarcValid: true,
      mxValid: true,
      lastDnsCheckAt: new Date().toISOString(),
      isActive: true,
    };

    setAccounts(prev => [newAcc, ...prev]);
    setShowConnectModal(false);
    setSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Outbound Email Accounts</h1>
          <p className="text-slate-400 text-sm mt-1">
            Connect sending addresses, configure warmup profiles, and review DNS reputation scores.
          </p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          Connect Inbox
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Inboxes Table (Left / Center) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-500" />
                Active Inboxes
              </h2>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                {accounts.length} Connected
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <span className="text-xs font-semibold">Resolving configurations...</span>
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Mail className="h-8 w-8 text-slate-700 mx-auto" />
                <p className="text-sm font-semibold">No active inboxes connected.</p>
                <p className="text-xs text-slate-650">Link a sending account to start launching automated campaigns.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-850">
                {accounts.map((acc) => {
                  const isHealthy = acc.spfValid && acc.dkimValid && acc.dmarcValid && acc.mxValid;
                  const isSelected = selectedDiagnostics?.id === acc.id;

                  return (
                    <div
                      key={acc.id}
                      onClick={() => {
                        setSelectedDiagnostics(acc);
                        setDiagRecordData(null);
                      }}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-850/50 transition-colors ${
                        isSelected ? "bg-indigo-600/5 border-l-2 border-indigo-500 pl-3.5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 mt-0.5">
                          <Mail className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 text-sm">{acc.email}</span>
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-400">
                              {acc.provider}
                            </span>
                          </div>
                          <p className="text-xs text-slate-450 mt-0.5">{acc.name}</p>
                          {/* DNS badge check */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-slate-500 font-semibold">Reputation:</span>
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-bold ${
                                isHealthy ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              {isHealthy ? (
                                <>
                                  <ShieldCheck className="h-3 w-3" /> DNS Valid
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="h-3 w-3" /> Action Required
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls right */}
                      <div className="flex items-center justify-between sm:justify-end gap-6" onClick={e => e.stopPropagation()}>
                        {/* Daily sending capacity stats */}
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">
                            Sent Today
                          </span>
                          <span className="text-xs font-bold text-slate-350">
                            {acc.sentCountToday} / <span className="text-slate-200">{acc.dailyLimit}</span>
                          </span>
                        </div>

                        {/* Warmup toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase hidden sm:inline">
                            Warmup
                          </span>
                          <button
                            onClick={() => handleToggleWarmup(acc.id, acc.warmupStatus)}
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            {acc.warmupStatus === "WARMUP" ? (
                              <ToggleRight className="h-7 w-7 text-indigo-500" />
                            ) : (
                              <ToggleLeft className="h-7 w-7 text-slate-600" />
                            )}
                          </button>
                        </div>

                        {/* Disconnect button */}
                        <button
                          onClick={() => handleDisconnectAccount(acc.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Disconnect Inbox"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* DNS Records Inspector (Right column) */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              DNS Diagnostics
            </h3>

            {!selectedDiagnostics ? (
              <div className="text-center p-6 text-slate-500 text-xs">
                <Info className="h-5 w-5 mx-auto text-slate-700 mb-2" />
                Select a connected email account to run DNS authentication checks.
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 break-all">{selectedDiagnostics.email}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Last DNS check: {selectedDiagnostics.lastDnsCheckAt ? new Date(selectedDiagnostics.lastDnsCheckAt).toLocaleDateString() : "Never"}
                  </p>
                </div>

                {/* DNS checks list */}
                <div className="space-y-3">
                  {/* MX Record */}
                  <div className="flex items-center justify-between border border-slate-850 p-2.5 rounded-lg bg-slate-950/50">
                    <div className="flex items-center gap-2 text-xs">
                      {selectedDiagnostics.mxValid ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="font-semibold text-slate-350">MX (Mail Exchange)</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase ${selectedDiagnostics.mxValid ? "text-emerald-400" : "text-amber-400"}`}>
                      {selectedDiagnostics.mxValid ? "Verified" : "Missing"}
                    </span>
                  </div>

                  {/* SPF Record */}
                  <div className="flex items-center justify-between border border-slate-850 p-2.5 rounded-lg bg-slate-950/50">
                    <div className="flex items-center gap-2 text-xs">
                      {selectedDiagnostics.spfValid ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="font-semibold text-slate-350">SPF Authentication</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase ${selectedDiagnostics.spfValid ? "text-emerald-400" : "text-amber-400"}`}>
                      {selectedDiagnostics.spfValid ? "Verified" : "Missing"}
                    </span>
                  </div>

                  {/* DKIM Record */}
                  <div className="flex items-center justify-between border border-slate-850 p-2.5 rounded-lg bg-slate-950/50">
                    <div className="flex items-center gap-2 text-xs">
                      {selectedDiagnostics.dkimValid ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="font-semibold text-slate-350">DKIM Signature</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase ${selectedDiagnostics.dkimValid ? "text-emerald-400" : "text-amber-400"}`}>
                      {selectedDiagnostics.dkimValid ? "Verified" : "Missing"}
                    </span>
                  </div>

                  {/* DMARC Record */}
                  <div className="flex items-center justify-between border border-slate-850 p-2.5 rounded-lg bg-slate-950/50">
                    <div className="flex items-center gap-2 text-xs">
                      {selectedDiagnostics.dmarcValid ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="font-semibold text-slate-350">DMARC Policy</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase ${selectedDiagnostics.dmarcValid ? "text-emerald-400" : "text-amber-400"}`}>
                      {selectedDiagnostics.dmarcValid ? "Verified" : "Missing"}
                    </span>
                  </div>
                </div>

                {/* Inspect diagnostics payload */}
                {diagRecordData && (
                  <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 space-y-2 text-[10px] font-mono text-slate-400">
                    <div>
                      <span className="text-indigo-400 font-bold block">SPF Record Found:</span>
                      <span className="break-all">{diagRecordData.spf}</span>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-bold block">DMARC Policy Found:</span>
                      <span className="break-all">{diagRecordData.dmarc}</span>
                    </div>
                  </div>
                )}

                {/* Re-run button */}
                <button
                  onClick={() => handleVerifyDns(selectedDiagnostics.id)}
                  disabled={runningDiagnostics}
                  className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-850 text-indigo-400 font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${runningDiagnostics ? "animate-spin" : ""}`} />
                  {runningDiagnostics ? "Inspecting records..." : "Check DNS Configuration"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowConnectModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-500" />
                Connect Outbound Inbox
              </h3>
              <button onClick={() => setShowConnectModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
                <X className="h-5 w-5" onClick={() => setShowConnectModal(false)} />
              </button>
            </div>

            {/* Provider Type selector tabs */}
            <div className="grid grid-cols-3 border-b border-slate-850 bg-slate-950/20 text-center font-bold text-xs">
              <button
                onClick={() => setConnectTab("GMAIL")}
                className={`py-3 ${connectTab === "GMAIL" ? "text-indigo-400 border-b border-indigo-500 bg-indigo-500/5" : "text-slate-400 hover:text-slate-200"}`}
              >
                Google Workspace
              </button>
              <button
                onClick={() => setConnectTab("OUTLOOK")}
                className={`py-3 ${connectTab === "OUTLOOK" ? "text-indigo-400 border-b border-indigo-500 bg-indigo-500/5" : "text-slate-400 hover:text-slate-200"}`}
              >
                Microsoft Outlook
              </button>
              <button
                onClick={() => setConnectTab("SMTP")}
                className={`py-3 ${connectTab === "SMTP" ? "text-indigo-400 border-b border-indigo-500 bg-indigo-500/5" : "text-slate-400 hover:text-slate-200"}`}
              >
                SMTP / IMAP
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {connectTab !== "SMTP" ? (
                <div className="text-center p-8 space-y-4">
                  <Mail className="h-10 w-10 text-indigo-500 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-white text-sm">
                      Connect via Secure OAuth 2.0
                    </h4>
                    <p className="text-xs text-slate-450 max-w-sm mx-auto">
                      Link your workspace email safely. The AI agent will compose drafts and track bounces using standard API access scopes.
                    </p>
                  </div>
                  <button
                    onClick={handleOAuthConnect}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-all inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                  >
                    {saving ? "Redirecting..." : `Authorize with ${connectTab === "GMAIL" ? "Google" : "Microsoft"}`}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConnectAccount} className="space-y-4 text-xs font-semibold text-slate-400">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label>Sender Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="Rohan Mehta"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="sdr@outbound.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-850 pt-4 space-y-4">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      SMTP (Outgoing Mail)
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <label>SMTP Host</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={e => setSmtpHost(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                          placeholder="smtp.mailgun.org"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label>SMTP Port</label>
                        <input
                          type="text"
                          value={smtpPort}
                          onChange={e => setSmtpPort(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                          placeholder="587"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label>SMTP User</label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={e => setSmtpUser(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                          placeholder="User login"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label>SMTP Password</label>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={e => setSmtpPass(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-850 pt-4 space-y-4">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      IMAP (Incoming Mail Tracking)
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <label>IMAP Host</label>
                        <input
                          type="text"
                          value={imapHost}
                          onChange={e => setImapHost(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                          placeholder="imap.gmail.com"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label>IMAP Port</label>
                        <input
                          type="text"
                          value={imapPort}
                          onChange={e => setImapPort(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                          placeholder="993"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-slate-355 font-bold">Daily Sending Limit</label>
                      <p className="text-[10px] text-slate-500">Maximum daily outbound messages per address</p>
                    </div>
                    <input
                      type="number"
                      value={limit}
                      onChange={e => setLimit(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 text-slate-200 text-center w-20 rounded-lg p-2 font-bold"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowConnectModal(false)}
                      className="bg-slate-950 border border-slate-850 text-slate-400 text-xs font-bold px-4 py-2.5 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all"
                    >
                      {saving ? "Testing connection..." : "Connect SMTP"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
