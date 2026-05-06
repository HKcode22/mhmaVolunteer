"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  Upload,
} from "lucide-react";

interface ACFData {
  event_poster?: string;
  event_date?: string;
  event_time?: string;
  event_location?: string;
  event_rsvp_link?: string;
  event_description?: string;
  event_name?: string;
}

interface Event {
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

export default function EditEventPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <EditEventContent />
    </Suspense>
  );
}

function EditEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  
  const [event, setEvent] = useState<Event | null>(null);
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
  const [posterImage, setPosterImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageId, setImageId] = useState<number | null>(null);

  useEffect(() => {
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

    if (!eventId) {
      setError("No event ID provided");
      setLoading(false);
      return;
    }

    fetchEvent();
  }, [eventId, router]);

  const fetchEvent = async () => {
    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      const response = await fetch(`${WP_API_URL}/wp/v2/pages/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch event");
      }

      const data: Event = await response.json();
      setEvent(data);
      
      setFormData({
        title: data.title.rendered,
        content: data.content.rendered,
        acf: data.acf || {},
      });

      if (data.acf?.event_poster) {
        if (typeof data.acf.event_poster === 'number') {
          setImageId(data.acf.event_poster);
          // Fetch media URL
          const mediaResponse = await fetch(`${WP_API_URL}/wp/v2/media/${data.acf.event_poster}`);
          if (mediaResponse.ok) {
            const media = await mediaResponse.json();
            setImagePreview(media.source_url || media.guid?.rendered || "");
          }
        } else {
          setImagePreview(data.acf.event_poster);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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

      // Upload new image if provided
      let mediaId = imageId;
      if (posterImage) {
        const formDataImage = new FormData();
        formDataImage.append("file", posterImage);

        const uploadResponse = await fetch(`${WP_API_URL}/wp/v2/media`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImage,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const mediaData = await uploadResponse.json();
        mediaId = mediaData.id;
      }

      // Format date from YYYY-MM-DD to YYYYMMDD for WordPress ACF
      let formattedDate = formData.acf.event_date;
      if (formattedDate && /^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
        const [year, month, day] = formattedDate.split('-');
        formattedDate = `${year}${month}${day}`;
      }

      // Update event using POST (WordPress uses POST for updates with ID in URL)
      const updateData = {
        title: formData.title,
        content: formData.content,
        acf: {
          event_poster: mediaId,
          event_date: formattedDate,
          event_time: formData.acf.event_time,
          event_location: formData.acf.event_location,
          event_rsvp_link: formData.acf.event_rsvp_link,
          event_description: formData.acf.event_description,
          event_name: formData.title,
        },
      };
      
      console.log("Updating event with data:", updateData);
      
      const response = await fetch(`${WP_API_URL}/wp/v2/pages/${eventId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      setSuccess("Event updated successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading event...</p>
      </div>
    );
  }

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
                onClick={() => {
                  localStorage.removeItem("jwt_token");
                  localStorage.removeItem("user_role");
                  localStorage.removeItem("username");
                  window.location.href = "/login";
                }}
                className="text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/dashboard" className="inline-flex items-center text-[#c9a227] hover:text-[#8c7622] mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
            <p className="text-gray-600 mt-2">Update event information</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Poster Image</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#c9a227] transition-colors">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <Image src={imagePreview} alt="Preview" width={200} height={200} className="mx-auto rounded-md" />
                        <button
                          type="button"
                          onClick={() => {
                            setPosterImage(null);
                            setImagePreview(null);
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#c9a227] hover:text-[#8c7622] focus-within:outline-none">
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                  <input
                    type="date"
                    value={formData.acf.event_date?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') || ""}
                    onChange={(e) => setFormData({ ...formData, acf: { ...formData.acf, event_date: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Time</label>
                  <input
                    type="time"
                    value={formData.acf.event_time?.split(':').slice(0, 2).join(':') || ""}
                    onChange={(e) => setFormData({ ...formData, acf: { ...formData.acf, event_time: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Location</label>
                <input
                  type="text"
                  value={formData.acf.event_location || ""}
                  onChange={(e) => setFormData({ ...formData, acf: { ...formData.acf, event_location: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RSVP Link</label>
                <input
                  type="url"
                  value={formData.acf.event_rsvp_link || ""}
                  onChange={(e) => setFormData({ ...formData, acf: { ...formData.acf, event_rsvp_link: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Description</label>
                <textarea
                  value={formData.acf.event_description || ""}
                  onChange={(e) => setFormData({ ...formData, acf: { ...formData.acf, event_description: e.target.value } })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#c9a227] hover:bg-[#8c7622] text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
