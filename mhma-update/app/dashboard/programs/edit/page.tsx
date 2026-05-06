"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Landmark,
  BookOpen,
  Heart,
  User,
  LogOut,
  ArrowLeft,
  Save,
} from "lucide-react";

interface ACFData {
  program_title?: string;
  program_description?: string;
  program_image?: string;
  program_image_poster?: string;
  use_hardcoded_version?: boolean;
  stat_1_label?: string;
  stat_1_value?: string;
  stat_2_label?: string;
  stat_2_value?: string;
  stat_3_label?: string;
  stat_3_value?: string;
  stat_4_label?: string;
  stat_4_value?: string;
  additional_content?: string;
}

interface Program {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  slug: string;
  acf?: ACFData;
}

function EditProgramContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("id");
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    acf: ACFData;
  }>({
    title: "",
    content: "",
    acf: {},
  });
  const [programImage, setProgramImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageId, setImageId] = useState<number | null>(null);
  const [programPosterImage, setProgramPosterImage] = useState<File | null>(null);
  const [posterImagePreview, setPosterImagePreview] = useState<string>("");
  const [posterImageId, setPosterImageId] = useState<number | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("jwt_token");
    const userRole = localStorage.getItem("user_role");

    if (!token) {
      router.push("/login");
      return;
    }

    const isBoardMember = userRole === "board_member" || userRole === "administrator";
    if (!isBoardMember) {
      router.push("/");
      return;
    }

    if (!programId) {
      setError("No program ID provided");
      setLoading(false);
      return;
    }

    // Fetch program data
    fetchProgram();
  }, [programId, router]);

  const fetchProgram = async () => {
    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      // Check if programId is numeric (WordPress page) or string (slug)
      if (!/^\d+$/.test(programId || "")) {
        // String ID - this is a hardcoded page, not a WordPress page
        // Try to fetch by slug to see if a WordPress page exists
        const response = await fetch(`${WP_API_URL}/wp/v2/pages?slug=${programId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch program");
        }

        const pages = await response.json();
        if (pages.length === 0) {
          throw new Error("This is a hardcoded page. A corresponding WordPress page does not exist. Hardcoded pages cannot be edited via the dashboard. Please create a WordPress page for this program first.");
        }

        // WordPress page exists, use its numeric ID
        const data: Program = pages[0];
        setProgram(data);
        setFormData({
          title: data.title.rendered,
          content: data.content.rendered,
          acf: data.acf || {},
        });
        if (data.acf?.program_image) {
          setImagePreview(data.acf.program_image);
          if (typeof data.acf.program_image === 'number') {
            setImageId(data.acf.program_image);
          }
        }
        if (data.acf?.program_image_poster) {
          setPosterImagePreview(data.acf.program_image_poster);
          if (typeof data.acf.program_image_poster === 'number') {
            setPosterImageId(data.acf.program_image_poster);
          }
        }
      } else {
        // Numeric ID - fetch by ID
        const response = await fetch(`${WP_API_URL}/wp/v2/pages/${programId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch program");
        }

        const data: Program = await response.json();
        setProgram(data);
        setFormData({
          title: data.title.rendered,
          content: data.content.rendered,
          acf: data.acf || {},
        });
        if (data.acf?.program_image) {
          setImagePreview(data.acf.program_image);
          if (typeof data.acf.program_image === 'number') {
            setImageId(data.acf.program_image);
          }
        }
        if (data.acf?.program_image_poster) {
          setPosterImagePreview(data.acf.program_image_poster);
          if (typeof data.acf.program_image_poster === 'number') {
            setPosterImageId(data.acf.program_image_poster);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load program");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProgramImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePosterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProgramPosterImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPosterImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    console.log("=== EDIT PROGRAM SUBMIT START ===");
    console.log("Program ID:", programId);
    console.log("Form data:", formData);
    console.log("Program image selected:", programImage ? "Yes" : "No");

    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");
      console.log("Token exists:", !!token);

      let programImageId = imageId || null;
      let newPosterImageId = posterImageId || null;
      console.log("Current image ID:", programImageId);
      console.log("Current poster image ID:", newPosterImageId);

      // Upload image if a new one is selected
      if (programImage) {
        console.log("=== UPLOADING NEW IMAGE ===");
        const formDataImage = new FormData();
        formDataImage.append("file", programImage);

        const imageResponse = await fetch(`${WP_API_URL}/wp/v2/media`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImage,
        });

        console.log("Image upload response status:", imageResponse.status);

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          programImageId = imageData.id;
          console.log("Image upload success. New ID:", programImageId);
          console.log("Image upload response data:", imageData);
        } else {
          const errorText = await imageResponse.text();
          console.error("Image upload failed. Status:", imageResponse.status);
          console.error("Error response:", errorText);
          throw new Error(`Failed to upload image: ${imageResponse.status}`);
        }
      }

      // Upload poster image if a new one is selected
      if (programPosterImage) {
        console.log("=== UPLOADING NEW POSTER IMAGE ===");
        const formDataPoster = new FormData();
        formDataPoster.append("file", programPosterImage);

        const posterResponse = await fetch(`${WP_API_URL}/wp/v2/media`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataPoster,
        });

        console.log("Poster image upload response status:", posterResponse.status);

        if (posterResponse.ok) {
          const posterData = await posterResponse.json();
          newPosterImageId = posterData.id;
          console.log("Poster image upload success. New ID:", newPosterImageId);
          console.log("Poster image upload response data:", posterData);
        } else {
          const errorText = await posterResponse.text();
          console.error("Poster image upload failed. Status:", posterResponse.status);
          console.error("Error response:", errorText);
          throw new Error(`Failed to upload poster image: ${posterResponse.status}`);
        }
      }

      console.log("=== UPDATING PROGRAM ===");
      console.log("Updating page ID:", programId);
      console.log("Program data ID:", program?.id);

      // Use the numeric ID from the fetched program data, not the URL parameter
      const updateId = program?.id || programId;
      if (!/^\d+$/.test(String(updateId))) {
        throw new Error("Cannot update program: Invalid ID. This is a hardcoded page without a WordPress page.");
      }

      const updateData = {
        title: formData.title,
        content: formData.content,
        acf: {
          ...formData.acf,
          program_image: programImageId,
          program_image_poster: newPosterImageId,
        },
      };
      console.log("Update data being sent:", JSON.stringify(updateData, null, 2));
      console.log("Updating using numeric ID:", updateId);

      const response = await fetch(`${WP_API_URL}/wp/v2/pages/${updateId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      console.log("Update response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update failed. Status:", response.status);
        console.error("Error response:", errorText);

        // Handle 403 permission error specifically
        if (response.status === 403) {
          throw new Error("Permission denied: You do not have permission to edit this page. This page may have been created by a different user. Please contact the administrator or create a new WordPress page for this program.");
        }

        throw new Error(`Failed to update program: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Update success. Response data:", responseData);

      setSuccess("Program updated successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("=== EDIT PROGRAM ERROR ===");
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Failed to update program");
    } finally {
      setSaving(false);
      console.log("=== EDIT PROGRAM SUBMIT END ===");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!programId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">No program ID provided</p>
          <Link href="/dashboard" className="text-[#c9a227] hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0">
              <Link href="/" className="block">
                <Image
                  src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp"
                  alt="MHMA Logo"
                  width={180}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <div className="hidden lg:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-[#c9a227] transition-colors font-medium">
                HOME
              </Link>
              <div
                className="relative"
                onMouseEnter={() => setAboutDropdownOpen(true)}
                onMouseLeave={() => setAboutDropdownOpen(false)}
              >
                <button className="flex items-center text-gray-700 hover:text-[#c9a227] transition-colors font-medium">
                  <Landmark className="mr-1 h-4 w-4" />
                  MHMA
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {aboutDropdownOpen && (
                  <div className="absolute top-full left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-50">
                    <Link href="/board" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      BOARD
                    </Link>
                    <Link href="/committees" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      COMMITTEES
                    </Link>
                    <Link href="/bylaws" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      BYLAWS
                    </Link>
                    <Link href="/feedback" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      FEEDBACK
                    </Link>
                  </div>
                )}
              </div>
              <div
                className="relative"
                onMouseEnter={() => setProgramsDropdownOpen(true)}
                onMouseLeave={() => setProgramsDropdownOpen(false)}
              >
                <button className="flex items-center text-gray-700 hover:text-[#c9a227] transition-colors font-medium">
                  <BookOpen className="mr-1 h-4 w-4" />
                  PROGRAMS
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {programsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-0 w-56 bg-white shadow-lg rounded-md py-2 z-50">
                    <Link href="/programs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      ALL PROGRAMS
                    </Link>
                    <Link href="/programs/maktab-program" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      MHMA MAKTAB
                    </Link>
                    <Link href="/zakat" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      ZAKAT
                    </Link>
                  </div>
                )}
              </div>
              <Link href="/donate" className="flex items-center text-gray-700 hover:text-[#c9a227] transition-colors font-medium">
                <Heart className="mr-1 h-4 w-4" />
                DONATE
              </Link>
              <Link href="/dashboard" className="flex items-center text-[#c9a227] font-medium">
                <User className="mr-1 h-4 w-4" />
                DASHBOARD
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                <LogOut className="mr-1 h-4 w-4" />
                LOGOUT
              </button>
            </div>
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-[#c9a227] p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  HOME
                </Link>
                <Link href="/board" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  BOARD
                </Link>
                <Link href="/committees" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  COMMITTEES
                </Link>
                <Link href="/programs" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  PROGRAMS
                </Link>
                <Link href="/donate" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  DONATE
                </Link>
                <Link href="/dashboard" className="block px-3 py-2 text-[#c9a227] font-medium">
                  DASHBOARD
                </Link>
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

      {/* Main Content */}
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-[#c9a227] hover:text-[#8c7622] mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Program</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Edit Form */}
          {program && (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ACF Fields</h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="program_image" className="block text-sm font-medium text-gray-700 mb-2">
                      Program Image
                    </label>
                    <input
                      type="file"
                      id="program_image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                    />
                    {imagePreview && (
                      <div className="mt-2 relative w-full h-48">
                        <Image
                          src={imagePreview}
                          alt="Program image preview"
                          fill
                          className="object-contain rounded-md"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="program_image_poster" className="block text-sm font-medium text-gray-700 mb-2">
                      Program Poster Image (optional)
                    </label>
                    <input
                      type="file"
                      id="program_image_poster"
                      accept="image/*"
                      onChange={handlePosterImageUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                    />
                    {posterImagePreview && (
                      <div className="mt-2 relative w-full h-48">
                        <Image
                          src={posterImagePreview}
                          alt="Poster image preview"
                          fill
                          className="object-contain rounded-md"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="program_title" className="block text-sm font-medium text-gray-700 mb-2">
                      Program Title
                    </label>
                    <input
                      type="text"
                      id="program_title"
                      value={formData.acf.program_title || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        acf: { ...formData.acf, program_title: e.target.value }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {(program?.slug === "arabic-academy") && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <label htmlFor="use_hardcoded_version" className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="use_hardcoded_version"
                          checked={formData.acf.use_hardcoded_version || false}
                          onChange={(e) => setFormData({
                            ...formData,
                            acf: { ...formData.acf, use_hardcoded_version: e.target.checked }
                          })}
                          className="mr-2 h-4 w-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          <strong>Use Hardcoded Version:</strong> If checked, the Arabic Academy page will use the hardcoded version instead of WordPress data. This allows you to revert to the original hardcoded design.
                        </span>
                      </label>
                    </div>
                  )}

                  <div>
                    <label htmlFor="program_description" className="block text-sm font-medium text-gray-700 mb-2">
                      Program Description
                    </label>
                    <textarea
                      id="program_description"
                      value={formData.acf.program_description || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        acf: { ...formData.acf, program_description: e.target.value } 
                      })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="stat_1_label" className="block text-sm font-medium text-gray-700 mb-2">
                        Stat 1 Label
                      </label>
                      <input
                        type="text"
                        id="stat_1_label"
                        value={formData.acf.stat_1_label || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          acf: { ...formData.acf, stat_1_label: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="stat_1_value" className="block text-sm font-medium text-gray-700 mb-2">
                        Stat 1 Value
                      </label>
                      <input
                        type="text"
                        id="stat_1_value"
                        value={formData.acf.stat_1_value || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          acf: { ...formData.acf, stat_1_value: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="stat_2_label" className="block text-sm font-medium text-gray-700 mb-2">
                        Stat 2 Label
                      </label>
                      <input
                        type="text"
                        id="stat_2_label"
                        value={formData.acf.stat_2_label || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          acf: { ...formData.acf, stat_2_label: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="stat_2_value" className="block text-sm font-medium text-gray-700 mb-2">
                        Stat 2 Value
                      </label>
                      <input
                        type="text"
                        id="stat_2_value"
                        value={formData.acf.stat_2_value || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          acf: { ...formData.acf, stat_2_value: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="stat_3_label" className="block text-sm font-medium text-gray-700 mb-2">
                        Stat 3 Label
                      </label>
                      <input
                        type="text"
                        id="stat_3_label"
                        value={formData.acf.stat_3_label || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          acf: { ...formData.acf, stat_3_label: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="stat_3_value" className="block text-sm font-medium text-gray-700 mb-2">
                        Stat 3 Value
                      </label>
                      <input
                        type="text"
                        id="stat_3_value"
                        value={formData.acf.stat_3_value || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          acf: { ...formData.acf, stat_3_value: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="stat_4_label" className="block text-sm font-medium text-gray-700 mb-2">
                        Stat 4 Label
                      </label>
                      <input
                        type="text"
                        id="stat_4_label"
                        value={formData.acf.stat_4_label || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          acf: { ...formData.acf, stat_4_label: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="stat_4_value" className="block text-sm font-medium text-gray-700 mb-2">
                        Stat 4 Value
                      </label>
                      <input
                        type="text"
                        id="stat_4_value"
                        value={formData.acf.stat_4_value || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          acf: { ...formData.acf, stat_4_value: e.target.value } 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="additional_content" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Content
                    </label>
                    <textarea
                      id="additional_content"
                      value={formData.acf.additional_content || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        acf: { ...formData.acf, additional_content: e.target.value } 
                      })}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function EditProgramPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Loading...</p></div>}>
      <EditProgramContent />
    </Suspense>
  );
}
