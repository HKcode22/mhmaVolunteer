"use client";

import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ChevronLeft,
  ArrowRight
} from "lucide-react";

export default function WishPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-mhma-gold selection:text-white bg-[#FDFDFD]">
      <Navigation currentPage="programs" />

      {/* Hero Section - Consistent with other programs */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden mhma-gradient mhma-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Link href="/programs" className="inline-flex items-center text-mhma-gold font-bold mb-8 hover:-translate-x-2 transition-transform text-sm tracking-widest uppercase">
            <ChevronLeft className="w-4 h-4 mr-2" /> All Programs
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif uppercase tracking-tight">
            WISH <span className="text-mhma-gold italic">Program</span>
          </h1>
          <div className="w-24 h-1.5 bg-mhma-gold mx-auto rounded-full"></div>
        </div>
      </section>

      <main className="flex-grow py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-7/12">
              <div className="prose prose-lg max-w-none text-gray-700 font-light leading-relaxed">
                <p className="text-xl text-mhma-teal font-medium mb-8 border-l-4 border-mhma-gold pl-6 italic">
                  Weekend Islamic Social Hub — MHMA's flagship program in its fourth successful year serving the community.
                </p>
                <p className="mb-6">
                  Weekend Islamic Social Hub (WISH) is MHMA's flagship program in its fourth successful year serving the Mountain House Muslim community. The program breaks the mold of the traditional Sunday School model that typically focuses only on theoretical Islamic education. The WISH program takes a much broader and holistic approach of catering for residents of all ages including school aged students.
                </p>

                <div className="my-12 p-8 bg-gray-50 rounded-3xl border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 font-serif">Weekend Learning — Grade Pre K-3</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-mhma-gold">
                          <th className="text-left py-2 px-3 text-mhma-teal font-bold">Time</th>
                          <th className="text-left py-2 px-3 text-mhma-teal font-bold">Event</th>
                          <th className="text-left py-2 px-3 text-mhma-teal font-bold">Venue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr><td className="py-2 px-3">10:30 AM</td><td className="py-2 px-3">Islamic Education (45 min)</td><td className="py-2 px-3">Classroom</td></tr>
                        <tr><td className="py-2 px-3">11:15 AM</td><td className="py-2 px-3">Quranic Education (45 min)</td><td className="py-2 px-3">Classroom</td></tr>
                        <tr><td className="py-2 px-3">12:00 PM</td><td className="py-2 px-3">Lunch Break (30 min)</td><td className="py-2 px-3">Outside Area</td></tr>
                        <tr><td className="py-2 px-3">12:30 PM</td><td className="py-2 px-3">Arts & Craft (30 min)</td><td className="py-2 px-3">Outside Area</td></tr>
                        <tr><td className="py-2 px-3">1:00 PM</td><td className="py-2 px-3">Sports/Social Activity (30 min)</td><td className="py-2 px-3">Big Gym</td></tr>
                        <tr><td className="py-2 px-3">1:30 PM</td><td className="py-2 px-3">Zuhr Prayer (15 min)</td><td className="py-2 px-3">Big Gym</td></tr>
                        <tr><td className="py-2 px-3">1:45 PM</td><td className="py-2 px-3">End of Day</td><td className="py-2 px-3">-</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="my-12 p-8 bg-gray-50 rounded-3xl border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 font-serif">Weekend Learning — Grade 4-8</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-mhma-gold">
                          <th className="text-left py-2 px-3 text-mhma-teal font-bold">Time</th>
                          <th className="text-left py-2 px-3 text-mhma-teal font-bold">Event</th>
                          <th className="text-left py-2 px-3 text-mhma-teal font-bold">Venue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr><td className="py-2 px-3">10:30 AM</td><td className="py-2 px-3">Sports Activity (60 min)</td><td className="py-2 px-3">Big Gym</td></tr>
                        <tr><td className="py-2 px-3">11:30 AM</td><td className="py-2 px-3">Lunch Break (30 min)</td><td className="py-2 px-3">Big Gym</td></tr>
                        <tr><td className="py-2 px-3">12:00 PM</td><td className="py-2 px-3">Islamic Education (45 min)</td><td className="py-2 px-3">Classroom</td></tr>
                        <tr><td className="py-2 px-3">12:45 PM</td><td className="py-2 px-3">Quranic Education (45 min)</td><td className="py-2 px-3">Classroom</td></tr>
                        <tr><td className="py-2 px-3">1:30 PM</td><td className="py-2 px-3">Zuhr Prayer (15 min)</td><td className="py-2 px-3">Big Gym</td></tr>
                        <tr><td className="py-2 px-3">1:45 PM</td><td className="py-2 px-3">End of Day</td><td className="py-2 px-3">-</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-5/12 space-y-8">
              {/* Enroll Card */}
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Enroll Now</h3>
                <p className="text-gray-500 text-sm mb-8 font-light">Register your child for our Weekend Islamic Social Hub program.</p>
                <Link href="/enroll" className="flex items-center justify-center w-full py-4 bg-mhma-gold text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg uppercase tracking-widest">
                  ENROLL NOW <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-mhma-teal p-8 rounded-3xl text-center text-white shadow-lg">
                  <p className="text-3xl font-bold font-serif text-mhma-gold mb-1">197</p>
                  <p className="text-xs uppercase tracking-widest opacity-70 font-medium">Students</p>
                </div>
                <div className="bg-mhma-dark p-8 rounded-3xl text-center text-white shadow-lg">
                  <p className="text-3xl font-bold font-serif text-mhma-gold mb-1">30</p>
                  <p className="text-xs uppercase tracking-widest opacity-70 font-medium">Faculty</p>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-mhma-dark p-10 rounded-3xl text-white relative mhma-pattern">
                <div className="text-4xl text-mhma-gold opacity-50 mb-4 font-serif">"</div>
                <p className="text-lg italic font-light mb-6 leading-relaxed">The WISH program is one of the best Islamic programs in the Bay Area.</p>
                <div className="flex items-center">
                  <div className="w-10 h-0.5 bg-mhma-gold mr-4"></div>
                  <p className="text-xs font-bold uppercase tracking-widest text-mhma-gold">Naeem Baig • Program Director</p>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 font-serif">Location</h3>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0977704984784!2d-121.5463444!3d37.7647551!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80900c02b5b8f353%3A0xa8e69c4f6e63c44a!2sMountain%20House%20High%20School!5e0!3m2!1sen!2sus!4v1699400000000!5m2!1sen!2sus"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-xl"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="Logo" width={200} height={40} className="mx-auto mb-12 opacity-80" />
          <div className="flex justify-center space-x-6 mb-12">
            {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-mhma-gold hover:text-white transition-all border border-gray-100">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
          <p className="text-gray-400 text-xs tracking-widest uppercase font-medium">© 2026 Mountain House Muslim Association</p>
        </div>
      </footer>
    </div>
  );
}
