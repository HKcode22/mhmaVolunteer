"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { updatePassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updateProfile, verifyBeforeUpdateEmail, PhoneAuthProvider, RecaptchaVerifier, linkWithCredential } from "firebase/auth";
import { auth, db } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";
import { uploadImage } from "@/lib/upload";
import { Upload, Loader2, User, Eye, EyeOff, Smartphone } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState({
    firstName: "", lastName: "", phone: "", address: "", emergencyContactName: "", emergencyContactPhone: "",
    membershipDate: "", familySize: "", photoUrl: "",
  });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Email change state
  const [emailForm, setEmailForm] = useState({ password: "", newEmail: "" });
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailStep, setEmailStep] = useState<"form" | "sms" | "done">("form");
  const [smsCode, setSmsCode] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsVerifying, setSmsVerifying] = useState(false);
  const [smsError, setSmsError] = useState("");
  const [verificationId, setVerificationId] = useState("");

  // Phone change
  const [newPhone, setNewPhone] = useState("");
  const [phoneFormPassword, setPhoneFormPassword] = useState("");
  const [showPhonePassword, setShowPhonePassword] = useState(false);
  const [changingPhone, setChangingPhone] = useState(false);
  const [phoneStep, setPhoneStep] = useState<"form" | "sms" | "done">("form");
  const [phoneSmsCode, setPhoneSmsCode] = useState("");
  const [phoneSmsSending, setPhoneSmsSending] = useState(false);
  const [phoneSmsVerifying, setPhoneSmsVerifying] = useState(false);
  const [phoneSmsError, setPhoneSmsError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user) {
      getDoc(doc(db, "users", user.uid)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          const existingFirst = data.firstName || "";
          const existingLast = data.lastName || "";
          const existingDisplayName = data.displayName || user.displayName || "";
          let firstName = existingFirst;
          let lastName = existingLast;
          if (!firstName && !lastName && existingDisplayName) {
            const parts = existingDisplayName.split(" ");
            firstName = parts[0] || "";
            lastName = parts.slice(1).join(" ");
          }
          setProfile({
            firstName,
            lastName,
            phone: data.phone || "",
            address: data.address || "",
            emergencyContactName: data.emergencyContactName || "",
            emergencyContactPhone: data.emergencyContactPhone || "",
            membershipDate: data.membershipDate || "",
            familySize: data.familySize || "",
            photoUrl: data.photoUrl || "",
          });
        } else {
          let firstName = "";
          let lastName = "";
          if (user.displayName) {
            const parts = user.displayName.split(" ");
            firstName = parts[0] || "";
            lastName = parts.slice(1).join(" ");
          }
          setProfile(prev => ({ ...prev, firstName, lastName }));
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
      const displayName = `${profile.firstName} ${profile.lastName}`.trim() || undefined;
      await setDoc(doc(db, "users", user.uid), { ...profile, displayName, updatedAt: serverTimestamp() }, { merge: true });
      if (auth.currentUser && displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }
      if (refreshUser) await refreshUser();
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

  const getRecaptchaVerifier = (): RecaptchaVerifier | null => {
    if (!recaptchaVerifierRef.current && recaptchaRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: "invisible",
      });
    }
    return recaptchaVerifierRef.current;
  };

  const sendSmsCode = async (phone: string): Promise<string> => {
    const verifier = getRecaptchaVerifier();
    if (!verifier) throw new Error("Recaptcha not ready");
    const provider = new PhoneAuthProvider(auth);
    return await provider.verifyPhoneNumber(phone, verifier);
  };

  const verifySmsCode = async (vId: string, code: string): Promise<void> => {
    const credential = PhoneAuthProvider.credential(vId, code);
    try {
      await reauthenticateWithCredential(auth.currentUser!, credential);
    } catch (reauthErr: any) {
      if (reauthErr.code === "auth/user-mismatch") {
        await linkWithCredential(auth.currentUser!, credential);
      } else {
        throw reauthErr;
      }
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) { setError("No email on file"); return; }
    if (emailForm.newEmail === user.email) { setError("New email is the same as current."); return; }
    setChangingEmail(true); setError(""); setSuccess("");
    try {
      const credential = EmailAuthProvider.credential(user.email, emailForm.password);
      await reauthenticateWithCredential(auth.currentUser!, credential);

      if (profile.phone) {
        setSmsSending(true);
        const vId = await sendSmsCode(profile.phone);
        setVerificationId(vId);
        setEmailStep("sms");
        setSmsSending(false);
        setSuccess("SMS verification code sent to your phone.");
        return;
      }

      await finishEmailChange(user.email!, emailForm.newEmail);
    } catch (err: any) {
      const msg = err.code === "auth/requires-recent-login" ? "Please log out and log back in before changing your email." : err.message;
      setError(msg);
      setEmailStep("form");
    } finally {
      setChangingEmail(false);
    }
  };

  const handleSmsVerify = async () => {
    if (!user?.email || !verificationId) return;
    setSmsVerifying(true); setSmsError(""); setError("");
    try {
      await verifySmsCode(verificationId, smsCode);
      await finishEmailChange(user.email!, emailForm.newEmail);
    } catch (err: any) {
      setSmsError(err.code === "auth/invalid-verification-code" ? "Incorrect code. Please try again." : err.message);
    } finally {
      setSmsVerifying(false);
    }
  };

  const finishEmailChange = async (oldEmail: string, newEmail: string) => {
    const idToken = await auth.currentUser!.getIdToken();
    const notifyRes = await fetch("/api/change-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ oldEmail, newEmail }),
    });
    const notifyData = await notifyRes.json();
    if (!notifyRes.ok) console.error("Old email notification failed:", notifyData.error);

    await verifyBeforeUpdateEmail(auth.currentUser!, newEmail);

    setEmailStep("done");
    setSuccess(
      `Verification sent to ${newEmail}. Check your inbox and click the link from Firebase to complete the change. ` +
      (notifyData.oldEmailSent ? `A notification was also sent to ${oldEmail}.` :
       `Note: The notification to ${oldEmail} could not be delivered (you may be using a test email address).`)
    );
    setEmailForm({ password: "", newEmail: "" });
  };

  const handleChangePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !profile.phone) { setError("You need a current phone number on file to change it."); return; }
    if (newPhone === profile.phone) { setError("New phone is the same as current."); return; }
    setChangingPhone(true); setError(""); setSuccess("");
    try {
      const credential = EmailAuthProvider.credential(user.email, phoneFormPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);

      const vId = await sendSmsCode(profile.phone);
      setVerificationId(vId);
      setPhoneStep("sms");
      setSuccess("SMS verification code sent to your current phone.");
    } catch (err: any) {
      setError(err.message);
      setPhoneStep("form");
    } finally {
      setChangingPhone(false);
    }
  };

  const handlePhoneSmsVerify = async () => {
    if (!verificationId || !profile.phone) return;
    setPhoneSmsVerifying(true); setPhoneSmsError(""); setError("");
    try {
      await verifySmsCode(verificationId, phoneSmsCode);

      await setDoc(doc(db, "users", user!.uid), { phone: newPhone }, { merge: true });
      setProfile(prev => ({ ...prev, phone: newPhone }));
      setPhoneStep("done");
      setSuccess("Phone number updated to " + newPhone);
      setNewPhone("");
      setPhoneFormPassword("");
    } catch (err: any) {
      setPhoneSmsError(err.code === "auth/invalid-verification-code" ? "Incorrect code. Please try again." : err.message);
    } finally {
      setPhoneSmsVerifying(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccess("Password reset email sent to " + user.email);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="profile" />
      <div className="pt-32 text-center"><p className="text-gray-500">Loading...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="profile" />
      <PageBanner title="My Profile" highlightedText="Profile" subtitle="Manage your account and personal information." currentPage="profile" />
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-800">{error}</p></div>}
        {success && <div className="p-4 bg-green-50 border border-green-200 rounded-md"><p className="text-sm text-green-800">{success}</p></div>}

        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
          <p className="text-gray-500 text-sm mb-4">{user?.email} · {user?.displayName}</p>

          <div className="flex items-center gap-4 mb-6 p-4 bg-mhma-cream rounded-lg">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 px-4 py-2 bg-mhma-forest text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-mhma-forest-light transition-colors">
                <Upload className="w-4 h-4" />
                {photoUploading ? "Uploading..." : "Upload Photo"}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={photoUploading} className="hidden" />
              </label>
              {photoUploading && <Loader2 className="w-4 h-4 mt-1 animate-spin text-mhma-gold" />}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" placeholder="Doe" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  <span>{profile.phone || "(not set)"}</span>
                </div>
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
              className="bg-mhma-gold hover:bg-mhma-gold-light text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Change Email</h2>
          <p className="text-sm text-gray-500 mb-4">Current email: <strong>{user?.email}</strong></p>

          {emailStep === "sms" && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800 font-medium mb-3">SMS code sent to your phone ({profile.phone}). Enter it below:</p>
              <div className="flex gap-2">
                <input type="text" value={smsCode} onChange={e => setSmsCode(e.target.value)}
                  className="flex-1 px-4 py-2 border border-amber-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none text-lg font-mono tracking-widest text-center"
                  placeholder="000000" maxLength={6} />
                <button onClick={handleSmsVerify} disabled={smsVerifying || smsCode.length < 6}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-2 rounded-md transition-colors disabled:opacity-50">
                  {smsVerifying ? "Verifying..." : "Verify"}
                </button>
              </div>
              {smsError && <p className="text-red-600 text-xs mt-2">{smsError}</p>}
              <button onClick={() => { setEmailStep("form"); setSmsCode(""); setSmsError(""); }}
                className="text-xs text-gray-500 mt-2 hover:underline">Cancel</button>
            </div>
          )}

          {emailStep === "done" ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                Verification sent to <strong>{emailForm.newEmail || "your new email"}</strong>. Check your inbox and click the link from Firebase to complete the change.
              </p>
              <button onClick={() => { setEmailStep("form"); setSmsCode(""); }}
                className="text-xs text-mhma-gold mt-2 hover:underline">Change again</button>
            </div>
          ) : emailStep === "form" && (
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
                <input type="email" value={emailForm.newEmail} onChange={e => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" placeholder="new@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password (to confirm)</label>
                <div className="relative">
                  <input type={showEmailPassword ? "text" : "password"} value={emailForm.password} onChange={e => setEmailForm({ ...emailForm, password: e.target.value })}
                    autoComplete="current-password" className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" required />
                  <button type="button" onClick={() => setShowEmailPassword(!showEmailPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={changingEmail}
                className="bg-blue-700 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50">
                {changingEmail ? "Processing..." : "Change Email"}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Change Phone Number</h2>
          <p className="text-sm text-gray-500 mb-4">Current phone: <strong>{profile.phone || "(none)"}</strong></p>

          {phoneStep === "sms" && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800 font-medium mb-3">SMS code sent to your current phone ({profile.phone}). Enter it below:</p>
              <div className="flex gap-2">
                <input type="text" value={phoneSmsCode} onChange={e => setPhoneSmsCode(e.target.value)}
                  className="flex-1 px-4 py-2 border border-amber-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none text-lg font-mono tracking-widest text-center"
                  placeholder="000000" maxLength={6} />
                <button onClick={handlePhoneSmsVerify} disabled={phoneSmsVerifying || phoneSmsCode.length < 6}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-2 rounded-md transition-colors disabled:opacity-50">
                  {phoneSmsVerifying ? "Verifying..." : "Verify"}
                </button>
              </div>
              {phoneSmsError && <p className="text-red-600 text-xs mt-2">{phoneSmsError}</p>}
              <button onClick={() => { setPhoneStep("form"); setPhoneSmsCode(""); setPhoneSmsError(""); }}
                className="text-xs text-gray-500 mt-2 hover:underline">Cancel</button>
            </div>
          )}

          {phoneStep === "done" ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">Phone number updated successfully.</p>
              <button onClick={() => { setPhoneStep("form"); setPhoneSmsCode(""); }}
                className="text-xs text-mhma-gold mt-2 hover:underline">Change again</button>
            </div>
          ) : phoneStep === "form" && (
            <form onSubmit={handleChangePhone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Phone Number</label>
                <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" placeholder="(555) 123-4567" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password (to confirm)</label>
                <div className="relative">
                  <input type={showPhonePassword ? "text" : "password"} value={phoneFormPassword} onChange={e => setPhoneFormPassword(e.target.value)}
                    autoComplete="current-password" className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" required />
                  <button type="button" onClick={() => setShowPhonePassword(!showPhonePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPhonePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={changingPhone}
                className="bg-teal-700 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                {changingPhone ? "Sending SMS..." : "Change Phone"}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input type="text" autoComplete="username" value={user?.email || ""} readOnly className="hidden" aria-hidden="true" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input type={showPassword.current ? "text" : "password"} value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  autoComplete="current-password" className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" required />
                <button type="button" onClick={() => setShowPassword(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input type={showPassword.new ? "text" : "password"} value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    autoComplete="new-password" className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" required />
                  <button type="button" onClick={() => setShowPassword(s => ({ ...s, new: !s.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input type={showPassword.confirm ? "text" : "password"} value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    autoComplete="new-password" className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] outline-none" required />
                  <button type="button" onClick={() => setShowPassword(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50">
                {saving ? "Updating..." : "Change Password"}
              </button>
              <button type="button" onClick={handleForgotPassword}
                className="text-sm text-mhma-gold hover:text-amber-600 font-medium underline underline-offset-2">
                Forgot current password?
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Hidden recaptcha container for Firebase Phone Auth */}
      <div ref={recaptchaRef}></div>
    </div>
  );
}
