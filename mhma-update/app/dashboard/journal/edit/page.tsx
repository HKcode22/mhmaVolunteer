"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function EditJournalEntryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <JournalEditContent />
    </Suspense>
  );
}

function JournalEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const journalId = searchParams.get("id");

  const [formData, setFormData] = useState({
    title: "",
    datePublished: "",
    dateHeldOn: "",
    attendees: "",
    content: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Helper function to convert YYYY-MM-DD to ACF format (F j, Y) - WITHOUT timezone issues
  const formatDateForACF = (dateString: string) => {
    if (!dateString) return "";
    // Parse YYYY-MM-DD format manually to avoid timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return `${monthNames[month - 1]} ${day}, ${year}`;
  };

  useEffect(() => {
    if (!journalId) {
      setError("No journal ID provided");
      setLoading(false);
      return;
    }

    fetchJournalEntry();
  }, [journalId]);

  const fetchJournalEntry = async () => {
    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      const response = await fetch(`${WP_API_URL}/wp/v2/pages/${journalId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch journal entry");
      }

      const data = await response.json();
      console.log("Journal entry data:", data);
      console.log("ACF data:", data.acf);
      console.log("date_published:", data.acf?.date_published);
      console.log("date_held_on:", data.acf?.date_held_on);

      // Helper function to convert date to YYYY-MM-DD format for HTML input
      const formatDateForInput = (dateString: string | undefined) => {
        if (!dateString) return "";
        // If already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
        // Handle ACF format "F j, Y" (e.g., "April 29, 2026")
        if (/^[A-Za-z]+ \d{1,2}, \d{4}$/.test(dateString)) {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return dateString;
          return date.toISOString().split('T')[0];
        }
        // Try to parse and convert other formats
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toISOString().split('T')[0];
      };

      // Check both ACF and meta fields for data
      const acfData = data.acf || {};
      const metaData = data.meta || {};
      
      setFormData({
        title: acfData.journal_title || metaData.journal_title || data.title.rendered,
        datePublished: formatDateForInput(acfData.date_published || metaData.date_published),
        dateHeldOn: formatDateForInput(acfData.date_held_on || metaData.date_held_on),
        attendees: acfData.attendees || metaData.attendees || "",
        content: acfData.content || metaData.journal_content || data.content.rendered || "",
      });
    } catch (err) {
      console.error("Error fetching journal entry:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch journal entry");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      const formattedDatePublished = formatDateForACF(formData.datePublished);
      const formattedDateHeldOn = formatDateForACF(formData.dateHeldOn);

      const payload = {
        title: formData.title,
        content: formData.content,
        acf: {
          journal_title: formData.title,
          date_published: formattedDatePublished,
          date_held_on: formattedDateHeldOn,
          attendees: formData.attendees,
          content: formData.content,
        },
        meta: {
          journal_title: formData.title,
          date_published: formattedDatePublished,
          date_held_on: formattedDateHeldOn,
          attendees: formData.attendees,
          journal_content: formData.content,
        },
      };

      console.log("Sending payload:", payload);
      console.log("date_published value:", formData.datePublished);
      console.log("date_held_on value:", formData.dateHeldOn);

      const response = await fetch(`${WP_API_URL}/wp/v2/pages/${journalId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to update journal entry: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Journal entry updated successfully:", responseData);
      router.push("/dashboard");
    } catch (err) {
      console.error("Error updating journal entry:", err);
      setError(err instanceof Error ? err.message : "Failed to update journal entry");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="dashboard" />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="dashboard" />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <Link href="/dashboard" className="text-[#c9a227] hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />

      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-[#c9a227] hover:underline mb-4 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Journal Entry</h1>
            <p className="text-gray-600 mt-2">Update journal entry for board meeting minutes</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                  />
                </div>

                {/* Date Published */}
                <div>
                  <label htmlFor="datePublished" className="block text-sm font-medium text-gray-700 mb-2">
                    Date Published *
                  </label>
                  <input
                    type="date"
                    id="datePublished"
                    required
                    value={formData.datePublished}
                    onChange={(e) => setFormData({ ...formData, datePublished: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="Select date"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: April 30, 2026 (will be displayed as such)
                  </p>
                </div>

                {/* Date Held On */}
                <div>
                  <label htmlFor="dateHeldOn" className="block text-sm font-medium text-gray-700 mb-2">
                    Date Held On *
                  </label>
                  <input
                    type="date"
                    id="dateHeldOn"
                    required
                    value={formData.dateHeldOn}
                    onChange={(e) => setFormData({ ...formData, dateHeldOn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="Select date"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: April 30, 2026 (will be displayed as such)
                  </p>
                </div>

                {/* Attendees */}
                <div>
                  <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-2">
                    Attendees
                  </label>
                  <input
                    type="text"
                    id="attendees"
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="e.g., Umar Sear, Asad Siddiqui, Saqib Malik"
                  />
                </div>

                {/* Content */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    id="content"
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="Enter the meeting minutes content. You can use HTML tags for formatting."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: You can use HTML tags for formatting (e.g., p, strong, ul, li)
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Link
                    href="/dashboard"
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-[#c9a227] text-white rounded-md hover:bg-[#8c7622] transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
