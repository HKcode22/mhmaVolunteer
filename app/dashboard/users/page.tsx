"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Search, Mail, Phone, Shield, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchUsers, FirebaseUser } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function UsersPage() {
  const router = useRouter();
  const { isBoardMember, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isBoardMember) router.push("/login");
    if (authLoading) return;
    fetchUsers(500).then(data => {
      setUsers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authLoading, isBoardMember, router]);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.displayName || "").toLowerCase().includes(q) || (u.firstName || "").toLowerCase().includes(q)
      || (u.lastName || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
      || (u.phone || "").includes(q);
  });

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
          <p className="text-gray-500 mb-6 text-sm">All users who have created an account on the website</p>

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
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Phone / WhatsApp</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-mhma-forest/10 flex items-center justify-center text-mhma-forest font-bold text-xs">
                              {(u.displayName || u.firstName || u.email || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${u.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Mail className="w-3 h-3" /> {u.email}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          {u.phone ? (
                            <a href={`https://wa.me/${u.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:underline">
                              <Phone className="w-3 h-3" /> {u.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === "board_member" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"
                          }`}>
                            <Shield className="w-3 h-3" /> {u.role === "board_member" ? "Board" : "Member"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {u.createdAt?.toDate?.()?.toLocaleDateString() || ""}
                          </span>
                        </td>
                      </tr>
                    ))}
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
