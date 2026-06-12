"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Mail, Phone, Clock, Calendar, Users, CheckCircle, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchRSVPs, deleteRSVP, updateRSVP, FirebaseRSVP } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardRSVPsPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FirebaseRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    fetchRSVPs(100).then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || i.fullName.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || (i.eventTitle || "").toLowerCase().includes(q);
  });

  const handleStatus = async (id: string, status: "confirmed" | "cancelled") => {
    await updateRSVP(id, { status });
    setItems(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleBulk = async (status: "confirmed" | "cancelled") => {
    const pending = filtered.filter(r => r.status === "pending" && r.id);
    for (const r of pending) {
      await updateRSVP(r.id!, { status });
      setItems(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
    }
  };

  if (authLoading || loading) return <div className="pt-32 text-center text-gray-500">Loading...</div>;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-4 font-semibold">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">RSVP List</h1>
              <p className="text-gray-500 text-sm">View event RSVPs from the community.</p>
            </div>
            {filtered.some(r => r.status === "pending") && (
              <div className="flex items-center gap-2">
                <button onClick={() => handleBulk("confirmed")} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">Approve All</button>
                <button onClick={() => handleBulk("cancelled")} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">Reject All</button>
              </div>
            )}
          </div>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or event..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{search ? "No matching RSVPs." : "No RSVPs yet."}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-8 px-2 py-3"></th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Contact</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Event</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Guests</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(i => {
                      const isExpanded = expandedId === i.id;
                      return (
                        <Fragment key={i.id}>
                          <tr
                            className="border-b border-gray-100 dashboard-row cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : i.id || null)}
                          >
                            <td className="w-8 px-2 py-3">
                              <button onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : i.id || null); }} className="p-1 hover:bg-gray-100 rounded transition-colors">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{i.fullName}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <a href={`mailto:${i.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail className="w-3 h-3" /> {i.email}</a>
                                {i.phone && <a href={`tel:${i.phone}`} className="flex items-center gap-1 text-gray-500 hover:underline"><Phone className="w-3 h-3" /> {i.phone}</a>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{i.eventTitle || "—"}</td>
                            <td className="px-4 py-3"><span className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-500" /> {i.attendees}</span></td>
                            <td className="px-4 py-3">{statusBadge(i.status)}</td>
                            <td className="px-4 py-3 text-gray-500"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {i.createdAt?.toDate?.()?.toLocaleDateString() || ""}</span></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {i.status === "pending" && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); i.id && handleStatus(i.id, "confirmed"); }} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors" title="Confirm">
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); i.id && handleStatus(i.id, "cancelled"); }} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors" title="Cancel">
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); if (!confirm("Delete this RSVP?")) return; deleteRSVP(i.id!).then(() => setItems(prev => prev.filter(x => x.id !== i.id))); }}
                                  className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${i.id}-detail`}>
                              <td colSpan={8} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ID</h4>
                                    <p className="text-sm text-gray-700 font-mono">{i.id}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Attendee Name</h4>
                                    <p className="text-sm text-gray-700">{i.fullName}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</h4>
                                    <a href={`mailto:${i.email}`} className="text-sm text-blue-600 hover:underline">{i.email}</a>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event</h4>
                                    <p className="text-sm text-gray-700">{i.eventTitle || "—"}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Guests</h4>
                                    <p className="text-sm text-gray-700">{i.attendees}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status</h4>
                                    <p className="text-sm text-gray-700">{i.status}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date</h4>
                                    <p className="text-sm text-gray-700">{i.createdAt?.toDate?.()?.toLocaleDateString() || ""}</p>
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
          <p className="text-xs text-gray-400 mt-4">{filtered.length} RSVP{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </main>
    </div>
  );
}
