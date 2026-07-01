"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  Database,
  Cpu,
  Globe,
  Settings2,
  CheckCircle,
  XCircle,
  TrendingUp,
  CreditCard,
  Building,
} from "lucide-react";

interface Organisation {
  id: string;
  name: string;
  plan: string;
  monthlyLeadLimit: number;
  leadsUsedThisMonth: number;
  seats: number;
  isActive: boolean;
  createdAt: string;
}

interface SuperadminStats {
  totalOrgs: number;
  totalUsers: number;
  totalLeads: number;
  totalAICalls: number;
  totalAICostUSD: number;
}

export default function SuperadminPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [stats, setStats] = useState<SuperadminStats>({
    totalOrgs: 0,
    totalUsers: 0,
    totalLeads: 0,
    totalAICalls: 0,
    totalAICostUSD: 0,
  });

  const [loading, setLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null);
  const [editForm, setEditForm] = useState({
    plan: "STARTER",
    seats: 1,
    monthlyLeadLimit: 250,
    isActive: true,
  });

  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const orgsRes = await fetch("http://localhost:3001/api/superadmin/organisations");
      const orgsData = await orgsRes.json();
      if (orgsData.success) {
        setOrganisations(orgsData.organisations);
      }

      const statsRes = await fetch("http://localhost:3001/api/superadmin/stats");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error(err);
      // Seed fallback mock stats for offline preview
      setStats({
        totalOrgs: 12,
        totalUsers: 42,
        totalLeads: 489,
        totalAICalls: 154,
        totalAICostUSD: 0.187,
      });
      setOrganisations([
        {
          id: "default-org-id",
          name: "Acme Outbound Corp",
          plan: "STARTER",
          monthlyLeadLimit: 250,
          leadsUsedThisMonth: 124,
          seats: 3,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (org: Organisation) => {
    setEditingOrg(org);
    setEditForm({
      plan: org.plan,
      seats: org.seats,
      monthlyLeadLimit: org.monthlyLeadLimit,
      isActive: org.isActive,
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    setUpdating(true);

    try {
      const res = await fetch(`http://localhost:3001/api/superadmin/organisations/${editingOrg.id}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Successfully updated organization settings!`);
        setEditingOrg(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
      showToast("Could not save settings.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-950/90 text-emerald-200 text-sm font-semibold shadow-2xl animate-bounce">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/20 via-slate-900 to-indigo-950/20 p-8 border border-red-500/10 backdrop-blur-md">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="h-3 w-3" />
            Platform Superadmin Console Mode Active
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            System Control Panel
          </h1>
          <p className="text-slate-400 max-w-xl text-sm">
            Monitor organizational metrics, adjust subscription seat sizes, toggle tenant access, and view model credits utilization.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 text-slate-500 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold">Aggregating system statistics...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Global Metrics Row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 group hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-slate-450">
                <span className="text-xs font-bold uppercase tracking-wider">Total Tenants</span>
                <Building className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <span className="text-2xl font-extrabold text-white mt-3 block">{stats.totalOrgs}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 group hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-slate-450">
                <span className="text-xs font-bold uppercase tracking-wider">Active Seats</span>
                <Users className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <span className="text-2xl font-extrabold text-white mt-3 block">{stats.totalUsers}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 group hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-slate-450">
                <span className="text-xs font-bold uppercase tracking-wider">Leads Import Limit</span>
                <Database className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <span className="text-2xl font-extrabold text-white mt-3 block">{stats.totalLeads}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 group hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-slate-450">
                <span className="text-xs font-bold uppercase tracking-wider">Global AI Spend</span>
                <Cpu className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <span className="text-2xl font-extrabold text-indigo-400 mt-3 block">
                ${stats.totalAICostUSD.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Tenants Lists Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-indigo-500" />
              Active Platform Tenants
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Organization Name</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Seats Allocated</th>
                    <th className="py-3 px-4">Monthly Quota Usage</th>
                    <th className="py-3 px-4">System Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {organisations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-950 transition-all">
                      <td className="py-4 px-4 font-bold text-white">{org.name}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          org.plan === "ENTERPRISE"
                            ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                            : org.plan === "GROWTH"
                            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                            : "bg-slate-950 border-slate-800 text-slate-300"
                        }`}>
                          {org.plan}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-300">{org.seats} seats</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-slate-400 font-medium">
                          <span>{org.leadsUsedThisMonth} / {org.monthlyLeadLimit}</span>
                          <span className="text-[10px] text-slate-500">
                            ({Math.round((org.leadsUsedThisMonth / org.monthlyLeadLimit) * 100)}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {org.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-450 font-bold">
                            <XCircle className="h-3.5 w-3.5" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleEditClick(org)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                        >
                          <Settings2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Editing Dialog Modal */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div>
              <h3 className="text-base font-extrabold text-white">Adjust Tenant Controls</h3>
              <p className="text-xs text-slate-400 mt-1">Tenant: {editingOrg.name}</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billing Plan Tier</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="STARTER">STARTER (250 leads/mo)</option>
                  <option value="GROWTH">GROWTH (1000 leads/mo)</option>
                  <option value="ENTERPRISE">ENTERPRISE (Unlimited)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seats Limit</label>
                <input
                  type="number"
                  value={editForm.seats}
                  onChange={(e) => setEditForm({ ...editForm, seats: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Importer Max Quota Limit</label>
                <input
                  type="number"
                  value={editForm.monthlyLeadLimit}
                  onChange={(e) => setEditForm({ ...editForm, monthlyLeadLimit: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-b border-slate-800">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Tenant Portal Status</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  {updating ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
