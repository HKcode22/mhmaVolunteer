"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Edit3, Trash2, BookOpen, Mail, Phone, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchPrograms, addProgram, updateProgram, deleteProgram, fetchEnrollments, deleteEnrollment, FirebaseProgram, FirebaseEnrollment } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardProgramsPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [programs, setPrograms] = useState<FirebaseProgram[]>([]);
  const [enrollments, setEnrollments] = useState<FirebaseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FirebaseProgram | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", description: "", image: "" });
  const [saving, setSaving] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [sectionOrder, setSectionOrder] = useState<"normal" | "swapped">("normal");

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    Promise.all([fetchPrograms(100), fetchEnrollments(100)]).then(([p, e]) => {
      setPrograms(p); setEnrollments(e); setLoading(false);
    }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  useEffect(() => {
    const saved = localStorage.getItem("programsSectionOrder");
    if (saved === "swapped" || saved === "normal") setSectionOrder(saved);
  }, []);

  const handleSwap = () => {
    const next = sectionOrder === "normal" ? "swapped" : "normal";
    setSectionOrder(next);
    localStorage.setItem("programsSectionOrder", next);
  };

  const filtered = programs.filter(i => {
    const q = search.toLowerCase();
    return !q || i.title.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q);
  });

  const filteredEnroll = enrollments.filter(i => {
    const q = enrollSearch.toLowerCase();
    return !q || i.fullName.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || i.program.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setForm({ title: "", slug: "", description: "", image: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (item: FirebaseProgram) => {
    setForm({ title: item.title, slug: item.slug, description: item.description || "", image: item.image || "" });
    setEditing(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (editing?.id) {
        await updateProgram(editing.id, { title: form.title.trim(), slug, description: form.description.trim(), image: form.image });
      } else {
        await addProgram({ title: form.title.trim(), slug, description: form.description.trim(), image: form.image, useHardcodedVersion: false, createdBy: "board" });
      }
      resetForm();
      const updated = await fetchPrograms(100);
      setPrograms(updated);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteProgram(id);
    setPrograms(prev => prev.filter(x => x.id !== id));
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", completed: "bg-blue-100 text-blue-800" };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || map.pending}`}>{s}</span>;
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Programs</h1>
              <p className="text-gray-500 text-sm">Manage programs and view enrollments.</p>
            </div>
            <button onClick={() => showForm ? resetForm() : setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light transition-colors font-medium text-sm">
              <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "Add Program"}
            </button>
          </div>

          {showForm && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">{editing ? "Edit Program" : "New Program"}</h2>
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
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                  <input type="url" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.title.trim()}
                  className="px-4 py-2 bg-mhma-forest text-white rounded-lg hover:bg-mhma-forest-light text-sm font-medium disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update" : "Create Program"}
                </button>
              </div>
            </div>
          )}

          {sectionOrder === "normal" ? (
            <>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
                {filtered.length === 0 ? (
                  <div className="p-12 text-center"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{search ? "No matching programs." : "No programs yet."}</p></div>
                ) : (
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Title</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Slug</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(p => (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900">{p.title}</p>
                              {p.description && <p className="text-xs text-gray-500 truncate max-w-[300px]">{p.description}</p>}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{p.slug}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <Link href={p.id ? `/dashboard/programs/edit?id=${p.id}` : "#"} className="p-1.5 bg-gray-100 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors inline-flex"><Edit3 className="w-4 h-4" /></Link>
                                <button onClick={() => p.id && handleDelete(p.id, p.title)} className="p-1.5 bg-gray-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 -mt-6 mb-6">{filtered.length} program{filtered.length !== 1 ? "s" : ""}</p>

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Enrollments</h2>
                <button onClick={handleSwap} className="text-xs text-mhma-gold hover:text-amber-600 font-medium">Swap order</button>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search enrollments..." value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {filteredEnroll.length === 0 ? (
                  <div className="p-12 text-center"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{enrollSearch ? "No matching enrollments." : "No enrollments yet."}</p></div>
                ) : (
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Contact</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Program</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnroll.map(i => (
                          <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-900">{i.fullName}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <a href={`mailto:${i.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail className="w-3 h-3" /> {i.email}</a>
                                {i.phone && <a href={`tel:${i.phone}`} className="flex items-center gap-1 text-gray-500 hover:underline"><Phone className="w-3 h-3" /> {i.phone}</a>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{i.program || "—"}</td>
                            <td className="px-4 py-3">{statusBadge(i.status)}</td>
                            <td className="px-4 py-3 text-gray-500"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {i.createdAt?.toDate?.()?.toLocaleDateString() || ""}</span></td>
                            <td className="px-4 py-3">
                              <button onClick={() => { if (!confirm("Delete this enrollment?")) return; deleteEnrollment(i.id!).then(() => setEnrollments(prev => prev.filter(x => x.id !== i.id))); }}
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
              <p className="text-xs text-gray-400 mt-4">{filteredEnroll.length} enrollment{filteredEnroll.length !== 1 ? "s" : ""}</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Enrollments</h2>
                <button onClick={handleSwap} className="text-xs text-mhma-gold hover:text-amber-600 font-medium">Swap order</button>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search enrollments..." value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {filteredEnroll.length === 0 ? (
                  <div className="p-12 text-center"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{enrollSearch ? "No matching enrollments." : "No enrollments yet."}</p></div>
                ) : (
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Contact</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Program</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnroll.map(i => (
                          <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-900">{i.fullName}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <a href={`mailto:${i.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail className="w-3 h-3" /> {i.email}</a>
                                {i.phone && <a href={`tel:${i.phone}`} className="flex items-center gap-1 text-gray-500 hover:underline"><Phone className="w-3 h-3" /> {i.phone}</a>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{i.program || "—"}</td>
                            <td className="px-4 py-3">{statusBadge(i.status)}</td>
                            <td className="px-4 py-3 text-gray-500"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {i.createdAt?.toDate?.()?.toLocaleDateString() || ""}</span></td>
                            <td className="px-4 py-3">
                              <button onClick={() => { if (!confirm("Delete this enrollment?")) return; deleteEnrollment(i.id!).then(() => setEnrollments(prev => prev.filter(x => x.id !== i.id))); }}
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
              <p className="text-xs text-gray-400 mb-6">{filteredEnroll.length} enrollment{filteredEnroll.length !== 1 ? "s" : ""}</p>

              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
                {filtered.length === 0 ? (
                  <div className="p-12 text-center"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{search ? "No matching programs." : "No programs yet."}</p></div>
                ) : (
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Title</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Slug</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(p => (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900">{p.title}</p>
                              {p.description && <p className="text-xs text-gray-500 truncate max-w-[300px]">{p.description}</p>}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{p.slug}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <Link href={p.id ? `/dashboard/programs/edit?id=${p.id}` : "#"} className="p-1.5 bg-gray-100 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors inline-flex"><Edit3 className="w-4 h-4" /></Link>
                                <button onClick={() => p.id && handleDelete(p.id, p.title)} className="p-1.5 bg-gray-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 -mt-6 mb-6">{filtered.length} program{filtered.length !== 1 ? "s" : ""}</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
