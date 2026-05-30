"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQItem } from "@/lib/firebase";

interface Props {
  items: FAQItem[];
  className?: string;
}

export default function FAQAccordion({ items, className = "" }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const grouped = items.reduce<Record<string, FAQItem[]>>((acc, item) => {
    const cat = item.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (items.length === 0) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {Object.entries(grouped).map(([category, faqs]) => (
        <div key={category}>
          <h3 className="text-sm font-bold text-mhma-gold uppercase tracking-wider mb-3">{category}</h3>
          <div className="space-y-2">
            {faqs.map(faq => {
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id || null)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 text-sm pr-4">{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-mhma-gold shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4">
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
