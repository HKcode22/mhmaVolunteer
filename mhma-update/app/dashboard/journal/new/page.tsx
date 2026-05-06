"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    datePublished: "",
    dateHeldOn: "",
    attendees: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      const formattedDatePublished = formatDateForACF(formData.datePublished);
      const formattedDateHeldOn = formatDateForACF(formData.dateHeldOn);

      const payload = {
        title: formData.title,
        content: formData.content,
        status: "publish",
        parent: 199, // Journal page ID
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

      console.log("Creating journal entry with payload:", payload);
      console.log("date_published value:", formData.datePublished);
      console.log("date_held_on value:", formData.dateHeldOn);

      // Create the journal page
      const response = await fetch(`${WP_API_URL}/wp/v2/pages`, {
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
        throw new Error(`Failed to create journal entry: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Journal entry created successfully:", data);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Error creating journal entry:", err);
      setError(err instanceof Error ? err.message : "Failed to create journal entry");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Create New Journal Entry</h1>
            <p className="text-gray-600 mt-2">Add a new journal entry for board meeting minutes</p>
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
                    placeholder="e.g., BOD Minutes for MHMA Board of Directors Meeting – 12-Apr-26"
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
                    disabled={loading}
                    className="px-6 py-2 bg-[#c9a227] text-white rounded-md hover:bg-[#8c7622] transition-colors disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create Journal Entry"}
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
