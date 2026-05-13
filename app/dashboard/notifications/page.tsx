"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchEnrollments, fetchSchedulingRequests } from "@/lib/firebase";
import Navigation from "@/components/Navigation";

type NotificationItem = {
  id: string;
  type: "contact" | "event_request" | "enrollment";
  title: string;
  date: string;
  details: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "contact" | "event_request" | "enrollment">("all");

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    loadNotifications();
  }, [authLoading, isBoardMember, router]);

  const loadNotifications = async () => {
    try {
      const [enrollments, requests] = await Promise.all([
        fetchEnrollments(50),
        fetchSchedulingRequests(50),
      ]);
      const items: NotificationItem[] = [
        ...enrollments.map(e => ({
          id: e.id || "", type: "enrollment" as const,
          title: `New Enrollment: ${e.fullName}`,
          date: e.createdAt?.toDate?.()?.toISOString?.()?.split("T")[0] || "",
          details: `${e.program} — ${e.email}`,
        })),
        ...requests.map(r => ({
          id: r.id || "", type: "event_request" as const,
          title: `Event Request: ${r.eventTitle}`,
          date: r.createdAt?.toDate?.()?.toISOString?.()?.split("T")[0] || "",
          details: `${r.organizer?.firstName} ${r.organizer?.lastName} — ${r.status}`,
        })),
      ];
      items.sort((a, b) => b.date.localeCompare(a.date));
      setNotifications(items);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);
  const countByType = (type: string) => type === "all" ? notifications.length : notifications.filter(n => n.type === type).length;

  if (authLoading || loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />
      <div className="pt-32 text-center"><p className="text-gray-500">Loading notifications...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />
      <div className="pt-28 pb-8 px-4 max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-teal-700 hover:text-teal-600 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-500 mb-6">Manage contact submissions, event requests, and new enrollments.</p>

        <div className="flex gap-2 mb-6">
          {(["all", "contact", "event_request", "enrollment"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === f ? "bg-teal-800 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}>
              {f === "all" ? "All" : f === "contact" ? "Contact" : f === "event_request" ? "Event Requests" : "Enrollments"}
              <span className="ml-1.5 text-xs opacity-75">({countByType(f)})</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <p className="text-gray-400">No notifications found.</p>
            </div>
          )}
          {filtered.map(n => (
            <div key={n.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${
                  n.type === "contact" ? "bg-blue-50 text-blue-600" :
                  n.type === "event_request" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                }`}>
                  {n.type === "contact" ? <Mail className="w-5 h-5" /> :
                   n.type === "event_request" ? <Calendar className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{n.details}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
