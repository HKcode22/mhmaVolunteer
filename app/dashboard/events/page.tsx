"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Edit3, Trash2, Calendar, Mail, Phone, Clock, Users, CheckCircle, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchEvents, fetchEventsDirect, addEvent, updateEvent, deleteEvent, fetchRSVPs, deleteRSVP, updateRSVP, FirebaseEvent, FirebaseRSVP } from "@/lib/firebase";
import { getCachedData } from "@/lib/cache-manager";
import { compressImage } from "@/lib/compress-image";
import Navigation from "@/app/components/Navigation";
import CsvExportButton from "@/app/components/CsvExportButton";

export default function DashboardEventsPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [rsvps, setRsvps] = useState<FirebaseRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FirebaseEvent | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", date: "", time: "", location: "", description: "", poster: "" });
  const [saving, setSaving] = useState(false);
  const [rsvpSearch, setRsvpSearch] = useState("");
  const [sectionOrder, setSectionOrder] = useState<"normal" | "swapped">("normal");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    Promise.all([getCachedData('events', () => fetchEvents(100)).then(r => r.data), getCachedData('rsvps', () => fetchRSVPs(100)).then(r => r.data)]).then(([e, r]) => {
      setEvents(e); setRsvps(r); setLoading(false);
    }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  useEffect(() => {
    const saved = localStorage.getItem("eventsSectionOrder");
    if (saved === "swapped" || saved === "normal") setSectionOrder(saved);
  }, []);

  const handleSwap = () => {
    const next = sectionOrder === "normal" ? "swapped" : "normal";
    setSectionOrder(next);
    localStorage.setItem("eventsSectionOrder", next);
  };

  const filtered = events.filter(i => {
    const q = search.toLowerCase();
    return !q || i.title.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q);
  });

  const rsvpCounts = useMemo(() => {
    const map: Record<string, { total: number; confirmed: number; pending: number; cancelled: number }> = {};
    for (const r of rsvps) {
      const key = r.eventTitle || r.eventId || "unknown";
      if (!map[key]) map[key] = { total: 0, confirmed: 0, pending: 0, cancelled: 0 };
      map[key].total++;
      if (r.status === "confirmed") map[key].confirmed++;
      else if (r.status === "pending") map[key].pending++;
      else if (r.status === "cancelled") map[key].cancelled++;
    }
    return map;
  }, [rsvps]);

  const filteredRsvps = rsvps.filter(i => {
    const q = rsvpSearch.toLowerCase();
    return !q || i.fullName.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || (i.eventTitle || "").toLowerCase().includes(q);
  });

  const resetForm = () => {
    setForm({ title: "", slug: "", date: "", time: "", location: "", description: "", poster: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (item: FirebaseEvent) => {
    setForm({ title: item.title, slug: item.slug, date: item.date || "", time: item.time || "", location: item.location || "", description: item.description || "", poster: item.poster || "" });
    setEditing(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (editing?.id) {
        await updateEvent(editing.id, { title: form.title.trim(), slug, date: form.date, time: form.time, location: form.location, description: form.description, poster: form.poster });
      } else {
        await addEvent({ title: form.title.trim(), slug, date: form.date, time: form.time, location: form.location, description: form.description, poster: form.poster });
        fetch("/api/notify-event", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.title.trim(), date: form.date, time: form.time, location: form.location, slug }),
        }).catch(() => {});
      }
      resetForm();
      const updated = await fetchEvents(100);
      setEvents(updated);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteEvent(id);
    setEvents(prev => prev.filter(x => x.id !== id));
  };

  const handleRsvpStatus = async (id: string, status: "confirmed" | "cancelled") => {
    await updateRSVP(id, { status });
    setRsvps(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleBulkRsvp = async (status: "confirmed" | "cancelled") => {
    const pending = filteredRsvps.filter(r => r.status === "pending" && r.id);
    for (const r of pending) {
      await updateRSVP(r.id!, { status });
      setRsvps(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
    }
  };

  const rsvpStatusBadge = (s: string) => {
    const map: Record<string, string> = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || map.pending}`}>{s}</span>;
  };

  const formatTime = (t?: string) => {
    if (!t) return "";
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
      const [h, m] = t.split(":");
      const hour = parseInt(h, 10);
      return `${hour % 12 || 12}:${m}${hour >= 12 ? "pm" : "am"}`;
    }
    return t;
  };

  const renderEventsTable = () => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
      {filtered.length === 0 ? (
        <div className="p-12 text-center"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{search ? "No matching events." : "No events yet."}</p></div>
      ) : (
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <th className="w-8 px-2 py-3"></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">RSVPs</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Location</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const isExpanded = expandedId === e.id;
                return (
                  <Fragment key={e.id}>
                    <tr
                      className="border-b border-gray-100 dashboard-row cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : e.id || null)}
                    >
                      <td className="w-8 px-2 py-3">
                        <button onClick={(ev) => { ev.stopPropagation(); setExpandedId(isExpanded ? null : e.id || null); }} className="p-1 hover:bg-gray-100 rounded transition-colors">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{e.title}</p>
                        {e.description && <p className="text-xs text-gray-500 truncate max-w-[250px]">{e.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-900">{(rsvpCounts[e.title] || rsvpCounts[e.id!] || { total: 0 }).total}</span>
                          <span className="text-xs text-gray-400">total</span>
                          {(() => {
                            const c = rsvpCounts[e.title] || rsvpCounts[e.id!];
                            if (!c) return null;
                            return (
                              <div className="flex gap-1.5 ml-1">
                                {c.confirmed > 0 && <span className="text-xs text-green-600 font-medium">{c.confirmed} ✅</span>}
                                {c.pending > 0 && <span className="text-xs text-amber-600 font-medium">{c.pending} ⏳</span>}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{e.date || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{formatTime(e.time) || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{e.location || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={(ev) => { ev.stopPropagation(); handleEdit(e); }} className="p-1.5 bg-gray-100 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={(ev) => { ev.stopPropagation(); e.id && handleDelete(e.id, e.title); }} className="p-1.5 bg-gray-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${e.id}-detail`}>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ID</h4>
                              <p className="text-sm text-gray-700 font-mono">{e.id}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Title</h4>
                              <p className="text-sm text-gray-700">{e.title}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date</h4>
                              <p className="text-sm text-gray-700">{e.date || "—"}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Time</h4>
                              <p className="text-sm text-gray-700">{formatTime(e.time) || "—"}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location</h4>
                              <p className="text-sm text-gray-700">{e.location || "—"}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                              <p className="text-sm text-gray-700">{e.description || "—"}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">RSVPs</h4>
                              <div className="text-sm text-gray-700">
                                {(rsvpCounts[e.title] || rsvpCounts[e.id!])
                                  ? (() => { const c = rsvpCounts[e.title] || rsvpCounts[e.id!];
                                      return `${c.total} total (${c.confirmed} confirmed, ${c.pending} pending, ${c.cancelled} cancelled)`;
                                    })()
                                  : "No RSVPs yet"}
                              </div>
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
  );

  const renderRsvpsTable = () => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {filteredRsvps.length === 0 ? (
        <div className="p-12 text-center"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{rsvpSearch ? "No matching RSVPs." : "No RSVPs yet."}</p></div>
      ) : (
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
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
              {filteredRsvps.map(i => {
                const isExpanded = expandedId === `rsvp-${i.id}`;
                return (
                  <Fragment key={i.id}>
                    <tr
                      className="border-b border-gray-100 dashboard-row cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : `rsvp-${i.id}` || null)}
                    >
                      <td className="w-8 px-2 py-3">
                        <button onClick={(ev) => { ev.stopPropagation(); setExpandedId(isExpanded ? null : `rsvp-${i.id}` || null); }} className="p-1 hover:bg-gray-100 rounded transition-colors">
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
                      <td className="px-4 py-3">{rsvpStatusBadge(i.status)}</td>
                      <td className="px-4 py-3 text-gray-500"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {i.createdAt?.toDate?.()?.toLocaleDateString() || ""}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {i.status === "pending" && (
                            <>
                              <button onClick={(ev) => { ev.stopPropagation(); i.id && handleRsvpStatus(i.id, "confirmed"); }} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors" title="Confirm">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={(ev) => { ev.stopPropagation(); i.id && handleRsvpStatus(i.id, "cancelled"); }} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors" title="Cancel">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={(ev) => { ev.stopPropagation(); if (!confirm("Delete this RSVP?")) return; deleteRSVP(i.id!).then(() => setRsvps(prev => prev.filter(x => x.id !== i.id))); }}
                            className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                            <Trash2 className="w-4 h-4" />
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
  );

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
              <p className="text-gray-500 text-sm">Manage events and view RSVPs.</p>
            </div>
            <div className="flex items-center gap-2">
              <CsvExportButton
                label="Export CSV"
                fetchData={(params) =>
                  params?.from || params?.to
                    ? fetchEventsDirect(10000, params.from, params.to).catch(() => [])
                    : fetchEvents(9999).catch(() => [])
                }
                filename="events"
                fields={['id', 'title', 'date', 'time', 'location', 'description', 'createdAt']}
              />
              <button onClick={() => showForm ? resetForm() : setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light transition-colors font-medium text-sm">
                <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "Add Event"}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">{editing ? "Edit Event" : "New Event"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Slug</label>
                  <input type="text" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="Auto-generated" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                  <input type="text" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="e.g. 7:00 PM" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="MHMA" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Poster Image</label>
                  <div className="flex flex-col gap-2">
                    <input type="url" value={form.poster} onChange={e => setForm(p => ({ ...p, poster: e.target.value }))} placeholder="Or paste image URL..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Upload:</span>
                      <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        compressImage(file).then(data => setForm(p => ({ ...p, poster: data })));
                      }} className="text-sm" />
                    </div>
                    {form.poster && <img src={form.poster} alt="Preview" className="mt-1 w-24 h-16 object-cover rounded-lg border border-gray-200" />}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.title.trim()}
                  className="px-4 py-2 bg-mhma-forest text-white rounded-lg hover:bg-mhma-forest-light text-sm font-medium disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update" : "Create Event"}
                </button>
              </div>
            </div>
          )}

          {sectionOrder === "normal" ? (
            <>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>

              {renderEventsTable()}
              <p className="text-xs text-gray-400 -mt-6 mb-6">{filtered.length} event{filtered.length !== 1 ? "s" : ""}</p>

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">RSVPs</h2>
                <div className="flex items-center gap-2">
                  {filteredRsvps.some(r => r.status === "pending") && (
                    <>
                      <button onClick={() => handleBulkRsvp("confirmed")} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">Approve All</button>
                      <button onClick={() => handleBulkRsvp("cancelled")} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">Reject All</button>
                    </>
                  )}
                  <button onClick={handleSwap} className="text-xs text-mhma-gold hover:text-amber-600 font-medium">Swap order</button>
                </div>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search RSVPs..." value={rsvpSearch} onChange={e => setRsvpSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>
              {renderRsvpsTable()}
              <p className="text-xs text-gray-400 mt-4">{filteredRsvps.length} RSVP{filteredRsvps.length !== 1 ? "s" : ""}</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">RSVPs</h2>
                <div className="flex items-center gap-2">
                  {filteredRsvps.some(r => r.status === "pending") && (
                    <>
                      <button onClick={() => handleBulkRsvp("confirmed")} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">Approve All</button>
                      <button onClick={() => handleBulkRsvp("cancelled")} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">Reject All</button>
                    </>
                  )}
                  <button onClick={handleSwap} className="text-xs text-mhma-gold hover:text-amber-600 font-medium">Swap order</button>
                </div>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search RSVPs..." value={rsvpSearch} onChange={e => setRsvpSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>
              {renderRsvpsTable()}
              <p className="text-xs text-gray-400 mb-6">{filteredRsvps.length} RSVP{filteredRsvps.length !== 1 ? "s" : ""}</p>

              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>

              {renderEventsTable()}
              <p className="text-xs text-gray-400 -mt-6 mb-6">{filtered.length} event{filtered.length !== 1 ? "s" : ""}</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
