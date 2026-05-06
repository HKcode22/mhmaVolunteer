"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Heart,
  User,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import PageBanner from "@/components/PageBanner";

export default function LoginPage() {
  const [userType, setUserType] = useState<"existing" | "new" | "board">("existing");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://my-wp-backend.duckdns.org/wp-json";

    try {
      if (userType === "new") {
        // Registration
        console.log("Attempting registration to:", `${WP_API_URL}/mhma/v1/register`);
        const response = await fetch(`${WP_API_URL}/mhma/v1/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            first_name: formData.username, // Using username as first_name since login form doesn't separate
            last_name: "",
            phone: "",
          }),
        });

        console.log("Registration response status:", response.status);
        console.log("Registration response ok:", response.ok);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Registration failed");
        }

        setSuccess("Registration submitted successfully! Your account is pending approval.");
        setUserType("existing");
      } else {
        // Login
        console.log("Attempting login to:", `${WP_API_URL}/jwt-auth/v1/token`);
        console.log("Login data:", { username: formData.username, password: "***" });
        const response = await fetch(`${WP_API_URL}/jwt-auth/v1/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        });

        console.log("Login response status:", response.status);
        console.log("Login response ok:", response.ok);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed");
        }

        // Store token in localStorage
        if (data.token) {
          localStorage.setItem("jwt_token", data.token);
          localStorage.setItem("username", data.user_nicename || formData.username);

          // Fetch actual user role from WordPress
          let actualRole = "subscriber";
          try {
            const userResponse = await fetch(`${WP_API_URL}/wp/v2/users/me`, {
              headers: {
                Authorization: `Bearer ${data.token}`,
              },
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              actualRole = userData.roles && userData.roles.length > 0 ? userData.roles[0] : "subscriber";
            }
          } catch (err) {
            console.error("Failed to fetch user role:", err);
          }

          localStorage.setItem("user_role", actualRole);
          console.log("Login successful. Actual role from WordPress:", actualRole);

          const isBoardMember = actualRole === "board_member" || actualRole === "administrator";

          if (userType === "board" && !isBoardMember) {
            localStorage.removeItem("jwt_token");
            localStorage.removeItem("user_role");
            localStorage.removeItem("username");
            throw new Error("Access denied. Only registered board members can log in here. Please contact the administrator if you believe this is an error.");
          }

          setSuccess("Login successful! Redirecting...");
          setTimeout(() => {
            if (isBoardMember) {
              window.location.href = "/dashboard";
            } else {
              window.location.href = "/";
            }
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error details:", JSON.stringify(err));
      setError(err instanceof Error ? err.message : "An error occurred");
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

      {/* Main Content */}
      <main className="pt-8">
        {/* Login Form Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-md mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-8 border border-gray-100">
              {/* User Type Selection */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Mountain House Muslim Association</h2>
                <p className="text-gray-600 text-center mb-6">I am a...</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setUserType("new")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      userType === "new"
                        ? "border-[#c9a227] bg-[#c9a227]/10"
                        : "border-gray-200 hover:border-[#c9a227]"
                    }`}
                  >
                    <User className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">New Member</span>
                  </button>
                  <button
                    onClick={() => setUserType("existing")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      userType === "existing"
                        ? "border-[#c9a227] bg-[#c9a227]/10"
                        : "border-gray-200 hover:border-[#c9a227]"
                    }`}
                  >
                    <User className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">Existing Member</span>
                  </button>
                  <button
                    onClick={() => setUserType("board")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      userType === "board"
                        ? "border-[#c9a227] bg-[#c9a227]/10"
                        : "border-gray-200 hover:border-[#c9a227]"
                    }`}
                  >
                    <User className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">Board Member</span>
                  </button>
                </div>
              </div>

              <div className="text-center mb-8">
                <p className="text-gray-600">
                  {userType === "new" && "Create a new member account"}
                  {userType === "existing" && "Registered User Login"}
                  {userType === "board" && "Board Member Login"}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {userType === "new" && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    {userType === "new" ? "Username" : "Username or Email"}
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                    placeholder={userType === "new" ? "Choose a username" : "Enter your username or email"}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                    placeholder={userType === "new" ? "Create a password" : "Enter your password"}
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      className="w-4 h-4 text-[#c9a227] border-gray-300 rounded focus:ring-[#c9a227]"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember Me</span>
                  </label>
                  <Link href="/recover" className="text-sm text-[#c9a227] hover:underline">
                    Lost your password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-3 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : userType === "new" ? "Register" : "Login"}
                </button>
              </form>

              <div className="mt-6 text-center">
                {userType === "new" && (
                  <p className="text-sm text-gray-600">
                    Already a member?{" "}
                    <button
                      onClick={() => setUserType("existing")}
                      className="text-[#c9a227] hover:underline font-medium"
                    >
                      Login here
                    </button>
                  </p>
                )}
                {userType === "existing" && (
                  <p className="text-sm text-gray-600">
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => setUserType("new")}
                      className="text-[#c9a227] hover:underline font-medium"
                    >
                      Register here
                    </button>
                  </p>
                )}
                {userType === "board" && (
                  <p className="text-sm text-gray-600">
                    Board member access only. Contact administrator if you need access.
                  </p>
                )}
              </div>

              <div className="mt-4 text-center">
                <Link href="/" className="text-sm text-gray-500 hover:text-[#c9a227] transition-colors">
                  ← Back to MHMA
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image
                src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp"
                alt="MHMA Logo"
                width={200}
                height={45}
                className="h-12 w-auto"
              />
            </div>
            <div className="flex space-x-4 mb-8">
              <a
                href="https://www.facebook.com/mhma95391"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/mhma.ig/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/i/flow/login?redirect_after_login=%2Fmhmatweets"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/mountain-house-muslim-association/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@MHMAYouTube"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
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
