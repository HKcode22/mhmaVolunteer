"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Mail, Phone, Clock, Calendar, ChevronDown, ChevronRight, MapPin, Utensils, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchSchedulingRequests, deleteSchedulingRequest, updateSchedulingRequest, FirebaseSchedulingRequest } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardSchedulingRequestsPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FirebaseSchedulingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    fetchSchedulingRequests(100).then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || (i.organizer?.firstName || "").toLowerCase().includes(q) || (i.organizer?.lastName || "").toLowerCase().includes(q) || i.organizer?.email?.toLowerCase().includes(q) || i.eventTitle.toLowerCase().includes(q);
  });

  const handleStatus = async (id: string, status: "approved" | "rejected") => {
    await updateSchedulingRequest(id, { status });
    setItems(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleBulk = async (status: "approved" | "rejected") => {
    const pending = filtered.filter(r => r.status === "pending" && r.id);
    for (const r of pending) {
      await updateSchedulingRequest(r.id!, { status });
      setItems(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
    }
  };

  if (authLoading || loading) return <div className="pt-32 text-center text-gray-500">Loading...</div>;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800" };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || "bg-gray-100 text-gray-700"}`}>{s}</span>;
  };

  const YesIcon = (v?: string) => v === "yes" ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : v === "no" ? <XCircle className="w-3.5 h-3.5 text-red-400" /> : <HelpCircle className="w-3.5 h-3.5 text-gray-300" />;

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduling Requests</h1>
              <p className="text-gray-500 text-sm">Event scheduling requests from the community. Click a row to expand details.</p>
            </div>
            {filtered.some(r => r.status === "pending") && (
              <div className="flex items-center gap-2">
                <button onClick={() => handleBulk("approved")} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">Approve All</button>
                <button onClick={() => handleBulk("rejected")} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">Reject All</button>
              </div>
            )}
          </div>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by organizer name, email, or event title..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{search ? "No matching requests." : "No scheduling requests yet."}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-8 px-2 py-3"></th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Organizer</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Contact</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Event</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(i => {
                      const isExpanded = expandedId === i.id;
                      return (
                        <>
                        <tr key={i.id} className="border-b border-gray-100">
                          <td className="px-2 py-3">
                            <button onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : i.id || null); }} className="p-1 hover:bg-gray-100 rounded transition-colors">
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : i.id || null)}>
                            <span className="font-semibold text-gray-900">{i.organizer?.firstName || ""} {i.organizer?.lastName || ""}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <a href={`mailto:${i.organizer?.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail className="w-3 h-3" /> {i.organizer?.email}</a>
                              {i.organizer?.phone && <a href={`tel:${i.organizer?.phone}`} className="flex items-center gap-1 text-gray-500 hover:underline"><Phone className="w-3 h-3" /> {i.organizer?.phone}</a>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{i.eventTitle}</td>
                          <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{i.category}</span></td>
                          <td className="px-4 py-3">{statusBadge(i.status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {i.status === "pending" && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); i.id && handleStatus(i.id, "approved"); }} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors" title="Approve">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); i.id && handleStatus(i.id, "rejected"); }} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors" title="Reject">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); if (!confirm("Delete this request?")) return; deleteSchedulingRequest(i.id!).then(() => setItems(prev => prev.filter(x => x.id !== i.id))); }}
                                className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${i.id}-detail`}>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Details</h4>
                                  <div className="space-y-1.5 text-xs">
                                    <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> <span className="font-medium">Location:</span> {i.location || "—"}</p>
                                    <p className="flex items-center gap-1"><span className="font-medium">Facility:</span> {i.facility || "—"}</p>
                                    {i.start && <p className="flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-400" /> <span className="font-medium">Start:</span> {new Date(i.start).toLocaleString()}</p>}
                                    {i.end && <p className="flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-400" /> <span className="font-medium">End:</span> {new Date(i.end).toLocaleString()}</p>}
                                    {i.description && <p className="mt-2 p-2 bg-white rounded border border-gray-100 text-gray-600 whitespace-pre-wrap">{i.description}</p>}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Logistics</h4>
                                  <div className="space-y-1.5 text-xs">
                                    <p className="flex items-center gap-1"><span className="font-medium">Host/Speaker:</span> {YesIcon(i.hasHostSpeaker)} {i.hasHostSpeaker || "—"}</p>
                                    <p className="flex items-center gap-1"><Utensils className="w-3 h-3 text-gray-400" /> <span className="font-medium">Food:</span> {YesIcon(i.hasFood)} {i.hasFood === "yes" ? (i.foodService?.join(", ") || "yes") : i.hasFood || "—"}</p>
                                    {i.roundTables !== undefined && <p><span className="font-medium">Round Tables:</span> {i.roundTables}</p>}
                                    {i.rectangularTables !== undefined && <p><span className="font-medium">Rect. Tables:</span> {i.rectangularTables}</p>}
                                    {i.chairs !== undefined && <p><span className="font-medium">Chairs:</span> {i.chairs}</p>}
                                    {i.equipment?.length ? <p><span className="font-medium">Equipment:</span> {i.equipment.join(", ")}</p> : null}
                                    {i.volunteers !== undefined && <p><span className="font-medium">Volunteers:</span> {i.volunteers}</p>}
                                    {i.helpers !== undefined && <p><span className="font-medium">Helpers:</span> {i.helpers}</p>}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Requirements</h4>
                                  <div className="space-y-1.5 text-xs">
                                    <p className="flex items-center gap-1"><span className="font-medium">RSVP Required:</span> {YesIcon(i.rsvpRequired)} {i.rsvpRequired || "—"}</p>
                                    <p className="flex items-center gap-1"><span className="font-medium">Payment Required:</span> {YesIcon(i.paymentRequired)} {i.paymentRequired || "—"}</p>
                                    {i.comments && (
                                      <>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-3 mb-1">Comments</h4>
                                        <p className="p-2 bg-white rounded border border-gray-100 text-gray-600 whitespace-pre-wrap">{i.comments}</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </main>
    </div>
  );
}
