"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchProgramById, updateProgram, logActivity, FirebaseProgram } from "@/lib/firebase";
import { uploadImage } from "@/lib/upload";
import Navigation from "@/app/components/Navigation";

function EditProgramForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { user, isBoardMember, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<FirebaseProgram>({ title: "", slug: "", stats: [] });
  const [statFields, setStatFields] = useState<{ label: string; value: string }[]>([
    { label: "Students", value: "" },
    { label: "Days/Week", value: "" },
    { label: "", value: "" },
    { label: "", value: "" },
  ]);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (!authLoading && id) {
      fetchProgramById(id).then(p => {
        if (p) {
          setFormData(p);
          const stats = p.stats || [];
          const fields = [...stats];
          while (fields.length < 4) fields.push({ label: "", value: "" });
          setStatFields(fields.slice(0, 4));
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [authLoading, isBoardMember, id, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "image" | "imagePoster") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (err: any) {
      setError(err.message || "Image upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!formData.title?.trim()) { setError("Title is required."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { id: _ignoreId, ...cleanData } = formData;
      const payload: Record<string, any> = {};
      Object.entries(cleanData).forEach(([k, v]) => { if (v !== undefined) payload[k] = v; });
      payload.slug = slug;
      payload.stats = statFields.filter(s => s.label || s.value);
      await updateProgram(id, payload);
      setSuccess("Program updated! Redirecting...");
      if (user) logActivity({ userId: user.uid, userEmail: user.email || "", userName: user.displayName || user.email || "Board Member", action: "program_update", details: `Updated program: ${formData.title}`, targetType: "program", targetId: id });
      setTimeout(() => router.push("/dashboard"), 1500);
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
          <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-[#8c7622] mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Program</h1>
          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-800">{error}</p></div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md"><p className="text-sm text-green-800">{success}</p></div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mhma-gold outline-none" />
                <p className="text-xs text-amber-600 mt-1">Title is required — without it, the program cannot be viewed on the site.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input type="text" value={formData.slug || ""} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mhma-gold outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mhma-gold outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-mhma-gold transition-colors text-sm">
                      <Upload className="w-3 h-3" />
                      <span>{uploading === "image" ? "Uploading..." : "Upload"}</span>
                      <input type="file" accept="image/*" onChange={e => handleFileUpload(e, "image")} disabled={uploading !== null} className="hidden" />
                    </label>
                    {uploading === "image" && <Loader2 className="w-3 h-3 mt-1 animate-spin text-mhma-gold" />}
                  </div>
                  <input type="url" value={formData.image || ""} onChange={e => setFormData({ ...formData, image: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mhma-gold outline-none text-sm"
                    placeholder="Or paste URL" />
                </div>
                {formData.image && <img src={formData.image} alt="Program image preview" className="mt-2 h-20 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poster Image</label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-mhma-gold transition-colors text-sm">
                      <Upload className="w-3 h-3" />
                      <span>{uploading === "imagePoster" ? "Uploading..." : "Upload"}</span>
                      <input type="file" accept="image/*" onChange={e => handleFileUpload(e, "imagePoster")} disabled={uploading !== null} className="hidden" />
                    </label>
                    {uploading === "imagePoster" && <Loader2 className="w-3 h-3 mt-1 animate-spin text-mhma-gold" />}
                  </div>
                  <input type="url" value={formData.imagePoster || ""} onChange={e => setFormData({ ...formData, imagePoster: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mhma-gold outline-none text-sm"
                    placeholder="Or paste URL" />
                </div>
                {formData.imagePoster && <img src={formData.imagePoster} alt="Program poster preview" className="mt-2 h-20 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-700">Statistics (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex gap-2">
                  <input type="text" placeholder={`Stat ${i + 1} Label`}
                    value={statFields[i]?.label || ""}
                    onChange={e => {
                      const updated = [...statFields];
                      updated[i] = { ...updated[i], label: e.target.value };
                      setStatFields(updated);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mhma-gold outline-none" />
                  <input type="text" placeholder={`Stat ${i + 1} Value`}
                    value={statFields[i]?.value || ""}
                    onChange={e => {
                      const updated = [...statFields];
                      updated[i] = { ...updated[i], value: e.target.value };
                      setStatFields(updated);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mhma-gold outline-none" />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Layout</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="layout" value="text_first" checked={(formData.layout || "text_first") === "text_first"} onChange={() => setFormData({ ...formData, layout: "text_first" })} />
                  <span className="text-sm">Text before poster image</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="layout" value="poster_first" checked={formData.layout === "poster_first"} onChange={() => setFormData({ ...formData, layout: "poster_first" })} />
                  <span className="text-sm">Poster image before text</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Text</label>
                <textarea value={formData.quote || ""} onChange={e => setFormData({ ...formData, quote: e.target.value })} rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mhma-gold outline-none" placeholder="Optional testimonial text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Author</label>
                <input type="text" value={formData.quoteAuthor || ""} onChange={e => setFormData({ ...formData, quoteAuthor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mhma-gold outline-none" placeholder="e.g., Prophet Muhammad (ﷺ)" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Content (HTML)</label>
              <textarea value={formData.additionalContent || ""} onChange={e => setFormData({ ...formData, additionalContent: e.target.value })} rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mhma-gold outline-none font-mono text-sm" />
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-mhma-gold hover:bg-mhma-gold-light text-white font-semibold py-3 px-6 rounded transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Update Program"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function EditProgramPage() {
  return <Suspense fallback={<div className="pt-32 text-center"><p className="text-gray-500">Loading...</p></div>}><EditProgramForm /></Suspense>;
}
