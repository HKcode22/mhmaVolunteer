"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, ShieldCheck, ChevronRight, Sparkles, Check, ArrowRight } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";

export default function BuildersClubPage() {
  const [amount, setAmount] = useState("50");

  return (
    <div className="min-h-screen flex flex-col font-sans bg-mhma-cream">
      <Navigation currentPage="donate" />

      <section className="relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-gradient-to-br from-mhma-forest via-mhma-forest-mid to-mhma-forest-light">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 bg-mhma-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-mhma-gold/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-mhma-gold/30 bg-mhma-gold/10 backdrop-blur-sm text-mhma-gold text-xs font-bold tracking-widest uppercase">
            <Star className="w-3.5 h-3.5" /> Monthly Giving Program
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif">
            MHMA <span className="text-mhma-gold">Builders Club</span>
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed mb-4">
            Join a community of monthly sustainers powering our masjid and programs year-round.
          </p>
          <p className="text-mhma-gold text-lg font-semibold">Set it. Forget it. Build barakah every single month.</p>
        </div>
      </section>

      <main className="flex-grow">
        {/* Why Join */}
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                { icon: Star, title: "Consistent Impact", desc: "Your monthly gift provides predictable funding for programs, salaries, and masjid operations all year long." },
                { icon: ShieldCheck, title: "Exclusive Updates", desc: "Builders Club members receive quarterly impact reports showing exactly how your contributions are used." },
                { icon: Heart, title: "Community Legacy", desc: "Be part of the foundation that sustains our masjid for future generations. Every month counts." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all text-center group">
                    <div className="w-14 h-14 rounded-2xl bg-mhma-forest flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-mhma-gold" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Join Form */}
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center font-serif">Start Your Monthly Giving</h2>
              <p className="text-gray-500 text-center mb-8 text-sm">Choose your monthly amount. Cancel anytime.</p>

              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {[25, 50, 100, 250, 500].map(val => (
                  <button key={val} onClick={() => setAmount(String(val))}
                    className={`px-6 py-3 rounded-xl text-lg font-bold border-2 transition-all ${
                      amount === String(val)
                        ? "bg-mhma-forest text-white border-mhma-forest shadow-lg"
                        : "bg-white text-gray-700 border-gray-200 hover:border-mhma-gold"
                    }`}>
                    ${val}/mo
                  </button>
                ))}
                <button onClick={() => setAmount("custom")}
                  className={`px-6 py-3 rounded-xl text-lg font-bold border-2 transition-all ${
                    amount === "custom"
                      ? "bg-mhma-forest text-white border-mhma-forest shadow-lg"
                      : "bg-white text-gray-700 border-gray-200 hover:border-mhma-gold"
                  }`}>
                  Custom
                </button>
              </div>

              {amount === "custom" && (
                <input type="number" min="1" placeholder="Enter monthly amount"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mhma-gold outline-none text-lg mb-4" />
              )}

              <Link href={`/donate?amount=${amount}&recurring=true`}
                className="block w-full py-3.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light font-bold text-lg transition-colors text-center flex items-center justify-center gap-2 mb-4">
                Join the Builders Club <ArrowRight className="w-5 h-5" />
              </Link>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Secure via Stripe</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Tax-deductible</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "Can I cancel anytime?", a: "Yes. You can cancel your monthly subscription at any time from your profile page or by contacting us." },
                { q: "Is my donation tax-deductible?", a: "Yes. MHMA is a 501(c)(3) organization. You will receive an annual receipt for tax purposes." },
                { q: "Where does my monthly gift go?", a: "Your gift supports masjid operations, educational programs, youth activities, and community services." },
                { q: "Can I change my monthly amount?", a: "Yes. You can increase or decrease your monthly gift at any time." },
              ].map((faq, i) => (
                <details key={i} className="group bg-mhma-cream rounded-2xl border border-gray-200 open:shadow-sm">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none font-semibold text-gray-900 group-open:text-mhma-gold">
                    {faq.q}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="px-6 pb-4 text-gray-500 text-sm">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-mhma-dark py-16 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="MHMA Logo" width={220} height={45} className="mx-auto mb-8 opacity-90" />
          <p className="text-gray-400 text-sm">© 2026 Mountain House Muslim Association</p>
        </div>
      </footer>
    </div>
  );
}
