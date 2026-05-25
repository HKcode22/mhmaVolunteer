"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, ArrowLeft, Loader2, Users, Edit3 } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";
import { renderMarkdown } from "@/lib/markdown";
import { useAuth } from "@/lib/auth-context";

export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { isBoardMember } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${slug}`);
        if (!res.ok) throw new Error("Event not found");
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  const formatTime = (t: string) => {
    if (!t) return "";
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
      const [hours, minutes] = t.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "pm" : "am";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes}${ampm}`;
    }
    return t;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mhma-cream">
        <Navigation currentPage="events" />
        <div className="pt-32 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-mhma-cream">
        <Navigation currentPage="events" />
        <div className="pt-32 text-center">
          <p className="text-gray-500">Event not found.</p>
          <Link href="/events" className="text-mhma-gold font-semibold mt-4 inline-block">← Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="events" />
      <PageBanner
        title={event.title || "Event Details"}
        highlightedText="Details"
        subtitle="View full event information."
        currentPage="events"
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/events" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-6 font-semibold">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Events
        </Link>

        {event.poster && (
          <div className="w-full flex justify-center mb-8">
            <img src={event.poster} alt={event.title} className="w-full max-w-3xl rounded-2xl shadow-lg" />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 relative">
          {isBoardMember && (
            <Link href={`/dashboard/events/edit?id=${event.id}`} className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-mhma-gold text-white text-xs font-bold rounded-lg hover:bg-mhma-gold-light transition-colors" title="Edit event">
              <Edit3 className="w-3.5 h-3.5" /> EDIT
            </Link>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-serif">{event.title}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {event.date && (
              <div className="flex items-center text-gray-600 bg-gray-50 rounded-xl p-4">
                <Calendar className="w-5 h-5 mr-3 text-mhma-gold shrink-0" />
                <span className="font-medium">{event.date}</span>
              </div>
            )}
            {event.time && (
              <div className="flex items-center text-gray-600 bg-gray-50 rounded-xl p-4">
                <Clock className="w-5 h-5 mr-3 text-mhma-gold shrink-0" />
                <span className="font-medium">{formatTime(event.time)}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center text-gray-600 bg-gray-50 rounded-xl p-4">
                <MapPin className="w-5 h-5 mr-3 text-mhma-gold shrink-0" />
                <span className="font-medium">{event.location}</span>
              </div>
            )}
          </div>

          {event.description && (
            <div className="prose prose-gray max-w-none mb-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(event.description) }} />
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
            <Link
              href={`/rsvp?eventId=${event.id}`}
              className="flex-1 inline-flex justify-center items-center px-8 py-4 bg-mhma-gold text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg text-lg"
            >
              <Users className="mr-2 w-5 h-5" /> RSVP NOW
            </Link>
            {event.rsvpLink && (
              <a
                href={event.rsvpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex justify-center items-center px-8 py-4 border-2 border-mhma-gold text-mhma-gold font-bold rounded-xl hover:bg-mhma-gold/10 transition-all text-sm"
              >
                External RSVP Form →
              </a>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-xs tracking-widest uppercase font-medium">© 2026 Mountain House Muslim Association</p>
        </div>
      </footer>
    </div>
  );
}
