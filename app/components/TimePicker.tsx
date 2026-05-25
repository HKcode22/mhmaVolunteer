"use client";

import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const COMMON_TIMES = [
  { label: "Fajr / Dawn", value: "05:30" },
  { label: "Morning", value: "09:00" },
  { label: "Late Morning", value: "10:30" },
  { label: "Noon", value: "12:00" },
  { label: "Dhuhr / Lunch", value: "13:00" },
  { label: "Afternoon", value: "15:00" },
  { label: "Asr / Late Afternoon", value: "16:30" },
  { label: "Maghrib / Sunset", value: "18:00" },
  { label: "Evening", value: "19:00" },
  { label: "Isha / Night", value: "20:00" },
  { label: "Late Night", value: "21:30" },
];

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplay = (t: string) => {
    if (!t) return "";
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
      const [h, m] = t.split(":");
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "pm" : "am";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m}${ampm}`;
    }
    return t;
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#C9A84C] outline-none pr-10"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C9A84C] transition-colors"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Select</p>
          </div>
          {value && (
            <div className="px-3 py-2 bg-[#F8F4EC] border-b border-gray-100 text-sm text-gray-700">
              Custom: <span className="font-medium">{formatDisplay(value)}</span>
            </div>
          )}
          {COMMON_TIMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { onChange(t.value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#F8F4EC] transition-colors flex items-center justify-between"
            >
              <span className="text-gray-600">{t.label}</span>
              <span className="text-gray-900 font-medium">{formatDisplay(t.value)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
