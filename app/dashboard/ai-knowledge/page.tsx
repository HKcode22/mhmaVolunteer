"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Trash2, Edit3, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  fetchKnowledgeDocs,
  addKnowledgeDoc,
  updateKnowledgeDoc,
  deleteKnowledgeDoc,
  KnowledgeDoc,
} from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

const CATEGORIES = ["general", "event", "program", "donation", "news", "auth", "dashboard", "faq", "route", "workflow", "account"];

const ROLE_OPTIONS = ["member", "board_member", "administrator"] as const;

const EMPTY_FORM = {
  type: "static" as const,
  category: "general",
  question: "",
  answer: "",
  keywords: "",
  source: "assistant-knowledge.ts",
  roleAccess: [] as string[],
};

export default function KnowledgeManagerPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [items, setItems] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KnowledgeDoc | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    fetchKnowledgeDocs(200).then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchesSearch = !q || i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q) || i.keywords.some(k => k.toLowerCase().includes(q));
    const matchesCategory = !filterCategory || i.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (item: KnowledgeDoc) => {
    setForm({
      type: "static",
      category: item.category || "general",
      question: item.question,
      answer: item.answer,
      keywords: (item.keywords || []).join(", "),
      source: item.source || "",
      roleAccess: item.roleAccess || [],
    });
    setEditing(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      const data = {
        type: "static" as const,
        category: form.category,
        question: form.question.trim(),
        answer: form.answer.trim(),
        keywords: form.keywords.split(",").map(k => k.trim()).filter(Boolean),
        source: form.source.trim() || "assistant-knowledge.ts",
        roleAccess: form.roleAccess.length > 0 ? form.roleAccess : ["member", "board_member", "administrator"],
      };

      if (editing?.id) {
        await updateKnowledgeDoc(editing.id, data);
      } else {
        await addKnowledgeDoc(data);
      }

      resetForm();
      const updated = await fetchKnowledgeDocs(200);
      setItems(updated);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`Delete "${question}"?`)) return;
    await deleteKnowledgeDoc(id);
    setItems(prev => prev.filter(x => x.id !== id));
  };

  const toggleRole = (role: string) => {
    setForm(prev => ({
      ...prev,
      roleAccess: prev.roleAccess.includes(role)
        ? prev.roleAccess.filter(r => r !== role)
        : [...prev.roleAccess, role],
    }));
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Knowledge Base</h1>
              <p className="text-gray-500 text-sm">Knowledge entries used by the AI assistant to answer member questions.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light transition-colors font-medium text-sm">
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </div>

          {showForm && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">{editing ? "Edit Entry" : "New Knowledge Entry"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Question *</label>
                  <input type="text" value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="How do I create an event?" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Answer *</label>
                  <textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="Go to Dashboard → Events..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
                  <input type="text" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="assistant-knowledge.ts" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Keywords (comma-separated)</label>
                  <input type="text" value={form.keywords} onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" placeholder="create event, add event, new event" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-2">Role Access</label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map(role => (
                      <button key={role} onClick={() => toggleRole(role)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.roleAccess.includes(role) ? "bg-mhma-forest text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {role.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.question.trim() || !form.answer.trim()}
                  className="px-4 py-2 bg-mhma-forest text-white rounded-lg hover:bg-mhma-forest-light text-sm font-medium disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update Entry" : "Save Entry"}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search questions, answers, or keywords..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{search || filterCategory ? "No matching entries." : "No knowledge entries yet. Sync from the TypeScript file or add one manually."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-8 px-2 py-3"></th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Question</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Roles</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => {
                      const isExpanded = expandedId === item.id;
                      return (
                        <Fragment key={item.id}>
                          <tr
                            className="border-b border-gray-100 dashboard-row cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : item.id || null)}
                          >
                            <td className="w-8 px-2 py-3">
                              <button onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : item.id || null); }} className="p-1 hover:bg-gray-100 rounded transition-colors">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900 max-w-[350px] truncate">{item.question}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium">{item.category}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {(item.roleAccess || []).map(r => (
                                  <span key={r} className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                                    r === "administrator" ? "bg-purple-100 text-purple-700" :
                                    r === "board_member" ? "bg-amber-100 text-amber-700" :
                                    "bg-green-100 text-green-700"
                                  }`}>{r.replace("_", " ")}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                  className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.id) handleDelete(item.id, item.question);
                                }} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${item.id}-detail`}>
                              <td colSpan={5} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="md:col-span-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Question</h4>
                                    <p className="text-sm text-gray-700">{item.question}</p>
                                  </div>
                                  <div className="md:col-span-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Answer</h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.answer}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ID</h4>
                                    <p className="text-sm text-gray-700 font-mono">{item.id}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Source</h4>
                                    <p className="text-sm text-gray-700">{item.source || "—"}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Type</h4>
                                    <p className="text-sm text-gray-700">{item.type}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</h4>
                                    <p className="text-sm text-gray-700">{item.category}</p>
                                  </div>
                                  <div className="md:col-span-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Keywords</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {(item.keywords || []).map(k => (
                                        <span key={k} className="inline-block px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">{k}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="md:col-span-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role Access</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {(item.roleAccess || []).map(r => (
                                        <span key={r} className="inline-block px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">{r}</span>
                                      ))}
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
          <p className="text-xs text-gray-400 mt-4">{filtered.length} entry{filtered.length !== 1 ? "ies" : "y"}</p>
        </div>
      </main>
    </div>
  );
}
