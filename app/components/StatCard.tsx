"use client";

import { useCountUp } from "@/lib/use-count-up";

export default function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
  const suffix = value.replace(/[0-9]/g, "");
  const isNumeric = /^\d+$/.test(value.replace(/[+$KMB]/g, ""));
  const animated = useCountUp(isNumeric && num > 0 ? num : 0);

  return (
    <div className={`${color} rounded-xl p-5 text-center text-white shadow-lg`}>
      <p className="text-2xl font-bold text-mhma-gold mb-1 font-serif">
        {isNumeric && num > 0 ? `${animated}${suffix}` : value}
      </p>
      <p className="text-gray-300 text-xs uppercase tracking-wider">{label}</p>
    </div>
  );
}
