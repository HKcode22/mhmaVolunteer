"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, Facebook, Instagram, Twitter, Linkedin, Youtube, Heart, LogOut, Edit, Plus, Trash2, BookOpen, Bell, Key, Copy, Check, RefreshCw, Settings, ArrowUp, ArrowDown, X, BarChart3, ChevronDown, ChevronUp, Phone, Mail, MapPin, Calendar, Clock, MessageSquare, Users, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import {
  fetchEvents, deleteEvent,
  fetchPrograms, deleteProgram,
  fetchEnrollments, deleteEnrollment, updateEnrollment,
  fetchSchedulingRequests, deleteSchedulingRequest, updateSchedulingRequest,
  fetchContactSubmissions, deleteContactSubmission, markContactSubmissionRead,
  fetchRSVPs, deleteRSVP, updateRSVP,
  generateInviteCode, fetchInviteCodes, deleteInviteCode, logActivity,
  FirebaseEvent, FirebaseProgram, FirebaseEnrollment, FirebaseSchedulingRequest, FirebaseContactSubmission, FirebaseRSVP, InviteCode,
} from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isBoardMember, loading: authLoading, signOut } = useAuth();
  const [programs, setPrograms] = useState<FirebaseProgram[]>([]);
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [eventRequests, setEventRequests] = useState<FirebaseSchedulingRequest[]>([]);
  const [enrollments, setEnrollments] = useState<FirebaseEnrollment[]>([]);
  const [contactSubmissions, setContactSubmissions] = useState<FirebaseContactSubmission[]>([]);
  const [rsvps, setRSVPs] = useState<FirebaseRSVP[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [showAllEnrollments, setShowAllEnrollments] = useState(false);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [showAllRSVPs, setShowAllRSVPs] = useState(false);
  const [showAllCodes, setShowAllCodes] = useState(false);
  const [expandedDashboardId, setExpandedDashboardId] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [showCustomize, setShowCustomize] = useState(false);
  const defaultOrder = ["programs", "events", "requests", "enrollments", "rsvps", "submissions", "codes"];
  const [layoutOrder, setLayoutOrder] = useState<string[]>(defaultOrder);

  useEffect(() => {
    if (user?.uid) {
      getDoc(doc(db, "users", user.uid)).then(snap => {
        if (snap.exists() && snap.data().dashboardOrder) {
          const saved = snap.data().dashboardOrder as string[];
          const merged = [...saved];
          for (const item of defaultOrder) {
            if (!merged.includes(item)) merged.push(item);
          }
          setLayoutOrder(merged);
        }
      });
    }
  }, [user?.uid]);

  const saveLayoutOrder = async (newOrder: string[]) => {
    setLayoutOrder(newOrder);
    if (user?.uid) {
      try {
        await setDoc(doc(db, "users", user.uid), { dashboardOrder: newOrder }, { merge: true });
      } catch (err) {
        console.error("Failed to save layout:", err);
      }
    }
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...layoutOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    saveLayoutOrder(newOrder);
  };

  useEffect(() => {
    if (!authLoading && !isBoardMember) {
      router.push("/login");
      return;
    }
    if (authLoading) return;

    const timeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
      ]);

    const loadAll = async () => {
      const results = await Promise.allSettled([
        timeout(fetchPrograms(100), 15000).catch(() => [] as FirebaseProgram[]),
        timeout(fetchEvents(100), 15000).catch(() => [] as FirebaseEvent[]),
        timeout(fetchSchedulingRequests(100), 15000).catch(() => [] as FirebaseSchedulingRequest[]),
        timeout(fetchEnrollments(100), 15000).catch(() => [] as FirebaseEnrollment[]),
        timeout(fetchRSVPs(100), 15000).catch(() => [] as FirebaseRSVP[]),
        timeout(fetchContactSubmissions(100), 15000).catch(() => [] as FirebaseContactSubmission[]),
        timeout(fetchInviteCodes(), 15000).catch(() => [] as InviteCode[]),
      ]);
      const [p, e, er, en, rsvp, cs, codes] = results.map(r => (r as any).value || (r as any).reason || []);
      setPrograms(p || []);
      setEvents(e || []);
      setEventRequests(er || []);
      setEnrollments(en || []);
      setRSVPs(rsvp || []);
      setContactSubmissions(cs || []);
      setInviteCodes(codes || []);
      setLoading(false);
      if (user) logActivity({ userId: user.uid, userEmail: user.email || "", userName: user.displayName || user.email || "Board Member", action: "dashboard_view", details: "Viewed dashboard", targetType: "dashboard" });
    };
    loadAll();
  }, [authLoading, isBoardMember, router]);

  const handleGenerateCode = async () => {
    if (!user?.uid) return;
    setGeneratingCode(true);
    setCodeMsg("");
    try {
      const code = await generateInviteCode(user.uid);
      setCodeMsg(`Generated: ${code}`);
      const codes = await fetchInviteCodes();
      setInviteCodes(codes);
    } catch (err: any) {
      setCodeMsg("Failed to generate code: " + err.message);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm("Delete this invite code?")) return;
    try {
      await deleteInviteCode(id);
      setInviteCodes(codes => codes.filter(c => c.id !== id));
      setCodeMsg("");
    } catch (err) {
      console.error("Failed to delete code:", err);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    type: "enrollment" | "request",
    newStatus: string,
  ) => {
    try {
      if (type === "enrollment") {
        await updateEnrollment(id, { status: newStatus as any });
        setEnrollments(p => p.map(e => e.id === id ? { ...e, status: newStatus as any } : e));
      } else {
        await updateSchedulingRequest(id, { status: newStatus as any });
        setEventRequests(p => p.map(e => e.id === id ? { ...e, status: newStatus as any } : e));
      }
    } catch (err) {
      console.error(`Failed to update ${type}:`, err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markContactSubmissionRead(id);
      setContactSubmissions(p => p.map(s => s.id === id ? { ...s, read: true } : s));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };



  const renderDetails = (itemType: string, r: any) => {
    switch (itemType) {
      case "enrollment":
        return (
          <div className="grid grid-cols-2 gap-3 text-sm">
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
      case "rsvp":
        return (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <DetailItem label="Full Name" value={r.fullName} />
            <DetailItem label="Email" value={r.email} />
            <DetailItem label="Phone" value={r.phone} />
            <DetailItem label="Event" value={r.eventTitle} />
            <DetailItem label="Attendees" value={r.attendees} />
            <DetailItem label="Status" value={r.status} />
            {r.notes && <DetailItem label="Notes" value={r.notes} fullWidth />}
          </div>
        );
      case "submission":
        return (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <DetailItem label="Name" value={r.name} />
            <DetailItem label="Email" value={r.email} />
            <DetailItem label="Subject" value={r.subject} />
            <DetailItem label="Read" value={r.read ? "Yes" : "No"} />
            {r.message && <DetailItem label="Message" value={r.message} fullWidth />}
          </div>
        );
      default:
        return null;
    }
  };

  const handleDelete = async (
    id: string,
    title: string,
    type: "program" | "event" | "request" | "enrollment" | "rsvp" | "submission"
  ) => {
    if (deletingId === id) return;
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      switch (type) {
        case "program": await deleteProgram(id); setPrograms(p => p.filter(x => x.id !== id)); break;
        case "event": await deleteEvent(id); setEvents(p => p.filter(x => x.id !== id)); break;
        case "request": await deleteSchedulingRequest(id); setEventRequests(p => p.filter(x => x.id !== id)); break;
        case "enrollment": await deleteEnrollment(id); setEnrollments(p => p.filter(x => x.id !== id)); break;
        case "rsvp": await deleteRSVP(id); setRSVPs(p => p.filter(x => x.id !== id)); break;
        case "submission": await deleteContactSubmission(id); setContactSubmissions(p => p.filter(x => x.id !== id)); break;
      }
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-mhma-cream">
        <Navigation currentPage="dashboard" />
        <div className="pt-32 text-center"><p className="text-gray-500">Loading dashboard...</p></div>
      </div>
    );
  }

  const visiblePrograms = showAllPrograms ? programs : programs.slice(0, 5);
  const visibleEvents = showAllEvents ? events : events.slice(0, 5);
  const visibleRequests = showAllRequests ? eventRequests : eventRequests.slice(0, 5);
  const visibleEnrollments = showAllEnrollments ? enrollments : enrollments.slice(0, 5);
  const visibleRSVPs = showAllRSVPs ? rsvps : rsvps.slice(0, 5);
  const visibleSubmissions = showAllSubmissions ? contactSubmissions : contactSubmissions.slice(0, 5);
  const visibleCodes = showAllCodes ? inviteCodes : inviteCodes.slice(0, 5);

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />

      <div className="pt-28 pb-8 px-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#1C2A20]">Dashboard</h1>
              <p className="text-gray-500 mt-1">Welcome, {user?.displayName || "Board Member"}</p>
            </div>
            <button onClick={() => setShowCustomize(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-sm hover:bg-mhma-cream transition-colors text-sm font-medium text-gray-600">
              <Settings className="w-4 h-4" /> Customize
            </button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            <Link href="/dashboard/programs/new" className="bg-mhma-forest text-white p-4 rounded-sm hover:bg-mhma-forest-light transition-all flex flex-col items-center justify-center gap-2">
              <Plus className="w-6 h-6" /><span className="font-semibold text-sm">Add Program</span>
            </Link>
            <Link href="/dashboard/events/new" className="bg-mhma-forest text-white p-4 rounded-sm hover:bg-mhma-forest-light transition-all flex flex-col items-center justify-center gap-2">
              <Plus className="w-6 h-6" /><span className="font-semibold text-sm">Add Event</span>
            </Link>
            <Link href="/dashboard/analytics" className="bg-mhma-forest text-white p-4 rounded-sm hover:bg-mhma-forest-light transition-all flex flex-col items-center justify-center gap-2">
              <BarChart3 className="w-6 h-6" /><span className="font-semibold text-sm">Analytics</span>
            </Link>
            <Link href="/dashboard/activity" className="bg-mhma-forest text-white p-4 rounded-sm hover:bg-mhma-forest-light transition-all flex flex-col items-center justify-center gap-2">
              <Activity className="w-6 h-6" /><span className="font-semibold text-sm">Activity Log</span>
            </Link>
            <Link href="/dashboard/notifications" className="bg-mhma-forest text-white p-4 rounded-sm hover:bg-mhma-forest-light transition-all flex flex-col items-center justify-center gap-2">
              <Bell className="w-6 h-6" /><span className="font-semibold text-sm">Notifications</span>
            </Link>
            <Link href="/dashboard/pledges" className="bg-mhma-forest text-white p-4 rounded-sm hover:bg-mhma-forest-light transition-all flex flex-col items-center justify-center gap-2">
              <Heart className="w-6 h-6" /><span className="font-semibold text-sm">Pledges</span>
            </Link>
            <Link href="/dashboard/subscribers" className="bg-mhma-forest text-white p-4 rounded-sm hover:bg-mhma-forest-light transition-all flex flex-col items-center justify-center gap-2">
              <Mail className="w-6 h-6" /><span className="font-semibold text-sm">Subscribers</span>
            </Link>
            <Link href="/dashboard/masjid-construction" className="bg-mhma-forest text-white p-4 rounded-sm hover:bg-mhma-forest-light transition-all flex flex-col items-center justify-center gap-2">
              <Building2 className="w-6 h-6" /><span className="font-semibold text-sm">Construction</span>
            </Link>
            <Link href="/dashboard/users" className="bg-mhma-forest text-white p-4 rounded-sm hover:bg-mhma-forest-light transition-all flex flex-col items-center justify-center gap-2">
              <Users className="w-6 h-6" /><span className="font-semibold text-sm">Members</span>
            </Link>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {layoutOrder.map((section, idx) => {
          switch (section) {
            case "programs":
              return (
                <Section key="programs" title="Programs" count={programs.length} href="/dashboard/programs/new" allShown={showAllPrograms} onToggle={() => setShowAllPrograms(!showAllPrograms)} scrollable>
                  {visiblePrograms.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{p.title || "Unnamed Program"}</p>
                        <p className="text-xs text-gray-500">{p.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/programs/${p.slug}`} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="View"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></Link>
                        <Link href={`/dashboard/programs/edit?id=${p.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></Link>
                        <button onClick={() => p.id && handleDelete(p.id, p.title || "Unnamed Program", "program")} disabled={deletingId === p.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {programs.length === 0 && <p className="text-gray-400 text-sm p-3">No programs yet.</p>}
                </Section>
              );
            case "events":
              return (
                <Section key="events" title="Events" count={events.length} href="/dashboard/events/new" allShown={showAllEvents} onToggle={() => setShowAllEvents(!showAllEvents)} scrollable>
                  {visibleEvents.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{e.title}</p>
                        <p className="text-xs text-gray-500">{e.date || ""} {e.time || ""}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/events/${e.id}`} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="View"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></Link>
                        <Link href={`/dashboard/events/edit?id=${e.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></Link>
                        <button onClick={() => e.id && handleDelete(e.id, e.title, "event")} disabled={deletingId === e.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && <p className="text-gray-400 text-sm p-3">No events yet.</p>}
                </Section>
              );
            case "requests":
              return (
                <Section key="requests" title="Scheduling Requests" count={eventRequests.length} href="#" allShown={showAllRequests} onToggle={() => setShowAllRequests(!showAllRequests)} scrollable>
                  {visibleRequests.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{r.eventTitle}</p>
                        <p className="text-xs text-gray-500">{r.organizer?.firstName} {r.organizer?.lastName}
                          <span className={`ml-2 inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                            r.status === "approved" ? "bg-green-100 text-green-700" :
                            r.status === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>{r.status}</span>
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => r.id && handleUpdateStatus(r.id, "request", "approved")}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                            <button onClick={() => r.id && handleUpdateStatus(r.id, "request", "rejected")}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </>
                        )}
                        <button onClick={() => r.id && handleDelete(r.id, r.eventTitle, "request")} disabled={deletingId === r.id} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {eventRequests.length === 0 && <p className="text-gray-400 text-sm p-3">No scheduling requests.</p>}
                </Section>
              );
            case "enrollments":
              return (
                <Section key="enrollments" title="Enrollments" count={enrollments.length} href="#" allShown={showAllEnrollments} onToggle={() => setShowAllEnrollments(!showAllEnrollments)} scrollable>
                  {visibleEnrollments.map(e => (
                    <div key={e.id} className={`bg-white rounded-lg border transition-all ${expandedDashboardId === `enrollment-${e.id}` ? "border-teal-300 shadow-md" : "border-gray-100"}`}>
                      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedDashboardId(expandedDashboardId === `enrollment-${e.id}` ? null : `enrollment-${e.id}`)}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{e.fullName} · {e.program}</p>
                          <p className="text-xs text-gray-500">{e.email}
                            <span className={`ml-2 inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                              e.status === "approved" ? "bg-green-100 text-green-700" :
                              e.status === "rejected" ? "bg-red-100 text-red-700" :
                              e.status === "completed" ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>{e.status}</span>
                          </p>
                        </div>
                        <div className="flex gap-1 items-center shrink-0">
                          {e.status === "pending" && (
                            <>
                              <button onClick={(ev) => { ev.stopPropagation(); e.id && handleUpdateStatus(e.id, "enrollment", "approved"); }}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                              <button onClick={(ev) => { ev.stopPropagation(); e.id && handleUpdateStatus(e.id, "enrollment", "rejected"); }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </>
                          )}
                          {e.status === "approved" && (
                            <button onClick={(ev) => { ev.stopPropagation(); e.id && handleUpdateStatus(e.id, "enrollment", "completed"); }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Mark Completed"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                          )}
                          <button onClick={(ev) => { ev.stopPropagation(); e.id && handleDelete(e.id, `${e.fullName} - ${e.program}`, "enrollment"); }} disabled={deletingId === e.id} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"><Trash2 className="w-4 h-4" /></button>
                          {expandedDashboardId === `enrollment-${e.id}` ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
                        </div>
                      </div>
                      {expandedDashboardId === `enrollment-${e.id}` && (
                        <div className="px-3 pb-3 pt-0 border-t border-gray-100 mt-0">
                          {renderDetails("enrollment", e)}
                        </div>
                      )}
                    </div>
                  ))}
                  {enrollments.length === 0 && <p className="text-gray-400 text-sm p-3">No enrollments.</p>}
                </Section>
              );
            case "rsvps":
              return (
                <Section key="rsvps" title="Event RSVPs" count={rsvps.length} href="#" allShown={showAllRSVPs} onToggle={() => setShowAllRSVPs(!showAllRSVPs)} scrollable>
                  {visibleRSVPs.map(r => (
                    <div key={r.id} className={`bg-white rounded-lg border transition-all ${expandedDashboardId === `rsvp-${r.id}` ? "border-teal-300 shadow-md" : "border-gray-100"}`}>
                      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedDashboardId(expandedDashboardId === `rsvp-${r.id}` ? null : `rsvp-${r.id}`)}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{r.fullName} · {r.eventTitle}</p>
                          <p className="text-xs text-gray-500">{r.email} · {r.attendees} attendee(s)
                            <span className={`ml-2 inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                              r.status === "confirmed" ? "bg-green-100 text-green-700" :
                              r.status === "cancelled" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>{r.status}</span>
                          </p>
                        </div>
                        <div className="flex gap-1 items-center shrink-0">
                          {r.status === "pending" && (
                            <>
                              <button onClick={(ev) => { ev.stopPropagation(); r.id && updateRSVP(r.id, { status: "confirmed" }).then(() => setRSVPs(p => p.map(x => x.id === r.id ? { ...x, status: "confirmed" } : x))); }}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Confirm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                              <button onClick={(ev) => { ev.stopPropagation(); r.id && updateRSVP(r.id, { status: "cancelled" }).then(() => setRSVPs(p => p.map(x => x.id === r.id ? { ...x, status: "cancelled" } : x))); }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancel"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </>
                          )}
                          <button onClick={(ev) => { ev.stopPropagation(); r.id && handleDelete(r.id, `${r.fullName} - ${r.eventTitle}`, "rsvp"); }} disabled={deletingId === r.id} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"><Trash2 className="w-4 h-4" /></button>
                          {expandedDashboardId === `rsvp-${r.id}` ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
                        </div>
                      </div>
                      {expandedDashboardId === `rsvp-${r.id}` && (
                        <div className="px-3 pb-3 pt-0 border-t border-gray-100 mt-0">
                          {renderDetails("rsvp", r)}
                        </div>
                      )}
                    </div>
                  ))}
                  {rsvps.length === 0 && <p className="text-gray-400 text-sm p-3">No RSVPs yet.</p>}
                </Section>
              );
            case "submissions":
              return (
                <Section key="submissions" title="Contact Submissions" count={contactSubmissions.length} href="#" allShown={showAllSubmissions} onToggle={() => setShowAllSubmissions(!showAllSubmissions)} scrollable>
                  {visibleSubmissions.map(s => (
                    <div key={s.id} className={`bg-white rounded-lg border transition-all ${expandedDashboardId === `sub-${s.id}` ? "border-teal-300 shadow-md" : "border-gray-100"}`}>
                      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedDashboardId(expandedDashboardId === `sub-${s.id}` ? null : `sub-${s.id}`)}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{s.subject || "(no subject)"}</p>
                          <p className="text-xs text-gray-500">{s.name} · {s.email}{!s.read ? <span className="text-amber-600 font-medium ml-2">NEW</span> : null}</p>
                        </div>
                        <div className="flex gap-1 items-center shrink-0">
                          {!s.read && (
                            <button onClick={(ev) => { ev.stopPropagation(); s.id && handleMarkRead(s.id); }}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Mark as Read"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.66l5-3.33a2 2 0 012.22 0l5 3.33a2 2 0 01.89 1.66V19a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11l9 6 9-6" /></svg></button>
                          )}
                          <button onClick={(ev) => { ev.stopPropagation(); s.id && handleDelete(s.id, s.subject || "submission", "submission"); }} disabled={deletingId === s.id} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"><Trash2 className="w-4 h-4" /></button>
                          {expandedDashboardId === `sub-${s.id}` ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
                        </div>
                      </div>
                      {expandedDashboardId === `sub-${s.id}` && (
                        <div className="px-3 pb-3 pt-0 border-t border-gray-100 mt-0">
                          {renderDetails("submission", s)}
                        </div>
                      )}
                    </div>
                  ))}
                  {contactSubmissions.length === 0 && <p className="text-gray-400 text-sm p-3">No contact submissions.</p>}
                </Section>
              );
            case "codes":
              return (
                <Section key="codes" title="Board Invite Codes" count={inviteCodes.length} href="#" allShown={showAllCodes} onToggle={() => setShowAllCodes(!showAllCodes)} scrollable>
                  {codeMsg && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3 flex items-center justify-between">
                      <p className="text-sm text-purple-800 font-medium">{codeMsg}</p>
                      {codeMsg.startsWith("Generated:") && (
                        <button onClick={() => handleCopyCode(codeMsg.replace("Generated: ", ""))}
                          className="ml-2 p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors">
                          {copiedCode === codeMsg.replace("Generated: ", "") ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  )}
                  <button onClick={handleGenerateCode} disabled={generatingCode}
                    className="w-full mb-3 bg-purple-800 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <RefreshCw className={`w-4 h-4 ${generatingCode ? "animate-spin" : ""}`} />
                    {generatingCode ? "Generating..." : "Generate New Code"}
                  </button>
                  {visibleCodes.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-bold text-lg text-purple-900 tracking-wider">{c.code}</p>
                        <p className="text-xs text-gray-500">
                          {c.used ? `Used by ${c.usedBy || "someone"}` : "Available"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!c.used && (
                          <button onClick={() => handleCopyCode(c.code)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded">
                            {copiedCode === c.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                        <button onClick={() => c.id && handleDeleteCode(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {inviteCodes.length === 0 && !generatingCode && (
                    <p className="text-gray-400 text-sm p-3">No invite codes yet. Generate one to share with new board members.</p>
                  )}
                </Section>
              );
            default:
              return null;
          }
        })}
        </div>

      </div>

      {/* Customize Layout Modal */}
      {showCustomize && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCustomize(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Customize Dashboard Layout</h2>
              <button onClick={() => setShowCustomize(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-gray-500 text-sm mb-4">Use the arrows to reorder sections. Changes are saved automatically.</p>
            <div className="space-y-2">
              {layoutOrder.map((section, idx) => (
                <div key={section} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="font-medium text-gray-900 capitalize">
                    {section === "requests" ? "Scheduling Requests" : section === "codes" ? "Invite Codes" : section === "submissions" ? "Contact Submissions" : section === "rsvps" ? "Event RSVPs" : section}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => moveSection(idx, "up")} disabled={idx === 0}
                      className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveSection(idx, "down")} disabled={idx === layoutOrder.length - 1}
                      className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => {
              saveLayoutOrder(["programs", "events", "requests", "enrollments", "rsvps", "submissions", "codes"]);
            }} className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Reset to Default
            </button>
          </div>
        </div>
      )}

      <footer className="bg-[#040E08] py-8 border-t border-gray-200/10">
        <div className="max-w-6xl mx-auto px-4 text-center text-[#2A4A35] text-sm">
          <p>© 2026 Mountain House Muslim Association — Board Dashboard</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, count, href, children, allShown, onToggle, scrollable }: {
  title: string; count: number; href: string; children: React.ReactNode; allShown: boolean; onToggle: () => void; scrollable?: boolean;
}) {
  return (
    <div className={`bg-white rounded-sm p-6 border border-[#E8E2D4] ${scrollable ? "max-h-[420px] flex flex-col" : ""}`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xl font-serif font-bold text-[#1C2A20]">{title} <span className="text-gray-400 text-sm font-sans">({count})</span></h2>
        <div className="flex gap-3">
          {href !== "#" && (
            <Link href={href} className="flex items-center gap-1 text-mhma-gold hover:text-mhma-gold-light font-semibold text-sm">
              <Plus className="w-4 h-4" /> Add New
            </Link>
          )}
          {count > 5 && (
            <button onClick={onToggle} className="text-mhma-gold hover:text-mhma-gold-light text-sm font-semibold shrink-0">
              {allShown ? "Show Less" : "Show All"}
            </button>
          )}
        </div>
      </div>
      <div className={`space-y-2 ${scrollable ? "overflow-y-auto flex-1 pr-1" : ""}`}>{children}</div>
    </div>
  );
}

function DetailItem({ label, value, fullWidth }: { label: string; value?: string; fullWidth?: boolean }) {
  if (!value) return null;
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-gray-800 font-medium">{value}</p>
    </div>
  );
}
