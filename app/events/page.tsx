"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Edit3
} from "lucide-react";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";
import EventCalendar from "@/app/components/EventCalendar";
import { renderMarkdown } from "@/lib/markdown";
import { useAuth } from "@/lib/auth-context";
import BoardMemberCard from "@/app/components/BoardMemberCard";
import { boardOfDirectors } from "@/app/lib/board-data";

interface Slide {
  id: number;
  src: string;
  alt: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventDescription: string;
  eventRsvpLink: string;
  showDate: boolean;
  showTime: boolean;
  showLocation: boolean;
  showDescription: boolean;
}

export default function EventsPage() {
  const { isBoardMember } = useAuth();
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [rawEvents, setRawEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("eventsViewMode");
    if (saved === "cards" || saved === "calendar") setViewMode(saved);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Use API proxy for reliable fetching (handles CORS and retries)
        const timestamp = Date.now();
        const response = await fetch(`/api/events?_=${timestamp}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();

        setRawEvents(data);

        const eventSlides: Slide[] = data.map((event: any) => {
          let formattedDate = event.date || "";
          if (formattedDate && /^\d{8}$/.test(formattedDate)) {
            const year = formattedDate.substring(0, 4);
            const month = formattedDate.substring(4, 6);
            const day = formattedDate.substring(6, 8);
            formattedDate = `${month}/${day}/${year}`;
          }

          let formattedTime = event.time || "";
          if (formattedTime && /^\d{1,2}:\d{2}(:\d{2})?$/.test(formattedTime)) {
            const [hours, minutes] = formattedTime.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'pm' : 'am';
            const hour12 = hour % 12 || 12;
            formattedTime = `${hour12}:${minutes}${ampm}`;
          }

          return {
            id: event.id,
            src: event.poster || "https://mhma.us/wp-content/uploads/2024/06/MHMA-Default-Event.webp",
            alt: event.title || "Event",
            eventName: event.title || "Untitled Event",
            eventDate: formattedDate,
            eventTime: formattedTime,
            eventLocation: event.location || "",
            eventDescription: event.description || "",
            eventRsvpLink: event.rsvpLink || "",
            showDate: !!formattedDate,
            showTime: !!formattedTime,
            showLocation: !!event.location,
            showDescription: !!event.description,
          };
        });

        setSlides(eventSlides);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-mhma-gold selection:text-white bg-mhma-cream">
      <Navigation currentPage="events" />

      <PageBanner
        title="Upcoming Events"
        highlightedText="Events"
        subtitle="Stay connected with the heartbeat of our community. Join us for prayers, learning, and sisterhood."
        badgeText="Community Calendar"
      />

      {/* Main Events Grid */}
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-3xl h-[500px]"></div>
              ))}
            </div>
          ) : slides.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No upcoming events scheduled at this time.</p>
              <Link href="/" className="mt-4 inline-block text-mhma-gold font-bold">Return Home →</Link>
            </div>
          ) : (
            <>
              {/* View Toggle */}
              <div className="flex items-center justify-end mb-6">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => { setViewMode("cards"); localStorage.setItem("eventsViewMode", "cards"); }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === "cards" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    Card View
                  </button>
                  <button onClick={() => { setViewMode("calendar"); localStorage.setItem("eventsViewMode", "calendar"); }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === "calendar" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    Calendar View
                  </button>
                </div>
              </div>

              {viewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {slides.map((slide) => (
                    <div key={slide.id} className="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 group hover:border-mhma-gold transition-all duration-300 relative">
                      {/* Poster Area */}
                      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                        {isBoardMember && (
                          <Link href={`/dashboard/events/edit?id=${slide.id}`} className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1.5 bg-mhma-forest/80 backdrop-blur-sm text-mhma-gold text-[10px] font-bold rounded-lg hover:bg-mhma-gold hover:text-white transition-colors" title="Edit event">
                            <Edit3 className="w-3 h-3" /> EDIT
                          </Link>
                        )}
                        <img
                          src={slide.src}
                          alt={slide.alt}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-mhma-dark/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>

                      {/* Info Area */}
                      <div className="p-6 bg-white">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 font-serif group-hover:text-mhma-gold transition-colors">{slide.eventName}</h3>

                        <div className="grid grid-cols-1 gap-4 mb-8">
                          {slide.showDate && slide.eventDate && (
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-5 h-5 mr-3 text-mhma-gold" />
                              <span className="font-light">{slide.eventDate}</span>
                            </div>
                          )}
                          {slide.showTime && slide.eventTime && (
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-5 h-5 mr-3 text-mhma-gold" />
                              <span className="font-light">{slide.eventTime}</span>
                            </div>
                          )}
                          {slide.showLocation && slide.eventLocation && (
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-5 h-5 mr-3 text-mhma-gold" />
                              <span className="font-light">{slide.eventLocation}</span>
                            </div>
                          )}
                        </div>

                        {slide.showDescription && slide.eventDescription && (
                          <div className="text-gray-500 text-sm leading-relaxed mb-4 font-light border-l-2 border-mhma-gold/20 pl-4 prose-sm max-h-24 overflow-hidden" dangerouslySetInnerHTML={{ __html: renderMarkdown(slide.eventDescription) }} />
                        )}
                        {slide.showDescription && (
                          <Link href={`/events/${slide.id}`} className="text-mhma-gold font-semibold text-sm mb-4 inline-block hover:underline">View Full Details →</Link>
                        )}

                        {slide.eventRsvpLink && (
                          <div className="space-y-3">
                            <Link
                              href={`/rsvp?eventId=${slide.id}`}
                              className="inline-flex w-full justify-center items-center px-8 py-4 bg-mhma-gold text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg text-lg uppercase tracking-widest"
                            >
                              RSVP NOW <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <a
                              href={slide.eventRsvpLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex w-full justify-center items-center px-8 py-3 border-2 border-mhma-gold text-mhma-gold font-bold rounded-xl hover:bg-mhma-gold/10 transition-all text-sm"
                            >
                              External RSVP Form <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                          </div>
                        )}
                        {!slide.eventRsvpLink && (
                          <Link
                            href={`/events/${slide.id}`}
                            className="inline-flex w-full justify-center items-center px-8 py-4 bg-mhma-gold text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg text-lg uppercase tracking-widest"
                          >
                            RSVP NOW <ArrowRight className="ml-2 w-5 h-5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EventCalendar events={rawEvents} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Call to Action */}
      <section className="py-24 bg-mhma-dark relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 font-serif italic">Together we are stronger.</h2>
          <p className="text-gray-400 text-lg mb-12 font-light leading-relaxed">
            Join us in our mission to build a vibrant Muslim community in Mountain House. Your support and presence make all the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/feedback" className="px-10 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-mhma-dark transition-all">VOLUNTEER</Link>
            <Link href="/donate" className="px-10 py-4 bg-mhma-gold text-white font-bold rounded-full hover:bg-amber-600 transition-all shadow-xl">DONATE NOW</Link>
          </div>
        </div>
      </section>

      {/* Board Oversight */}
      <section className="py-16 bg-mhma-cream">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">Board <span className="text-mhma-gold">Oversight</span></h2>
          <div className="w-24 h-1 bg-mhma-gold mx-auto mb-4"></div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-10">Events are coordinated under the guidance of our board members. Reach out with any questions.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[boardOfDirectors[0], boardOfDirectors[3], boardOfDirectors[8]].filter(Boolean).map((member, i) => (
              member ? <BoardMemberCard key={i} member={member} variant="compact" /> : null
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="Logo" width={220} height={45} className="mx-auto mb-12 opacity-80" />
          <div className="flex justify-center space-x-6 mb-12">
            {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-mhma-gold hover:text-white transition-all border border-gray-100">
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
          <p className="text-gray-400 text-xs tracking-widest uppercase font-medium">© 2026 Mountain House Muslim Association</p>
        </div>
      </footer>
    </div>
  );
}
