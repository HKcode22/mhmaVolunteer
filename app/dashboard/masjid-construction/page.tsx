"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2, Trash2, Plus, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchMasjidUpdates, addMasjidUpdate, updateMasjidUpdate, deleteMasjidUpdate, FirebaseMasjidUpdate } from "@/lib/firebase";
import { getCachedData } from "@/lib/cache-manager";
import { uploadImage } from "@/lib/upload";
import Navigation from "@/app/components/Navigation";

export default function MasjidConstructionPage() {
  const router = useRouter();
  const { user, isBoardMember, loading: authLoading } = useAuth();
  const [updates, setUpdates] = useState<FirebaseMasjidUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [raisedFromDonations, setRaisedFromDonations] = useState(0);
  const [constructionGoal, setConstructionGoal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [useStripeData, setUseStripeData] = useState(false);
  const [givingTiers, setGivingTiers] = useState<{ name: string; amount: string; description: string }[]>([]);
  const [formData, setFormData] = useState({
    image: "", video: "", caption: "", phase: "", raised: "", goal: "", progressDate: "",
    narrative: "", sqFootage: "", capacity: "", communityImpact: "", brochureUrl: "", visionVideoUrl: "",
    heroType: "image" as "image" | "video" | "none",
  });

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    loadUpdates();
  }, [authLoading, isBoardMember, router]);

  const loadUpdates = async () => {
    try {
      const { data } = await getCachedData('masjidConstruction', () => fetchMasjidUpdates(20));
      setUpdates(data);
      if (data.length > 0) setConstructionGoal(data[0].goal || 0);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/donation-totals").then(r => r.json()).then(d => {
      setRaisedFromDonations(d.constructionTotal || 0);
    }).catch(() => {});
  }, []);

  const resetForm = () => {
    setFormData({ image: "", video: "", caption: "", phase: "", raised: "", goal: "", progressDate: "", narrative: "", sqFootage: "", capacity: "", communityImpact: "", brochureUrl: "", visionVideoUrl: "", heroType: "image" });
    setEditingId(null);
    setUseStripeData(false);
    setGivingTiers([]);
    setShowForm(false);
    setError("");
  };

  useEffect(() => {
    if (useStripeData && raisedFromDonations > 0) {
      setFormData(prev => ({ ...prev, raised: String(raisedFromDonations) }));
    }
  }, [useStripeData, raisedFromDonations]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFormData(prev => ({ ...prev, video: dataUrl }));
      setUploadingVideo(false);
    };
    reader.onerror = () => {
      setError("Video file read failed. Try a smaller file or use YouTube URL.");
      setUploadingVideo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (u: FirebaseMasjidUpdate) => {
    setFormData({
      image: u.image || "",
      video: u.video || "",
      caption: u.caption || "",
      phase: u.phase || "",
      raised: String(u.raised || 0),
      goal: String(u.goal || 0),
      progressDate: u.progressDate || "",
      narrative: u.narrative || "",
      sqFootage: u.sqFootage ? String(u.sqFootage) : "",
      capacity: u.capacity ? String(u.capacity) : "",
      communityImpact: u.communityImpact || "",
      brochureUrl: u.brochureUrl || "",
      visionVideoUrl: u.visionVideoUrl || "",
      heroType: u.heroType || "image",
    });
    setGivingTiers((u.givingTiers || []).map(t => ({ name: t.name || "", amount: String(t.amount || 0), description: t.description || "" })));
    setEditingId(u.id || null);
    setShowForm(true);
    setError("");
  };

  const toEmbedUrl = (url: string): string => {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
      if (u.hostname.includes("youtube.com")) {
        if (u.pathname === "/watch" && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
        if (u.pathname.startsWith("/embed/")) return url;
      }
    } catch {}
    return url;
  };

  const parseAmount = (val: string): number => {
    const s = val.trim().replace(/,/g, "").toUpperCase();
    if (s.endsWith("M")) return parseFloat(s) * 1000000;
    if (s.endsWith("K")) return parseFloat(s) * 1000;
    return parseFloat(s) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    setSaving(true);
    setError("");
    try {
      const data = {
        image: formData.image,
        video: toEmbedUrl(formData.video),
        caption: formData.caption,
        phase: formData.phase,
        raised: parseAmount(formData.raised),
        goal: parseAmount(formData.goal),
        progressDate: formData.progressDate || new Date().toISOString().split("T")[0],
        createdBy: user?.uid,
        narrative: formData.narrative || "",
        sqFootage: formData.sqFootage ? parseFloat(formData.sqFootage) : 0,
        capacity: formData.capacity ? parseFloat(formData.capacity) : 0,
        communityImpact: formData.communityImpact || "",
        brochureUrl: formData.brochureUrl || "",
        visionVideoUrl: toEmbedUrl(formData.visionVideoUrl) || "",
        givingTiers: givingTiers.filter(t => t.name && parseFloat(t.amount) > 0).map(t => ({
          name: t.name,
          amount: parseFloat(t.amount) || 0,
          description: t.description || undefined,
        })),
        heroType: formData.heroType,
      };
      if (editingId) {
        await updateMasjidUpdate(editingId, data);
      } else {
        await addMasjidUpdate(data);
      }
      resetForm();
      loadUpdates();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this progress update?")) return;
    try {
      await deleteMasjidUpdate(id);
      loadUpdates();
    } catch { /* ignore */ }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-mhma-gold" /></div>;
  }

  return (
    <div className="min-h-screen bg-mhma-cream font-sans">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-4 font-semibold">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Masjid Construction</h1>
            <p className="text-gray-500 mt-1">Manage progress updates, photos, videos, and fundraising stats.</p>
          </div>
          <button onClick={() => showForm ? resetForm() : setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-mhma-gold text-white font-bold rounded-lg hover:bg-mhma-gold-light transition-all">
            <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "Add Update"}
          </button>
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Total Raised for Construction</h2>
            <span className="text-xs text-gray-400">from completed donations</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-mhma-gold">${raisedFromDonations.toLocaleString()}</span>
            {constructionGoal > 0 && <span className="text-gray-500 text-lg">/ ${constructionGoal.toLocaleString()}</span>}
          </div>
          {constructionGoal > 0 && (
            <div className="w-full bg-gray-100 rounded-full h-3 mt-3 overflow-hidden">
              <div className="bg-mhma-gold h-full rounded-full" style={{ width: `${Math.min((raisedFromDonations / constructionGoal) * 100, 100)}%` }}></div>
            </div>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{editingId ? "Edit Update" : "New Update"}</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Image</label>
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="text-sm" />
                {uploading && <Loader2 className="w-4 h-4 animate-spin text-mhma-gold" />}
              </div>
              {formData.image && <img src={formData.image} alt="Preview" className="mt-2 w-32 h-24 object-cover rounded-lg" />}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Video</label>
              <div className="flex flex-col gap-2">
                <input type="url" value={formData.video} onChange={e => setFormData(p => ({ ...p, video: e.target.value }))} placeholder="Paste any YouTube URL (youtu.be/..., watch?v=...)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Or upload from computer:</span>
                  <input type="file" accept="video/*" onChange={handleVideoFileUpload} className="text-sm" />
                  {uploadingVideo && <Loader2 className="w-4 h-4 animate-spin text-mhma-gold" />}
                </div>
                <p className="text-xs text-gray-400">Uploaded video is stored as Base64 in Firestore (larger files may be rejected if they exceed the 1MB document size limit).</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Show on Homepage Hero</label>
              <div className="flex flex-wrap gap-3">
                {(["image", "video", "none"] as const).map(type => (
                  <label key={type} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                    formData.heroType === type
                      ? "border-mhma-forest bg-mhma-forest text-white"
                      : "border-gray-200 text-gray-700 hover:border-mhma-forest/30"
                  }`}>
                    <input type="radio" name="heroType" value={type} checked={formData.heroType === type}
                      onChange={() => setFormData(p => ({ ...p, heroType: type }))} className="sr-only" />
                    {type === "image" ? "Show Image" : type === "video" ? "Show Video" : "Show Neither"}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formData.heroType === "image" ? "The image above will be shown on the homepage hero." :
                 formData.heroType === "video" ? "The video URL above will be shown on the homepage hero." :
                 "Neither image nor video will appear on the homepage. The SVG illustration will be used."}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Caption</label>
                <input type="text" value={formData.caption} onChange={e => setFormData(p => ({ ...p, caption: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phase</label>
                <input type="text" value={formData.phase} onChange={e => setFormData(p => ({ ...p, phase: e.target.value }))} placeholder="e.g., Phase 1: Foundation" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Raised ($)</label>
                <div className="flex items-center gap-3">
                  <input type="text" value={formData.raised} onChange={e => setFormData(p => ({ ...p, raised: e.target.value }))} disabled={useStripeData}
                    placeholder={useStripeData ? "Auto-filled from Stripe" : "e.g., 500,000 or 500K or 0.5M"}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500" />
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
                    <input type="checkbox" checked={useStripeData} onChange={e => setUseStripeData(e.target.checked)}
                      className="rounded border-gray-300 text-mhma-gold focus:ring-mhma-gold" />
                    Use Stripe
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Goal ($)</label>
                <input type="text" value={formData.goal} onChange={e => setFormData(p => ({ ...p, goal: e.target.value }))} placeholder="e.g., 20,000,000 or 20M" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            {/* Project Overview */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="text-md font-bold text-gray-900 mb-3">Project Overview</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Narrative</label>
                  <textarea value={formData.narrative} onChange={e => setFormData(p => ({ ...p, narrative: e.target.value }))} rows={3}
                    placeholder="Brief narrative about why the masjid is needed, community growth, etc."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Sq Footage</label>
                    <input type="number" min="0" value={formData.sqFootage} onChange={e => setFormData(p => ({ ...p, sqFootage: e.target.value }))}
                      placeholder="e.g., 25000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Capacity</label>
                    <input type="number" min="0" value={formData.capacity} onChange={e => setFormData(p => ({ ...p, capacity: e.target.value }))}
                      placeholder="e.g., 800" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Community Impact</label>
                    <input type="text" value={formData.communityImpact} onChange={e => setFormData(p => ({ ...p, communityImpact: e.target.value }))}
                      placeholder="e.g., Serving 500+ families" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Brochure URL</label>
                    <input type="url" value={formData.brochureUrl} onChange={e => setFormData(p => ({ ...p, brochureUrl: e.target.value }))}
                      placeholder="https://example.com/brochure.pdf" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Vision Video URL</label>
                    <input type="url" value={formData.visionVideoUrl} onChange={e => setFormData(p => ({ ...p, visionVideoUrl: e.target.value }))}
                      placeholder="Paste any YouTube URL (youtu.be/..., watch?v=...)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Giving Tiers */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="text-md font-bold text-gray-900 mb-3">Giving Tiers</h3>
              <p className="text-xs text-gray-500 mb-3">Tiers displayed on the campaign page (e.g., Platinum $50K+, Gold $25K+).</p>
              {givingTiers.map((tier, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tier Name</label>
                    <input type="text" value={tier.name} onChange={e => { const t = [...givingTiers]; t[i].name = e.target.value; setGivingTiers(t); }}
                      placeholder="Platinum" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Amount ($)</label>
                    <input type="number" min="0" value={tier.amount} onChange={e => { const t = [...givingTiers]; t[i].amount = e.target.value; setGivingTiers(t); }}
                      placeholder="50000" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <input type="text" value={tier.description} onChange={e => { const t = [...givingTiers]; t[i].description = e.target.value; setGivingTiers(t); }}
                      placeholder="Optional description" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  <button type="button" onClick={() => setGivingTiers(givingTiers.filter((_, j) => j !== i))}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setGivingTiers([...givingTiers, { name: "", amount: "", description: "" }])}
                className="text-sm text-mhma-gold font-semibold hover:text-amber-600 transition-colors">
                + Add Tier
              </button>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" disabled={saving || uploading} className="px-6 py-2.5 bg-mhma-gold text-white font-bold rounded-lg hover:bg-mhma-gold-light disabled:opacity-50 transition-all">
                {saving ? "Saving..." : (editingId ? "Update Construction" : "Save Update")}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-mhma-gold" /></div>
        ) : updates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No progress updates yet.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-mhma-gold font-bold hover:underline">Add your first update</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {updates.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                {u.video ? (
                  <div className="relative w-full aspect-video bg-black">
                    {u.video.startsWith("data:") ? (
                      <video src={u.video} className="w-full h-full object-contain" controls />
                    ) : (
                      <iframe src={u.video} className="absolute inset-0 w-full h-full" allowFullScreen></iframe>
                    )}
                  </div>
                ) : u.image ? (
                  <img src={u.image} alt={u.caption} className="w-full h-48 object-cover" />
                ) : null}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    {u.phase && <span className="text-xs font-bold text-mhma-gold uppercase tracking-wider">{u.phase}</span>}
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(u)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => u.id && handleDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {u.caption && <p className="text-gray-700 text-sm mb-3">{u.caption}</p>}
                  {(u.raised > 0 || u.goal > 0) && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>${u.raised.toLocaleString()} raised</span>
                        <span>Goal: ${u.goal.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-mhma-gold h-full rounded-full" style={{ width: `${Math.min((u.raised / u.goal) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-3">{u.progressDate || ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
