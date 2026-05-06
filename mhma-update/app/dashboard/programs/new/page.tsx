"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  Facebook,
  Instagram,
  Menu,
  X,
  Twitter,
  Linkedin,
  Youtube,
  ArrowLeft,
  Save,
  User,
  LogOut,
} from "lucide-react";

interface FormData {
  title: string;
  content: string;
  slug: string;
  programTitle: string;
  programDescription: string;
  programImage: string;
  programImagePoster: string;
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  stat3Label: string;
  stat3Value: string;
  stat4Label: string;
  stat4Value: string;
  additionalContent: string;
}

export default function NewProgramPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    slug: "",
    programTitle: "",
    programDescription: "",
    programImage: "",
    programImagePoster: "",
    stat1Label: "Students",
    stat1Value: "",
    stat2Label: "Days/Week",
    stat2Value: "",
    stat3Label: "",
    stat3Value: "",
    stat4Label: "",
    stat4Value: "",
    additionalContent: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPosterImage, setUploadingPosterImage] = useState(false);
  const [programImageId, setProgramImageId] = useState<number | null>(null);
  const [programImagePosterId, setProgramImagePosterId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    const userRole = localStorage.getItem("user_role");
    setIsLoggedIn(!!token);
    if (!token) {
      router.push("/login");
      return;
    }
    const isBoardMember = userRole === "board_member" || userRole === "administrator";
    if (!isBoardMember) {
      router.push("/");
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Starting image upload:", file.name);
    setUploadingImage(true);
    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading to WordPress media API...");
      const response = await fetch(`${WP_API_URL}/wp/v2/media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Image upload response status:", response.status);
      const data = await response.json();
      console.log("Image upload response data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image");
      }

      console.log("Setting programImageId to:", data.id);
      setProgramImageId(data.id);
      setFormData((prev) => ({ ...prev, programImage: data.source_url }));
    } catch (err) {
      console.error("Image upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePosterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Starting poster image upload:", file.name);
    setUploadingPosterImage(true);
    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading poster to WordPress media API...");
      const response = await fetch(`${WP_API_URL}/wp/v2/media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Poster image upload response status:", response.status);
      const data = await response.json();
      console.log("Poster image upload response data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload poster image");
      }

      console.log("Setting programImagePosterId to:", data.id);
      setProgramImagePosterId(data.id);
      setFormData((prev) => ({ ...prev, programImagePoster: data.source_url }));
    } catch (err) {
      console.error("Poster image upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload poster image");
    } finally {
      setUploadingPosterImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      // Create new program page
      const response = await fetch(`${WP_API_URL}/wp/v2/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, "-"),
          status: "publish",
          parent: 70, // Programs page ID
          acf: {
            program_title: formData.programTitle,
            program_description: formData.programDescription,
            program_image: programImageId,
            program_image_poster: programImagePosterId,
            stat_1_label: formData.stat1Label,
            stat_1_value: formData.stat1Value,
            stat_2_label: formData.stat2Label,
            stat_2_value: formData.stat2Value,
            stat_3_label: formData.stat3Label,
            stat_3_value: formData.stat3Value,
            stat_4_label: formData.stat4Label,
            stat_4_value: formData.stat4Value,
            additional_content: formData.additionalContent,
          },
        }),
      });

      console.log("Program creation response status:", response.status);
      const responseData = await response.json();
      console.log("Program creation response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to create program");
      }

      setSuccess("Program created successfully! ID: " + responseData.id);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create program");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="block">
                <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="MHMA Logo" width={180} height={40} className="h-10 w-auto" />
              </Link>
            </div>
            <div className="hidden lg:flex items-center space-x-8">
              <Link href="/dashboard" className="text-[#c9a227] font-medium">DASHBOARD</Link>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                LOGOUT
              </button>
            </div>
            <div className="lg:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-700 hover:text-[#c9a227] p-2">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link href="/dashboard" className="block px-3 py-2 text-[#c9a227] font-medium">DASHBOARD</Link>
                <button
                  onClick={handleLogout}
                  className="block px-3 py-2 text-gray-700 hover:text-red-600 font-medium w-full text-left"
                >
                  LOGOUT
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/dashboard" className="inline-flex items-center text-[#c9a227] hover:text-[#8c7622] mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Add New Program</h1>
            <p className="text-gray-600 mt-2">Create a new program page with custom fields</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  placeholder="e.g., Arabic Academy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  placeholder="e.g., arabic-academy"
                />
                <p className="text-xs text-gray-500 mt-1">This will be used in the URL: /programs/{formData.slug}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program Title</label>
                <input
                  type="text"
                  value={formData.programTitle}
                  onChange={(e) => setFormData({ ...formData, programTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  placeholder="e.g., LEARN ARABIC LANGUAGE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                />
                {uploadingImage && <p className="text-xs text-gray-500 mt-1">Uploading image...</p>}
                {formData.programImage && (
                  <div className="mt-2">
                    <img src={formData.programImage} alt="Program preview" className="h-32 w-auto rounded border" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program Poster Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterImageUpload}
                  disabled={uploadingPosterImage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                />
                {uploadingPosterImage && <p className="text-xs text-gray-500 mt-1">Uploading poster image...</p>}
                {formData.programImagePoster && (
                  <div className="mt-2">
                    <img src={formData.programImagePoster} alt="Poster preview" className="h-32 w-auto rounded border" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program Description</label>
                <textarea
                  value={formData.programDescription}
                  onChange={(e) => setFormData({ ...formData, programDescription: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  placeholder="Describe the program..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  placeholder="Main page content..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stat 1 Label</label>
                  <input
                    type="text"
                    value={formData.stat1Label}
                    onChange={(e) => setFormData({ ...formData, stat1Label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                    placeholder="e.g., Students"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stat 1 Value</label>
                  <input
                    type="text"
                    value={formData.stat1Value}
                    onChange={(e) => setFormData({ ...formData, stat1Value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                    placeholder="e.g., 25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stat 2 Label</label>
                  <input
                    type="text"
                    value={formData.stat2Label}
                    onChange={(e) => setFormData({ ...formData, stat2Label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                    placeholder="e.g., Days/Week"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stat 2 Value</label>
                  <input
                    type="text"
                    value={formData.stat2Value}
                    onChange={(e) => setFormData({ ...formData, stat2Value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stat 3 Label</label>
                  <input
                    type="text"
                    value={formData.stat3Label}
                    onChange={(e) => setFormData({ ...formData, stat3Label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stat 3 Value</label>
                  <input
                    type="text"
                    value={formData.stat3Value}
                    onChange={(e) => setFormData({ ...formData, stat3Value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stat 4 Label</label>
                  <input
                    type="text"
                    value={formData.stat4Label}
                    onChange={(e) => setFormData({ ...formData, stat4Label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stat 4 Value</label>
                  <input
                    type="text"
                    value={formData.stat4Value}
                    onChange={(e) => setFormData({ ...formData, stat4Value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Content (HTML)</label>
                <textarea
                  value={formData.additionalContent}
                  onChange={(e) => setFormData({ ...formData, additionalContent: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  placeholder="Additional HTML content..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#c9a227] hover:bg-[#8c7622] text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Creating..." : "Create Program"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
