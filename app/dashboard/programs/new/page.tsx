"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { addProgram } from "@/lib/firebase";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Navigation from "@/components/Navigation";

export default function NewProgramPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "", slug: "", programTitle: "", programDescription: "",
    programImage: "", programImagePoster: "",
    stat1Label: "Students", stat1Value: "",
    stat2Label: "Days/Week", stat2Value: "",
    stat3Label: "", stat3Value: "",
    stat4Label: "", stat4Value: "",
    additionalContent: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
  }, [authLoading, isBoardMember, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "programImage" | "programImagePoster") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `programs/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytesResumable(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const stats = [
        { label: formData.stat1Label, value: formData.stat1Value },
        { label: formData.stat2Label, value: formData.stat2Value },
        { label: formData.stat3Label, value: formData.stat3Value },
        { label: formData.stat4Label, value: formData.stat4Value },
      ].filter(s => s.label || s.value);

      await addProgram({
        title: formData.title || formData.programTitle,
        slug,
        description: formData.programDescription,
        image: formData.programImage,
        imagePoster: formData.programImagePoster,
        additionalContent: formData.additionalContent,
        stats,
        useHardcodedVersion: false,
        createdBy: "board",
      });
      setSuccess("Program created!");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create program");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="dashboard" />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center text-[#c9a227] hover:text-[#8c7622] mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Program</h1>
          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-800">{error}</p></div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md"><p className="text-sm text-green-800">{success}</p></div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" placeholder="Auto-generated if empty" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Title</label>
              <input type="text" value={formData.programTitle} onChange={e => setFormData({ ...formData, programTitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.programDescription} onChange={e => setFormData({ ...formData, programDescription: e.target.value })} rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, "programImage")}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                {formData.programImage && <img src={formData.programImage} alt="" className="mt-2 h-20 rounded" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poster Image</label>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, "programImagePoster")}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                {formData.programImagePoster && <img src={formData.programImagePoster} alt="" className="mt-2 h-20 rounded" />}
              </div>
            </div>

            <p className="text-sm font-medium text-gray-700">Statistics (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-2">
                  <input type="text" placeholder={`Stat ${i} Label`}
                    value={(formData as any)[`stat${i}Label`]}
                    onChange={e => setFormData({ ...formData, [`stat${i}Label`]: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
                  <input type="text" placeholder={`Stat ${i} Value`}
                    value={(formData as any)[`stat${i}Value`]}
                    onChange={e => setFormData({ ...formData, [`stat${i}Value`]: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Content (HTML)</label>
              <textarea value={formData.additionalContent} onChange={e => setFormData({ ...formData, additionalContent: e.target.value })} rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none font-mono text-sm" />
            </div>

            <button type="submit" disabled={saving || uploadingImage}
              className="w-full bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-3 px-6 rounded transition-colors disabled:opacity-50">
              {uploadingImage ? "Uploading image..." : saving ? "Saving..." : "Create Program"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
