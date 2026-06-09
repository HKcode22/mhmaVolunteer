"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Users, BookOpen, Building2, ChevronRight } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";
import { formatCompactAmount } from "@/lib/stats-utils";

export default function ImpactReportPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/donation-totals").then(r => r.json()),
      fetch("/api/enrollment-count").then(r => r.json()),
    ]).then(([totals, enrollment]) => {
      const t = totals.status === "fulfilled" ? totals.value : {};
      const e = enrollment.status === "fulfilled" ? enrollment.value : {};
      setStats({ constructionTotal: t.constructionTotal || 0, donorCount: t.donorCount || 0, enrollmentCount: e.count || 0 });
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-mhma-cream">
      <Navigation currentPage="about" />

      <PageBanner
        title="Annual Impact Report"
        highlightedText="Impact Report"
        subtitle="Transparency and accountability — see how your support strengthens our community."
      />

      <main className="flex-grow py-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { icon: Building2, label: "Raised for Masjid", value: stats ? `${formatCompactAmount(stats.constructionTotal)}+` : "—", color: "bg-mhma-forest" },
              { icon: Heart, label: "Total Donors", value: stats ? `${stats.donorCount}+` : "—", color: "bg-mhma-gold/20 text-gray-900" },
              { icon: Users, label: "Youth Served", value: stats ? `${stats.enrollmentCount}+` : "—", color: "bg-mhma-forest-mid" },
              { icon: BookOpen, label: "Programs Running", value: "10+", color: "bg-teal-700" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={`${item.color} rounded-2xl p-6 text-center ${i === 1 ? "text-gray-900" : "text-white"} shadow-lg`}>
                  <Icon className={`w-6 h-6 mx-auto mb-3 ${i === 1 ? "text-mhma-gold" : "text-mhma-gold"}`} />
                  <p className="text-2xl md:text-3xl font-bold font-serif mb-1">{item.value}</p>
                  <p className="text-xs uppercase tracking-wider opacity-80">{item.label}</p>
                </div>
              );
            })}
          </div>

          {/* Impact Narrative */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif">FY 2025–2026 Impact Summary</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>Alhmadulillah, the Mountain House Muslim Association has experienced another year of growth and community impact. Thanks to your generous support, we have:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Advanced the masjid construction project significantly, with foundation work underway</li>
                <li>Maintained daily prayers and Jumu'ah services at the Unity Center</li>
                <li>Served over 500 families through our programs and events</li>
                <li>Enrolled {stats?.enrollmentCount || "many"} youth in our educational programs</li>
                <li>Hosted community events including iftars, family nights, and youth activities</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link href="/donate" className="inline-flex items-center px-8 py-3 bg-mhma-forest text-white font-bold rounded-xl hover:bg-mhma-forest-light transition-all shadow-lg">
              Support Our Mission <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
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
