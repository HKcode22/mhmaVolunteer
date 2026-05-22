"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, User, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchActivityLog, ActivityLogEntry } from "@/lib/firebase";
import Navigation from "@/components/Navigation";

export default function ActivityLogPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    fetchActivityLog(200).then(data => {
      setEntries(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const actionIcon = (action: string) => {
    if (action.includes("create")) return "➕";
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
