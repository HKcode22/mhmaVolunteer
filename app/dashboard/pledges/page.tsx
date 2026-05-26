"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Search, Mail, Phone, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchPledges, updatePledgeStatus, deletePledge, Pledge } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardPledgesPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    fetchPledges(100).then(d => { setPledges(d); setLoading(false); }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filtered = pledges.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || (p.phone || "").includes(q);
  });

  const handleStatus = async (id: string, status: "fulfilled" | "cancelled") => {
    await updatePledgeStatus(id, status);
    setPledges(prev => prev.map(p => p.id === id ? { ...p, status, fulfilledAt: status === "fulfilled" ? new Date() : undefined, cancelledAt: status === "cancelled" ? new Date() : undefined } : p));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this pledge?")) return;
    await deletePledge(id);
    setPledges(prev => prev.filter(p => p.id !== id));
  };

  if (authLoading || loading) return <div className="pt-32 text-center text-gray-500">Loading...</div>;

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-amber-100 text-amber-800", label: "Pending" },
      fulfilled: { color: "bg-green-100 text-green-800", label: "Fulfilled" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    };
    const s = map[status] || map.pending;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-4 font-semibold">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pledges</h1>
          <p className="text-gray-500 mb-6 text-sm">Track and manage donor pledges.</p>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-amber-600">{pledges.filter(p => p.status === "pending").length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-600">${pledges.filter(p => p.status === "fulfilled").reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Fulfilled Total</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">${pledges.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Pledged</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{search ? "No matching pledges." : "No pledges yet."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Contact</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                              <Mail className="w-3 h-3" /> {p.email}
                            </a>
                            {p.phone && (
                              <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-gray-500 hover:underline">
                                <Phone className="w-3 h-3" /> {p.phone}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">${p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">{statusBadge(p.status)}</td>
                        <td className="px-4 py-3 text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {p.createdAt?.toDate?.()?.toLocaleDateString() || ""}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {p.status === "pending" && (
                              <>
                                <button onClick={() => handleStatus(p.id!, "fulfilled")} title="Mark fulfilled"
                                  className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleStatus(p.id!, "cancelled")} title="Cancel"
                                  className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button onClick={() => handleDelete(p.id!)} title="Delete"
                              className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4">{filtered.length} pledge{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </main>
    </div>
  );
}
