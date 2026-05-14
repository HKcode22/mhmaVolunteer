"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import Navigation from "@/components/Navigation";
import PageBanner from "@/components/PageBanner";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      const msg =
        err.code === "auth/user-not-found" ? "No account found with this email address." :
        err.code === "auth/invalid-email" ? "Please enter a valid email address." :
        err.code === "auth/too-many-requests" ? "Too many requests. Please try again later." :
        "Failed to send reset email. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="login" />
      <PageBanner
        title="Reset Password"
        highlightedText="Reset Password"
        subtitle="We'll send you a link to create a new password."
        currentPage="login"
      />

      <main className="pt-8">
        <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-8">
              {!sent ? (
                <>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Forgot your password?</h2>
                    <p className="text-gray-500 text-sm">
                      Enter your email address and we&apos;ll send you a link to reset it.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-700">{error}</p>
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

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-[#b49c2e] hover:bg-[#8c7622] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200/50"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </div>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email!</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    We&apos;ve sent a password reset link to <strong className="text-gray-700">{email}</strong>.
                    Click the link in the email to create a new password.
                  </p>
                  <p className="text-xs text-gray-400 mb-6">
                    Didn&apos;t receive it? Check your spam folder or{" "}
                    <button onClick={() => setSent(false)} className="text-[#c9a227] hover:underline font-medium">
                      try again
                    </button>
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    Back to Sign In <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Remember your password?{" "}
                  <Link href="/login" className="text-[#c9a227] hover:text-amber-700 font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
