"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import PageBanner from "@/components/PageBanner";
import { Upload, Camera, User, Phone, MapPin, Users, Calendar, AlertCircle } from "lucide-react";

interface UserProfile {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  roles: string[];
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_date?: string;
  family_size?: string | number;
  profile_pic?: string | number;
  profile_pic_url?: string;
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
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    membership_date: "",
    family_size: "",
    profile_pic_id: "",
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
        const profilePicId = userData.profile_pic;
        let profilePicUrl = "";
        if (profilePicId && typeof profilePicId === "number") {
          const mediaResp = await fetch(`${WP_API_URL}/wp/v2/media/${profilePicId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (mediaResp.ok) {
            const mediaData = await mediaResp.json();
            profilePicUrl = mediaData.source_url || "";
          }
        } else if (typeof profilePicId === "string" && profilePicId.startsWith("http")) {
          profilePicUrl = profilePicId;
        }
        const profileData = {
          ...userData,
          profile_pic_url: profilePicUrl,
        };
        setProfile(profileData);
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          phone: userData.phone || "",
          address: userData.address || "",
          emergency_contact_name: userData.emergency_contact_name || "",
          emergency_contact_phone: userData.emergency_contact_phone || "",
          membership_date: userData.membership_date || "",
          family_size: userData.family_size?.toString() || "",
          profile_pic_id: typeof profilePicId === "number" ? profilePicId.toString() : "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    setError("");
    const token = localStorage.getItem("jwt_token");
    if (!token) return;

    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://my-wp-backend.duckdns.org/wp-json";
      const formDataImage = new FormData();
      formDataImage.append("file", file);

      const uploadResponse = await fetch(`${WP_API_URL}/wp/v2/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataImage,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const mediaData = await uploadResponse.json();
      const mediaId = mediaData.id;

      const updateResp = await fetch(`${WP_API_URL}/mhma/v1/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profile_pic_id: mediaId }),
      });

      if (updateResp.ok) {
        const updated = await updateResp.json();
        setProfile((prev) => prev ? { ...prev, profile_pic_id: mediaId, profile_pic_url: mediaData.source_url } : null);
        setFormData((prev) => ({ ...prev, profile_pic_id: mediaId.toString() }));
        setSuccess("Profile picture updated!");
        fetchProfile(token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const token = localStorage.getItem("jwt_token");
    if (!token) return;

    const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://my-wp-backend.duckdns.org/wp-json";

    try {
      const response = await fetch(`${WP_API_URL}/mhma/v1/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          membership_date: formData.membership_date,
          family_size: formData.family_size,
          profile_pic_id: formData.profile_pic_id ? parseInt(formData.profile_pic_id) : undefined,
        }),
      });

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        setEditing(false);
        fetchProfile(token);
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
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
              {/* Profile Picture */}
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  {profile?.profile_pic_url ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-[#c9a227]">
                      <Image src={profile.profile_pic_url} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-teal-800 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold border-4 border-[#c9a227]">
                      {profile?.first_name?.charAt(0) || profile?.username?.charAt(0) || "?"}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#c9a227] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#8c7622] transition-colors border-2 border-white">
                    <Camera className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingPic} />
                  </label>
                </div>
                {uploadingPic && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                <h2 className="text-2xl font-bold text-gray-800">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile?.name || profile?.username || "Member"}
                </h2>
                <p className="text-gray-500 text-sm">{profile?.email}</p>
                {profile?.roles && profile.roles.length > 0 && (
                  <span className="inline-block mt-2 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-200">
                    {profile.roles[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                )}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Family Size</label>
                      <input
                        type="number"
                        value={formData.family_size}
                        onChange={(e) => setFormData({ ...formData, family_size: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none"
                        placeholder="Number of family members"
                        min="1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none"
                        rows={2}
                        placeholder="123 Main St, Mountain House, CA 95391"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none"
                        placeholder="(555) 987-6543"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Membership Date</label>
                      <input
                        type="date"
                        value={formData.membership_date}
                        onChange={(e) => setFormData({ ...formData, membership_date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none"
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
                      disabled={saving}
                      className="px-6 py-3 bg-[#c9a227] text-white rounded-md hover:bg-[#8c7622] disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-md flex items-start gap-3">
                      <User className="w-5 h-5 text-[#c9a227] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Name</p>
                        <p className="font-medium">{profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : "—"}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md flex items-start gap-3">
                      <User className="w-5 h-5 text-[#c9a227] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Username</p>
                        <p className="font-medium">{profile?.username || "—"}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md flex items-start gap-3">
                      <Phone className="w-5 h-5 text-[#c9a227] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                        <p className="font-medium">{profile?.phone || "—"}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md flex items-start gap-3">
                      <Users className="w-5 h-5 text-[#c9a227] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Family Size</p>
                        <p className="font-medium">{profile?.family_size || "—"}</p>
                      </div>
                    </div>
                    <div className="md:col-span-2 p-4 bg-gray-50 rounded-md flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#c9a227] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Address</p>
                        <p className="font-medium">{profile?.address || "—"}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#c9a227] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Emergency Contact</p>
                        <p className="font-medium">{profile?.emergency_contact_name || "—"}</p>
                        {profile?.emergency_contact_phone && (
                          <p className="text-sm text-gray-600">{profile.emergency_contact_phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-[#c9a227] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Member Since</p>
                        <p className="font-medium">{profile?.membership_date || "—"}</p>
                      </div>
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
