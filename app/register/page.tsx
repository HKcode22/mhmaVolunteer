"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, ShieldCheck, Key, UserPlus, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { validateInviteCode, markInviteCodeUsed } from "@/lib/firebase";
import Navigation from "@/components/Navigation";
import PageBanner from "@/components/PageBanner";

type TabType = "member" | "board";

export default function RegisterPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("member");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tabConfig = {
    member: {
      label: "Member",
      icon: User,
      title: "Create Member Account",
      desc: "Sign up to enroll in programs, receive updates, and connect with the MHMA community.",
    },
    board: {
      label: "Board Member",
      icon: ShieldCheck,
      title: "Create Board Account",
      desc: "Requires an invite code from an existing board member. Board accounts get dashboard access.",
    },
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "board") {
        const valid = await validateInviteCode(formData.inviteCode);
        if (!valid) {
          setError("Invalid or expired invite code. Contact a board member to get a new code.");
          setLoading(false);
          return;
        }
      }

      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const role = tab === "board" ? "board_member" : "member";

      await setDoc(doc(db, "users", cred.user.uid), {
        email: formData.email,
        displayName: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || "",
        role,
        createdAt: serverTimestamp(),
      });

      if (tab === "board") {
        await markInviteCodeUsed(formData.inviteCode, cred.user.uid);
        await addDoc(collection(db, "notifications"), {
          type: "board_registration",
          title: `New Board Member: ${formData.firstName} ${formData.lastName}`,
          details: `${formData.email} registered using invite code ${formData.inviteCode}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setSuccess(`Account created! Redirecting to login...`);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use" ? "An account with this email already exists." :
        err.code === "auth/weak-password" ? "Password should be at least 6 characters." :
        err.code === "auth/api-key-not-valid" ? "Configuration error. Contact the administrator." :
        err.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const current = tabConfig[tab];

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="register" />
      <PageBanner
        title="Create Account"
        highlightedText="Create Account"
        subtitle="Join the Mountain House Muslim Association community."
        currentPage="register"
      />

      <main className="pt-8">
        <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {(["member", "board"] as const).map((t) => {
                  const cfg = tabConfig[t];
                  const isActive = tab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setError(""); }}
                      className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-sm font-semibold transition-all duration-300 relative ${
                        isActive
                          ? "text-[#c9a227]"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <cfg.icon className={`w-4 h-4 ${isActive ? "text-[#c9a227]" : ""}`} />
                      {cfg.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c9a227] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-8">
                {/* Tab info */}
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{current.title}</h2>
                  <p className="text-gray-500 text-sm">{current.desc}</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-700 text-center font-medium">{success}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => update("firstName", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] outline-none transition-all bg-gray-50/50"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => update("lastName", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] outline-none transition-all bg-gray-50/50"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] outline-none transition-all bg-gray-50/50"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] outline-none transition-all bg-gray-50/50"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => update("password", e.target.value)}
                          autoComplete="new-password"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] outline-none transition-all bg-gray-50/50"
                          placeholder="Min 6 characters"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => update("confirmPassword", e.target.value)}
                          autoComplete="new-password"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] outline-none transition-all bg-gray-50/50"
                          placeholder="Repeat password"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showPass"
                      checked={showPassword}
                      onChange={() => setShowPassword(!showPassword)}
                      className="rounded border-gray-300 text-[#c9a227] focus:ring-[#c9a227]"
                    />
                    <label htmlFor="showPass" className="text-xs text-gray-500 cursor-pointer">Show passwords</label>
                  </div>

                  {/* Invite Code - Board only */}
                  {tab === "board" && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-700" />
                        <label className="text-sm font-bold text-amber-900">Board Invite Code *</label>
                      </div>
                      <p className="text-xs text-amber-700">
                        Enter the invite code given to you by an existing board member. Codes are one-time use.
                      </p>
                      <input
                        type="text"
                        value={formData.inviteCode}
                        onChange={(e) => update("inviteCode", e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] outline-none transition-all text-lg font-bold tracking-[0.3em] text-center uppercase bg-white"
                        placeholder="XXXX-XXXX"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#b49c2e] hover:bg-[#8c7622] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200/50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center space-y-3">
                  <p className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#c9a227] hover:text-amber-700 font-semibold inline-flex items-center gap-1">
                      Sign in <ArrowRight className="w-3 h-3" />
                    </Link>
                  </p>
                  {tab === "board" && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-4 py-2 inline-block">
                      Need an invite code? Ask an existing board member.
                    </p>
                  )}
                  {tab === "member" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-blue-800">
                        Already an MHMA member? Visit{" "}
                        <a href="https://s.mhma.info/join" target="_blank" rel="noopener noreferrer" className="text-[#c9a227] hover:underline font-medium">
                          s.mhma.info/join
                        </a>{" "}
                        to sign up for official MHMA membership.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
