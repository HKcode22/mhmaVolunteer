"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, User } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";
import Navigation from "@/components/Navigation";
import PageBanner from "@/components/PageBanner";

export default function LoginPage() {
  const [userType, setUserType] = useState<"member" | "board">("member");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const email = username.includes("@") ? username : null;
      if (!email) {
        setError("Please enter your email address to log in.");
        setLoading(false);
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const tokenResult = await cred.user.getIdTokenResult();
      const role = (tokenResult.claims.role as string) || "member";
      const isBoard = role === "board_member" || role === "administrator";

      if (userType === "board" && !isBoard) {
        await auth.signOut();
        throw new Error("Access denied. Only board members can log in here.");
      }

      await refreshUser();
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = isBoard ? "/dashboard" : "/";
      }, 1000);
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

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="login" />
      <PageBanner
        title="Login"
        highlightedText="Login"
        subtitle="Access your member dashboard and stay connected with the community."
        currentPage="login"
      />

      <main className="pt-8">
        <section className="py-16 px-4 bg-white">
          <div className="max-w-md mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-8 border border-gray-100">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Mountain House Muslim Association</h2>
                <p className="text-gray-600 text-center mb-6">I am a...</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setUserType("member")}
                    className={`p-4 rounded-lg border-2 transition-all ${userType === "member" ? "border-[#c9a227] bg-[#c9a227]/10" : "border-gray-200 hover:border-[#c9a227]"}`}
                  >
                    <User className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">Member</span>
                  </button>
                  <button
                    onClick={() => setUserType("board")}
                    className={`p-4 rounded-lg border-2 transition-all ${userType === "board" ? "border-[#c9a227] bg-[#c9a227]/10" : "border-gray-200 hover:border-[#c9a227]"}`}
                  >
                    <User className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">Board Member</span>
                  </button>
                </div>
              </div>

              <div className="text-center mb-8">
                <p className="text-gray-600">
                  {userType === "member" && "Registered User Login"}
                  {userType === "board" && "Board Member Login"}
                </p>
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

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" id="email" value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                    placeholder="Enter your email address" required />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input type="password" id="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                    placeholder="Enter your password" required />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-3 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Processing..." : "Login"}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-[#c9a227] hover:underline font-medium">Register here</Link>
                </p>
                {userType === "board" && (
                  <p className="text-sm text-gray-500">Board member access only. Contact administrator if you need access.</p>
                )}
              </div>

              <div className="mt-4 text-center">
                <Link href="/" className="text-sm text-gray-500 hover:text-[#c9a227] transition-colors">← Back to MHMA</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#1a1a1a] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="MHMA Logo" width={200} height={45} className="h-12 w-auto" />
            </div>
            <div className="flex space-x-4 mb-8">
              <a href="https://www.facebook.com/mhma95391" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="https://www.instagram.com/mhma.ig/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="https://x.com/i/flow/login?redirect_after_login=%2Fmhmatweets" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="https://www.linkedin.com/company/mountain-house-muslim-association/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="https://www.youtube.com/@MHMAYouTube" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
            <div className="text-center text-gray-400 text-sm">
              <p>Copyright 2024 MHMA - Mountain House Muslim Association</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
