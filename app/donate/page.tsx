"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import Navigation from "@/app/components/Navigation";
import { fetchMasjidUpdates, FirebaseMasjidUpdate } from "@/lib/firebase";

type Designation = "general" | "construction" | "zakat" | "programs" | "other";

const designations: { key: Designation; label: string; icon: any; description: string; color: string; stripeId: string }[] = [
  { key: "general", label: "General Fund", icon: Heart, description: "Support MHMA's daily operations, programs, and community services. Your gift helps us serve the Mountain House community.", color: "bg-mhma-teal", stripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq" },
  { key: "construction", label: "Construction", icon: Building2, description: "Direct your donation to the Masjid construction fund. Help us build a permanent Islamic Center for our growing community.", color: "bg-mhma-gold", stripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq" },
  { key: "zakat", label: "Zakat-ul-Maal", icon: HandCoins, description: "Fulfill your Zakat obligation. Funds are distributed according to Islamic guidelines to those in need.", color: "bg-mhma-forest", stripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq" },
  { key: "programs", label: "Programs", icon: BookOpen, description: "Support our educational and youth programs — Quran, Arabic, youth sports, and family events.", color: "bg-emerald-700", stripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq" },
  { key: "other", label: "Other", icon: Globe, description: "Choose your own amount for any other purpose. Every contribution makes a difference.", color: "bg-gray-700", stripeId: "buy_btn_1O6UR8KkhNmRB0QYd4bijFKq" },
];

export default function DonatePage() {
  const [latest, setLatest] = useState<FirebaseMasjidUpdate | null>(null);
  const [designation, setDesignation] = useState<Designation>("general");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetchMasjidUpdates(1).then(d => { if (d.length > 0) setLatest(d[0]); }).catch(() => {});
  }, []);

  const goal = latest?.goal || 1500000;
  const raised = latest?.raised || 350000;
  const remaining = goal - raised;
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
                          onClick={() => setDesignation(d.key)}
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

                {/* Stripe Payment */}
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Heart className="w-24 h-24 text-mhma-gold" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-mhma-gold" />
                    Donate Online — {current.label}
                  </h3>
                  <p className="text-sm text-gray-500 mb-8">Secure payment via Stripe. Credit/debit cards accepted.</p>
                  <div className="min-h-[100px] flex justify-center">
                    <div className="w-full" key={designation} ref={(el) => {
                      if (el && typeof window !== 'undefined') {
                        el.innerHTML = '';
                        const script = document.createElement('script');
                        script.src = 'https://js.stripe.com/v3/buy-button.js';
                        script.async = true;
                        el.appendChild(script);

                        const button = document.createElement('stripe-buy-button');
                        button.setAttribute('buy-button-id', current.stripeId);
                        button.setAttribute('publishable-key', 'pk_live_51Nz3brKkhNmRB0QYiQmU7j48IR0VIVgI5fUW9boK2NGoz2ZzhCSn8n4EivbkAzovFpZja1l4mAyFshV5izioBIJK00h8ttma6x');
                        el.appendChild(button);
                      }
                    }} />
                  </div>
                  <p className="mt-8 text-xs text-gray-400 text-center uppercase tracking-widest font-medium">
                    All donations are 100% Tax Deductible
                  </p>
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

                  </div>
                </div>

              </div>

              {/* Right Side: Stats & Contact */}
              <div className="lg:w-5/12 flex flex-col gap-8">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-mhma-teal p-8 rounded-3xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
                    <p className="text-xs uppercase tracking-widest opacity-70 mb-2 font-bold">Campaign Goal</p>
                    <p className="text-4xl md:text-5xl font-bold font-serif">${(goal / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="bg-mhma-gold p-8 rounded-3xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
                    <p className="text-xs uppercase tracking-widest opacity-70 mb-2 font-bold">Raised to Date</p>
                    <p className="text-4xl md:text-5xl font-bold font-serif">${(raised / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="bg-mhma-dark p-8 rounded-3xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
                    <p className="text-xs uppercase tracking-widest opacity-70 mb-2 font-bold">Remaining</p>
                    <p className="text-4xl md:text-5xl font-bold font-serif">${(remaining / 1000000).toFixed(1)}M</p>
                  </div>
                </div>

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
