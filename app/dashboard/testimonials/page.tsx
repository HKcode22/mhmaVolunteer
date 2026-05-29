"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Clock, Star, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchTestimonials, addTestimonial, updateTestimonial, deleteTestimonial, Testimonial } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardTestimonialsPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", content: "", displayOn: [] as string[], active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    fetchTestimonials(100).then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.content.toLowerCase().includes(q);
  });

  const handleAdd = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await addTestimonial({ name: form.name.trim(), role: form.role.trim() || undefined, content: form.content.trim(), displayOn: form.displayOn, active: form.active });
      setForm({ name: "", role: "", content: "", displayOn: [], active: true });
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

  const pageOptions = ["homepage", "about", "programs", "donate", "contact"];

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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Testimonial Content *</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="What they said..." />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">Show on pages:</label>
                <div className="flex flex-wrap gap-2">
                  {pageOptions.map(p => (
                    <button key={p} onClick={() => togglePage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.displayOn.includes(p) ? "bg-mhma-forest text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
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
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                        <td className="px-4 py-3">{t.active ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}</td>
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
