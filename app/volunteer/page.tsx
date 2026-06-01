"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/lib/auth-context";

const INTEREST_OPTIONS = [
  "Event Setup & Coordination",
  "Youth Program Assistance",
  "Community Outreach",
  "Administrative Support",
  "Fundraising & Grants",
  "Facility Maintenance",
  "Food & Hospitality",
  "IT & Media",
  "Transportation",
  "Other",
];

export default function VolunteerPage() {
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    availability: "",
    interests: [] as string[],
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      setForm(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user, authLoading]);

  const toggleInterest = (val: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(val)
        ? prev.interests.filter(i => i !== val)
        : [...prev.interests, val],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.availability) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.interests.length === 0) {
      setError("Please select at least one area of interest.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/submit-volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Submission failed");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-mhma-cream font-sans">
        <Navigation currentPage="volunteer" />
        <div className="max-w-lg mx-auto px-4 pt-32 pb-20 text-center">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600 mb-6">Your volunteer application has been submitted. Our team will reach out to you soon.</p>
            <a href="/" className="inline-block px-6 py-2.5 bg-mhma-gold text-mhma-forest font-semibold rounded-lg hover:bg-mhma-gold-light transition-all">Return Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mhma-cream font-sans">
      <Navigation currentPage="volunteer" />

      <section className="bg-gradient-to-br from-mhma-forest via-mhma-forest-light to-mhma-forest text-white pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Volunteer With Us</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Your time and skills can make a real difference in our community. Join the MHMA volunteer team and help us serve better.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Volunteer Application</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-mhma-forest" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-mhma-forest" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-mhma-forest" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-mhma-forest" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability *</label>
                <select value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-mhma-forest">
                  <option value="">Select availability...</option>
                  <option value="weekdays-daytime">Weekdays — Daytime</option>
                  <option value="weekdays-evening">Weekdays — Evening</option>
                  <option value="weekends">Weekends</option>
                  <option value="flexible">Flexible / As needed</option>
                  <option value="one-time">One-time event only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Interest *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INTEREST_OPTIONS.map(opt => (
                    <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                      form.interests.includes(opt)
                        ? "border-mhma-forest bg-mhma-forest text-white"
                        : "border-gray-200 text-gray-700 hover:border-mhma-forest/30"
                    }`}>
                      <input type="checkbox" checked={form.interests.includes(opt)} onChange={() => toggleInterest(opt)} className="sr-only" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Message (optional)</label>
                <textarea rows={4} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Tell us about your skills, experience, or any questions..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-mhma-forest" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-mhma-gold text-mhma-forest font-bold rounded-lg hover:bg-mhma-gold-light transition-colors disabled:opacity-50">
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2026 Mountain House Muslim Association. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
