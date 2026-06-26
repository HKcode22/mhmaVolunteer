"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MapPin,
  Mail,
  Phone,
  Heart,
  ShieldCheck,
  Globe,
  ArrowRight,
  Building2,
  BookOpen,
  HandCoins,
  Landmark,
  Smartphone,
  Check,
  Copy,
  Briefcase,
  Star,
} from "lucide-react";
import Navigation from "@/app/components/Navigation";

import { fetchMasjidUpdates, fetchDonationsByUser, FirebaseMasjidUpdate, Donation } from "@/lib/firebase";
import { getCachedData } from "@/lib/cache-manager";
import { usePageData } from "@/lib/page-data-context";
import { formatCampaignDollars, normalizeCampaignDollars } from "@/lib/campaign-stats";
import BoardMemberCard from "@/app/components/BoardMemberCard";
import { boardOfDirectors } from "@/app/lib/board-data";

type Designation = "general" | "construction" | "zakat" | "programs" | "other";

const designations: { key: Designation; label: string; icon: any; description: string; color: string; stripeId: string; monthlyStripeId: string }[] = [
  { key: "general", label: "General Fund", icon: Heart, description: "Support MHMA's daily operations, programs, and community services. Your gift helps us serve the Mountain House community.", color: "bg-mhma-teal", stripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq", monthlyStripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq" },
  { key: "construction", label: "Construction", icon: Building2, description: "Direct your donation to the Masjid construction fund. Help us build a permanent Islamic Center for our growing community.", color: "bg-mhma-gold", stripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq", monthlyStripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq" },
  { key: "zakat", label: "Zakat-ul-Maal", icon: HandCoins, description: "Fulfill your Zakat obligation. Funds are distributed according to Islamic guidelines to those in need.", color: "bg-mhma-forest", stripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq", monthlyStripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq" },
  { key: "programs", label: "Programs", icon: BookOpen, description: "Support our educational and youth programs — Quran, Arabic, youth sports, and family events.", color: "bg-emerald-700", stripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq", monthlyStripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq" },
  { key: "other", label: "Other", icon: Globe, description: "Choose your own amount for any other purpose. Every contribution makes a difference.", color: "bg-gray-700", stripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq", monthlyStripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq" },
];

