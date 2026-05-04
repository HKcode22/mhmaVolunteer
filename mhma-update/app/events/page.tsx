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
  ChevronLeft
} from "lucide-react";
import Navigation from "@/components/Navigation";

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
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
        const response = await fetch(`${WP_API_URL}/wp/v2/pages?parent=277&per_page=100`);
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();

        const eventSlides: Slide[] = await Promise.all(data.map(async (event: any) => {
          let formattedDate = event.acf?.event_date || "";
          if (formattedDate && /^\d{8}$/.test(formattedDate)) {
            const year = formattedDate.substring(0, 4);
            const month = formattedDate.substring(4, 6);
            const day = formattedDate.substring(6, 8);
            formattedDate = `${month}/${day}/${year}`;
          }

          let formattedTime = event.acf?.event_time || "";
          if (formattedTime && /^\d{1,2}:\d{2}(:\d{2})?$/.test(formattedTime)) {
            const [hours, minutes] = formattedTime.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'pm' : 'am';
            const hour12 = hour % 12 || 12;
            formattedTime = `${hour12}:${minutes}${ampm}`;
          }

          let posterUrl = event.acf?.event_poster || "";
          if (typeof posterUrl === 'number') {
            try {
              const mediaResponse = await fetch(`${WP_API_URL}/wp/v2/media/${posterUrl}`);
              if (mediaResponse.ok) {
                const mediaData = await mediaResponse.json();
                posterUrl = mediaData.source_url;
              }
            } catch (error) {
              posterUrl = "";
            }
          }

          return {
            id: event.id,
            src: posterUrl || "https://mhma.us/wp-content/uploads/2024/06/MHMA-Default-Event.webp",
            alt: event.title.rendered,
            eventName: event.title.rendered,
            eventDate: formattedDate,
            eventTime: formattedTime,
            eventLocation: event.acf?.event_location || "",
            eventDescription: event.acf?.event_description || "",
            eventRsvpLink: event.acf?.event_rsvp_link || "",
            showDate: event.acf?.show_date || false,
            showTime: event.acf?.show_time || false,
            showLocation: event.acf?.show_location || false,
            showDescription: event.acf?.show_description || false,
          };
        }));

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
    <div className="min-h-screen flex flex-col font-sans selection:bg-mhma-gold selection:text-white bg-[#FDFDFD]">
      <Navigation currentPage="events" />

      {/* Hero Header */}
      <section className="relative pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden mhma-gradient mhma-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 mb-4 rounded-full border border-mhma-gold/30 bg-mhma-gold/10 backdrop-blur-sm text-mhma-gold text-xs font-bold tracking-widest uppercase">
            Community Calendar
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 font-serif uppercase tracking-tight">
            Upcoming <span className="text-mhma-gold italic">Events</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto font-light">
            Stay connected with the heartbeat of our community. Join us for prayers, learning, and sisterhood.
          </p>
        </div>
      </section>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {slides.map((slide) => (
                <div key={slide.id} className="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 group hover:border-mhma-gold transition-all duration-300">
                  {/* Poster Area */}
                  <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
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
                      <p className="text-gray-500 text-sm leading-relaxed mb-8 font-light border-l-2 border-mhma-gold/20 pl-4">{slide.eventDescription}</p>
                    )}

                    {slide.eventRsvpLink && (
                      <a
                        href={slide.eventRsvpLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full justify-center items-center px-8 py-4 bg-mhma-gold text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg text-lg uppercase tracking-widest"
                      >
                        RSVP NOW <ArrowRight className="ml-2 w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Call to Action */}
      <section className="py-24 bg-mhma-dark mhma-pattern relative overflow-hidden">
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
