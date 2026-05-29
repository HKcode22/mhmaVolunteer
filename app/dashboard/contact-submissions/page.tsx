"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Mail, Phone, Clock, MessageSquare, CheckCircle, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchContactSubmissions, markContactSubmissionRead, deleteContactSubmission, FirebaseContactSubmission } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function DashboardContactSubmissionsPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FirebaseContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    fetchContactSubmissions(100).then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || i.subject.toLowerCase().includes(q);
  });

  if (authLoading || loading) return <div className="pt-32 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="dashboard" />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-4 font-semibold">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Submissions</h1>
          <p className="text-gray-500 mb-6 text-sm">Messages submitted through the contact form.</p>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or subject..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-mhma-gold outline-none text-sm" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center"><MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{search ? "No matching submissions." : "No contact submissions yet."}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Contact</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Subject</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Read</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(i => (
                      <tr key={i.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!i.read ? "bg-blue-50/50" : ""}`}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{i.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <a href={`mailto:${i.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail className="w-3 h-3" /> {i.email}</a>
                            {i.phone && <a href={`tel:${i.phone}`} className="flex items-center gap-1 text-gray-500 hover:underline"><Phone className="w-3 h-3" /> {i.phone}</a>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{i.subject}</td>
                        <td className="px-4 py-3">{i.read ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Eye className="w-4 h-4 text-amber-500" />}</td>
                        <td className="px-4 py-3 text-gray-500"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {i.createdAt?.toDate?.()?.toLocaleDateString() || ""}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {!i.read && (
                              <button onClick={() => { markContactSubmissionRead(i.id!).then(() => setItems(prev => prev.map(x => x.id === i.id ? { ...x, read: true } : x))); }}
                                className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Mark as read">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => { if (!confirm("Delete this submission?")) return; deleteContactSubmission(i.id!).then(() => setItems(prev => prev.filter(x => x.id !== i.id))); }}
                              className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4">{filtered.length} submission{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </main>
    </div>
  );
}
