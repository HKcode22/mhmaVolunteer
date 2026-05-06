"use client";

import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { MapPin, Clock, Calendar, ChevronRight, Loader2 } from "lucide-react";

interface PrayerTime {
  name: string;
  time: string;
  arabicName: string;
}

interface AladhanResponse {
  code: number;
  status: string;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
    };
    date: {
      readable: string;
      hijri: {
        date: string;
        month: { en: string };
        year: string;
      };
    };
    meta: {
      method: { name: string };
    };
  };
}

const jumuahTimes = [
  { session: "1st Session", time: "1:00 PM", khutbah: "12:45 PM" },
  { session: "2nd Session", time: "2:00 PM", khutbah: "1:45 PM" },
];

const LATITUDE = 37.7782;
const LONGITUDE = -121.5423;

export default function PrayerTimesPage() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [currentDate, setCurrentDate] = useState("");
  const [hijriDate, setHijriDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("ISNA");

  useEffect(() => {
    fetchPrayerTimes();
  }, []);

  const fetchPrayerTimes = async () => {
    // Commented out aladhan API - using masjidi widget instead
    /*
    try {
      setLoading(true);
      const today = new Date();
      
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${Math.floor(today.getTime() / 1000)}?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=2&school=0`
      );

      if (!response.ok) throw new Error("Failed to fetch prayer times");

      const data: AladhanResponse = await response.json();

      if (data.code === 200 && data.data) {
        const timings = data.data.timings;
        const date = data.data.date;

        const formatTime = (time24: string) => {
          const [hours, minutes] = time24.split(':');
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour % 12 || 12;
          return `${hour12}:${minutes} ${ampm}`;
        };

        setPrayerTimes([
          { name: "Fajr", time: formatTime(timings.Fajr), arabicName: "الفجر" },
          { name: "Sunrise", time: formatTime(timings.Sunrise), arabicName: "الشروق" },
          { name: "Dhuhr", time: formatTime(timings.Dhuhr), arabicName: "الظهر" },
          { name: "Asr", time: formatTime(timings.Asr), arabicName: "العصر" },
          { name: "Maghrib", time: formatTime(timings.Maghrib), arabicName: "المغرب" },
          { name: "Isha", time: formatTime(timings.Isha), arabicName: "العشاء" },
        ]);

        setCurrentDate(date.readable);
        setHijriDate(`${date.hijri.date} ${date.hijri.month.en} ${date.hijri.year} AH`);
        setMethod(data.data.meta.method.name);
      }
    } catch (err) {
      setError("Unable to load prayer times. Please try again later.");
    } finally {
      setLoading(false);
    }
    */
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="prayer-times" />

      <section className="pt-52 md:pt-56 pb-16 bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-bold mb-5 uppercase tracking-wide leading-tight">
            Prayer <span className="text-amber-400">Times</span>
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-200 max-w-3xl mx-auto font-light tracking-[0.2em] uppercase">
            Mountain House, California
          </p>
        </div>
      </section>

      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 text-center">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading dates...</span>
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <>
              <p className="text-gray-700 text-xl mb-1 font-medium">{currentDate}</p>
              <p className="text-amber-600 font-semibold text-lg">{hijriDate}</p>
            </>
          )}
        </div>
      </section>

      <section className="py-12 bg-amber-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Jumu'ah <span className="text-amber-600">Prayer</span>
            </h2>
            <div className="w-24 h-1 bg-amber-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Unity Center, Mountain House</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {jumuahTimes.map((session, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border-2 border-amber-200 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{session.session}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Khutbah Begins</span>
                    <span className="text-amber-600 font-bold">{session.khutbah}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                    <span className="text-gray-600">Jumu'ah Prayer</span>
                    <span className="text-amber-600 font-bold text-lg">{session.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Today's <span className="text-amber-600">Prayer Times</span>
            </h2>
            <div className="w-24 h-1 bg-amber-400 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Prayer times for Mountain House, CA
            </p>
          </div>

          {/* Masjidi Widget */}
          <div className="flex justify-center">
            <iframe
              src="https://ummahsoft.org/salahtime/masjid-embed/prayer_widet.php?masjid_id=53487"
              width="100%"
              height="380"
              frameBorder="0"
              scrolling="no"
              className="max-w-[480px] rounded-lg shadow-lg"
            ></iframe>
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://www.islamicfinder.org/world/united-states/5375407/mountain-house-prayer-times/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-teal-800 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              View Full Monthly Schedule
            </a>
            <p className="text-gray-500 text-sm mt-4 max-w-xl mx-auto">
              Prayer times provided by Masjidi.com
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-wide">
            Location
          </h2>
          <div className="w-24 h-1 bg-amber-400 mx-auto mb-8"></div>

          <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
              <MapPin className="w-6 h-6" />
              <span className="text-xl font-semibold">Unity Center</span>
            </div>
            <p className="text-gray-700 text-xl mb-4">
              250 E. Main Street<br />
              Mountain House, CA 95391
            </p>
            <a
              href="https://maps.google.com/?q=250+E+Main+St+Mountain+House+CA+95391"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-amber-600 font-semibold hover:text-amber-700 hover:underline text-lg"
            >
              Get Directions <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Mountain House Muslim Association
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Prayer times powered by Aladhan API
          </p>
        </div>
      </footer>
    </div>
  );
}
