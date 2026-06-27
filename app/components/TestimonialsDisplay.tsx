"use client";

import { useState, useEffect } from "react";
import { fetchTestimonials, Testimonial } from "@/lib/firebase";
import { getCachedData } from "@/lib/cache-manager";
import { Star } from "lucide-react";

interface Props {
  page: string;
  limit?: number;
  className?: string;
  sectionBg?: string;
  cardBg?: string;
}

export default function TestimonialsDisplay({ page, limit: max = 6, className = "", sectionBg = "bg-mhma-cream", cardBg = "bg-white" }: Props) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCachedData('testimonials', () => fetchTestimonials(50)).then(({ data }) => {
      setItems(data.filter(t => t.active && t.displayOn?.includes(page)).slice(0, max));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, max]);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <section className={`py-16 ${sectionBg} ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Community Voices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map(t => (
            <div key={t.id} className={`${cardBg} rounded-2xl p-6 border border-gray-200`}>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-mhma-gold text-mhma-gold" />)}
              </div>
              {t.photo && (
                <img src={t.photo} alt={t.name} className="w-14 h-14 object-cover rounded-full mx-auto mb-3 border-2 border-mhma-gold/30" />
              )}
              <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{t.content}"</p>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                {t.role && <p className="text-xs text-gray-500">{t.role}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
