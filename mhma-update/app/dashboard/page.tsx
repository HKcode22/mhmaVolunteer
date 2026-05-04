"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Heart,
  LogOut,
  Edit,
  Plus,
  Trash2,
  BookOpen,
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Program {
  id: number;
  title: {
    rendered: string;
  };
  slug: string;
  parent: number;
  acf?: {
    programTitle?: string;
    programDescription?: string;
  };
}

export default function DashboardPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [events, setEvents] = useState<Program[]>([]);
  const [journals, setJournals] = useState<Program[]>([]);
  const [eventRequests, setEventRequests] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllJournals, setShowAllJournals] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("jwt_token");
    const userRole = localStorage.getItem("user_role");
    const username = localStorage.getItem("username");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setUser({ username: username || "Board Member", role: userRole || "board_member" });

    // Fetch programs, events, journals, and event requests
    fetchPrograms();
    fetchEvents();
    fetchJournals();
    fetchEventRequests();
  }, []);

  const fetchPrograms = async () => {
    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      const response = await fetch(`${WP_API_URL}/wp/v2/pages?parent=70&per_page=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch programs");
      }

      const data = await response.json();
      setPrograms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      const response = await fetch(`${WP_API_URL}/wp/v2/pages?parent=277&per_page=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  const fetchJournals = async () => {
    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      const response = await fetch(`${WP_API_URL}/wp/v2/pages?parent=199&per_page=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch journals");
      }

      const data = await response.json();
      setJournals(data);
    } catch (err) {
      console.error("Failed to load journals:", err);
    }
  };

  const fetchEventRequests = async () => {
    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");

      // Fetch pages with status=pending (event scheduling requests)
      const response = await fetch(`${WP_API_URL}/wp/v2/pages?status=pending&per_page=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch event requests");
      }

      const data = await response.json();
      setEventRequests(data);
    } catch (err) {
      console.error("Failed to load event requests:", err);
    }
  };

  const handleDeleteProgram = async (programId: number, programTitle: string) => {
    if (deletingId === programId) {
      return; // Prevent double-click
    }

    if (!confirm(`Are you sure you want to delete "${programTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(programId);

    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const token = localStorage.getItem("jwt_token");
      const userRole = localStorage.getItem("user_role");

      console.log("=== DELETE PROGRAM START ===");
      console.log("Program ID:", programId);
      console.log("Program Title:", programTitle);
      console.log("Token exists:", !!token);
      console.log("User role:", userRole);
      console.log("Delete URL:", `${WP_API_URL}/wp/v2/pages/${programId}?force=true`);

      // Try force delete first
      let response = await fetch(`${WP_API_URL}/wp/v2/pages/${programId}?force=true`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Delete response status:", response.status);

      // If force delete fails with 403, try moving to trash instead
      if (response.status === 403) {
        console.log("Force delete failed, trying to move to trash...");
        response = await fetch(`${WP_API_URL}/wp/v2/pages/${programId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Trash response status:", response.status);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete failed. Response:", errorText);

        if (response.status === 403) {
          setError("Permission denied: Your WordPress user account doesn't have permission to delete pages. Please contact the administrator to grant 'delete_pages' capability to the subscriber role in WordPress, or log in as an administrator.");
        } else if (response.status === 404) {
          setError("Item already deleted or not found. Refreshing list...");
          fetchPrograms();
          fetchEvents();
          fetchJournals();
        } else {
          throw new Error(`Failed to delete program: ${response.status} - ${errorText}`);
        }
      } else {
        console.log("Delete successful");
        // Refresh programs list
        fetchPrograms();
        fetchEvents();
        fetchJournals();
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete program");
    } finally {
      setDeletingId(null);
    }
  };

  // Hardcoded program slugs that should not show delete button
  const hardcodedProgramSlugs = [
    "arabic-academy",
    "boy-scouts",
    "ladies-meetup",
    "youth-sports-league",
    "family-night",
    "jummah-and-salah",
    "learn-3d-printing",
    "maktab-program",
    "quran-hifz-program",
    "urdu-academy",
    "wish",
    "islamic-center-of-mountain-house",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />

      {/* Main Content */}
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Board Member Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome, {user?.username}! Manage your programs and events here.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/dashboard/programs/new"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="flex items-center">
                <Plus className="h-8 w-8 text-[#c9a227] mr-4" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add New Program</h3>
                  <p className="text-sm text-gray-600">Create a new program page</p>
                </div>
              </div>
            </Link>
            <Link
              href="/dashboard/events/new"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="flex items-center">
                <Plus className="h-8 w-8 text-[#c9a227] mr-4" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add New Event</h3>
                  <p className="text-sm text-gray-600">Create a new event poster</p>
                </div>
              </div>
            </Link>
            <Link
              href="/dashboard/journal/new"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-[#c9a227] mr-4" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add Journal Entry</h3>
                  <p className="text-sm text-gray-600">Create a new journal entry</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Management Grid - 2x2 Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Programs Box */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-teal-800 to-teal-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Programs</h2>
                    <p className="text-xs text-white/70">{programs.length} active programs</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/programs/new"
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  title="Add New Program"
                >
                  <Plus className="h-5 w-5" />
                </Link>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {loading ? (
                  <p className="text-gray-600 text-center py-4">Loading...</p>
                ) : programs.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No programs found.</p>
                ) : (
                  <div className="space-y-2">
                    {(showAllPrograms ? programs : programs.slice(0, 5)).map((program) => (
                      <div
                        key={program.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-amber-50 transition-colors border border-gray-100"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{program.title.rendered}</h3>
                          <p className="text-xs text-gray-500">{program.slug}</p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Link
                            href={`/dashboard/programs/edit?id=${program.id}`}
                            className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-md transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          {!hardcodedProgramSlugs.includes(program.slug) && (
                            <button
                              onClick={() => handleDeleteProgram(program.id, program.title.rendered)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {programs.length > 5 && (
                      <button
                        onClick={() => setShowAllPrograms(!showAllPrograms)}
                        className="w-full text-center text-sm text-mhma-teal hover:text-mhma-gold py-2 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                      >
                        {showAllPrograms ? 'Show Less' : `+${programs.length - 5} more programs`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Events Box */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-teal-800 to-teal-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Events</h2>
                    <p className="text-xs text-white/70">{events.length} upcoming events</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/events/new"
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  title="Add New Event"
                >
                  <Plus className="h-5 w-5" />
                </Link>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No events found.</p>
                ) : (
                  <div className="space-y-2">
                    {(showAllEvents ? events : events.slice(0, 5)).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-amber-50 transition-colors border border-gray-100"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{event.title.rendered}</h3>
                          <p className="text-xs text-gray-500">{event.slug}</p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Link
                            href={`/dashboard/events/edit?id=${event.id}`}
                            className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-md transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProgram(event.id, event.title.rendered)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {events.length > 5 && (
                      <button
                        onClick={() => setShowAllEvents(!showAllEvents)}
                        className="w-full text-center text-sm text-mhma-teal hover:text-mhma-gold py-2 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                      >
                        {showAllEvents ? 'Show Less' : `+${events.length - 5} more events`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Journal Box */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-teal-800 to-teal-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Journal</h2>
                    <p className="text-xs text-white/70">{journals.length} entries</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/journal/new"
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  title="Add Journal Entry"
                >
                  <Plus className="h-5 w-5" />
                </Link>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {journals.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No journal entries found.</p>
                ) : (
                  <div className="space-y-2">
                    {(showAllJournals ? journals : journals.slice(0, 5)).map((journal) => (
                      <div
                        key={journal.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors border border-gray-100"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{journal.title.rendered}</h3>
                          <p className="text-xs text-gray-500">{journal.slug}</p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Link
                            href={`/dashboard/journal/edit?id=${journal.id}`}
                            className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-md transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProgram(journal.id, journal.title.rendered)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {journals.length > 5 && (
                      <button
                        onClick={() => setShowAllJournals(!showAllJournals)}
                        className="w-full text-center text-sm text-mhma-teal hover:text-mhma-gold py-2 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                      >
                        {showAllJournals ? 'Show Less' : `+${journals.length - 5} more entries`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Event Scheduling Requests Box */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-teal-800 to-teal-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Scheduling Requests</h2>
                    <p className="text-xs text-white/70">
                      {eventRequests.length > 0 ? `${eventRequests.length} pending` : "No pending requests"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {eventRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Heart className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-gray-600">No pending requests.</p>
                    <p className="text-sm text-gray-500">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(showAllRequests ? eventRequests : eventRequests.slice(0, 5)).map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{request.title.rendered}</h3>
                          <p className="text-xs text-teal-600">Pending Review</p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Link
                            href={`/dashboard/events/edit?id=${request.id}`}
                            className="p-1.5 text-teal-600 hover:bg-teal-200 rounded-md transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProgram(request.id, request.title.rendered)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {eventRequests.length > 5 && (
                      <button
                        onClick={() => setShowAllRequests(!showAllRequests)}
                        className="w-full text-center text-sm text-mhma-teal hover:text-mhma-gold py-2 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                      >
                        {showAllRequests ? 'Show Less' : `+${eventRequests.length - 5} more requests`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image
                src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp"
                alt="MHMA Logo"
                width={200}
                height={45}
                className="h-12 w-auto"
              />
            </div>
            <div className="flex space-x-4 mb-8">
              <a
                href="https://www.facebook.com/mhma95391"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/mhma.ig/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/i/flow/login?redirect_after_login=%2Fmhmatweets"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/mountain-house-muslim-association/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@MHMAYouTube"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            <div className="text-center text-gray-400 text-sm">
              <p>Copyright 2024 MHMA - Mountain House Muslim Association</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