export default function DonatePage() {
  const { user } = useAuth();
  const { setPageData } = usePageData();
  useEffect(() => { document.title = "Donate | MHMA | Mountain House"; }, []);
  const [latest, setLatest] = useState<FirebaseMasjidUpdate | null>(null);
  const [raisedFromDonations, setRaisedFromDonations] = useState(0);
  const [donorCount, setDonorCount] = useState(0);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [masjidLoaded, setMasjidLoaded] = useState(false);
  const [designation, setDesignation] = useState<Designation>("general");
  const [recurring, setRecurring] = useState(false);
  const [amount, setAmount] = useState("");
  const [dedicate, setDedicate] = useState(false);
  const [dedicationName, setDedicationName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (window.location.search.includes("success=true")) {
      setSuccess(true);
      window.history.replaceState({}, "", "/donate");
    }
    getCachedData('masjidConstruction', () => fetchMasjidUpdates(20)).then(({ data }) => { if (data.length > 0) setLatest(data[0]); setMasjidLoaded(true); setPageData({ masjidConstruction: data }); }).catch(() => setMasjidLoaded(true));
    getCachedData('donations', () => fetch("/api/donation-totals").then(r => r.json())).then(({ data }) => {
      const d = data as any;
      setRaisedFromDonations(d.constructionTotal || 0);
      setDonorCount(d.donorCount || 0);
      setStatsLoaded(true);
    }).catch(() => setStatsLoaded(true));
  }, []);

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) < 1) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), designation, recurring, firebaseUid: user?.uid || "", dedicate, dedicationName }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const goal = normalizeCampaignDollars(latest?.goal, 8_500_000);
  const raised = raisedFromDonations;
  const remaining = Math.max(0, goal - raised);
  const current = designations.find(d => d.key === designation) || designations[0];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-mhma-gold selection:text-white bg-mhma-cream">
      <Navigation currentPage="donate" />

      <section className="relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-gradient-to-br from-mhma-forest via-mhma-forest-mid to-mhma-forest-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-mhma-gold/30 bg-mhma-gold/10 backdrop-blur-sm text-mhma-gold text-xs font-bold tracking-widest uppercase">
            Support Our Community
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif uppercase tracking-tight">
            Invest in <span className="text-mhma-gold italic">Aakhirah</span>
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
            Your contributions fuel our mission to serve the Mountain House community.
            Build your legacy today through charity.
          </p>
        </div>
      </section>

      <main className="flex-grow">
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-stretch">

              {/* Left Side */}
              <div className="lg:w-7/12 space-y-12">

                {/* Intro */}
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">Choose Where Your Gift Goes</h2>
                  <div className="w-20 h-1.5 bg-mhma-gold rounded-full mb-8"></div>
                  <p className="text-gray-600 text-lg font-light leading-relaxed">
                    Select a fund below, then complete your donation online via Stripe, or use one of the alternative methods.
                  </p>
                </div>

                {/* Designation Picker */}
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {designations.map(d => {
                      const Icon = d.icon;
                      const active = designation === d.key;
                      return (
                        <button
                          key={d.key}
                          onClick={() => { setDesignation(d.key); if (success) setSuccess(false); }}
                          className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                            active
                              ? `${d.color} text-white border-transparent shadow-lg scale-[1.02]`
                              : "bg-white border-gray-200 text-gray-700 hover:border-mhma-gold/50 hover:shadow-md"
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${active ? "text-white" : "text-mhma-gold"}`} />
                          <span className="text-xs font-bold uppercase tracking-wide">{d.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-200">
                    <p className="text-sm text-gray-600">{current.description}</p>
                  </div>
                </div>

                  {/* Stripe Donation Form */}
                  <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Heart className="w-24 h-24 text-mhma-gold" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-mhma-gold" />
                      Donate Online — {current.label}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">Secure payment via Stripe. Credit/debit cards accepted.</p>

                    {/* Recurring Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-6 p-2 bg-gray-50 rounded-xl border border-gray-200">
                      <span className={`text-xs font-bold uppercase tracking-wide ${!recurring ? "text-gray-900" : "text-gray-400"}`}>One-Time</span>
                      <button
                        onClick={() => setRecurring(!recurring)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${recurring ? "bg-mhma-gold" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${recurring ? "translate-x-7" : ""}`} />
                      </button>
                      <span className={`text-xs font-bold uppercase tracking-wide ${recurring ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
                    </div>

                    {recurring && (
                      <p className="text-xs text-amber-600 font-medium text-center mb-4">
                        You will be charged monthly. Cancel anytime.
                      </p>
                    )}

                    {success ? (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-green-800 mb-2">Thank You for Your Donation!</h3>
                        <p className="text-green-600">Your donation has been received. JazakAllah Khair!</p>
                        <p className="text-xs text-green-500 mt-2">It may take a moment to appear in donation history.</p>
                        <p className="text-xs text-gray-500 mt-4 mb-3">Share your support:</p>
                        <div className="flex justify-center gap-3 mb-4">
                          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://mhma-update.vercel.app/donate")}`} target="_blank" rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                            <Facebook className="w-5 h-5" />
                          </a>
                          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I just donated to support the Mountain House Muslim Association! 🕌")}&url=${encodeURIComponent("https://mhma-update.vercel.app/donate")}`} target="_blank" rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors">
                            <Twitter className="w-5 h-5" />
                          </a>
                          <button onClick={() => { navigator.clipboard.writeText("https://mhma-update.vercel.app/donate"); alert("Link copied!"); }}
                            className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700 transition-colors">
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                        <button onClick={() => { setSuccess(false); setAmount(""); }}
                          className="inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-sm">
                          <Heart className="w-4 h-4" /> Donate Again
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* MHMA Builders Club promo */}
                        {recurring && (
                          <div className="bg-gradient-to-r from-mhma-forest to-mhma-forest-mid rounded-xl p-4 mb-2">
                            <p className="text-white font-bold text-sm">You are joining the MHMA Builders Club! 🌟</p>
                            <p className="text-mhma-sage text-xs mt-1">Monthly sustainers power our community year-round. Cancel anytime.</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">Amount ($)</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {[25, 50, 100, 250, 500].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setAmount(String(val))}
                                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                                  amount === String(val)
                                    ? "bg-mhma-forest text-white border-mhma-forest"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-mhma-gold"
                                }`}
                              >
                                ${val}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setAmount("")}
                              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                                amount && ![25, 50, 100, 250, 500].includes(Number(amount))
                                  ? "bg-mhma-forest text-white border-mhma-forest"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-mhma-gold"
                              }`}
                            >
                              Custom
                            </button>
                          </div>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mhma-gold outline-none text-lg font-bold text-gray-900"
                          />
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={dedicate}
                              onChange={e => setDedicate(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-mhma-gold focus:ring-mhma-gold"
                            />
                            <span className="text-sm text-gray-700">Dedicate this donation</span>
                          </label>
                          {dedicate && (
                            <input
                              type="text"
                              value={dedicationName}
                              onChange={e => setDedicationName(e.target.value)}
                              placeholder="In honor/memory of..."
                              className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mhma-gold outline-none text-sm text-gray-900"
                            />
                          )}
                        </div>

                        <button
                          onClick={handleDonate}
                          disabled={!amount || parseFloat(amount) < 1 || processing}
                          className="w-full py-3.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light font-bold text-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          {processing ? (
                            <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Processing...</>
                          ) : (
                            <><Heart className="w-5 h-5" /> Donate ${parseFloat(amount || "0").toFixed(2)}</>
                          )}
                        </button>
                        <p className="text-xs text-gray-400 text-center uppercase tracking-widest font-medium">
                          All donations are 100% Tax Deductible
                        </p>
                      </div>
                    )}
                  </div>

                {/* Other Ways to Give */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Other Ways to Give</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Zelle */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-purple-600" />
                        </div>
                        <h4 className="font-bold text-gray-900">Zelle</h4>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">Send via Zelle to our registered email address. No fees.</p>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <code className="text-sm text-gray-700 flex-1 truncate">board@mhma.info</code>
                        <button onClick={() => copyToClipboard("board@mhma.info", "zelle")}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors">
                          {copied === "zelle" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                        </button>
                      </div>
                    </div>

                    {/* Check */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Landmark className="w-5 h-5 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-gray-900">Check</h4>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">Make checks payable to:</p>
                      <p className="font-semibold text-gray-900">Mountain House Muslim Association</p>
                      <p className="text-sm text-gray-500 mt-2">Mail to:</p>
                      <p className="text-sm text-gray-700">250 East Main Street, Mountain House, CA 95391</p>
                    </div>

                    {/* Cash */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <HandCoins className="w-5 h-5 text-green-600" />
                        </div>
                        <h4 className="font-bold text-gray-900">Cash / In Person</h4>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">Visit us during office hours or at Jumu'ah prayers.</p>
                      <p className="text-sm text-gray-700">
                        <strong>Location:</strong> 250 East Main Street, Mountain House, CA 95391<br />
                        <strong>Phone:</strong> 408.722.1043
                      </p>
                    </div>

                    {/* PayPal */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-cyan-600" />
                        </div>
                        <h4 className="font-bold text-gray-900">PayPal</h4>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">Send via PayPal to our registered email.</p>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <code className="text-sm text-gray-700 flex-1 truncate">board@mhma.info</code>
                        <button onClick={() => copyToClipboard("board@mhma.info", "paypal")}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors">
                          {copied === "paypal" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Or use: <a href="https://paypal.me/mhma" target="_blank" rel="noopener noreferrer" className="text-mhma-gold hover:underline">paypal.me/mhma</a></p>
                    </div>

                    {/* Employer Matching */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-orange-600" />
                        </div>
                        <h4 className="font-bold text-gray-900">Employer Matching</h4>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">Double your impact! Many employers match charitable donations dollar-for-dollar.</p>
                      <p className="text-sm text-gray-700">For Benevity or other matching platforms, use <strong>board@mhma.info</strong> as the organization email.</p>
                    </div>

                    {/* MHMA Builders Club */}
                    <div className="bg-gradient-to-br from-mhma-forest to-mhma-forest-mid p-6 rounded-2xl shadow-md">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-mhma-gold/20 flex items-center justify-center">
                          <Star className="w-5 h-5 text-mhma-gold" />
                        </div>
                        <h4 className="font-bold text-white">MHMA Builders Club</h4>
                      </div>
                      <p className="text-sm text-gray-200 mb-2">Join our monthly giving program. Set it and forget it — your recurring gift provides stable funding for programs year-round.</p>
                      <p className="text-xs text-mhma-gold font-semibold">Toggle "Monthly" above to start your sustainer membership.</p>
                    </div>

                  </div>
                </div>

              </div>

              {/* Right Side: Stats & Contact */}
              <div className="lg:w-5/12 flex flex-col gap-8">
                {statsLoaded && masjidLoaded ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-mhma-forest p-8 rounded-3xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
                    <p className="text-xs uppercase tracking-widest opacity-70 mb-2 font-bold">Campaign Goal</p>
                    <p className="text-4xl md:text-5xl font-bold font-serif">{formatCampaignDollars(goal)}</p>
                  </div>
                  <div className="bg-mhma-forest p-8 rounded-3xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
                    <p className="text-xs uppercase tracking-widest opacity-70 mb-2 font-bold">Raised to Date</p>
                    <p className="text-4xl md:text-5xl font-bold font-serif">{formatCampaignDollars(raised)}</p>
                  </div>
                  <div className="bg-mhma-forest p-8 rounded-3xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
                    <p className="text-xs uppercase tracking-widest opacity-70 mb-2 font-bold">Remaining</p>
                    <p className="text-4xl md:text-5xl font-bold font-serif">{formatCampaignDollars(remaining)}</p>
                  </div>
                  <div className="bg-mhma-forest p-6 rounded-3xl shadow-lg text-white text-center">
                    <p className="text-2xl font-bold">{statsLoaded ? donorCount : "—"}</p>
                    <p className="text-xs uppercase tracking-wider opacity-70">Donors Contributed</p>
                  </div>
                </div>
                ) : null}

                <div className="flex-grow grid grid-cols-1 gap-4">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:border-mhma-gold transition-colors">
                    <MapPin className="w-8 h-8 text-mhma-gold mb-4 group-hover:scale-110 transition-transform" />
                    <p className="text-gray-900 font-bold mb-1">Visit Us</p>
                    <p className="text-gray-500 text-sm font-light">250 East Main Street,<br />Mountain House, CA 95391</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:border-mhma-gold transition-colors">
                    <Mail className="w-8 h-8 text-mhma-gold mb-4 group-hover:scale-110 transition-transform" />
                    <p className="text-gray-900 font-bold mb-1">Email Us</p>
                    <p className="text-gray-500 text-sm font-light">board@mhma.info</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:border-mhma-gold transition-colors">
                    <Phone className="w-8 h-8 text-mhma-gold mb-4 group-hover:scale-110 transition-transform" />
                    <p className="text-gray-900 font-bold mb-1">Call Us</p>
                    <p className="text-gray-500 text-sm font-light">408.722.1043</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {user && (
        <DonationHistorySection userId={user.uid} email={user.email || undefined} />
      )}

      {/* Board Oversight */}
      <section className="py-16 bg-mhma-cream">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">Board <span className="text-mhma-gold">Oversight</span></h2>
          <div className="w-24 h-1 bg-mhma-gold mx-auto mb-4"></div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-10">Financial matters are overseen by our board. Reach out to discuss donations, pledges, or endowments.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[boardOfDirectors[0], boardOfDirectors[2], boardOfDirectors[6]].filter(Boolean).map((member, i) => (
              member ? <BoardMemberCard key={i} member={member} variant="compact" /> : null
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-mhma-dark py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="Logo" width={220} height={45} className="mx-auto mb-12 opacity-90" />
          <div className="flex justify-center space-x-6 mb-12">
            {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-mhma-gold transition-all border border-white/10">
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
          <p className="text-gray-500 text-sm tracking-widest uppercase mb-4">© 2026 Mountain House Muslim Association</p>
          <div className="w-16 h-1 bg-mhma-gold mx-auto rounded-full opacity-30"></div>
        </div>
      </footer>
    </div>
  );
}

function DonationHistorySection({ userId, email }: { userId: string; email?: string }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCachedData('donations', () => fetchDonationsByUser(userId, email)).then(({ data }) => {
      setDonations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId, email]);

  return (
    <section className="py-16 bg-white border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Donation History</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : donations.length === 0 ? (
          <div className="bg-mhma-cream p-8 rounded-xl border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">No donations yet. When you donate through our site, your contributions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {donations.map(d => (
              <div key={d.id} className="bg-mhma-cream p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">${((d.amount || 0) / 100).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {d.designation} · {d.method} · {(() => { if (!d.createdAt) return ""; if (typeof d.createdAt === "string") return new Date(d.createdAt).toLocaleDateString(); if (d.createdAt.toDate) return d.createdAt.toDate().toLocaleDateString(); return ""; })()}
                  </p>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${d.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{d.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
