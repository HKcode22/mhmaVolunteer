"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addEnrollment } from "@/lib/firebase";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import PageBanner from "@/components/PageBanner";

export default function EnrollPage() {
  const router = useRouter();
  const { user, isBoardMember, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    program: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/enroll");
    } else if (isBoardMember) {
      router.push("/dashboard");
    }
  }, [user, isBoardMember, authLoading, router]);

  const programs = [
    { value: "youth_sports_league", label: "Youth Sports League" },
    { value: "ladies_meetup", label: "Ladies Meetup" },
    { value: "learn_3d_printing", label: "Learn 3D Printing" },
    { value: "urdu_academy", label: "Urdu Academy" },
    { value: "maktab_program", label: "Maktab Program" },
    { value: "family_night", label: "Family Night" },
    { value: "jummah_and_salah", label: "Jummah and Salah" },
    { value: "wish", label: "WISH (Weekend Islamic School)" },
    { value: "quran_hifz_program", label: "Quran Hifz Program" },
    { value: "boy_scouts", label: "Boy Scouts" },
    { value: "arabic_academy", label: "Arabic Academy" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await addEnrollment({ fullName: formData.fullName, email: formData.email, phone: formData.phone, program: formData.program, message: formData.message, status: "pending" });

      setSuccess(true);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        program: "",
        message: "",
      });
    } catch (error) {
      console.error("Enrollment error:", error);
      setError("Enrollment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#c9a227] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="enroll" />
      <PageBanner
        title="Program Enrollment"
        highlightedText="Enrollment"
        subtitle="Join our programs and become part of our growing community."
        currentPage="enroll"
      />

      <main className="pt-8">
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">PROGRAM ENROLLMENT</h2>
                <div className="w-16 h-1 bg-[#c9a227] mx-auto mt-4"></div>
              </div>

              {success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <p className="text-green-800 font-semibold mb-2">Enrollment Submitted Successfully!</p>
                  <p className="text-green-600 text-sm">We will contact you shortly with more information about your selected program.</p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Submit Another Enrollment
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Program *
                      </label>
                      <select
                        required
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all bg-white"
                      >
                        <option value="">Choose a program...</option>
                        {programs.map((prog) => (
                          <option key={prog.value} value={prog.value}>
                            {prog.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Message (Optional)
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c9a227] focus:border-transparent outline-none transition-all resize-none"
                      placeholder="Any questions or special requests?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-8 py-4 bg-[#c9a227] text-white font-bold rounded-lg hover:bg-amber-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Submitting..." : "Submit Enrollment"}
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    By submitting, you agree to be contacted about the selected program.
                  </p>
                </form>
              )}
            </div>

            <div className="mt-8 text-center">
              <Link href="/programs" className="text-[#c9a227] hover:underline font-medium">
                ← Back to Programs
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
