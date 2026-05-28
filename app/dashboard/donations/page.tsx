"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Search, Mail, DollarSign, Clock, Trash2, Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchDonations, addManualDonation, deleteDonation, Donation } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

const designations = ["general", "construction", "zakat", "programs", "other"];
const methods = ["stripe", "zelle", "check", "cash", "paypal"];

export default function DashboardDonationsPage() {
  const router = useRouter();
  const { user, isBoardMember, loading: authLoading } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [designationFilter, setDesignationFilter] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("donationDesignationFilter") || "all";
    return "all";
  });
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ donorName: "", donorEmail: "", amount: "", designation: "general", method: "cash", notes: "", showOnWall: true, anonymous: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    fetchDonations(200).then(d => { setDonations(d); setLoading(false); }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filtered = donations.filter(d => {
    const q = search.toLowerCase();
    const matchesSearch = !q || d.donorName.toLowerCase().includes(q) || d.donorEmail.toLowerCase().includes(q) || d.designation.includes(q);
    const matchesDesignation = designationFilter === "all" || d.designation === designationFilter;
    return matchesSearch && matchesDesignation;
  });

  const onChangeDesignation = (val: string) => {
    setDesignationFilter(val);
    localStorage.setItem("donationDesignationFilter", val);
  };

  const fmtDate = (d: Donation) => {
    if (!d.createdAt) return "";
    if (typeof d.createdAt === "string") return new Date(d.createdAt).toLocaleDateString();
    if (d.createdAt.toDate) return d.createdAt.toDate().toLocaleDateString();
    return "";
  };

  const handleManualSubmit = async () => {
    if (!user) return;
    const amount = parseFloat(manual.amount);
    if (!manual.donorName || !amount || amount <= 0) return;
    setSaving(true);
    try {
      await addManualDonation({
        donorId: "",
        donorName: manual.donorName,
        donorEmail: manual.donorEmail,
        amount: Math.round(amount * 100),
        designation: manual.designation,
        method: manual.method,
        status: "completed",
        showOnWall: manual.showOnWall,
        anonymous: manual.anonymous,
        notes: manual.notes || "",
        recordedBy: user.uid,
      });
      setManual({ donorName: "", donorEmail: "", amount: "", designation: "general", method: "cash", notes: "", showOnWall: true, anonymous: false });
      setShowManual(false);
      const updated = await fetchDonations(200);
      setDonations(updated);
    } catch (err) {
      console.error("Failed to save donation:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this donation record?")) return;
    try {
      await deleteDonation(id);
      setDonations(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const totalAmount = donations.reduce((s, d) => s + (d.amount || 0), 0);

  const downloadCSV = () => {
    const headers = ["Donor Name", "Email", "Amount", "Designation", "Method", "Status", "Date", "Notes"];
    const rows = filtered.map(d => [
      d.donorName,
      d.donorEmail,
      ((d.amount || 0) / 100).toFixed(2),
      d.designation,
      d.method,
      d.status,
      d.createdAt?.toDate?.()?.toLocaleDateString() || "",
      d.notes || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) return <div className="pt-32 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />
      <main className="pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-4 font-semibold">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Donations</h1>
              <p className="text-gray-500 text-sm">Payment records from Stripe and manual entries.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm border border-gray-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export CSV
              </button>
              <button onClick={() => setShowManual(true)} className="flex items-center gap-2 px-4 py-2.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light transition-colors font-medium text-sm">
                <Plus className="w-4 h-4" /> Record Donation
              </button>
            </div>
          </div>

          {/* Manual Donation Form */}
          {showManual && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Record Offline/Manual Donation</h2>
                <button onClick={() => setShowManual(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Donor Name *</label>
                  <input type="text" value={manual.donorName} onChange={e => setManual(p => ({ ...p, donorName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Donor Email</label>
                  <input type="email" value={manual.donorEmail} onChange={e => setManual(p => ({ ...p, donorEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount ($) *</label>
                  <input type="number" step="0.01" min="0.01" value={manual.amount} onChange={e => setManual(p => ({ ...p, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Designation</label>
                  <select value={manual.designation} onChange={e => setManual(p => ({ ...p, designation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm bg-white">
                    {designations.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                  <select value={manual.method} onChange={e => setManual(p => ({ ...p, method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm bg-white">
                    {methods.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <input type="text" value={manual.notes} onChange={e => setManual(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={manual.showOnWall} onChange={e => setManual(p => ({ ...p, showOnWall: e.target.checked }))}
                      className="rounded border-gray-300 text-mhma-gold focus:ring-mhma-gold" />
                    <span className="text-xs text-gray-600">Show on donor wall</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={manual.anonymous} onChange={e => setManual(p => ({ ...p, anonymous: e.target.checked }))}
                      className="rounded border-gray-300 text-mhma-gold focus:ring-mhma-gold" />
                    <span className="text-xs text-gray-600">Anonymous (hide name)</span>
                  </label>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowManual(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleManualSubmit} disabled={saving || !manual.donorName || !manual.amount}
                  className="px-4 py-2 bg-mhma-forest text-white rounded-lg hover:bg-mhma-forest-light text-sm font-medium disabled:opacity-50">
                  {saving ? "Saving..." : "Save Donation"}
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{donations.length}</p>
              <p className="text-xs text-gray-500">Total Donations</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-600">${(totalAmount / 100).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Collected</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{donations.filter(d => d.method === "stripe").length}</p>
              <p className="text-xs text-gray-500">Stripe Payments</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-amber-600">{donations.filter(d => d.method !== "stripe").length}</p>
              <p className="text-xs text-gray-500">Manual Entries</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or designation..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => onChangeDesignation("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${designationFilter === "all" ? "bg-mhma-forest text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-mhma-forest"}`}>
              All
            </button>
            {designations.map(d => (
              <button key={d} onClick={() => onChangeDesignation(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${designationFilter === d ? "bg-mhma-forest text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-mhma-forest"}`}>
                {d}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{search ? "No matching donations." : "No donations recorded yet. Donations from Stripe will appear here automatically once the webhook is configured."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Donor</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Designation</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Method</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(d => (
                      <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{d.donorName}</p>
                          {d.donorEmail && <a href={`mailto:${d.donorEmail}`} className="flex items-center gap-1 text-blue-600 hover:underline text-xs mt-0.5">
                            <Mail className="w-3 h-3" /> {d.donorEmail}
                          </a>}
                          {d.donorId && <p className="text-xs text-gray-400 mt-0.5">ID: {d.donorId.slice(0, 12)}...</p>}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">${((d.amount || 0) / 100).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">{d.designation}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{d.method}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${d.status === "completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDate(d)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDelete(d.id!)} title="Delete"
                            className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4">{filtered.length} donation{filtered.length !== 1 ? "s" : ""}</p>

          {/* Donation Charts */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Designation */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">By Designation</h3>
              <div className="space-y-3">
                {designations.map(d => {
                  const total = donations.filter(dd => dd.designation === d).reduce((s, dd) => s + (dd.amount || 0), 0);
                  const maxTotal = Math.max(...designations.map(dd => donations.filter(x => x.designation === dd).reduce((s, x) => s + (x.amount || 0), 0)), 1);
                  const pct = (total / maxTotal) * 100;
                  return (
                    <div key={d}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium text-gray-700">{d}</span>
                        <span className="font-bold text-gray-900">${(total / 100).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full bg-mhma-gold transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Method */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">By Method</h3>
              <div className="space-y-3">
                {["stripe", "zelle", "check", "cash", "paypal"].map(m => {
                  const total = donations.filter(dd => dd.method === m).reduce((s, dd) => s + (dd.amount || 0), 0);
                  const maxTotal = Math.max(...["stripe", "zelle", "check", "cash", "paypal"].map(mm => donations.filter(x => x.method === mm).reduce((s, x) => s + (x.amount || 0), 0)), 1);
                  const pct = (total / maxTotal) * 100;
                  if (total === 0) return null;
                  return (
                    <div key={m}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium text-gray-700">{m}</span>
                        <span className="font-bold text-gray-900">${(total / 100).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full bg-mhma-forest transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {donations.filter(dd => !["stripe", "zelle", "check", "cash", "paypal"].includes(dd.method)).length === 0 && (
                  <p className="text-xs text-gray-400">Only Stripe donations recorded so far.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
