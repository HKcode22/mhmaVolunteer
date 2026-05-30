"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";
import FAQAccordion from "@/app/components/FAQAccordion";
import { fetchFAQs, FAQItem } from "@/lib/firebase";

export default function ContactFAQPage() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs(100)
      .then(data => setItems(data.filter(f => f.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="faq" />

      <PageBanner
        title="Frequently Asked"
        highlightedText="Questions"
        subtitle="Answers about MHMA programs, donations, the Islamic Center campaign, and more."
      />

      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          {loading ? (
            <p className="text-center text-gray-500 text-sm">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">No FAQs published yet. Please check back soon.</p>
          ) : (
            <FAQAccordion items={items} />
          )}
          {process.env.NEXT_PUBLIC_MHMA_EIN && (
            <p className="text-center text-xs text-gray-500 mt-8">
              MHMA is a 501(c)(3) nonprofit. EIN: {process.env.NEXT_PUBLIC_MHMA_EIN}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
