"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Check,
  CheckCircle,
  XCircle,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Building,
} from "lucide-react";

interface BillingData {
  plan: "STARTER" | "GROWTH" | "ENTERPRISE";
  monthlyLeadLimit: number;
  leadsUsedThisMonth: number;
  seats: number;
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/superadmin/organisations?orgId=default-org-id");
      const data = await res.json();
      if (data.success && data.organisations && data.organisations.length > 0) {
        const defaultOrg = data.organisations[0]; // Fetch first organization for mock settings
        setBilling({
          plan: defaultOrg.plan,
          monthlyLeadLimit: defaultOrg.monthlyLeadLimit,
          leadsUsedThisMonth: defaultOrg.leadsUsedThisMonth,
          seats: defaultOrg.seats,
        });
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setBilling({
        plan: "STARTER",
        monthlyLeadLimit: 250,
        leadsUsedThisMonth: 124,
        seats: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpgrade = async (targetPlan: string) => {
    try {
      const res = await fetch("http://localhost:3001/api/superadmin/billing/upgrade-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: "default-org-id", plan: targetPlan }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 Subscription upgraded to ${targetPlan} successfully!`);
        fetchBilling();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const upgrade = searchParams.get("upgrade");
    const sessionId = searchParams.get("session_id");
    if (upgrade && sessionId) {
      handleConfirmUpgrade(upgrade);
    } else {
      fetchBilling();
    }
  }, [searchParams]);

  const handleUpgrade = async (plan: "GROWTH" | "ENTERPRISE") => {
    setUpgradingPlan(plan);
    try {
      const res = await fetch("http://localhost:3001/api/superadmin/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: "default-org-id", plan }),
      });
      const data = await res.json();
      if (data.success && data.checkoutUrl) {
        showToast("Redirecting to checkout billing pool...");
        // Redirect to mock checkout URL (which will load back here with session_id)
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error(err);
      showToast("Upgrade checkout failed.");
    } finally {
      setUpgradingPlan(null);
    }
  };

  const usagePercent = billing
    ? Math.min(Math.round((billing.leadsUsedThisMonth / billing.monthlyLeadLimit) * 100), 100)
    : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border border-indigo-500/30 bg-indigo-950/90 text-indigo-200 text-sm font-semibold shadow-2xl animate-bounce">
          <CheckCircle className="h-4.5 w-4.5 text-indigo-400" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <CreditCard className="h-7 w-7 text-indigo-500" /> Subscription & billing
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your AI SDR seats, leads import monthly quotas, and payment receipts.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 text-slate-500 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold">Retrieving subscription status...</span>
        </div>
      ) : (
        billing && (
          <div className="space-y-8">
            {/* Current plan card */}
            <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Plan Tier</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-white">{billing.plan}</span>
                    <span className="text-xs text-slate-400">Monthly renewal</span>
                  </div>
                </div>

                <div className="flex-shrink-0 flex gap-2">
                  <span className="text-[10px] font-bold text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    ● Quota healthy
                  </span>
                </div>
              </div>

              {/* Usage stats bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Monthly Leads Quota Limit</span>
                  <span className="text-white">
                    {billing.leadsUsedThisMonth} / {billing.monthlyLeadLimit} leads used ({usagePercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Quota resets automatically on your billing cycle. Leads enrichment,fit scoring, and sequence scheduling will pause once quota is reached.
                </p>
              </div>
            </div>

            {/* Plans card columns grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* STARTER CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-750 transition-all">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Starter</h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Self-serve outbound</span>
                  </div>
                  <div className="flex items-baseline text-white">
                    <span className="text-3xl font-extrabold">$0</span>
                    <span className="text-xs text-slate-400 ml-1">/mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-450">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Max 250 Leads Import / mo</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> 1 Outbound Email Account</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> BANT AI Qualification</li>
                  </ul>
                </div>
                <button
                  type="button"
                  disabled={billing.plan === "STARTER"}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-center border border-slate-800 bg-slate-950 text-slate-400 disabled:opacity-50 transition-all"
                >
                  {billing.plan === "STARTER" ? "Active Plan" : "Downgrade"}
                </button>
              </div>

              {/* GROWTH CARD */}
              <div className="relative overflow-hidden bg-slate-900 border border-indigo-500/20 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-indigo-500/30 transition-all shadow-xl shadow-indigo-600/5">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  Popular
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                      Growth <Sparkles className="h-4 w-4 text-indigo-400" />
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Scale Outbound Teams</span>
                  </div>
                  <div className="flex items-baseline text-white">
                    <span className="text-3xl font-extrabold">$99</span>
                    <span className="text-xs text-slate-400 ml-1">/mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-450">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Max 1,000 Leads Import / mo</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> 5 Outbound Email Accounts</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Round-Robin Rotation limits</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> HubSpot & Slack integration sync</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpgrade("GROWTH")}
                  disabled={billing.plan === "GROWTH" || upgradingPlan !== null}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  {billing.plan === "GROWTH" ? "Active Plan" : upgradingPlan === "GROWTH" ? "Redirecting..." : "Upgrade to Growth"}
                </button>
              </div>

              {/* ENTERPRISE CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-750 transition-all">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Enterprise</h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Volume limits</span>
                  </div>
                  <div className="flex items-baseline text-white">
                    <span className="text-3xl font-extrabold">$299</span>
                    <span className="text-xs text-slate-400 ml-1">/mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-450">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Unlimited Leads Import / mo</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Unlimited Outbox Rotation</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Dedicated API provisioning keys</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> SLAs & 24/7 SDR Advisor Support</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpgrade("ENTERPRISE")}
                  disabled={billing.plan === "ENTERPRISE" || upgradingPlan !== null}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {billing.plan === "ENTERPRISE" ? "Active Plan" : upgradingPlan === "ENTERPRISE" ? "Redirecting..." : "Upgrade to Enterprise"}
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
