"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Clock, CheckCircle, XCircle, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchFAQs, addFAQ, updateFAQ, deleteFAQ, FAQItem } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardFAQPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "", order: 0, active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    loadFAQs();
  }, [authLoading, isBoardMember, router]);

  const loadFAQs = async () => {
    try {
      const data = await fetchFAQs(100);
      setItems(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setForm({ question: "", answer: "", category: "", order: 0, active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item: FAQItem) => {
    setForm({ question: item.question, answer: item.answer, category: item.category || "", order: item.order || 0, active: item.active });
    setEditingId(item.id || null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateFAQ(editingId, form);
      } else {
        await addFAQ(form);
      }
      resetForm();
      await loadFAQs();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await deleteFAQ(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch { /* ignore */ }
  };

  const moveOrder = async (id: string, dir: "up" | "down") => {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const a = items[idx];
    const b = items[swapIdx];
    const aOrder = a.order || 0;
    const bOrder = b.order || 0;
    await Promise.all([
      updateFAQ(id, { order: bOrder }),
      updateFAQ(b.id!, { order: aOrder }),
    ]);
    await loadFAQs();
  };

  if (authLoading) return <div className="pt-32 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-4 font-semibold">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">FAQ</h1>
              <p className="text-gray-500 text-sm">Frequently asked questions shown on the construction campaign page.</p>
            </div>
            <button onClick={() => showForm ? resetForm() : setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light transition-colors font-medium text-sm">
              <Plus className="w-4 h-4" /> {editingId ? "Cancel" : "Add FAQ"}
            </button>
          </div>

          {showForm && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">{editingId ? "Edit FAQ" : "New FAQ"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Question *</label>
                  <input type="text" value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="e.g., Is my donation tax-deductible?" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Answer *</label>
                  <textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="Full answer text..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                    <input type="text" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="e.g., Donations, Timeline" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Display Order</label>
                    <input type="number" min="0" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                      className="rounded border-gray-300 text-mhma-gold focus:ring-mhma-gold" />
                    <span className="text-xs text-gray-600">Active (visible on page)</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.question.trim() || !form.answer.trim()}
                    className="px-4 py-2 bg-mhma-forest text-white rounded-lg hover:bg-mhma-forest-light text-sm font-medium disabled:opacity-50">
                    {saving ? "Saving..." : editingId ? "Update FAQ" : "Save FAQ"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search questions, answers, or categories..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center"><Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{search ? "No matching FAQs." : "No FAQs yet."}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 w-8">Order</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Question</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Active</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, i) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-0.5">
                            <button onClick={() => moveOrder(item.id!, "up")} disabled={i === 0} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                            <span className="text-xs text-gray-500">{item.order || 0}</span>
                            <button onClick={() => moveOrder(item.id!, "down")} disabled={i === filtered.length - 1} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{item.question}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{item.answer}</p>
                        </td>
                        <td className="px-4 py-3">
                          {item.category && <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{item.category}</span>}
                        </td>
                        <td className="px-4 py-3">{item.active ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => handleEdit(item)} className="p-1.5 bg-gray-100 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(item.id!)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
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
          <p className="text-xs text-gray-400 mt-4">{filtered.length} FAQ{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </main>
    </div>
  );
}
