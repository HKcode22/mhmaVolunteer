"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, Mail, Phone, Clock, MessageSquare, CheckCircle, Eye,
  ChevronDown, ChevronRight, Plus, Trash2, ChevronUp, XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  fetchContactSubmissions, markContactSubmissionRead, deleteContactSubmission,
  FirebaseContactSubmission, fetchFAQs, addFAQ, updateFAQ, deleteFAQ, FAQItem,
  fetchVolunteers, deleteVolunteer, VolunteerSubmission,
} from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardContactSubmissionsPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FirebaseContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqSearch, setFaqSearch] = useState("");
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "", order: 0, active: true });
  const [faqSaving, setFaqSaving] = useState(false);
  const [volunteers, setVolunteers] = useState<VolunteerSubmission[]>([]);
  const [volunteerSearch, setVolunteerSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    loadAll();
  }, [authLoading, isBoardMember, router]);

  const loadAll = async () => {
    try {
      const [c, f, v] = await Promise.all([fetchContactSubmissions(100), fetchFAQs(100), fetchVolunteers(100)]);
      setItems(c);
      setFaqItems(f);
      setVolunteers(v);
    } catch { /* ignore */ }
    setLoading(false);
    setFaqLoading(false);
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || i.subject.toLowerCase().includes(q);
  });
  const unreadCount = items.filter(i => !i.read).length;

  const handleBulkMarkRead = async () => {
    const unread = items.filter(i => i.id && !i.read);
    if (unread.length === 0) return;
    await Promise.allSettled(unread.map(i => markContactSubmissionRead(i.id!)));
    const refreshed = await fetchContactSubmissions();
    setItems(refreshed);
  };

  const filteredFaqs = faqItems.filter(i => {
    const q = faqSearch.toLowerCase();
    return !q || i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q) || (i.category || "").toLowerCase().includes(q);
  });

  const resetFaqForm = () => {
    setFaqForm({ question: "", answer: "", category: "", order: 0, active: true });
    setEditingFaqId(null);
    setShowFaqForm(false);
  };

  const handleFaqEdit = (item: FAQItem) => {
    setFaqForm({
      question: item.question,
      answer: item.answer,
      category: item.category || "",
      order: item.order || 0,
      active: item.active !== false,
    });
    setEditingFaqId(item.id || null);
    setShowFaqForm(true);
  };

  const handleFaqSave = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
    setFaqSaving(true);
    try {
      if (editingFaqId) await updateFAQ(editingFaqId, faqForm);
      else await addFAQ(faqForm);
      resetFaqForm();
      const f = await fetchFAQs(100);
      setFaqItems(f);
    } finally {
      setFaqSaving(false);
    }
  };

  const handleFaqDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await deleteFAQ(id);
    setFaqItems(prev => prev.filter(x => x.id !== id));
  };

  const moveFaqOrder = async (id: string, dir: "up" | "down") => {
    const idx = faqItems.findIndex(i => i.id === id);
    if (idx === -1) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= faqItems.length) return;
    const a = faqItems[idx];
    const b = faqItems[swapIdx];
    await Promise.all([
      updateFAQ(id, { order: b.order || 0 }),
      updateFAQ(b.id!, { order: a.order || 0 }),
    ]);
    const f = await fetchFAQs(100);
    setFaqItems(f);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact &amp; FAQ</h1>
          <p className="text-gray-500 mb-6 text-sm">
            Contact form submissions and FAQ entries shown on{" "}
            <Link href="/contact/faq" className="text-mhma-forest hover:text-mhma-gold underline">/contact/faq</Link>.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Submissions{unreadCount > 0 && <span className="text-sm font-normal text-amber-600 ml-2">({unreadCount} unread)</span>}</h2>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or subject..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>
          {unreadCount > 0 && (
            <div className="mb-4 flex justify-end">
              <button onClick={handleBulkMarkRead} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">
                Mark All Read ({unreadCount})
              </button>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center"><MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{search ? "No matching submissions." : "No contact submissions yet."}</p></div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <th className="w-8 px-2 py-3"></th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Contact</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Subject</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Read</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(i => {
                      const isExpanded = expandedId === i.id;
                      return (
                        <React.Fragment key={i.id}>
                          <tr className="border-b border-gray-100">
                            <td className="px-2 py-3">
                              <button onClick={() => setExpandedId(isExpanded ? null : i.id || null)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              </button>
                            </td>
                            <td className={`px-4 py-3 cursor-pointer font-semibold text-gray-900 ${!i.read ? "font-bold" : ""}`} onClick={() => setExpandedId(isExpanded ? null : i.id || null)}>{i.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <a href={`mailto:${i.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail className="w-3 h-3" /> {i.email}</a>
                                {i.phone && <a href={`tel:${i.phone}`} className="flex items-center gap-1 text-gray-500 hover:underline"><Phone className="w-3 h-3" /> {i.phone}</a>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{i.subject}</td>
                            <td className="px-4 py-3">{i.read ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Eye className="w-4 h-4 text-amber-500" />}</td>
                            <td className="px-4 py-3 text-gray-500"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {i.createdAt?.toDate?.()?.toLocaleDateString() || ""}</span></td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {!i.read && (
                                  <button onClick={() => markContactSubmissionRead(i.id!).then(() => setItems(prev => prev.map(x => x.id === i.id ? { ...x, read: true } : x)))}
                                    className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Mark as read">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button onClick={() => { if (!confirm("Delete this submission?")) return; deleteContactSubmission(i.id!).then(() => setItems(prev => prev.filter(x => x.id !== i.id))); }}
                                  className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-100">{i.message}</p>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4 mb-12">{filtered.length} submission{filtered.length !== 1 ? "s" : ""}</p>

          {/* Volunteer Submissions */}
          <div className="border-t border-gray-200 pt-10 mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Volunteer Submissions</h2>
                <p className="text-gray-500 text-sm">People who submitted volunteer forms.</p>
              </div>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name, email..." value={volunteerSearch} onChange={e => setVolunteerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {volunteers.length === 0 ? (
                <div className="p-12 text-center"><p className="text-gray-500">No volunteer submissions yet.</p></div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <th className="w-8 px-2 py-3"></th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Phone</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Availability</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Interests</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volunteers.filter(v => {
                        const q = volunteerSearch.toLowerCase();
                        return !q || v.firstName.toLowerCase().includes(q) || v.lastName.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
                      }).map(v => (
                        <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-2 py-3">
                            <button onClick={() => setExpandedId(expandedId === `vol-${v.id}` ? null : `vol-${v.id}`)} className="p-1 text-gray-400 hover:text-gray-700">
                              {expandedId === `vol-${v.id}` ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{v.firstName} {v.lastName}</td>
                          <td className="px-4 py-3"><a href={`mailto:${v.email}`} className="text-blue-600 hover:underline">{v.email}</a></td>
                          <td className="px-4 py-3"><a href={`tel:${v.phone}`} className="text-blue-600 hover:underline">{v.phone}</a></td>
                          <td className="px-4 py-3 text-gray-700 capitalize">{v.availability?.replace(/-/g, " ")}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {v.interests?.slice(0, 2).map(i => <span key={i} className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">{i}</span>)}
                              {(v.interests?.length || 0) > 2 && <span className="text-[11px] text-gray-400">+{v.interests!.length - 2}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => v.id && deleteVolunteer(v.id).then(() => setVolunteers(prev => prev.filter(x => x.id !== v.id)))}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                      {expandedId?.startsWith("vol-") && (() => {
                        const v = volunteers.find(x => `vol-${x.id}` === expandedId);
                        if (!v) return null;
                        return (
                          <tr key={`exp-${v.id}`}>
                            <td colSpan={7} className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                              <div className="text-sm text-gray-600">
                                {v.message && <p className="mb-1"><strong>Message:</strong> {v.message}</p>}
                                <p className="text-xs text-gray-400">Submitted {v.createdAt?.toDate?.()?.toLocaleDateString() || "recently"}</p>
                              </div>
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4">{volunteers.length} volunteer submission{volunteers.length !== 1 ? "s" : ""}</p>
          </div>

          {/* FAQ management */}
          <div className="border-t border-gray-200 pt-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">FAQ</h2>
                <p className="text-gray-500 text-sm">Manage questions shown on the public FAQ page.</p>
              </div>
              <button onClick={() => showFaqForm ? resetFaqForm() : setShowFaqForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light transition-colors font-medium text-sm">
                <Plus className="w-4 h-4" /> {editingFaqId ? "Cancel" : "Add FAQ"}
              </button>
            </div>

            {showFaqForm && (
              <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">{editingFaqId ? "Edit FAQ" : "New FAQ"}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Question *</label>
                    <input type="text" value={faqForm.question} onChange={e => setFaqForm(p => ({ ...p, question: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Answer *</label>
                    <textarea value={faqForm.answer} onChange={e => setFaqForm(p => ({ ...p, answer: e.target.value }))} rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                      <input type="text" value={faqForm.category} onChange={e => setFaqForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Display Order</label>
                      <input type="number" min="0" value={faqForm.order} onChange={e => setFaqForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={faqForm.active} onChange={e => setFaqForm(p => ({ ...p, active: e.target.checked }))}
                      className="rounded border-gray-300 text-mhma-gold focus:ring-mhma-gold" />
                    <span className="text-xs text-gray-600">Active (visible on public FAQ page)</span>
                  </label>
                  <div className="flex justify-end gap-2">
                    <button onClick={resetFaqForm} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                    <button onClick={handleFaqSave} disabled={faqSaving || !faqForm.question.trim() || !faqForm.answer.trim()}
                      className="px-4 py-2 bg-mhma-forest text-white rounded-lg text-sm font-medium disabled:opacity-50">
                      {faqSaving ? "Saving..." : editingFaqId ? "Update FAQ" : "Save FAQ"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search FAQs..." value={faqSearch} onChange={e => setFaqSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {faqLoading ? (
                <div className="p-12 text-center text-gray-500 text-sm">Loading FAQs...</div>
              ) : filteredFaqs.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">{faqSearch ? "No matching FAQs." : "No FAQs yet."}</div>
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
                      {filteredFaqs.map((item, i) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center gap-0.5">
                              <button onClick={() => moveFaqOrder(item.id!, "up")} disabled={i === 0} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                              <span className="text-xs text-gray-500">{item.order || 0}</span>
                              <button onClick={() => moveFaqOrder(item.id!, "down")} disabled={i === filteredFaqs.length - 1} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{item.question}</p>
                            <p className="text-xs text-gray-500 truncate max-w-md">{item.answer}</p>
                          </td>
                          <td className="px-4 py-3">{item.category && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.category}</span>}</td>
                          <td className="px-4 py-3">{item.active !== false ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => handleFaqEdit(item)} className="p-1.5 bg-gray-100 text-blue-600 rounded-lg hover:bg-blue-50 text-xs font-medium">Edit</button>
                              <button onClick={() => handleFaqDelete(item.id!)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              {filteredFaqs.length} FAQ{filteredFaqs.length !== 1 ? "s" : ""}. Add MHMA&apos;s 501(c)(3) EIN in a tax-related answer, or set{" "}
              <code className="text-[11px]">NEXT_PUBLIC_MHMA_EIN</code> in env for the public FAQ footer.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
