"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { ArrowLeft, Clock, User, Activity, RotateCcw, Filter } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchActivityLog, fetchVersions, restoreVersion, ActivityLogEntry } from "@/lib/firebase";
import { invalidateCache } from "@/lib/cache-manager";
import Navigation from "@/app/components/Navigation";

export default function ActivityLogPage() {
  const router = useRouter();
  const { user, isBoardMember, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [tab, setTab] = useState<"activity" | "reverts">("activity");
  const [myActivityOnly, setMyActivityOnly] = useState(false);
  const [revertFilter, setRevertFilter] = useState<"all" | "mine" | "others">("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/cleanup-activity", { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.uid) {
      getDoc(doc(db, "users", user.uid)).then(snap => {
        const prefs = snap.data()?.activityLogPrefs;
        if (prefs) {
          if (typeof prefs.myActivityOnly === "boolean") setMyActivityOnly(prefs.myActivityOnly);
          if (prefs.revertFilter) setRevertFilter(prefs.revertFilter);
        }
      }).catch(() => {});
    }
  }, [user?.uid]);

  const savePrefs = useCallback(async (prefs: { myActivityOnly?: boolean; revertFilter?: string }) => {
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, "users", user.uid), { activityLogPrefs: prefs }, { merge: true });
      invalidateCache('users');
    } catch (err) {
      console.error("Failed to save activity log prefs:", err);
    }
  }, [user?.uid]);

  const loadEntries = useCallback(() => {
    if (authLoading) return;
    if (!isBoardMember) { router.push("/login"); return; }
    fetchActivityLog(200).then(data => {
      setEntries(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleRevert = async (entry: ActivityLogEntry) => {
    if (!entry.targetType || !entry.targetId || !user) return;
    if (!window.confirm(`Revert this ${entry.targetType} to a previous version? This will restore the last saved snapshot.`)) return;
    setRestoring(entry.id || "reverting");
    setMessage("");
    try {
      const versions = await fetchVersions(entry.targetType, entry.targetId);
      if (versions.length === 0) {
        setMessage("No previous versions available for this item. Versions are saved automatically when you update a program or event from the dashboard.");
        setRestoring(null);
        return;
      }
      const latestVersion = versions[0];
      const success = await restoreVersion(
        latestVersion.id,
        user.uid,
        user.email || "",
        user.displayName || user.email || "Board Member"
      );
      if (success) {
        setMessage(`Restored ${entry.targetType} to previous version. Refreshing log...`);
        setTimeout(() => { loadEntries(); setMessage(""); }, 1500);
      } else {
        setMessage("Failed to restore version.");
      }
    } catch (err) {
      console.error("Error during restore:", err);
      setMessage("Error during restore. Check browser console for details.");
    } finally {
      setRestoring(null);
    }
  };

  const toggleMyActivity = () => {
    const next = !myActivityOnly;
    setMyActivityOnly(next);
    savePrefs({ myActivityOnly: next, revertFilter });
  };

  const setRevertFilterAndSave = (val: "all" | "mine" | "others") => {
    setRevertFilter(val);
    savePrefs({ myActivityOnly, revertFilter: val });
  };

  const filteredEntries = entries.filter(e => {
    if (tab === "reverts" && e.action !== "restore") return false;
    if (tab === "activity" && e.action === "restore") return false;
    if (myActivityOnly && e.userId !== user?.uid) return false;
    if (memberFilter !== "all" && e.userId !== memberFilter) return false;
    if (tab === "reverts") {
      if (revertFilter === "mine" && e.userId !== user?.uid) return false;
      if (revertFilter === "others" && e.userId === user?.uid) return false;
    }
    return true;
  });

  // Build list of unique board members from entries
  const boardMembers = entries.reduce((acc: { id: string; name: string }[], e) => {
    if (!acc.find(m => m.id === e.userId)) {
      acc.push({ id: e.userId, name: e.userName || e.userEmail || "Unknown" });
    }
    return acc;
  }, []);

  const actionIcon = (action?: string) => {
    const a = action || "";
    if (a.includes("create") || a === "restore") return "➕";
    if (a.includes("update") || a.includes("status")) return "✏️";
    if (a.includes("view")) return "👁️";
    if (a.includes("read")) return "📖";
    return "📋";
  };

  if (authLoading || loading) return <div className="pt-32 text-center"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center text-[#c9a227] hover:text-[#8c7622] mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Log</h1>
          <p className="text-gray-500 mb-6 text-sm">Track board member actions and revert changes</p>

          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setTab("activity")} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === "activity" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                All Activity
              </button>
              <button onClick={() => setTab("reverts")} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === "reverts" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                Reverts
              </button>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={myActivityOnly} onChange={toggleMyActivity} className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                <Filter className="w-3 h-3" /> My activity only
              </label>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-xs text-gray-400">Member:</span>
                <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-amber-500 outline-none">
                  <option value="all">All members</option>
                  {boardMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}{m.id === user?.uid ? " (you)" : ""}</option>
                  ))}
                </select>
              </div>

              {tab === "reverts" && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-xs text-gray-400">Show:</span>
                  {(["all", "mine", "others"] as const).map(v => (
                    <button key={v} onClick={() => setRevertFilterAndSave(v)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${revertFilter === v ? "bg-amber-100 text-amber-800" : "text-gray-500 hover:text-gray-700"}`}>
                      {v === "all" ? "All" : v === "mine" ? "My reverts" : "Others' reverts"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-mhma-cream border border-mhma-forest/20 rounded-lg text-sm text-mhma-forest font-medium">{message}</div>
          )}

          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{tab === "reverts" ? "No reverts found." : "No activity logged yet."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry, i) => {
                const canRevert = tab === "activity" && (entry.action === "program_update" || entry.action === "event_update") && entry.targetType && entry.targetId;
                return (
                  <div key={entry.id || i} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-amber-300 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5 shrink-0">{actionIcon(entry.action)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold text-gray-900 truncate">{entry.details}</p>
                          <span className="text-xs text-gray-400 shrink-0">
                            {entry.createdAt?.toDate?.()?.toLocaleString() || ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {entry.userName}{entry.userId === user?.uid ? " (you)" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {(entry.action || "").replace(/_/g, " ")}
                          </span>
                          {entry.targetType && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{entry.targetType}</span>
                          )}
                          {entry.action === "restore" && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Revert</span>
                          )}
                        </div>
                      </div>
                      {canRevert && (
                        <button
                          onClick={() => handleRevert(entry)}
                          disabled={restoring !== null}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className={`w-3 h-3 ${restoring === (entry.id || "reverting") ? "animate-spin" : ""}`} />
                          {restoring === (entry.id || "reverting") ? "..." : "Revert"}
                        </button>
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
