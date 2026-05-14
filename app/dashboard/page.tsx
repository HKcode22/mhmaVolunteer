"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Heart, LogOut, Edit, Plus, Trash2, BookOpen, Bell, Key, Copy, Check, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  fetchEvents, deleteEvent,
  fetchPrograms, deleteProgram,
  fetchJournalEntries, deleteJournalEntry,
  fetchEnrollments, deleteEnrollment,
  fetchSchedulingRequests, deleteSchedulingRequest,
  generateInviteCode, fetchInviteCodes, deleteInviteCode,
  FirebaseEvent, FirebaseProgram, FirebaseJournalEntry, FirebaseEnrollment, FirebaseSchedulingRequest, InviteCode,
} from "@/lib/firebase";
import Navigation from "@/components/Navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isBoardMember, loading: authLoading, signOut } = useAuth();
  const [programs, setPrograms] = useState<FirebaseProgram[]>([]);
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [journals, setJournals] = useState<FirebaseJournalEntry[]>([]);
  const [eventRequests, setEventRequests] = useState<FirebaseSchedulingRequest[]>([]);
  const [enrollments, setEnrollments] = useState<FirebaseEnrollment[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllJournals, setShowAllJournals] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [showAllEnrollments, setShowAllEnrollments] = useState(false);
  const [showAllCodes, setShowAllCodes] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");
  const [codeMsg, setCodeMsg] = useState("");

  useEffect(() => {
    if (!authLoading && !isBoardMember) {
      router.push("/login");
      return;
    }
    if (authLoading) return;

    const loadAll = async () => {
      try {
        const [p, e, j, er, en, codes] = await Promise.all([
          fetchPrograms(100),
          fetchEvents(100),
          fetchJournalEntries(100),
          fetchSchedulingRequests(100),
          fetchEnrollments(100),
          fetchInviteCodes(),
        ]);
        setPrograms(p);
        setEvents(e);
        setJournals(j);
        setEventRequests(er);
        setEnrollments(en);
        setInviteCodes(codes);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
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
    } catch (err) {
      console.error("Failed to delete code:", err);
    }
  };

  const handleDelete = async (
    id: string,
    title: string,
    type: "program" | "event" | "journal" | "request" | "enrollment"
  ) => {
    if (deletingId === id) return;
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      switch (type) {
        case "program": await deleteProgram(id); setPrograms(p => p.filter(x => x.id !== id)); break;
        case "event": await deleteEvent(id); setEvents(p => p.filter(x => x.id !== id)); break;
        case "journal": await deleteJournalEntry(id); setJournals(p => p.filter(x => x.id !== id)); break;
        case "request": await deleteSchedulingRequest(id); setEventRequests(p => p.filter(x => x.id !== id)); break;
        case "enrollment": await deleteEnrollment(id); setEnrollments(p => p.filter(x => x.id !== id)); break;
      }
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="dashboard" />
        <div className="pt-32 text-center"><p className="text-gray-500">Loading dashboard...</p></div>
      </div>
    );
  }

  const visiblePrograms = showAllPrograms ? programs : programs.slice(0, 5);
  const visibleEvents = showAllEvents ? events : events.slice(0, 5);
  const visibleJournals = showAllJournals ? journals : journals.slice(0, 5);
  const visibleRequests = showAllRequests ? eventRequests : eventRequests.slice(0, 5);
  const visibleEnrollments = showAllEnrollments ? enrollments : enrollments.slice(0, 5);
  const visibleCodes = showAllCodes ? inviteCodes : inviteCodes.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />

      <div className="pt-28 pb-8 px-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome, {user?.displayName || "Board Member"}</p>
          </div>
          <button onClick={() => { signOut(); router.push("/login"); }} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/dashboard/programs/new" className="bg-teal-800 text-white p-4 rounded-xl hover:bg-teal-700 transition-all flex flex-col items-center justify-center gap-2">
            <Plus className="w-6 h-6" /><span className="font-semibold text-sm">Add Program</span>
          </Link>
          <Link href="/dashboard/events/new" className="bg-amber-600 text-white p-4 rounded-xl hover:bg-amber-500 transition-all flex flex-col items-center justify-center gap-2">
            <Plus className="w-6 h-6" /><span className="font-semibold text-sm">Add Event</span>
          </Link>
          <Link href="/dashboard/journal/new" className="bg-teal-800 text-white p-4 rounded-xl hover:bg-teal-700 transition-all flex flex-col items-center justify-center gap-2">
            <BookOpen className="w-6 h-6" /><span className="font-semibold text-sm">Journal</span>
          </Link>
          <Link href="/dashboard/notifications" className="bg-gray-700 text-white p-4 rounded-xl hover:bg-gray-600 transition-all flex flex-col items-center justify-center gap-2">
            <Bell className="w-6 h-6" /><span className="font-semibold text-sm">Notifications</span>
          </Link>
          <button onClick={handleGenerateCode} disabled={generatingCode}
            className="bg-purple-800 text-white p-4 rounded-xl hover:bg-purple-700 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50">
            <Key className="w-6 h-6" /><span className="font-semibold text-sm">Invite Code</span>
          </button>
        </div>

        {/* Programs */}
        <Section title="Programs" count={programs.length} href="/dashboard/programs/new" allShown={showAllPrograms} onToggle={() => setShowAllPrograms(!showAllPrograms)}>
          {visiblePrograms.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                <p className="text-xs text-gray-500">{p.id}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/programs/edit?id=${p.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></Link>
                <button onClick={() => p.id && handleDelete(p.id, p.title, "program")} disabled={deletingId === p.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {programs.length === 0 && <p className="text-gray-400 text-sm p-3">No programs yet.</p>}
        </Section>

        {/* Events */}
        <Section title="Events" count={events.length} href="/dashboard/events/new" allShown={showAllEvents} onToggle={() => setShowAllEvents(!showAllEvents)}>
          {visibleEvents.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{e.title}</p>
                <p className="text-xs text-gray-500">{e.date || ""} {e.time || ""}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/events/edit?id=${e.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></Link>
                <button onClick={() => e.id && handleDelete(e.id, e.title, "event")} disabled={deletingId === e.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-gray-400 text-sm p-3">No events yet.</p>}
        </Section>

        {/* Journal */}
        <Section title="Journal" count={journals.length} href="/dashboard/journal/new" allShown={showAllJournals} onToggle={() => setShowAllJournals(!showAllJournals)}>
          {visibleJournals.map(j => (
            <div key={j.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{j.title}</p>
                <p className="text-xs text-gray-500">{j.datePublished || ""}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/journal/edit?id=${j.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></Link>
                <button onClick={() => j.id && handleDelete(j.id, j.title, "journal")} disabled={deletingId === j.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {journals.length === 0 && <p className="text-gray-400 text-sm p-3">No journal entries yet.</p>}
        </Section>

        {/* Scheduling Requests */}
        <Section title="Scheduling Requests" count={eventRequests.length} href="#" allShown={showAllRequests} onToggle={() => setShowAllRequests(!showAllRequests)}>
          {visibleRequests.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{r.eventTitle}</p>
                <p className="text-xs text-gray-500">{r.organizer?.firstName} {r.organizer?.lastName} · {r.status}</p>
              </div>
              <button onClick={() => r.id && handleDelete(r.id, r.eventTitle, "request")} disabled={deletingId === r.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {eventRequests.length === 0 && <p className="text-gray-400 text-sm p-3">No scheduling requests.</p>}
        </Section>

        {/* Enrollments */}
        <Section title="Enrollments" count={enrollments.length} href="#" allShown={showAllEnrollments} onToggle={() => setShowAllEnrollments(!showAllEnrollments)}>
          {visibleEnrollments.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{e.fullName} · {e.program}</p>
                <p className="text-xs text-gray-500">{e.email} · {e.status}</p>
              </div>
              <button onClick={() => e.id && handleDelete(e.id, `${e.fullName} - ${e.program}`, "enrollment")} disabled={deletingId === e.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {enrollments.length === 0 && <p className="text-gray-400 text-sm p-3">No enrollments.</p>}
        </Section>
        {/* Invite Codes */}
        <Section title="Board Invite Codes" count={inviteCodes.length} href="#" allShown={showAllCodes} onToggle={() => setShowAllCodes(!showAllCodes)}>
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

      </div>

      <footer className="bg-gray-100 py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2026 Mountain House Muslim Association — Board Dashboard</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, count, href, children, allShown, onToggle }: {
  title: string; count: number; href: string; children: React.ReactNode; allShown: boolean; onToggle: () => void;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold text-gray-900">{title} <span className="text-gray-400 text-sm font-sans">({count})</span></h2>
        <div className="flex gap-3">
          {href !== "#" && (
            <Link href={href} className="flex items-center gap-1 text-teal-700 hover:text-teal-600 font-semibold text-sm">
              <Plus className="w-4 h-4" /> Add New
            </Link>
          )}
          {count > 5 && (
            <button onClick={onToggle} className="text-amber-600 hover:text-amber-700 text-sm font-semibold">
              {allShown ? "Show Less" : "Show All"}
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
