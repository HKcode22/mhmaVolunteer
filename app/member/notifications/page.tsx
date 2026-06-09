"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Calendar, BookOpen, ChevronRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchEvents, fetchPrograms, fetchNews, FirebaseEvent, FirebaseProgram, NewsItem } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function MemberNotificationsPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [programs, setPrograms] = useState<FirebaseProgram[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
    if (authLoading) return;
    Promise.all([
      fetchEvents(5),
      fetchPrograms(5),
      fetchNews(5),
    ]).then(([e, p, n]) => {
      setEvents(e);
      setPrograms(p);
      setNews(n);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authLoading, isLoggedIn, router]);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation />
      <div className="pt-32 text-center"><p className="text-gray-500">Loading notifications...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="member-notifications" />
      <div className="pt-28 pb-8 px-4 max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-mhma-gold hover:text-mhma-gold mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Link>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-500 mb-8">Stay updated on new events, programs, and news.</p>

        {events.length === 0 && programs.length === 0 && news.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No new notifications yet. Check back later!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map(n => (
              <Link key={n.id} href={`/news/${n.slug}`}
                className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-mhma-cream text-mhma-forest shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">New: {n.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{n.excerpt}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
                </div>
              </Link>
            ))}
            {events.map(e => (
              <Link key={e.id} href={`/events/${e.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-amber-50 text-amber-600 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">New Event: {e.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{e.date}{e.time ? ` · ${e.time}` : ""}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
                </div>
              </Link>
            ))}
            {programs.map(p => (
              <Link key={p.id} href={`/programs/${p.slug}`}
                className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-green-50 text-green-600 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">New Program: {p.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{p.description || ""}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
