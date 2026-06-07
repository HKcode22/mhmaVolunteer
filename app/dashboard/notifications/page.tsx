"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, BookOpen, Users, ChevronDown, ChevronUp, X, Check, Phone, MapPin, Clock, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchEnrollments, fetchSchedulingRequests, fetchContactSubmissions, fetchRSVPs, updateRSVP, updateEnrollment, updateSchedulingRequest, markContactSubmissionRead, logActivity } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

type NotificationItem = {
  id: string;
  type: "contact" | "event_request" | "enrollment" | "rsvp";
  title: string;
  date: string;
  details: string;
  status?: string;
  rawData: any;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isBoardMember, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "contact" | "event_request" | "enrollment" | "rsvp">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    loadNotifications();
  }, [authLoading, isBoardMember, router]);

  const loadNotifications = async () => {
    try {
      const [enrollments, requests, contacts, rsvps] = await Promise.all([
        fetchEnrollments(100),
        fetchSchedulingRequests(100),
        fetchContactSubmissions(100),
        fetchRSVPs(100),
      ]);
      const items: NotificationItem[] = [
        ...enrollments.map(e => ({
          id: e.id || "", type: "enrollment" as const,
          title: `New Enrollment: ${e.fullName}`,
          date: e.createdAt?.toDate?.()?.toLocaleDateString() || "",
          details: `${e.program} — ${e.email} — ${e.status}`,
          status: e.status,
          rawData: e,
        })),
        ...requests.map(r => ({
          id: r.id || "", type: "event_request" as const,
          title: `Event Request: ${r.eventTitle}`,
          date: r.createdAt?.toDate?.()?.toLocaleDateString() || "",
          details: `${r.organizer?.firstName} ${r.organizer?.lastName} — ${r.status}`,
          status: r.status,
          rawData: r,
        })),
        ...contacts.map(c => ({
          id: c.id || "", type: "contact" as const,
          title: `Contact: ${c.subject || "(no subject)"}`,
          date: c.createdAt?.toDate?.()?.toLocaleDateString() || "",
          details: `${c.name} · ${c.email}${!c.read ? " — NEW" : ""}`,
          rawData: c,
        })),
        ...rsvps.map(r => ({
          id: r.id || "", type: "rsvp" as const,
          title: `RSVP: ${r.fullName} for ${r.eventTitle}`,
          date: r.createdAt?.toDate?.()?.toLocaleDateString() || "",
          details: `${r.email} · ${r.attendees} attendee(s) — ${r.status}`,
          status: r.status,
          rawData: r,
        })),
      ];
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(items);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, type: string, newStatus: string) => {
    try {
      const target = notifications.find(n => n.id === id);
      if (type === "rsvp") {
        await updateRSVP(id, { status: newStatus as any });
      } else if (type === "enrollment") {
        await updateEnrollment(id, { status: newStatus as any });
      } else if (type === "event_request") {
        await updateSchedulingRequest(id, { status: newStatus as any });
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: newStatus, details: n.details.replace(/— \w+$/, `— ${newStatus}`) } : n));
      if (user && target) logActivity({ userId: user.uid, userEmail: user.email || "", userName: user.displayName || user.email || "Board Member", action: `${type}_status_update`, details: `Updated ${type} ${target.title} to ${newStatus}`, targetType: type, targetId: id });
    } catch (err) {
      console.error(`Failed to update ${type}:`, err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markContactSubmissionRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, details: n.details.replace(" — NEW", "") } : n));
      const target = notifications.find(n => n.id === id);
      if (user && target) logActivity({ userId: user.uid, userEmail: user.email || "", userName: user.displayName || user.email || "Board Member", action: "contact_mark_read", details: `Marked contact submission as read: ${target.title}`, targetType: "contact", targetId: id });
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);
  const countByType = (type: string) => type === "all" ? notifications.length : notifications.filter(n => n.type === type).length;

  const renderDetails = (n: NotificationItem) => {
    const r = n.rawData;
    switch (n.type) {
      case "enrollment":
        return (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
            <DetailItem label="Full Name" value={r.fullName} />
            <DetailItem label="Email" value={r.email} />
            <DetailItem label="Phone" value={r.phone} />
            <DetailItem label="Program" value={r.program} />
            <DetailItem label="Status" value={r.status} />
            <DetailItem label="Date" value={r.date} />
            {r.message && <DetailItem label="Message" value={r.message} fullWidth />}
            {r.adminNotes && <DetailItem label="Admin Notes" value={r.adminNotes} fullWidth />}
          </div>
        );
      case "event_request":
        return (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
            <DetailItem label="First Name" value={r.organizer?.firstName} />
            <DetailItem label="Last Name" value={r.organizer?.lastName} />
            <DetailItem label="Email" value={r.organizer?.email} />
            <DetailItem label="Phone" value={r.organizer?.phone} />
            <DetailItem label="Event Title" value={r.eventTitle} />
            <DetailItem label="Category" value={r.category} />
            <DetailItem label="Start" value={r.start} />
            <DetailItem label="End" value={r.end} />
            <DetailItem label="Location" value={r.location} />
            <DetailItem label="Facility" value={r.facility} />
            <DetailItem label="Status" value={r.status} />
            {r.description && <DetailItem label="Description" value={r.description} fullWidth />}
            {r.comments && <DetailItem label="Comments" value={r.comments} fullWidth />}
          </div>
        );
      case "contact":
        return (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
            <DetailItem label="Name" value={r.name} />
            <DetailItem label="Email" value={r.email} />
            <DetailItem label="Subject" value={r.subject} />
            <DetailItem label="Read" value={r.read ? "Yes" : "No"} />
            {r.message && <DetailItem label="Message" value={r.message} fullWidth />}
          </div>
        );
      case "rsvp":
        return (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
            <DetailItem label="Full Name" value={r.fullName} />
            <DetailItem label="Email" value={r.email} />
            <DetailItem label="Phone" value={r.phone} />
            <DetailItem label="Event" value={r.eventTitle} />
            <DetailItem label="Attendees" value={r.attendees} />
            <DetailItem label="Status" value={r.status} />
            {r.notes && <DetailItem label="Notes" value={r.notes} fullWidth />}
          </div>
        );
      default:
        return null;
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />
      <div className="pt-32 text-center"><p className="text-gray-500">Loading notifications...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />
      <div className="pt-28 pb-8 px-4 max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-mhma-gold mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-500 mb-6">Click any notification to view full details.</p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "contact", "event_request", "enrollment", "rsvp"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === f ? "bg-mhma-forest text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}>
              {f === "all" ? "All" : f === "contact" ? "Contact" : f === "event_request" ? "Event Requests" : f === "enrollment" ? "Enrollments" : "RSVPs"}
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
            <div key={n.id} className={`bg-white rounded-xl border transition-all ${expandedId === n.id ? "border-mhma-gold/30 shadow-md" : "border-gray-100 hover:shadow-md"}`}>
              <div
                className="p-4 cursor-pointer flex items-start gap-4"
                onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
              >
                <div className={`p-2 rounded-full shrink-0 ${
                  n.type === "contact" ? "bg-blue-50 text-blue-600" :
                  n.type === "event_request" ? "bg-amber-50 text-amber-600" :
                  n.type === "rsvp" ? "bg-mhma-cream text-mhma-gold" : "bg-green-50 text-green-600"
                }`}>
                  {n.type === "contact" ? <Mail className="w-5 h-5" /> :
                   n.type === "event_request" ? <Calendar className="w-5 h-5" /> :
                   n.type === "rsvp" ? <Users className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{n.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{n.details}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.date}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {n.status === "pending" && n.type !== "contact" && (
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(n.id, n.type, n.type === "rsvp" ? "confirmed" : "approved"); }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                          <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(n.id, n.type, n.type === "rsvp" ? "cancelled" : "rejected"); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                      )}
                      {n.type === "contact" && !n.rawData.read && (
                        <button onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Mark as Read"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.66l5-3.33a2 2 0 012.22 0l5 3.33a2 2 0 01.89 1.66V19a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11l9 6 9-6" /></svg></button>
                      )}
                      {expandedId === n.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                </div>
              </div>
              {expandedId === n.id && (
                <div className="px-4 pb-4">
                  {renderDetails(n)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  if (!value) return null;
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-gray-800 font-medium ${fullWidth ? "detail-item-value-full" : "detail-item-value"}`}>{value}</p>
    </div>
  );
}
