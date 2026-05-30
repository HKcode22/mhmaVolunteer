"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Edit3, Trash2, CheckCircle, XCircle, Mail, Download } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchAllNews, addNews, updateNews, deleteNews, fetchSubscribers, unsubscribeSubscriber, deleteSubscriber, NewsItem, Subscriber } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardNewsPage() {
  const router = useRouter();
  const { user, isBoardMember, loading: authLoading } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", image: "", authorName: "", published: true });
  const [saving, setSaving] = useState(false);
  const [subSearch, setSubSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    Promise.all([fetchAllNews(100), fetchSubscribers(500)]).then(([n, s]) => {
      setItems(n); setSubscribers(s); setLoading(false);
    }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || i.title.toLowerCase().includes(q) || i.excerpt.toLowerCase().includes(q);
  });

  const filteredSubs = subscribers.filter(s => {
    const q = subSearch.toLowerCase();
    return !q || s.email.includes(q) || (s.name || "").toLowerCase().includes(q) || (s.source || "").includes(q);
  });

  const resetForm = () => {
    setForm({ title: "", slug: "", excerpt: "", content: "", image: "", authorName: "", published: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (item: NewsItem) => {
    setForm({ title: item.title, slug: item.slug, excerpt: item.excerpt, content: item.content, image: item.image || "", authorName: item.authorName || "", published: item.published });
    setEditing(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const data = { title: form.title.trim(), slug, excerpt: form.excerpt.trim(), content: form.content, image: form.image, authorName: form.authorName, published: form.published };
      if (editing?.id) {
        await updateNews(editing.id, data);
      } else {
        await addNews(data);
      }
      resetForm();
      const updated = await fetchAllNews(100);
      setItems(updated);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this news article?")) return;
    await deleteNews(id);
    setItems(prev => prev.filter(x => x.id !== id));
  };

  const handleUnsubscribe = async (id: string) => {
    await unsubscribeSubscriber(id);
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, status: "unsubscribed" } : s));
  };

  const handleDeleteSub = async (id: string) => {
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">News</h1>
              <p className="text-gray-500 text-sm">Manage news articles and newsletter subscribers.</p>
            </div>
            <button onClick={() => showForm ? resetForm() : setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light transition-colors font-medium text-sm">
              <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "Add News"}
            </button>
          </div>

          {showForm && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">{editing ? "Edit News" : "New News Article"}</h2>
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Excerpt *</label>
                <textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Content *</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm font-mono" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                  <input type="url" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Author Name</label>
                  <input type="text" value={form.authorName} onChange={e => setForm(p => ({ ...p, authorName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                </div>
                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))}
                      className="rounded border-gray-300 text-mhma-gold focus:ring-mhma-gold" />
                    <span className="text-xs text-gray-600">Published</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.excerpt.trim() || !form.content.trim()}
                  className="px-4 py-2 bg-mhma-forest text-white rounded-lg hover:bg-mhma-forest-light text-sm font-medium disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update" : "Publish"}
                </button>
              </div>
            </div>
          )}

          {/* News List */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search news..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
            {filtered.length === 0 ? (
              <div className="p-12 text-center"><Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{search ? "No matching news." : "No news articles yet."}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Title</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Published</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(n => (
                      <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[400px]">{n.excerpt}</p>
                        </td>
                        <td className="px-4 py-3">{n.published ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => handleEdit(n)} className="p-1.5 bg-gray-100 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => n.id && handleDelete(n.id)} className="p-1.5 bg-gray-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 -mt-6 mb-6">{filtered.length} article{filtered.length !== 1 ? "s" : ""}</p>

          {/* Subscribers Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Newsletter Subscribers</h2>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-mhma-forest text-white rounded-lg hover:bg-mhma-forest-light text-sm font-semibold transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search subscribers..." value={subSearch} onChange={e => setSubSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filteredSubs.length === 0 ? (
              <div className="p-12 text-center"><Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{subSearch ? "No matching subscribers." : "No subscribers yet."}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Source</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.map(s => (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                              <button onClick={() => handleUnsubscribe(s.id!)} title="Unsubscribe"
                                className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"><XCircle className="w-4 h-4" /></button>
                            )}
                            <button onClick={() => handleDeleteSub(s.id!)} title="Delete"
                              className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4">{filteredSubs.length} subscriber{filteredSubs.length !== 1 ? "s" : ""}</p>
        </div>
      </main>
    </div>
  );
}
