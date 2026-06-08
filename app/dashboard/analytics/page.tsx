"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Users, Calendar, BookOpen, Mail, Clock, CheckCircle, UserPlus, Eye, Activity, Save, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  fetchEnrollments, fetchSchedulingRequests, fetchContactSubmissions,
  fetchEvents, fetchPrograms, fetchJournalEntries, fetchInviteCodes, fetchRSVPs, fetchUsers,
  fetchDonations, fetchPledges,
  FirebaseEnrollment, FirebaseSchedulingRequest, FirebaseContactSubmission,
  FirebaseEvent, FirebaseProgram, FirebaseJournalEntry, InviteCode, FirebaseRSVP, FirebaseUser,
  Donation, Pledge,
} from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";
import { auth } from "@/lib/firebase-client";

interface AnalyticsData {
  enrollments: FirebaseEnrollment[];
  requests: FirebaseSchedulingRequest[];
  submissions: FirebaseContactSubmission[];
  events: FirebaseEvent[];
  programs: FirebaseProgram[];
  journals: FirebaseJournalEntry[];
  inviteCodes: InviteCode[];
  rsvps: FirebaseRSVP[];
  users: FirebaseUser[];
  donations: Donation[];
  pledges: Pledge[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isBoardMember, loading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"30" | "90" | "365" | "all">("90");

  useEffect(() => {
    if (!authLoading && !isBoardMember) {
      router.push("/login");
      return;
    }
    if (authLoading) return;

    const loadAll = async () => {
      const [enrollments, requests, submissions, events, programs, journals, inviteCodes, rsvps, users, donations, pledges] = await Promise.all([
        fetchEnrollments(500),
        fetchSchedulingRequests(500),
        fetchContactSubmissions(500),
        fetchEvents(500),
        fetchPrograms(500),
        fetchJournalEntries(500),
        fetchInviteCodes(),
        fetchRSVPs(500),
        fetchUsers(500),
        fetchDonations(500),
        fetchPledges(200),
      ]);
      setData({ enrollments, requests, submissions, events, programs, journals, inviteCodes, rsvps, users, donations, pledges });
      setLoading(false);
    };
    loadAll();
  }, [authLoading, isBoardMember, router]);

  if (authLoading || loading || !data) {
    return (
      <div className="min-h-screen bg-mhma-cream">
        <Navigation currentPage="dashboard" />
        <div className="pt-32 text-center"><p className="text-gray-500">Loading analytics...</p></div>
      </div>
    );
  }

  const now = new Date();
  const cutoffDate = timeRange === "all" ? new Date(0) : new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

  const filterByDate = (items: any[]) => items.filter(item => {
    if (!item.createdAt) return false;
    const d = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
    return d >= cutoffDate;
  });

  const filteredEnrollments = filterByDate(data.enrollments);
  const filteredRequests = filterByDate(data.requests);
  const filteredSubmissions = filterByDate(data.submissions);
  const filteredRSVPs = filterByDate(data.rsvps);
  const filteredUsers = filterByDate(data.users);

  const enrollmentByStatus = {
    pending: filteredEnrollments.filter(e => e.status === "pending").length,
    approved: filteredEnrollments.filter(e => e.status === "approved").length,
    rejected: filteredEnrollments.filter(e => e.status === "rejected").length,
    completed: filteredEnrollments.filter(e => e.status === "completed").length,
  };

  const requestsByStatus = {
    pending: filteredRequests.filter(r => r.status === "pending").length,
    approved: filteredRequests.filter(r => r.status === "approved").length,
    rejected: filteredRequests.filter(r => r.status === "rejected").length,
  };

  const rsvpByStatus = {
    pending: filteredRSVPs.filter(r => r.status === "pending").length,
    confirmed: filteredRSVPs.filter(r => r.status === "confirmed").length,
    cancelled: filteredRSVPs.filter(r => r.status === "cancelled").length,
  };

  const enrollmentByProgram: Record<string, number> = {};
  filteredEnrollments.forEach(e => {
    enrollmentByProgram[e.program] = (enrollmentByProgram[e.program] || 0) + 1;
  });

  const rsvpByEvent: Record<string, number> = {};
  filteredRSVPs.forEach(r => {
    rsvpByEvent[r.eventTitle] = (rsvpByEvent[r.eventTitle] || 0) + 1;
  });

  const monthlyData: Record<string, { enrollments: number; rsvps: number; submissions: number; users: number }> = {};
  const addMonthly = (items: any[], key: "enrollments" | "rsvps" | "submissions" | "users") => {
    items.forEach(item => {
      if (!item.createdAt) return;
      const d = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      const monthKey = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { enrollments: 0, rsvps: 0, submissions: 0, users: 0 };
      monthlyData[monthKey][key]++;
    });
  };
  addMonthly(filteredEnrollments, "enrollments");
  addMonthly(filteredRSVPs, "rsvps");
  addMonthly(filteredSubmissions, "submissions");
  addMonthly(filteredUsers, "users");

  const totalEnrollments = filteredEnrollments.length;
  const approvalRate = totalEnrollments > 0 ? Math.round(((enrollmentByStatus.approved + enrollmentByStatus.completed) / totalEnrollments) * 100) : 0;
  const totalRSVPs = filteredRSVPs.length;
  const totalSubmissions = filteredSubmissions.length;
  const totalUsers = data.users.length;
  const recentUsers = filteredUsers.length;

  const monthlyEntries = Object.entries(monthlyData).slice(-8);

  const userRoleBreakdown: Record<string, number> = {};
  data.users.forEach(u => {
    const role = u.role || "member";
    userRoleBreakdown[role] = (userRoleBreakdown[role] || 0) + 1;
  });

  const engagementScore = totalEnrollments + totalRSVPs + totalSubmissions;

  // Donation stats
  const totalDonations = data.donations.length;
  const totalDonationAmount = data.donations.reduce((s, d) => s + (d.amount || 0), 0);
  const donationByDesignation: Record<string, { count: number; total: number }> = {};
  data.donations.forEach(d => {
    const des = d.designation || "other";
    if (!donationByDesignation[des]) donationByDesignation[des] = { count: 0, total: 0 };
    donationByDesignation[des].count++;
    donationByDesignation[des].total += d.amount;
  });
  const donationByMethod: Record<string, number> = {};
  data.donations.forEach(d => {
    const method = d.method || "other";
    donationByMethod[method] = (donationByMethod[method] || 0) + d.amount;
  });
  const stripeDonations = data.donations.filter(d => d.method === "stripe").length;
  const pendingPledges = data.pledges.filter(p => p.status === "pending").length;
  const fulfilledPledges = data.pledges.filter(p => p.status === "fulfilled").length;
  const totalPledgeAmount = data.pledges.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />

      <div className="pt-28 pb-8 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-mhma-cream rounded-sm transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-500 mt-1">Board metrics, user engagement, and trends</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(["30", "90", "365", "all"] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-mhma-forest text-white"
                    : "bg-white border border-[#E8E2D4] text-gray-600 hover:bg-mhma-cream"
                }`}
              >
                {range === "all" ? "All" : `${range}d`}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={totalUsers} color="bg-blue-50 text-blue-700" iconBg="bg-blue-100" />
          <StatCard icon={<UserPlus className="w-5 h-5" />} label="New Users" value={recentUsers} color="bg-indigo-50 text-indigo-700" iconBg="bg-indigo-100" />
          <StatCard icon={<Activity className="w-5 h-5" />} label="Engagement Score" value={engagementScore} color="bg-purple-50 text-purple-700" iconBg="bg-purple-100" />
          <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Approval Rate" value={`${approvalRate}%`} color="bg-green-50 text-green-700" iconBg="bg-green-100" />
        </div>

        {/* Donation Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Donations" value={totalDonations} color="bg-amber-50 text-amber-700" iconBg="bg-amber-100" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Donated" value={`$${(totalDonationAmount / 100).toLocaleString()}`} color="bg-green-50 text-green-700" iconBg="bg-green-100" />
          <StatCard icon={<Calendar className="w-5 h-5" />} label="Stripe Payments" value={stripeDonations} color="bg-blue-50 text-blue-700" iconBg="bg-blue-100" />
          <StatCard icon={<Calendar className="w-5 h-5" />} label="Pledges Pending" value={pendingPledges} color="bg-purple-50 text-purple-700" iconBg="bg-purple-100" />
        </div>

        {/* About Stats Editor */}
        <AboutStatsEditor />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Activity Overview */}
          <Card title="Monthly Activity Overview" fullWidth>
            <div className="space-y-4">
              {monthlyEntries.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500 font-medium">Month</th>
                        <th className="text-center py-2 text-blue-600 font-medium">Enrollments</th>
                        <th className="text-center py-2 text-teal-600 font-medium">RSVPs</th>
                        <th className="text-center py-2 text-amber-600 font-medium">Contacts</th>
                        <th className="text-center py-2 text-indigo-600 font-medium">New Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyEntries.map(([month, counts]) => (
                        <tr key={month} className="border-b border-gray-100">
                          <td className="py-2 font-medium text-gray-700">{month}</td>
                          <td className="py-2 text-center text-blue-600">{counts.enrollments}</td>
                          <td className="py-2 text-center text-teal-600">{counts.rsvps}</td>
                          <td className="py-2 text-center text-amber-600">{counts.submissions}</td>
                          <td className="py-2 text-center text-indigo-600">{counts.users}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* User Role Breakdown */}
          <Card title="User Role Breakdown">
            <div className="space-y-3">
              {Object.entries(userRoleBreakdown).map(([role, count]) => {
                const maxCount = Math.max(...Object.values(userRoleBreakdown), 1);
                const colors: Record<string, string> = { administrator: "bg-red-500", board_member: "bg-teal-500", member: "bg-blue-500", guest: "bg-gray-400" };
                return (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 capitalize">{role.replace("_", " ")}</span>
                      <span className="text-gray-500 font-medium">{count}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: colors[role] || "#6b7280" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Enrollment Status Donut */}
          <Card title="Enrollment Status">
            <DonutChart
              data={[
                { label: "Pending", value: enrollmentByStatus.pending, color: "#f59e0b" },
                { label: "Approved", value: enrollmentByStatus.approved, color: "#10b981" },
                { label: "Rejected", value: enrollmentByStatus.rejected, color: "#ef4444" },
                { label: "Completed", value: enrollmentByStatus.completed, color: "#3b82f6" },
              ]}
              total={totalEnrollments}
            />
          </Card>

          {/* RSVP Status Donut */}
          <Card title="RSVP Status">
            <DonutChart
              data={[
                { label: "Pending", value: rsvpByStatus.pending, color: "#f59e0b" },
                { label: "Confirmed", value: rsvpByStatus.confirmed, color: "#10b981" },
                { label: "Cancelled", value: rsvpByStatus.cancelled, color: "#ef4444" },
              ]}
              total={totalRSVPs}
            />
          </Card>

          {/* Enrollments by Program */}
          <Card title="Enrollments by Program">
            <HorizontalBarChart data={enrollmentByProgram} color="#10b981" />
          </Card>

          {/* RSVPs by Event */}
          <Card title="RSVPs by Event">
            <HorizontalBarChart data={rsvpByEvent} color="#14b8a6" />
          </Card>

          {/* Donations by Designation */}
          <Card title="Donations by Designation">
            <HorizontalBarChart
              data={Object.fromEntries(
                Object.entries(donationByDesignation).map(([k, v]) => [k, v.count])
              )}
              color="#f59e0b"
            />
          </Card>

          {/* Donations by Method (Amount) */}
          <Card title="Donation Amount by Method">
            <HorizontalBarChart
              data={Object.fromEntries(
                Object.entries(donationByMethod).map(([k, v]) => [k, Math.round(v / 100)])
              )}
              color="#3b82f6"
            />
          </Card>

          {/* Quick Stats */}
          <Card title="Quick Stats">
            <div className="space-y-3">
              <QuickStat label="Total Programs" value={data.programs.length} icon={<BookOpen className="w-4 h-4" />} />
              <QuickStat label="Journal Entries" value={data.journals.length} icon={<TrendingUp className="w-4 h-4" />} />
              <QuickStat label="Pending Requests" value={requestsByStatus.pending} icon={<Clock className="w-4 h-4" />} />
              <QuickStat label="Unread Messages" value={data.submissions.filter(s => !s.read).length} icon={<Mail className="w-4 h-4" />} />
              <QuickStat label="Pending RSVPs" value={rsvpByStatus.pending} icon={<Calendar className="w-4 h-4" />} />
              <QuickStat label="Total RSVPs" value={totalRSVPs} icon={<Users className="w-4 h-4" />} />
              <QuickStat label="Invite Codes Generated" value={data.inviteCodes.length} icon={<UserPlus className="w-4 h-4" />} />
              <QuickStat label="Invite Codes Used" value={data.inviteCodes.filter(c => c.used).length} icon={<CheckCircle className="w-4 h-4" />} />
              <QuickStat label="Pending Pledges" value={pendingPledges} icon={<Clock className="w-4 h-4" />} />
              <QuickStat label="Fulfilled Pledges" value={fulfilledPledges} icon={<CheckCircle className="w-4 h-4" />} />
            </div>
          </Card>

          {/* User Engagement Graph */}
          <Card title="User Engagement Trend">
            {monthlyEntries.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data available</p>
            ) : (
              <div className="flex items-end gap-3 h-32">
                {monthlyEntries.map(([month, counts]) => {
                  const total = counts.enrollments + counts.rsvps + counts.submissions + counts.users;
                  const maxTotal = Math.max(...monthlyEntries.map(([, c]) => c.enrollments + c.rsvps + c.submissions + c.users), 1);
                  return (
                    <div key={month} className="flex flex-col items-center flex-1">
                      <span className="text-xs text-gray-600 mb-1">{total}</span>
                      <div className="w-full rounded-t transition-all bg-gradient-to-t from-teal-700 to-teal-500" style={{ height: `${(total / maxTotal) * 100}px` }} />
                      <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">{month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <Card title="Recent Activity">
            <div className="space-y-3">
              {getRecentActivity(data).slice(0, 10).map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${activity.iconBg}`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${activity.badgeClass}`}>
                    {activity.status}
                  </span>
                </div>
              ))}
              {getRecentActivity(data).length === 0 && (
                <p className="text-gray-400 text-sm p-3 text-center">No recent activity.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, iconBg }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <span className={color}>{icon}</span>
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children, fullWidth }: { title: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-200 ${fullWidth ? "lg:col-span-2" : ""}`}>
      <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function DonutChart({ data, total }: {
  data: { label: string; value: number; color: string }[]; total: number;
}) {
  if (total === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No data available</p>;
  }

  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const segments = data.filter(d => d.value > 0).map(d => {
    const percent = d.value / total;
    const offset = cumulativePercent;
    cumulativePercent += percent;
    return { ...d, percent, offset, dashArray: `${percent * circumference} ${circumference}`, dashOffset: -offset * circumference };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, idx) => (
          <circle
            key={idx}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="fill-gray-900 text-2xl font-bold">
          {total}
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-gray-600">{seg.label} ({seg.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, color }: { data: Record<string, number>; color: string }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 8);
  if (entries.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No data available</p>;
  }

  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-3">
      {entries.map(([label, value], idx) => (
        <div key={idx}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 truncate">{label}</span>
            <span className="text-gray-500 font-medium">{value}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(value / maxVal) * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AboutStatsEditor() {
  const [yearsServing, setYearsServing] = useState<number>(0);
  const [numberOfFamilies, setNumberOfFamilies] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/about-stats");
      const data = await res.json();
      setYearsServing(data.yearsServing ?? 0);
      setNumberOfFamilies(data.numberOfFamilies ?? 0);
    } catch {
      setMessage("Failed to load stats");
    }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/about-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ yearsServing, numberOfFamilies }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMessage("Saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.message || "Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-gray-900">About Stats</h2>
          <p className="text-sm text-gray-500">Set years serving and number of families displayed on the website</p>
        </div>
        <button onClick={fetchStats} disabled={loading} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Years Serving</label>
          <input
            type="number"
            min={0}
            value={yearsServing}
            onChange={(e) => setYearsServing(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-mhma-forest"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Families</label>
          <input
            type="number"
            min={0}
            value={numberOfFamilies}
            onChange={(e) => setNumberOfFamilies(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-mhma-forest"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-mhma-forest text-white rounded-lg text-sm font-medium hover:bg-mhma-forest-light transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save"}
        </button>
        {message && (
          <span className={`text-sm ${message === "Saved successfully" ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{icon}</span>
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}

function getRecentActivity(data: AnalyticsData) {
  const activities: { title: string; time: string; status: string; badgeClass: string; icon: React.ReactNode; iconBg: string }[] = [];
  const toDate = (ts: any): Date => ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date(0);

  data.enrollments.slice(0, 5).forEach(e => {
    activities.push({
      title: `${e.fullName} enrolled in ${e.program}`,
      time: toDate(e.createdAt).toLocaleDateString(),
      status: e.status,
      badgeClass: e.status === "approved" ? "bg-green-100 text-green-700" : e.status === "rejected" ? "bg-red-100 text-red-700" : e.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700",
      icon: <Users className="w-4 h-4 text-blue-600" />,
      iconBg: "bg-blue-100",
    });
  });

  data.rsvps.slice(0, 3).forEach(r => {
    activities.push({
      title: `RSVP: ${r.fullName} for ${r.eventTitle}`,
      time: toDate(r.createdAt).toLocaleDateString(),
      status: r.status,
      badgeClass: r.status === "confirmed" ? "bg-green-100 text-green-700" : r.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
      icon: <Calendar className="w-4 h-4 text-teal-600" />,
      iconBg: "bg-teal-100",
    });
  });

  data.requests.slice(0, 3).forEach(r => {
    activities.push({
      title: `Scheduling request: ${r.eventTitle}`,
      time: toDate(r.createdAt).toLocaleDateString(),
      status: r.status,
      badgeClass: r.status === "approved" ? "bg-green-100 text-green-700" : r.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
      icon: <Calendar className="w-4 h-4 text-purple-600" />,
      iconBg: "bg-purple-100",
    });
  });

  data.submissions.slice(0, 3).forEach(s => {
    activities.push({
      title: `Contact: ${s.name} - ${s.subject || "(no subject)"}`,
      time: toDate(s.createdAt).toLocaleDateString(),
      status: s.read ? "Read" : "New",
      badgeClass: s.read ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-700",
      icon: <Mail className="w-4 h-4 text-amber-600" />,
      iconBg: "bg-amber-100",
    });
  });

  data.users.slice(0, 3).forEach(u => {
    activities.push({
      title: `New user registered: ${u.displayName || u.email}`,
      time: toDate(u.createdAt).toLocaleDateString(),
      status: u.role,
      badgeClass: "bg-indigo-100 text-indigo-700",
      icon: <UserPlus className="w-4 h-4 text-indigo-600" />,
      iconBg: "bg-indigo-100",
    });
  });

  activities.sort((a, b) => b.time.localeCompare(a.time));
  return activities;
}
