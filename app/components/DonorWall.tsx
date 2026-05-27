"use client";

import { useState, useEffect } from "react";
import { Heart, ShieldCheck, Users } from "lucide-react";
import { fetchDonations, Donation } from "@/lib/firebase";

export default function DonorWall() {
  const [donors, setDonors] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations(100).then(data => {
      const visible = data.filter(d => d.showOnWall !== false);
      setDonors(visible);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const displayDonors = donors.map(d => ({
    name: d.anonymous ? "Anonymous" : d.donorName || "Anonymous",
    amount: d.amount || 0,
    designation: d.designation || "general",
  }));

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
        <div className="h-8 bg-gray-100 rounded w-2/3 mx-auto" />
      </div>
    );
  }

  if (displayDonors.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-mhma-gold/10 border border-mhma-gold/20 text-mhma-gold text-xs font-bold tracking-widest uppercase">
          <Heart className="w-3.5 h-3.5" /> Our Donors
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-serif">Donor Wall</h2>
        <p className="text-gray-500 max-w-xl mx-auto mb-10 font-light">
          Thank you to everyone who has contributed to our mission. Your generosity makes our work possible.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayDonors.slice(0, 20).map((d, i) => (
            <div key={i} className="bg-mhma-cream rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-full bg-mhma-gold/20 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 text-mhma-gold" />
              </div>
              <p className="font-semibold text-gray-900 text-sm truncate">{d.name}</p>
              <p className="text-mhma-gold font-bold text-sm mt-0.5">${(d.amount / 100).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {displayDonors.length > 20 && (
          <p className="text-sm text-gray-400 mt-6">
            <Users className="w-4 h-4 inline mr-1" />
            +{displayDonors.length - 20} more supporters
          </p>
        )}
      </div>
    </section>
  );
}
