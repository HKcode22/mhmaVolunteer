"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchJournalEntryBySlug, updateJournalEntry, FirebaseJournalEntry } from "@/lib/firebase";
import Navigation from "@/components/Navigation";

function EditJournalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { isBoardMember, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<FirebaseJournalEntry>({ title: "", slug: "" });

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (!authLoading && id) {
      fetchJournalEntryBySlug(id).then(e => {
        if (e) setFormData(e);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [authLoading, isBoardMember, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      await updateJournalEntry(id, formData);
      setSuccess("Journal entry updated!");
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="pt-32 text-center"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="dashboard" />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center text-[#c9a227] hover:text-[#8c7622] mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Journal Entry</h1>
          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-800">{error}</p></div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md"><p className="text-sm text-green-800">{success}</p></div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input type="text" value={formData.slug || ""} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Held On</label>
                <input type="text" value={formData.dateHeldOn || ""} onChange={e => setFormData({ ...formData, dateHeldOn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Published</label>
                <input type="text" value={formData.datePublished || ""} onChange={e => setFormData({ ...formData, datePublished: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
              <textarea value={formData.content || ""} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
              <input type="text" value={formData.attendees || ""} onChange={e => setFormData({ ...formData, attendees: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
            </div>
            <button type="submit" disabled={saving}
              className="w-full bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-3 px-6 rounded transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Update Journal Entry"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function EditJournalPage() {
  return <Suspense fallback={<div className="pt-32 text-center"><p className="text-gray-500">Loading...</p></div>}><EditJournalForm /></Suspense>;
}
