"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchEventById, updateEvent, FirebaseEvent } from "@/lib/firebase";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Navigation from "@/components/Navigation";

function EditEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { isBoardMember, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<FirebaseEvent>({ title: "", slug: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (!authLoading && id) {
      fetchEventById(id).then(e => {
        if (e) setFormData(e);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [authLoading, isBoardMember, id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `events/${Date.now()}-${file.name}`);
      const snap = await uploadBytesResumable(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      setFormData(prev => ({ ...prev, poster: url }));
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      await updateEvent(id, formData);
      setSuccess("Event updated!");
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Event</h1>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={formData.date || ""} onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input type="text" value={formData.time || ""} onChange={e => setFormData({ ...formData, time: e.target.value })} placeholder="6:30 PM"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={formData.location || ""} onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RSVP Link</label>
              <input type="url" value={formData.rsvpLink || ""} onChange={e => setFormData({ ...formData, rsvpLink: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poster</label>
              <input type="file" accept="image/*" onChange={handleImageUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
              {formData.poster && <img src={formData.poster} alt="" className="mt-2 h-20 rounded" />}
            </div>
            <button type="submit" disabled={saving || uploading}
              className="w-full bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-3 px-6 rounded transition-colors disabled:opacity-50">
              {uploading ? "Uploading..." : saving ? "Saving..." : "Update Event"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function EditEventPage() {
  return <Suspense fallback={<div className="pt-32 text-center"><p className="text-gray-500">Loading...</p></div>}><EditEventForm /></Suspense>;
}
