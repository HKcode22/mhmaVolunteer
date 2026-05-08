"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, BookOpen, ExternalLink } from "lucide-react";
import Navigation from "@/components/Navigation";

interface ContactSubmission {
  id: number;
  title: { rendered: string };
  date: string;
  contact_name?: string;
  contact_email?: string;
  contact_subject?: string;
  content?: { rendered: string };
}

interface WPPage {
  id: number;
  title: { rendered: string };
  date: string;
  slug: string;
  status: string;
  content?: { rendered: string };
}

type NotificationItem = {
  id: string;
  type: "contact" | "event_request" | "enrollment";
  title: string;
  date: string;
  preview: string;
  status: string;
  link: string;
  meta?: Record<string, string>;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    const userRole = localStorage.getItem("user_role");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const isBoardMember = userRole === "board_member" || userRole === "administrator";
    if (!isBoardMember) {
      window.location.href = "/";
      return;
    }

    fetchAllNotifications();
  }, []);

  const fetchAllNotifications = async () => {
    const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
    const token = localStorage.getItem("jwt_token");
    const items: NotificationItem[] = [];

    try {
      const [contactRes, requestsRes, enrollmentsRes] = await Promise.allSettled([
        fetch(`${WP_API_URL}/wp/v2/contact_submission?per_page=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${WP_API_URL}/wp/v2/pages?status=pending&per_page=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchEnrollments(WP_API_URL, token),
      ]);

      if (contactRes.status === "fulfilled" && contactRes.value.ok) {
        const data: ContactSubmission[] = await contactRes.value.json();
        data.forEach((item) => {
          items.push({
            id: `contact-${item.id}`,
            type: "contact",
            title: item.contact_subject || item.title.rendered,
            date: item.date,
            preview: item.contact_name || "",
            status: "unread",
            link: "#",
            meta: {
              name: item.contact_name || "",
              email: item.contact_email || "",
              subject: item.contact_subject || "",
            },
          });
        });
      }

      if (requestsRes.status === "fulfilled" && requestsRes.value.ok) {
        const data: WPPage[] = await requestsRes.value.json();
        data.forEach((item) => {
          items.push({
            id: `request-${item.id}`,
            type: "event_request",
            title: item.title.rendered,
            date: item.date,
            preview: "Event scheduling request pending review",
            status: "pending",
            link: `/dashboard/events/edit?id=${item.id}`,
          });
        });
      }

      if (enrollmentsRes.status === "fulfilled" && enrollmentsRes.value) {
        const data: WPPage[] = enrollmentsRes.value;
        data.forEach((item) => {
          items.push({
            id: `enrollment-${item.id}`,
            type: "enrollment",
            title: item.title.rendered,
            date: item.date,
            preview: "New program enrollment submission",
            status: "private",
            link: `/dashboard/events/edit?id=${item.id}`,
          });
        });
      }

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (WP_API_URL: string, token: string | null): Promise<WPPage[]> => {
    try {
      const searchResponse = await fetch(`${WP_API_URL}/wp/v2/pages?slug=enrollments&per_page=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (searchResponse.ok) {
        const pages = await searchResponse.json();
        if (pages.length > 0) {
          const response = await fetch(`${WP_API_URL}/wp/v2/pages?parent=${pages[0].id}&per_page=100`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            return await response.json();
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch enrollments:", e);
    }
    return [];
  };

  const filteredNotifications = filter === "all"
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const typeConfig = {
    contact: { label: "Contact Form", icon: Mail, color: "bg-blue-100 text-blue-800" },
    event_request: { label: "Event Request", icon: Calendar, color: "bg-amber-100 text-amber-800" },
    enrollment: { label: "Enrollment", icon: BookOpen, color: "bg-green-100 text-green-800" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />

      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-[#c9a227] hover:text-[#8c7622] mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { value: "all", label: `All (${notifications.length})` },
              { value: "contact", label: `Contact (${notifications.filter(n => n.type === "contact").length})` },
              { value: "event_request", label: `Events (${notifications.filter(n => n.type === "event_request").length})` },
              { value: "enrollment", label: `Enrollments (${notifications.filter(n => n.type === "enrollment").length})` },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? "bg-teal-800 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No notifications</p>
              <p className="text-gray-500 text-sm mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((item) => {
                const config = typeConfig[item.type];
                const Icon = config.icon;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow border border-gray-200 p-5 hover:border-teal-200 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg ${item.type === "contact" ? "bg-blue-50" : item.type === "event_request" ? "bg-amber-50" : "bg-green-50"}`}>
                        <Icon className={`h-5 w-5 ${item.type === "contact" ? "text-blue-600" : item.type === "event_request" ? "text-amber-600" : "text-green-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(item.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                        {item.meta?.name && (
                          <p className="text-sm text-gray-600 mt-0.5">From: {item.meta.name} ({item.meta.email})</p>
                        )}
                        {item.meta?.subject && (
                          <p className="text-sm text-gray-500 mt-0.5">Subject: {item.meta.subject}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-0.5">{item.preview}</p>
                      </div>
                      {item.link !== "#" && (
                        <Link
                          href={item.link}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex-shrink-0"
                          title="View details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
