"use client";

import { Calendar, Download } from "lucide-react";

interface AddToCalendarProps {
  title: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
}

function buildDateStr(date?: string, time?: string): string {
  if (!date) return "";
  const cleaned = date.replace(/[-/]/g, "");
  const d = cleaned.length >= 8 ? cleaned : "";
  if (!time) return d + "T000000";
  const t = time.replace(/:/g, "");
  const padded = t.padEnd(6, "0");
  return d + "T" + padded;
}

export default function AddToCalendar({ title, description, date, time, location }: AddToCalendarProps) {
  if (!date) return null;

  const dtStart = buildDateStr(date, time);
  const dtEnd = buildDateStr(date, time ? "" : undefined);

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dtStart}/${dtEnd || dtStart}&details=${encodeURIComponent(description || "")}&location=${encodeURIComponent(location || "")}`;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MHMA//Events//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    dtEnd ? `DTEND:${dtEnd}` : "",
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, "\\n")}` : "",
    location ? `LOCATION:${location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const handleDownloadICS = () => {
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-mhma-forest text-mhma-forest font-semibold rounded-xl hover:bg-mhma-forest hover:text-white transition-all text-sm"
      >
        <Calendar className="w-4 h-4" /> Google Calendar
      </a>
      <button
        onClick={handleDownloadICS}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm"
      >
        <Download className="w-4 h-4" /> iCal / Outlook
      </button>
    </div>
  );
}
