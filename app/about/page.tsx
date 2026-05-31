"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/app/components/Navigation";
import { ChevronRight } from "lucide-react";

import PageBanner from "@/app/components/PageBanner";
import StatCard from "@/app/components/StatCard";
import { formatCompactAmount, formatCount } from "@/lib/stats-utils";

export default function AboutPage() {
  const [aboutStats, setAboutStats] = useState<any>(null);

  useEffect(() => { document.title = "About MHMA | MHMA | Mountain House"; }, []);

  useEffect(() => {
    fetch("/api/about-stats").then(r => r.json()).then(data => setAboutStats(data)).catch(() => {});
  }, []);
  return (
    <div className="min-h-screen bg-mhma-cream font-sans">
      <Navigation currentPage="about" />

      <PageBanner
        title="About MHMA"
        highlightedText="MHMA"
        subtitle="Strengthening the bonds of brotherhood through faith, education, and community service."
      />

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
                Our <span className="text-mhma-gold">Story</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The Mountain House Muslim Association (MHMA) was established to serve the Muslim community of Mountain House and the surrounding Bay Area. What started as a small congregation has grown into a thriving community center that serves hundreds of families.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our mission is to provide a welcoming environment for Muslims to worship, learn, and connect with one another. We offer daily prayers, Jumu'ah services, religious education programs, youth activities, and community events throughout the year.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Alhmadulillah, we continue to grow through our various programs including Quran maktab, Hifz memorization, Arabic language classes, youth programs, and sisters' activities.
              </p>
            </div>
            <div className="lg:w-1/2">
                <div className="bg-teal-50 rounded-xl p-8 border border-teal-100">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard value={aboutStats?.yearsServing ? `${aboutStats.yearsServing}+` : "—"} label="Years" color="bg-mhma-forest" />
                    <StatCard value={aboutStats?.numberOfFamilies ? `${aboutStats.numberOfFamilies}+` : "—"} label="Families" color="bg-mhma-forest-mid" />
                    <StatCard value={aboutStats?.programsCount ? `${formatCount(aboutStats.programsCount)}` : "—"} label="Programs" color="bg-mhma-forest" />
                    <StatCard value={aboutStats?.youthInPrograms ? `${formatCount(aboutStats.youthInPrograms)}` : "—"} label="Youth in Programs" color="bg-mhma-forest-mid" />
                    <StatCard value={aboutStats?.raisedForMasjid ? formatCompactAmount(aboutStats.raisedForMasjid) : "—"} label="Raised for Masjid" color="bg-mhma-forest" />
                    <StatCard value={aboutStats?.donorCount ? formatCount(aboutStats.donorCount) : "—"} label="Donors" color="bg-mhma-forest-mid" />
                    <StatCard value={aboutStats?.eventsCount ? formatCount(aboutStats.eventsCount) : "—"} label="Events Held" color="bg-mhma-forest" />
                    <StatCard value={aboutStats?.usersCount ? formatCount(aboutStats.usersCount) : "—"} label="Members" color="bg-mhma-forest-mid" />
                    <StatCard value={aboutStats?.raisedForPrograms ? formatCompactAmount(aboutStats.raisedForPrograms) : "—"} label="Raised for Programs" color="bg-mhma-forest" />
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-mhma-cream">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border-t-4 border-amber-500">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To serve as a center of excellence for Islamic education, worship, and community engagement. We are committed to nurturing the next generation of Muslims with strong faith, good character, and active participation in society.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg border-t-4 border-amber-500">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To be the premier Muslim community organization in the Bay Area, known for our welcoming environment, quality educational programs, and strong commitment to brotherhood and service to humanity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center">
            Our <span className="text-mhma-gold">Values</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Iman (Faith)', desc: 'Strengthening our relationship with Allah through worship and remembrance' },
              { title: 'Knowledge', desc: 'Pursuing Islamic education for all ages and levels' },
              { title: 'Brotherhood', desc: 'Building strong bonds within our community' },
              { title: 'Service', desc: 'Giving back to our neighbors and community' }
            ].map((value, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold text-mhma-forest mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Involved */}
      <section className="py-16 bg-mhma-forest text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">Get Involved</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            There are many ways to be part of the MHMA family. Join our programs, attend events, or volunteer your time and skills.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/programs" className="px-6 py-2.5 bg-amber-500 text-teal-900 font-semibold rounded-lg hover:bg-amber-400 transition-all">
              Explore Programs
            </Link>
            <Link href="/events" className="px-6 py-2.5 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all">
             View Events
            </Link>
            <Link href="/contact" className="px-6 py-2.5 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div>
              <Image 
                src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" 
                alt="MHMA Logo" 
                width={180} 
                height={40} 
                className="mx-auto md:mx-0 mb-4 opacity-70"
              />
              <p className="text-gray-400 text-xs uppercase tracking-wider">© 2026 Mountain House Muslim Association</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Contact Us</h4>
              <p className="text-gray-600 text-sm">📧 mhma@mhma.us</p>
              <p className="text-gray-600 text-sm">📞 (209) 555-0123</p>
              <p className="text-gray-600 text-sm">📍 245 E. Byron St, Mountain House, CA 95391</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Quick Links</h4>
              <div className="flex flex-col gap-1 text-sm">
                <Link href="/donate" className="text-mhma-gold hover:underline">Donate</Link>
                <Link href="/programs" className="text-mhma-gold hover:underline">Programs</Link>
                <Link href="/events" className="text-mhma-gold hover:underline">Events</Link>
                <Link href="/contact" className="text-mhma-gold hover:underline">Contact</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}