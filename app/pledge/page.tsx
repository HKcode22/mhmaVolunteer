"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, CheckCircle, Loader2 } from "lucide-react";
import { fetchPledgesByUser, Pledge } from "@/lib/firebase";
import { useAuth, fullName } from "@/lib/auth-context";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";

export default function PledgePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", amount: "", message: "" });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: prev.name || fullName(user) || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amountNum = parseFloat(form.amount);
    if (!form.name.trim() || !form.email.trim() || !amountNum || amountNum <= 0) {
      setError("Name, email, and a valid amount are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/pledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          amount: amountNum,
          message: form.message.trim() || undefined,
          userUid: user?.uid,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit pledge.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-mhma-cream">
        <Navigation currentPage="" />
        <PageBanner title="Pledge Submitted" highlightedText="Thank You" subtitle="Your pledge has been recorded." currentPage="pledge" />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You, {form.name}!</h2>
          <p className="text-gray-600 mb-2">Your pledge of <strong>${parseFloat(form.amount).toLocaleString()}</strong> has been received.</p>
          <p className="text-gray-500 text-sm mb-8">A board member will follow up with you to complete your donation.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-mhma-gold text-white font-bold py-3 px-6 rounded-xl hover:bg-amber-500 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="" />
      <PageBanner title="Make a Pledge" highlightedText="Pledge" subtitle="Commit to supporting the MHMA Islamic Center campaign." currentPage="pledge" />
      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-mhma-gold" />
            <h2 className="text-xl font-bold text-gray-900">Islamic Center Pledge</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Your pledge is a non-binding commitment. A board member will contact you to arrange payment. 
            You may also donate immediately via the <Link href="/donate" className="text-mhma-gold hover:underline font-semibold">donate page</Link>.
          </p>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-700">{error}</p></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={form.name} onChange={e => update("name", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mhma-gold/30 outline-none" placeholder="Your name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => update("email", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mhma-gold/30 outline-none" placeholder="you@example.com" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mhma-gold/30 outline-none" placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pledge Amount ($) *</label>
                <input type="number" min="1" step="any" value={form.amount} onChange={e => update("amount", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mhma-gold/30 outline-none" placeholder="500" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
              <textarea value={form.message} onChange={e => update("message", e.target.value)} rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mhma-gold/30 outline-none" placeholder="Any notes for the board..." />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-mhma-gold hover:bg-amber-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-amber-200/50">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Heart className="w-4 h-4" /> Submit Pledge</>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">Prefer to donate now?</p>
            <Link href="/donate" className="inline-flex items-center gap-1 text-mhma-gold hover:text-amber-600 font-semibold text-sm mt-1">
              Go to Donate Page <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          </div>
        </div>
      </main>

      {user && <PledgeHistorySection userId={user.uid} email={user.email || undefined} />}
    </div>
  );
}

function PledgeHistorySection({ userId, email }: { userId: string; email?: string }) {
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchPledgesByUser(userId, email).then(d => {
      setPledges(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId, email]);

  return (
    <section className="py-16 bg-white border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Your Pledges</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : pledges.length === 0 ? (
          <div className="bg-mhma-cream p-8 rounded-xl border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">No pledges yet. Submit one above and it&apos;ll appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pledges.map(d => (
              <div key={d.id} className="bg-mhma-cream p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">${(d.amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    Status: {d.status} · {(() => { if (!d.createdAt) return ""; if (typeof d.createdAt === "string") return new Date(d.createdAt).toLocaleDateString(); if (d.createdAt.toDate) return d.createdAt.toDate().toLocaleDateString(); return ""; })()}
                  </p>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${d.status === "fulfilled" ? "bg-green-100 text-green-700" : d.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{d.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
