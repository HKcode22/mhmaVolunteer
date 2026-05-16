"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";
import { uploadImage } from "@/lib/upload";
import { Upload, Loader2, User } from "lucide-react";
import Navigation from "@/components/Navigation";
import PageBanner from "@/components/PageBanner";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState({
    phone: "", address: "", emergencyContactName: "", emergencyContactPhone: "",
    membershipDate: "", familySize: "", photoUrl: "",
  });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user) {
      getDoc(doc(db, "users", user.uid)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            phone: data.phone || "",
            address: data.address || "",
            emergencyContactName: data.emergencyContactName || "",
            emergencyContactPhone: data.emergencyContactPhone || "",
            membershipDate: data.membershipDate || "",
            familySize: data.familySize || "",
            photoUrl: data.photoUrl || "",
          });
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setError("");
    try {
      const url = await uploadImage(file);
      setProfile(prev => ({ ...prev, photoUrl: url }));
      setSuccess("Photo uploaded!");
    } catch (err: any) {
      setError(err.message || "Photo upload failed");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      await setDoc(doc(db, "users", user.uid), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
      setSuccess("Profile updated!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) { setError("Passwords don't match"); return; }
    if (!user?.email) { setError("No email on file"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordForm.current);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, passwordForm.new);
      setSuccess("Password changed!");
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      setError(err.code === "auth/wrong-password" ? "Current password is incorrect" : err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="profile" />
      <div className="pt-32 text-center"><p className="text-gray-500">Loading...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="profile" />
      <PageBanner title="My Profile" highlightedText="Profile" subtitle="Manage your account and personal information." currentPage="profile" />
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-800">{error}</p></div>}
        {success && <div className="p-4 bg-green-50 border border-green-200 rounded-md"><p className="text-sm text-green-800">{success}</p></div>}

        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
          <p className="text-gray-500 text-sm mb-4">{user?.email} · {user?.displayName}</p>

          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-teal-700 transition-colors">
                <Upload className="w-4 h-4" />
                {photoUploading ? "Uploading..." : "Upload Photo"}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={photoUploading} className="hidden" />
              </label>
              {photoUploading && <Loader2 className="w-4 h-4 mt-1 animate-spin text-teal-700" />}
              {profile.photoUrl && (
                <button onClick={() => setProfile(prev => ({ ...prev, photoUrl: "" }))} className="text-xs text-red-600 mt-1 hover:underline">
                  Remove
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Size</label>
                <input type="number" value={profile.familySize} onChange={e => setProfile({ ...profile, familySize: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" placeholder="123 Main St, Mountain House, CA" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input type="text" value={profile.emergencyContactName} onChange={e => setProfile({ ...profile, emergencyContactName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                <input type="text" value={profile.emergencyContactPhone} onChange={e => setProfile({ ...profile, emergencyContactPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" placeholder="(555) 987-6543" />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input type="text" autoComplete="username" value={user?.email || ""} readOnly className="hidden" aria-hidden="true" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                autoComplete="current-password" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  autoComplete="new-password" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  autoComplete="new-password" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" required />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50">
              {saving ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
