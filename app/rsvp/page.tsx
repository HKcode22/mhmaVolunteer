"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar, Loader2, AlertCircle, Check } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";
import { fetchEvents } from "@/lib/firebase";
import { useAuth, fullName } from "@/lib/auth-context";

function RSVPForm() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    attendees: "1",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || fullName(user) || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents(100);
        setEvents(data);
        const eventId = searchParams.get("eventId");
        if (eventId && data.some((ev: any) => ev.id === eventId)) {
          setSelectedEvent(eventId);
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const event = events.find(ev => ev.id === selectedEvent);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent,
          eventTitle: event?.title || "Unknown Event",
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit RSVP");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ fullName: "", email: "", phone: "", attendees: "1", notes: "" });
    setSubmitted(false);
    setError("");
    setSelectedEvent("");
    window.history.replaceState({}, "", "/rsvp");
  };

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="events" />
      <PageBanner
        title="RSVP"
        highlightedText="RSVP"
        subtitle="Register for an upcoming event. Select an event below and fill out the form."
        currentPage="events"
      />

      <main className="max-w-2xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-4">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-sm border-2 border-dashed border-[#E8E2D4]">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No events available at this time.</p>
            <Link href="/" className="mt-4 inline-block text-mhma-gold font-bold">Return Home →</Link>
          </div>
        ) : submitted ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-[#1C2A20] mb-2">JazakAllahu Khairan!</h3>
            <p className="text-gray-600 mb-2">Your RSVP has been received for:</p>
            <p className="text-lg font-semibold text-mhma-forest mb-4">
              {events.find(ev => ev.id === selectedEvent)?.title}
            </p>
            <p className="text-sm text-gray-500 mb-6">We will confirm your RSVP shortly.</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-mhma-forest text-white rounded-sm hover:bg-mhma-forest-light transition-colors font-medium"
            >
              RSVP for Another Event
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-sm border border-[#E8E2D4] shadow-sm p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Select Event *</label>
              <select
                required
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-mhma-gold focus:border-transparent outline-none transition-all"
              >
                <option value="">-- Choose an event --</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title}{event.date ? ` — ${event.date}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-mhma-gold focus:border-transparent outline-none transition-all"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-mhma-gold focus:border-transparent outline-none transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-mhma-gold focus:border-transparent outline-none transition-all"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Number of Attendees</label>
              <select
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-mhma-gold focus:border-transparent outline-none transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-mhma-gold focus:border-transparent outline-none transition-all resize-none"
                placeholder="Any special requirements or questions..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedEvent}
              className="w-full py-3 bg-mhma-gold text-gray-900 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-amber-500 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit RSVP"
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default function RSVPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-mhma-cream"><Navigation currentPage="events" /><div className="pt-32 text-center"><p className="text-gray-500">Loading...</p></div></div>}>
      <RSVPForm />
    </Suspense>
  );
}
