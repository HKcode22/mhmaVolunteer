"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import PageBanner from "@/components/PageBanner";

interface UserProfile {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  roles: string[];
  avatar_url?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      router.push("/login?redirect=/profile");
    } else {
      setIsLoggedIn(true);
      fetchProfile(token);
    }
    setCheckingAuth(false);
  }, [router]);

  const fetchProfile = async (token: string) => {
    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://my-wp-backend.duckdns.org/wp-json";
      const response = await fetch(`${WP_API_URL}/wp/v2/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setProfile(userData);
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          phone: userData.meta?.phone || "",
          address: userData.meta?.address || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("jwt_token");
    if (!token || !profile) return;

    const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://my-wp-backend.duckdns.org/wp-json";

    try {
      const response = await fetch(`${WP_API_URL}/wp/v2/users/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
        }),
      });

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        setEditing(false);
        fetchProfile(token);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    localStorage.removeItem("first_name");
    window.location.href = "/login";
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#c9a227] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="profile" />
      <PageBanner
        title="My Profile"
        highlightedText="Profile"
        subtitle="Manage your account information and preferences."
        currentPage="profile"
      />

      <main className="pt-8">
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-teal-800 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.first_name?.charAt(0) || profile?.username?.charAt(0) || "?"}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile?.name || profile?.username || "Member"}
                </h2>
                <p className="text-gray-500 text-sm">{profile?.email}</p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              {editing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#c9a227] text-white rounded-md hover:bg-[#8c7622]"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-500 uppercase">First Name</p>
                      <p className="font-medium">{profile?.first_name || "—"}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-500 uppercase">Last Name</p>
                      <p className="font-medium">{profile?.last_name || "—"}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-500 uppercase">Email</p>
                      <p className="font-medium">{profile?.email}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-500 uppercase">Username</p>
                      <p className="font-medium">{profile?.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-end mt-6">
                    <button
                      onClick={() => setEditing(true)}
                      className="px-6 py-3 bg-[#c9a227] text-white rounded-md hover:bg-[#8c7622]"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-6 py-3 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/enroll" className="block p-6 bg-white rounded-lg border border-gray-100 hover:border-amber-400 hover:shadow-lg transition-all text-center">
                <p className="text-2xl mb-2">📋</p>
                <h3 className="font-semibold text-gray-800">Enroll in Programs</h3>
                <p className="text-xs text-gray-500 mt-1">Join our community programs</p>
              </Link>
              <Link href="/programs" className="block p-6 bg-white rounded-lg border border-gray-100 hover:border-amber-400 hover:shadow-lg transition-all text-center">
                <p className="text-2xl mb-2">📚</p>
                <h3 className="font-semibold text-gray-800">Browse Programs</h3>
                <p className="text-xs text-gray-500 mt-1">Explore all available programs</p>
              </Link>
              <Link href="/events" className="block p-6 bg-white rounded-lg border border-gray-100 hover:border-amber-400 hover:shadow-lg transition-all text-center">
                <p className="text-2xl mb-2">📅</p>
                <h3 className="font-semibold text-gray-800">View Events</h3>
                <p className="text-xs text-gray-500 mt-1">Upcoming community events</p>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
