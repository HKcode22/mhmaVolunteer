"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Clock, Star, CheckCircle, XCircle, Trash2, ChevronDown, ChevronRight, Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchTestimonials, addTestimonial, updateTestimonial, deleteTestimonial, fetchPrograms, fetchEvents, Testimonial, FirebaseProgram, FirebaseEvent } from "@/lib/firebase";
import { uploadImage } from "@/lib/upload";
import Navigation from "@/app/components/Navigation";

export default function DashboardTestimonialsPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", content: "", photo: "", displayOn: [] as string[], active: true });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [programs, setPrograms] = useState<FirebaseProgram[]>([]);
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [showProgList, setShowProgList] = useState(false);
  const [showEventList, setShowEventList] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    Promise.all([
      fetchTestimonials(100),
      fetchPrograms(100),
      fetchEvents(100),
    ]).then(([t, p, e]) => {
      setItems(t);
      setPendingCount(t.filter(i => !i.active).length);
      setPrograms(p);
      setEvents(e);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.content.toLowerCase().includes(q);
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await uploadImage(file);
      setForm(prev => ({ ...prev, photo: dataUrl }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await addTestimonial({ name: form.name.trim(), role: form.role.trim() || undefined, content: form.content.trim(), photo: form.photo || undefined, displayOn: form.displayOn, active: form.active });
      setForm({ name: "", role: "", content: "", photo: "", displayOn: [], active: true });
      setShowForm(false);
      const updated = await fetchTestimonials(100);
      setItems(updated);
    } finally {
      setSaving(false);
    }
  };

  const togglePage = (page: string) => {
    setForm(prev => ({ ...prev, displayOn: prev.displayOn.includes(page) ? prev.displayOn.filter(p => p !== page) : [...prev.displayOn, page] }));
  };

  if (authLoading || loading) return <div className="pt-32 text-center text-gray-500">Loading...</div>;

  const handleToggleActive = async (id: string, active: boolean) => {
    await updateTestimonial(id, { active });
    const refreshed = await fetchTestimonials(100);
    setItems(refreshed);
    setPendingCount(refreshed.filter(t => !t.active).length);
  };

  const handleBulkActive = async (active: boolean) => {
    const targets = items.filter(t => t.id && t.active !== active);
    await Promise.allSettled(targets.map(t => updateTestimonial(t.id!, { active })));
    const refreshed = await fetchTestimonials(100);
    setItems(refreshed);
    setPendingCount(refreshed.filter(t => !t.active).length);
  };

  const pageOptions = ["homepage", "about", "donate", "contact", "masjid-construction"];

  const isDisplayed = (val: string) => form.displayOn.includes(val);
  const toggleDisplay = (val: string) => {
    setForm(prev => ({
      ...prev,
      displayOn: prev.displayOn.includes(val)
        ? prev.displayOn.filter(p => p !== val)
        : [...prev.displayOn, val]
    }));
  };

  const formatLabel = (val: string) => {
    if (val.startsWith("program:")) return val.replace("program:", "");
    if (val.startsWith("event:")) return val.replace("event:", "");
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Testimonials</h1>
              <p className="text-gray-500 text-sm">Community testimonials and quotes shown on public pages.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light transition-colors font-medium text-sm">
              <Plus className="w-4 h-4" /> Add Testimonial
            </button>
          </div>

          {showForm && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">New Testimonial</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Author Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Role / Title</label>
                  <input type="text" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="Board Member, Volunteer, etc." />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Testimonial Text *</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="The testimonial content..." />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Photo (optional)</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm" />
                  {uploadingPhoto && <Loader2 className="w-4 h-4 animate-spin text-mhma-gold" />}
                </div>
                {form.photo && <img src={form.photo} alt="Preview" className="mt-2 w-16 h-16 object-cover rounded-full" />}
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">Show on pages:</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {pageOptions.map(p => (
                    <button key={p} onClick={() => toggleDisplay(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDisplayed(p) ? "bg-mhma-forest text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <button type="button" onClick={() => setShowProgList(!showProgList)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    {showProgList ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Programs ({programs.length})
                  </button>
                  <button type="button" onClick={() => setShowEventList(!showEventList)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    {showEventList ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Events ({events.length})
                  </button>
                </div>
                {showProgList && (
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                    {programs.length === 0 && <span className="text-xs text-gray-400">No programs available.</span>}
                    {programs.map(prog => (
                      <button key={prog.slug} onClick={() => toggleDisplay(`program:${prog.title}`)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${isDisplayed(`program:${prog.title}`) ? "bg-mhma-forest text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"}`}>
                        {prog.title}
                      </button>
                    ))}
                  </div>
                )}
                {showEventList && (
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                    {events.length === 0 && <span className="text-xs text-gray-400">No events available.</span>}
                    {events.map(evt => (
                      <button key={evt.id} onClick={() => toggleDisplay(`event:${evt.title}`)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${isDisplayed(`event:${evt.title}`) ? "bg-mhma-forest text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"}`}>
                        {evt.title}
                      </button>
                    ))}
                  </div>
                )}
                {form.displayOn.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.displayOn.map(v => (
                      <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-mhma-forest/10 text-mhma-forest font-medium">
                        {formatLabel(v)}
                        <button onClick={() => toggleDisplay(v)} className="hover:text-red-500">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                    className="rounded border-gray-300 text-mhma-gold focus:ring-mhma-gold" />
                  <span className="text-xs text-gray-600">Active (visible on pages)</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleAdd} disabled={saving || !form.name.trim() || !form.content.trim()}
                  className="px-4 py-2 bg-mhma-forest text-white rounded-lg hover:bg-mhma-forest-light text-sm font-medium disabled:opacity-50">
                  {saving ? "Saving..." : "Save Testimonial"}
                </button>
              </div>
            </div>
          )}

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name or content..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>

          {pendingCount > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-mhma-gold">{pendingCount}</span> testimonial{pendingCount !== 1 ? "s" : ""} pending approval
              </p>
              <div className="flex gap-2">
                <button onClick={() => handleBulkActive(true)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                  Activate All
                </button>
                <button onClick={() => handleBulkActive(false)} className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium hover:bg-gray-600 transition-colors">
                  Deactivate All
                </button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center"><Star className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{search ? "No matching testimonials." : "No testimonials yet."}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Content</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Pages</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Active</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} className="border-b border-gray-100 cursor-pointer">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{t.name}</p>
                          {t.role && <p className="text-xs text-gray-500">{t.role}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-[300px] truncate">{t.content}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(t.displayOn || []).map(p => (
                              <span key={p} className="inline-block px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{p}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {t.active ? (
                              <button onClick={() => handleToggleActive(t.id!, false)} className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors">
                                <CheckCircle className="w-3 h-3" /> Active
                              </button>
                            ) : (
                              <button onClick={() => handleToggleActive(t.id!, true)} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-amber-100 hover:text-amber-700 transition-colors">
                                <Clock className="w-3 h-3" /> Pending
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => {
                            if (!confirm("Delete this testimonial?")) return;
                            deleteTestimonial(t.id!).then(() => setItems(prev => prev.filter(x => x.id !== t.id)));
                          }} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
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
          <p className="text-xs text-gray-400 mt-4">{filtered.length} testimonial{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </main>
    </div>
  );
}
