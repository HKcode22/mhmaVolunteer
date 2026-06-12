"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import {
  ArrowLeft, User, Search, Mail, Shield,
  ChevronDown, ChevronRight, CheckCircle, XCircle, Minus,
  DollarSign, BookOpen, Calendar, Newspaper, Trash2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  fetchUsers, fetchSubscribers, fetchEnrollments, fetchRSVPs,
  fetchPledges, fetchDonations, fetchAllNews, fetchSchedulingRequests,
  Subscriber, FirebaseEnrollment, FirebaseRSVP, Pledge, Donation,
  NewsItem, FirebaseSchedulingRequest, FirebaseUser
} from "@/lib/firebase";
import { db } from "@/lib/firebase-client";
import { doc, deleteDoc } from "firebase/firestore";
import Navigation from "@/app/components/Navigation";

export default function UsersPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [enrollments, setEnrollments] = useState<FirebaseEnrollment[]>([]);
  const [rsvps, setRSVPs] = useState<FirebaseRSVP[]>([]);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [schedulingRequests, setSchedulingRequests] = useState<FirebaseSchedulingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;

    Promise.all([
      fetchUsers(500),
      fetchSubscribers(500),
      fetchEnrollments(500),
      fetchRSVPs(500),
      fetchPledges(500),
      fetchDonations(500),
      fetchAllNews(500),
      fetchSchedulingRequests(500),
    ]).then(([usersData, subs, enrolls, rsvpData, pledgeData, donationData, news, schedReqs]) => {
      setUsers(usersData);
      setSubscribers(subs);
      setEnrollments(enrolls);
      setRSVPs(rsvpData);
      setPledges(pledgeData);
      setDonations(donationData);
      setNewsItems(news);
      setSchedulingRequests(schedReqs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.displayName || "").toLowerCase().includes(q) || (u.firstName || "").toLowerCase().includes(q)
      || (u.lastName || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
      || (u.phone || "").includes(q);
  });

  const getSubscription = (email: string) =>
    subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());

  const getUserEnrollments = (email: string) =>
    enrollments.filter(e => e.email.toLowerCase() === email.toLowerCase());

  const getUserRSVPs = (email: string) =>
    rsvps.filter(r => r.email.toLowerCase() === email.toLowerCase());

  const getUserPledges = (user: FirebaseUser) =>
    pledges.filter(p => p.email.toLowerCase() === user.email.toLowerCase() || (user.id && p.userUid === user.id));

  const getUserDonations = (user: FirebaseUser) =>
    donations.filter(d => d.donorEmail.toLowerCase() === user.email.toLowerCase() || (user.id && d.donorId === user.id));

  const getUserNews = (user: FirebaseUser) => {
    const name = (user.displayName || `${user.firstName || ""} ${user.lastName || ""}`).trim().toLowerCase();
    return newsItems.filter(n =>
      n.authorName?.toLowerCase() === name ||
      n.authorName?.toLowerCase() === user.email.toLowerCase()
    );
  };

  const getUserSchedulingRequests = (email: string) =>
    schedulingRequests.filter(r => r.organizer.email.toLowerCase() === email.toLowerCase());

  const handleDelete = async (user: FirebaseUser, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user.id) return;
    if (!confirm(`Delete user "${user.displayName || user.email}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", user.id));
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  if (authLoading || loading) {
    return <div className="pt-32 text-center"><p className="text-gray-500">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-4 font-semibold">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registered Members</h1>
          <p className="text-gray-500 mb-6 text-sm">All users who have created an account on the website. Click a row to expand details.</p>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search by name, email, or phone..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{search ? "No matching users found." : "No registered users yet."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-8 px-2 py-3"></th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isExpanded = expandedUserId === u.id;
                      const userEnrollments = getUserEnrollments(u.email);
                      const userRSVPs = getUserRSVPs(u.email);
                      const userPledges = getUserPledges(u);
                      const userDonations = getUserDonations(u);
                      const userNews = getUserNews(u);
                      const userSchedReqs = getUserSchedulingRequests(u.email);
                      const sub = getSubscription(u.email);

                      return (
                        <Fragment key={u.id}>
                          <tr
                            className="border-b border-gray-100 cursor-pointer"
                            onClick={() => setExpandedUserId(isExpanded ? null : u.id || null)}
                          >
                            <td className="w-8 px-2 py-3">
                              <button onClick={(e) => { e.stopPropagation(); setExpandedUserId(isExpanded ? null : u.id || null); }} className="p-1 hover:bg-gray-100 rounded transition-colors">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-mhma-forest/10 flex items-center justify-center text-mhma-forest font-bold text-xs">
                                  {(u.displayName || u.firstName || u.email || "?").charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-gray-900">{u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <a href={`mailto:${u.email}`} className="flex items-center gap-1 text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                                <Mail className="w-3 h-3" /> {u.email}
                              </a>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                u.role === "board_member" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"
                              }`}>
                                <Shield className="w-3 h-3" /> {u.role === "board_member" ? "Board" : "Member"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={(e) => handleDelete(u, e)}
                                className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${u.id}-detail`}>
                              <td colSpan={6} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                      <Mail className="w-3 h-3" /> Newsletter
                                    </h4>
                                    {!sub ? (
                                      <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Minus className="w-3 h-3" /> Not found</span>
                                    ) : sub.status === "active" ? (
                                      <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Active</span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-xs text-red-500"><XCircle className="w-3 h-3" /> Unsubscribed</span>
                                    )}

                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 flex items-center gap-1">
                                      <BookOpen className="w-3 h-3" /> Enrollments ({userEnrollments.length})
                                    </h4>
                                    {userEnrollments.length === 0 ? (
                                      <p className="text-xs text-gray-400">None</p>
                                    ) : (
                                      <ul className="space-y-1">
                                        {userEnrollments.map(e => (
                                          <li key={e.id} className="text-xs flex items-center justify-between gap-2">
                                            <span className="text-gray-700 truncate">{e.program}</span>
                                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                              e.status === "approved" ? "bg-green-100 text-green-700" :
                                              e.status === "completed" ? "bg-blue-100 text-blue-700" :
                                              e.status === "rejected" ? "bg-red-100 text-red-700" :
                                              "bg-amber-100 text-amber-700"
                                            }`}>{e.status}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> RSVPs ({userRSVPs.length})
                                    </h4>
                                    {userRSVPs.length === 0 ? (
                                      <p className="text-xs text-gray-400">None</p>
                                    ) : (
                                      <ul className="space-y-1">
                                        {userRSVPs.map(r => (
                                          <li key={r.id} className="text-xs flex items-center justify-between gap-2">
                                            <span className="text-gray-700 truncate">{r.eventTitle}</span>
                                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                              r.status === "confirmed" ? "bg-green-100 text-green-700" :
                                              r.status === "cancelled" ? "bg-red-100 text-red-700" :
                                              "bg-amber-100 text-amber-700"
                                            }`}>{r.status}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}

                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" /> Pledges ({userPledges.length})
                                    </h4>
                                    {userPledges.length === 0 ? (
                                      <p className="text-xs text-gray-400">None</p>
                                    ) : (
                                      <ul className="space-y-1">
                                        {userPledges.map(p => (
                                          <li key={p.id} className="text-xs flex items-center justify-between gap-2">
                                            <span className="text-gray-700">${p.amount.toFixed(2)}</span>
                                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                              p.status === "fulfilled" ? "bg-green-100 text-green-700" :
                                              p.status === "cancelled" ? "bg-red-100 text-red-700" :
                                              "bg-amber-100 text-amber-700"
                                            }`}>{p.status}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" /> Donations ({userDonations.length})
                                    </h4>
                                    {userDonations.length === 0 ? (
                                      <p className="text-xs text-gray-400">None</p>
                                    ) : (
                                      <ul className="space-y-1">
                                        {userDonations.map(d => (
                                          <li key={d.id} className="text-xs text-gray-700">
                                            ${d.amount.toFixed(2)} — {d.designation}
                                          </li>
                                        ))}
                                      </ul>
                                    )}

                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 flex items-center gap-1">
                                      <Newspaper className="w-3 h-3" /> News Articles ({userNews.length})
                                    </h4>
                                    {userNews.length === 0 ? (
                                      <p className="text-xs text-gray-400">None</p>
                                    ) : (
                                      <ul className="space-y-1">
                                        {userNews.map(n => (
                                          <li key={n.id} className="text-xs text-gray-700 truncate">{n.title}</li>
                                        ))}
                                      </ul>
                                    )}

                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> Scheduling Requests ({userSchedReqs.length})
                                    </h4>
                                    {userSchedReqs.length === 0 ? (
                                      <p className="text-xs text-gray-400">None</p>
                                    ) : (
                                      <ul className="space-y-1">
                                        {userSchedReqs.map(s => (
                                          <li key={s.id} className="text-xs flex items-center justify-between gap-2">
                                            <span className="text-gray-700 truncate">{s.eventTitle}</span>
                                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                              s.status === "approved" ? "bg-green-100 text-green-700" :
                                              s.status === "rejected" ? "bg-red-100 text-red-700" :
                                              "bg-amber-100 text-amber-700"
                                            }`}>{s.status}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4">{filteredUsers.length} member{filteredUsers.length !== 1 ? "s" : ""} total</p>
        </div>
      </main>
    </div>
  );
}
