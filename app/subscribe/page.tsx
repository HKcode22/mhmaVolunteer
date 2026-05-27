"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Valid email required."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, source: "subscribe_page" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to subscribe");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="subscribe" />
      <PageBanner title="Newsletter" highlightedText="Subscribe" subtitle="Stay informed with MHMA news, events, and community updates." currentPage="subscribe" />

      <main className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-100">
            {done ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're subscribed!</h2>
                <p className="text-gray-500 mb-6">Thanks for joining the MHMA mailing list. You'll receive updates about events, programs, and community news.</p>
                <Link href="/" className="inline-flex items-center text-mhma-gold font-semibold hover:underline">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <Mail className="w-12 h-12 text-mhma-gold mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Stay in the Loop</h2>
                  <p className="text-gray-500 text-sm">Get MHMA news, event invitations, and community announcements delivered to your inbox.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Enter your name (optional)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com" required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mhma-gold outline-none" />
                  </div>

                  <button type="submit" disabled={submitting}
                    className="w-full py-3 bg-mhma-gold text-white font-bold rounded-lg hover:bg-amber-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {submitting ? "Subscribing..." : "Subscribe"}
                  </button>

                  <p className="text-xs text-gray-400 text-center">No spam. Unsubscribe anytime.</p>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
