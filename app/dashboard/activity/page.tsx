"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, User, Activity, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchActivityLog, fetchVersions, restoreVersion, ActivityLogEntry } from "@/lib/firebase";
import Navigation from "@/components/Navigation";

export default function ActivityLogPage() {
  const router = useRouter();
  const { user, isBoardMember, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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
      console.log("Revert: fetching versions for", entry.targetType, entry.targetId);
      const versions = await fetchVersions(entry.targetType, entry.targetId);
      console.log("Revert: found versions count:", versions.length);
      if (versions.length === 0) {
        setMessage("No previous versions available for this item. Versions are saved automatically when you update a program or event from the dashboard. Make sure you have made updates first.");
        setRestoring(null);
        return;
      }
      const latestVersion = versions[0];
      console.log("Revert: latest version id:", latestVersion.id);
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
      console.error("Revert: error during restore:", err);
      setMessage("Error during restore. Check browser console for details.");
    } finally {
      setRestoring(null);
    }
  };

  const actionIcon = (action: string) => {
    if (action.includes("create") || action === "restore") return "➕";
    if (action.includes("update") || action.includes("status")) return "✏️";
    if (action.includes("view")) return "👁️";
    if (action.includes("read")) return "📖";
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
          <p className="text-gray-500 mb-6 text-sm">Board member actions and changes across the site</p>

          {message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">{message}</div>
          )}

          {entries.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activity logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => (
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
                          <User className="w-3 h-3" /> {entry.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {entry.action.replace(/_/g, " ")}
                        </span>
                        {entry.targetType && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{entry.targetType}</span>
                        )}
                      </div>
                    </div>
                    {(entry.action === "program_update" || entry.action === "event_update") && entry.targetType && entry.targetId && (
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
