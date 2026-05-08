"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import {
  ArrowLeft,
  Save,
  Upload,
} from "lucide-react";

interface FormData {
  title: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  rsvpLink: string;
  eventDescription: string;
  posterImage: File | null;
  showDate: boolean;
  showTime: boolean;
  showLocation: boolean;
  showDescription: boolean;
}

export default function NewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    eventDate: "",
    eventTime: "",
    eventLocation: "",
    rsvpLink: "",
    eventDescription: "",
    posterImage: null,
    showDate: false,
    showTime: false,
    showLocation: false,
    showDescription: false,
  });

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, posterImage: file });
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

      // First, find the Events page by slug to get its ID dynamically
      let eventsParentId = 277; // fallback
      try {
        const searchResponse = await fetch(`${WP_API_URL}/wp/v2/pages?slug=events&per_page=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (searchResponse.ok) {
          const pages = await searchResponse.json();
          if (pages.length > 0) {
            eventsParentId = pages[0].id;
          }
        }
      } catch (e) {
        console.warn("Could not find Events page by slug, using fallback ID:", e);
      }

      // First upload the image if provided
      let mediaId = null;
      if (formData.posterImage) {
        const formDataImage = new FormData();
        formDataImage.append("file", formData.posterImage);

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
      let formattedDate = formData.eventDate;
      if (formattedDate) {
        const [year, month, day] = formattedDate.split('-');
        formattedDate = `${year}${month}${day}`;
      }

      // Create new event page as child of Events page
      const response = await fetch(`${WP_API_URL}/wp/v2/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.eventDescription,
          status: "publish",
          parent: eventsParentId,
          acf: {
            event_poster: mediaId,
            event_date: formattedDate,
            event_time: formData.eventTime,
            event_location: formData.eventLocation,
            event_rsvp_link: formData.rsvpLink,
            event_description: formData.eventDescription,
            event_name: formData.title,
            show_date: formData.showDate,
            show_time: formData.showTime,
            show_location: formData.showLocation,
            show_description: formData.showDescription,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to create event (status: ${response.status})`);
      }

      setSuccess("Event created successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="dashboard" />

      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/dashboard" className="inline-flex items-center text-[#c9a227] hover:text-[#8c7622] mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Add New Event</h1>
            <p className="text-gray-600 mt-2">Create a new event poster for the homepage</p>
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
                  placeholder="e.g., Eid Celebration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Poster Image *</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#c9a227] transition-colors">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <Image src={imagePreview} alt="Preview" width={200} height={200} className="mx-auto rounded-md" />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, posterImage: null });
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
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Time</label>
                  <input
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Location</label>
                <input
                  type="text"
                  value={formData.eventLocation}
                  onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  placeholder="e.g., Mountain House Unity Center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RSVP Link</label>
                <input
                  type="url"
                  value={formData.rsvpLink}
                  onChange={(e) => setFormData({ ...formData, rsvpLink: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Description</label>
                <textarea
                  value={formData.eventDescription}
                  onChange={(e) => setFormData({ ...formData, eventDescription: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  placeholder="Describe the event..."
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Display Options</p>
                <p className="text-xs text-gray-500 mb-3">Choose which event details to show below the poster (if already on poster, uncheck to avoid redundancy)</p>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showDate}
                      onChange={(e) => setFormData({ ...formData, showDate: e.target.checked })}
                      className="h-4 w-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Date</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showTime}
                      onChange={(e) => setFormData({ ...formData, showTime: e.target.checked })}
                      className="h-4 w-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Time</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showLocation}
                      onChange={(e) => setFormData({ ...formData, showLocation: e.target.checked })}
                      className="h-4 w-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Location</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showDescription}
                      onChange={(e) => setFormData({ ...formData, showDescription: e.target.checked })}
                      className="h-4 w-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Description</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#c9a227] hover:bg-[#8c7622] text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Creating..." : "Create Event"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
