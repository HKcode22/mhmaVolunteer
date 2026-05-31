"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  poster?: string;
}

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  if (/^\d{8}$/.test(dateStr)) {
    const y = parseInt(dateStr.substring(0, 4), 10);
    const m = parseInt(dateStr.substring(4, 6), 10) - 1;
    const d = parseInt(dateStr.substring(6, 8), 10);
    return new Date(y, m, d);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EventCalendar({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const d = parseDate(e.date);
      if (!d) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    map.forEach((evts) => {
      evts.sort((a: CalendarEvent, b: CalendarEvent) => {
        const da = parseDate(a.date);
        const db = parseDate(b.date);
        if (!da || !db) return 0;
        return da.getTime() - db.getTime();
      });
    });
    return map;
  }, [events]);

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDate(null);
  };

  // Week view: get the week containing the selected date or today
  const weekStart = useMemo(() => {
    const anchor = selectedDate || today;
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [selectedDate, today]);

  const changeWeek = (dir: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(d);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  };

  // Day view
  const changeDay = (dir: number) => {
    if (!selectedDate) { setSelectedDate(today); return; }
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  };

  const renderDayEvents = (dayEvents: CalendarEvent[]) => (
    <div className="mt-1 space-y-0.5">
      {dayEvents.slice(0, 3).map(e => (
        <Link key={e.id} href={`/events/${e.id}`} className="block text-[10px] leading-tight truncate rounded px-1 py-0.5 bg-mhma-gold/20 text-mhma-forest hover:bg-mhma-gold/40 transition-colors font-medium">
          {e.title}
        </Link>
      ))}
      {dayEvents.length > 3 && <span className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 3} more</span>}
    </div>
  );

  const dayEvents = selectedDate
    ? eventsByDate.get(`${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`) || []
    : [];

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No events to display on the calendar.</p>
      </div>
    );
  }

  return (
    <div>
      {/* View Toggle & Navigation */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["month", "week", "day"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {view === "month" && (
            <>
              <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-bold text-gray-900 text-sm min-w-[140px] text-center">{MONTHS[currentMonth]} {currentYear}</span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </>
          )}
          {view === "week" && (
            <>
              <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-bold text-gray-900 text-sm min-w-[200px] text-center">
                {MONTHS[weekStart.getMonth()]} {weekStart.getDate()} — {MONTHS[weekDays[6].getMonth()]} {weekDays[6].getDate()}
              </span>
              <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </>
          )}
          {view === "day" && (
            <>
              <button onClick={() => changeDay(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-bold text-gray-900 text-sm min-w-[140px] text-center">
                {selectedDate ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}` : "Select a date"}
              </span>
              <button onClick={() => changeDay(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </div>

      {/* Month View */}
      {view === "month" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAYS.map(d => (
              <div key={d} className="text-center py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] bg-gray-50/50 border-b border-r border-gray-100" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentYear, currentMonth, day);
              const key = `${currentYear}-${currentMonth}-${day}`;
              const dayEvents = eventsByDate.get(key) || [];
              const isToday = isSameDay(date, today);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              return (
                <div key={day} onClick={() => setSelectedDate(date)}
                  className={`min-h-[100px] p-1.5 border-b border-r border-gray-100 cursor-pointer transition-colors ${isSelected ? "bg-amber-50" : isToday ? "bg-blue-50/50" : "hover:bg-gray-50"}`}>
                  <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full ${isToday ? "bg-mhma-gold text-white" : "text-gray-700"}`}>
                    {day}
                  </span>
                  {renderDayEvents(dayEvents)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === "week" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAYS.map(d => (
              <div key={d} className="text-center py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weekDays.map((d, i) => {
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              const dayEvents = eventsByDate.get(key) || [];
              const isToday = isSameDay(d, today);
              const isSelected = selectedDate && isSameDay(d, selectedDate);
              return (
                <div key={i} onClick={() => setSelectedDate(d)}
                  className={`min-h-[120px] p-1.5 border-b border-r border-gray-100 cursor-pointer transition-colors ${isSelected ? "bg-amber-50" : isToday ? "bg-blue-50/50" : "hover:bg-gray-50"}`}>
                  <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full ${isToday ? "bg-mhma-gold text-white" : "text-gray-700"}`}>
                    {d.getDate()}
                  </span>
                  {renderDayEvents(dayEvents)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === "day" && selectedDate && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
          </h3>
          <p className="text-xs text-gray-400 mb-4">{dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</p>
          {dayEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No events on this day.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map(e => (
                <Link key={e.id} href={`/events/${e.id}`} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition-colors group">
                  {e.poster && (
                    <img src={e.poster} alt={e.title || "Event poster"} className="w-16 h-16 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-mhma-gold transition-colors">{e.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {e.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.time}</span>}
                      {e.location && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" /> {e.location}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-mhma-gold shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mini event list below calendar showing selected day's events */}
      {view !== "day" && selectedDate && dayEvents.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-gray-900 text-sm mb-3">
            Events for {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}
          </h3>
          <div className="space-y-2">
            {dayEvents.map(e => (
              <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:bg-amber-50 hover:border-amber-200 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm group-hover:text-mhma-gold transition-colors">{e.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    {e.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.time}</span>}
                    {e.location && <span className="truncate"><MapPin className="w-3 h-3 inline" /> {e.location}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-mhma-gold shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
