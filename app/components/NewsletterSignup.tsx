"use client";

import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

interface Props {
  source?: string;
  className?: string;
  variant?: "hero" | "footer";
}

export default function NewsletterSignup({ source = "website", className = "", variant = "footer" }: Props) {
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
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, source }),
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

  if (done) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">Thanks for subscribing!</span>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-2 ${className}`}>
        <div className="flex-1">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mhma-gold/30 outline-none text-sm" required />
        </div>
        <button type="submit" disabled={submitting}
          className="shrink-0 flex items-center justify-center gap-2 bg-mhma-gold hover:bg-amber-500 text-mhma-forest font-bold px-6 py-2.5 rounded-lg transition-all text-sm disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Subscribe
        </button>
        {error && <p className="text-xs text-red-600 w-full">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-mhma-gold/30 outline-none" />
      </div>
      <div className="flex gap-2">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-mhma-gold/30 outline-none" required />
        <button type="submit" disabled={submitting}
          className="shrink-0 px-4 py-2 bg-mhma-gold hover:bg-amber-500 text-mhma-forest font-bold text-sm rounded-lg transition-all disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
        </button>
      </div>
    </form>
  );
}
