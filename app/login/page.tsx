"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, ShieldCheck, LogIn, Eye, EyeOff, ArrowRight } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";
import Navigation from "@/components/Navigation";
import PageBanner from "@/components/PageBanner";

type TabType = "member" | "board";

export default function LoginPage() {
  const [tab, setTab] = useState<TabType>("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { refreshUser } = useAuth();

  const tabConfig = {
    member: {
      label: "Member",
      icon: User,
      title: "Member Login",
      desc: "Access your account to enroll in programs, view events, and manage your profile.",
      boardMsg: "",
    },
    board: {
      label: "Board Member",
      icon: ShieldCheck,
      title: "Board Member Login",
      desc: "Access the board dashboard to manage events, programs, enrollments, and site content.",
      boardMsg: "Only board members can log in here.",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const tokenResult = await cred.user.getIdTokenResult();
      const role = (tokenResult.claims.role as string) || "member";
      const isBoard = role === "board_member" || role === "administrator";

      if (tab === "board" && !isBoard) {
        await auth.signOut();
        throw new Error("This account does not have board access. Please use the Member tab.");
      }

      if (tab === "member" && isBoard) {
        await auth.signOut();
        throw new Error("This is a board member account. Please use the Board Member tab.");
      }

      await refreshUser();
      window.location.href = isBoard ? "/dashboard" : "/";
    } catch (err: any) {
      const msg =
        err.code === "auth/user-not-found" ? "No account found with this email." :
        err.code === "auth/wrong-password" || err.code === "auth/invalid-credential" ? "Invalid email or password." :
        err.code === "auth/too-many-requests" ? "Too many attempts. Please try again later." :
        err.message || "An error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const current = tabConfig[tab];

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="login" />
      <PageBanner
        title="Sign In"
        highlightedText="Sign In"
        subtitle="Welcome back to Mountain House Muslim Association."
        currentPage="login"
      />

      <main className="pt-8">
        <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-lg mx-auto">
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
                <div className={`text-center mb-8 transition-all duration-300`}>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{current.title}</h2>
                  <p className="text-gray-500 text-sm">{current.desc}</p>
                  {tab === "board" && (
                    <p className="text-amber-700 text-xs mt-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 inline-block">
                      {current.boardMsg}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700 text-center">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] outline-none transition-all bg-gray-50/50"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] outline-none transition-all bg-gray-50/50"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href="/recover"
                      className="text-sm text-[#c9a227] hover:text-amber-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#b49c2e] hover:bg-[#8c7622] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200/50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center space-y-3">
                  <p className="text-sm text-gray-500">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-[#c9a227] hover:text-amber-700 font-semibold inline-flex items-center gap-1">
                      Create one <ArrowRight className="w-3 h-3" />
                    </Link>
                  </p>
                  {tab === "board" && (
                    <p className="text-xs text-gray-400">
                      Need a board invite code? Contact an existing board member.
                    </p>
                  )}
                  <div className="pt-2 border-t border-gray-100">
                    <Link href="/" className="text-sm text-gray-400 hover:text-[#c9a227] transition-colors">
                      ← Back to home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
