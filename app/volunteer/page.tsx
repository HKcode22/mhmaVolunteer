"use client";

import Link from "next/link";
import { Heart, ArrowLeft, CheckCircle, Users, Target, Calendar } from "lucide-react";
import Navigation from "@/app/components/Navigation";

export default function VolunteerPage() {
  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="" />

      <section className="relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-gradient-to-br from-mhma-forest via-mhma-forest-mid to-mhma-forest-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-mhma-gold/30 bg-mhma-gold/10 backdrop-blur-sm text-mhma-gold text-xs font-bold tracking-widest uppercase">
            Give Your Time
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif uppercase tracking-tight">
            Volunteer With <span className="text-mhma-gold italic">Us</span>
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
            Your time and talent can make a difference. Join our team of dedicated volunteers serving the Mountain House community.
          </p>
        </div>
      </section>

      <main className="flex-grow">
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center shadow-sm">
                <Users className="w-8 h-8 text-mhma-gold mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Community</h3>
                <p className="text-sm text-gray-500">Join a growing family of dedicated volunteers</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center shadow-sm">
                <Target className="w-8 h-8 text-mhma-gold mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Impact</h3>
                <p className="text-sm text-gray-500">Make a tangible difference in your community</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center shadow-sm">
                <Calendar className="w-8 h-8 text-mhma-gold mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Flexible</h3>
                <p className="text-sm text-gray-500">Volunteer on your schedule, at your pace</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ways to Volunteer</h2>
              <ul className="space-y-3">
                {[
                  "Event setup and coordination",
                  "Youth program assistance and mentoring",
                  "Community outreach and engagement",
                  "Administrative and operational support",
                  "Fundraising and campaign support",
                  "Facility maintenance and beautification",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-mhma-gold shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 bg-mhma-gold/10 border border-mhma-gold/20 rounded-2xl p-8 text-center">
              <Heart className="w-10 h-10 text-mhma-gold mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Interested in Volunteering?</h2>
              <p className="text-gray-600 mb-6">Contact us and we'll help you find the perfect opportunity.</p>
              <Link href="/contact" className="inline-flex items-center gap-2 bg-mhma-forest text-white px-6 py-3 rounded-xl font-bold hover:bg-mhma-forest-light transition-all">
                Get in Touch <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-mhma-dark py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm tracking-widest uppercase mb-4">© 2026 Mountain House Muslim Association</p>
          <div className="w-16 h-1 bg-mhma-gold mx-auto rounded-full opacity-30"></div>
        </div>
      </footer>
    </div>
  );
}
