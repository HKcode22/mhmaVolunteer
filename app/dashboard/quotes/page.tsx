"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, Plus, Quote as QuoteIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchQuotes, addQuote, deleteQuote, Quote } from "@/lib/firebase";
import Navigation from "@/components/Navigation";

export default function QuotesPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    loadQuotes();
  }, [authLoading, isBoardMember, router]);

  const loadQuotes = async () => {
    try {
      const data = await fetchQuotes();
      setQuotes(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !author.trim()) { setError("Both text and author are required."); return; }
    setSaving(true); setError("");
    try {
      await addQuote({ text: text.trim(), author: author.trim() });
      setText(""); setAuthor(""); setShowForm(false);
      loadQuotes();
    } catch (err: any) {
      setError(err.message || "Failed to save quote");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quote?")) return;
    try {
      await deleteQuote(id);
      setQuotes(q => q.filter(x => x.id !== id));
    } catch { /* ignore */ }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-mhma-gold" /></div>;

  return (
    <div className="min-h-screen bg-mhma-cream font-sans">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-4 font-semibold">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Quotes</h1>
            <p className="text-gray-500 mt-1">Manage quotes shown on program pages. A random quote is displayed on each program page.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-mhma-gold text-white font-bold rounded-lg hover:bg-mhma-gold-light transition-all">
            <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "Add Quote"}
          </button>
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">New Quote</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Quote Text *</label>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Enter quote text..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Author *</label>
              <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g., Prophet Muhammad (ﷺ)" />
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-mhma-gold text-white font-bold rounded-lg hover:bg-mhma-gold-light disabled:opacity-50 transition-all">
              {saving ? "Saving..." : "Save Quote"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-mhma-gold" /></div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <QuoteIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No custom quotes yet.</p>
            <p className="text-gray-400 text-sm mt-1">Fallback quotes from Islamic tradition will be used.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-mhma-gold font-bold hover:underline">Add your first quote</button>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map(q => (
              <div key={q.id} className="bg-white rounded-xl p-5 border border-gray-200 flex items-start justify-between gap-4">
                <div>
                  <p className="text-gray-800 italic">{q.text}</p>
                  <p className="text-xs text-gray-500 mt-1">— {q.author}</p>
                </div>
                <button onClick={() => q.id && handleDelete(q.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
