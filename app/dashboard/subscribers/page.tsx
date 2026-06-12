"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Search, CheckCircle, XCircle, Trash2, Download, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchSubscribers, unsubscribeSubscriber, deleteSubscriber, Subscriber } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardSubscribersPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    fetchSubscribers(500).then(d => { setSubscribers(d); setLoading(false); }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filtered = subscribers.filter(s => {
    const q = search.toLowerCase();
    return !q || s.email.includes(q) || (s.name || "").toLowerCase().includes(q) || (s.source || "").includes(q);
  });

  const handleUnsubscribe = async (id: string) => {
    await unsubscribeSubscriber(id);
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, status: "unsubscribed" } : s));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subscriber?")) return;
    await deleteSubscriber(id);
    setSubscribers(prev => prev.filter(s => s.id !== id));
  };

  const handleExport = () => {
    const active = subscribers.filter(s => s.status === "active");
    const csv = "Email,Name,Source,Date\n" + active.map(s =>
      `${s.email},${s.name || ""},${s.source || ""},${s.createdAt?.toDate?.()?.toLocaleDateString() || ""}`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) return <div className="pt-32 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-4 font-semibold">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Newsletter Subscribers</h1>
              <p className="text-gray-500 text-sm">{subscribers.filter(s => s.status === "active").length} active subscribers</p>
            </div>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-mhma-forest text-white rounded-lg hover:bg-mhma-forest-light text-sm font-semibold transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{search ? "No matching subscribers." : "No subscribers yet."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-8 px-2 py-3"></th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Source</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => {
                      const isExpanded = expandedId === s.id;
                      return (
                        <Fragment key={s.id}>
                          <tr
                            className="border-b border-gray-100 dashboard-row cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : s.id || null)}
                          >
                            <td className="w-8 px-2 py-3">
                              <button onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : s.id || null); }} className="p-1 hover:bg-gray-100 rounded transition-colors">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{s.email}</td>
                            <td className="px-4 py-3 text-gray-600">{s.name || "—"}</td>
                            <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{s.source || "—"}</span></td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                                {s.status === "active" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {s.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">{s.createdAt?.toDate?.()?.toLocaleDateString() || ""}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {s.status === "active" && (
                                  <button onClick={(e) => { e.stopPropagation(); handleUnsubscribe(s.id!); }} title="Unsubscribe"
                                    className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id!); }} title="Delete"
                                  className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${s.id}-detail`}>
                              <td colSpan={7} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ID</h4>
                                    <p className="text-sm text-gray-700 font-mono">{s.id}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</h4>
                                    <p className="text-sm text-gray-700">{s.email}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Name</h4>
                                    <p className="text-sm text-gray-700">{s.name || "—"}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Source</h4>
                                    <p className="text-sm text-gray-700">{s.source || "—"}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status</h4>
                                    <p className="text-sm text-gray-700">{s.status}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date</h4>
                                    <p className="text-sm text-gray-700">{s.createdAt?.toDate?.()?.toLocaleDateString() || ""}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4">{filtered.length} subscriber{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </main>
    </div>
  );
}
