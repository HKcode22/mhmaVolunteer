"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  BookText,
  ArrowRight,
  ChevronRight,
  Clock,
  Search,
  BookOpen
} from "lucide-react";
import Navigation from "@/components/Navigation";
import PageBanner from "@/components/PageBanner";

interface JournalEntry {
  id: number;
  title: {
    rendered: string;
  };
  slug: string;
  acf?: {
    journal_title?: string;
    date_published?: string;
    date_held_on?: string;
    attendees?: string;
    content?: string;
  };
  meta?: {
    journal_title?: string;
    date_published?: string;
    date_held_on?: string;
    attendees?: string;
    journal_content?: string;
  };
}

export default function JournalPage() {
  const [wpJournalEntries, setWpJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchJournalEntries = async () => {
      try {
        const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
        const response = await fetch(`${WP_API_URL}/wp/v2/pages?parent=199&per_page=100&_fields=id,title,slug,acf,meta,content`);
        if (!response.ok) throw new Error("Failed to fetch journal entries");
        const data = await response.json();
        setWpJournalEntries(data);
      } catch (err) {
        console.error("Failed to fetch journal entries:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournalEntries();
  }, []);

  const hardcodedJournalEntries = [
    { id: 1, title: "BOD Minutes for MHMA Board of Directors Meeting – 12-Apr-26", date: "April 18, 2026", slug: "bod-minutes-for-mhma-board-of-directors-meeting-12-apr-26", rawDate: "2026-04-18" },
    { id: 2, title: "BOD Minutes for MHMA Board of Directors Meeting – 05-Apr-26", date: "April 12, 2026", slug: "bod-minutes-for-mhma-board-of-directors-meeting-05-apr-26", rawDate: "2026-04-12" },
    { id: 3, title: "Minutes for MHMA Full Board Meeting – 30-Mar-26", date: "April 5, 2026", slug: "minutes-for-mhma-full-board-meeting-30-mar-26", rawDate: "2026-04-05" },
    { id: 4, title: "Minutes for MHMA Full Board Meeting – Ramadan FR Focus – 24-Feb-26", date: "March 25, 2026", slug: "minutes-for-mhma-full-board-meeting-ramadan-fr-focus-24-feb-26", rawDate: "2026-03-25" },
    { id: 5, title: "Minutes for MHMA Full Board Meeting – 15-Feb-26", date: "March 25, 2026", slug: "minutes-for-mhma-full-board-meeting-15-feb-26", rawDate: "2026-03-25" },
    { id: 6, title: "Minutes for MHMA Full Board Meeting – 18-Jan-26", date: "January 25, 2026", slug: "minutes-for-mhma-full-board-meeting-18-jan-26", rawDate: "2026-01-25" },
    { id: 7, title: "Minutes for MHMA Board of Trustees Meeting – 04-Mar-26", date: "March 23, 2026", slug: "minutes-for-mhma-board-of-trustees-meeting-04-mar-26", rawDate: "2026-03-23" },
    { id: 8, title: "Minutes for MHMA Board of Trustees Meeting – 27-Feb-26", date: "March 23, 2026", slug: "minutes-for-mhma-board-of-trustees-meeting-27-feb-26", rawDate: "2026-03-23" }
  ];

  const wpJournalEntriesFormatted = wpJournalEntries.map(entry => {
    const datePublished = entry.acf?.date_published || entry.meta?.date_published;
    let formattedDate = datePublished || "";
    if (datePublished) {
      const date = new Date(datePublished);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    }
    const journalTitle = entry.acf?.journal_title || entry.meta?.journal_title;
    return {
      id: entry.id,
      title: journalTitle || entry.title.rendered,
      date: formattedDate,
      slug: entry.slug,
      rawDate: datePublished || "",
    };
  });

  const journalEntries = [...wpJournalEntriesFormatted, ...hardcodedJournalEntries].sort((a, b) => {
    const dateA = new Date((a as any).rawDate || "1970-01-01");
    const dateB = new Date((b as any).rawDate || "1970-01-01");
    return dateB.getTime() - dateA.getTime();
  });

  const displayEntries = showAll ? journalEntries : journalEntries.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-mhma-gold selection:text-white bg-[#FDFDFD]">
      <Navigation currentPage="journal" />

      <PageBanner
        title="The Journal"
        highlightedText="Journal"
        subtitle="Meeting minutes, community updates, and reflections from the heart of MHMA. Staying transparent and connected."
        badgeText="Community Archive"
      />

      {/* Main Journal Grid */}
      <main className="flex-grow py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search archive..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-mhma-gold focus:border-mhma-gold outline-none transition-all shadow-sm"
              />
            </div>
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-mhma-teal text-white rounded-lg text-sm font-bold tracking-widest uppercase">All Posts</button>
              <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-gray-100">Minutes</button>
              <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-gray-100">Updates</button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-gray-50 rounded-3xl h-64 border border-gray-100"></div>
              ))}
            </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayEntries.map((entry) => (
                <Link 
                  key={entry.id} 
                  href={`/journal/${entry.slug}`}
                  className="flex flex-col bg-white p-8 rounded-3xl shadow-sm border border-gray-100 group hover:border-mhma-gold hover:shadow-xl transition-all duration-500"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl text-mhma-teal group-hover:bg-mhma-teal group-hover:text-white transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex items-center text-mhma-gold text-xs font-bold uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {entry.date.replace("Published On: ", "")}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif leading-tight group-hover:text-mhma-gold transition-colors line-clamp-3 flex-grow">
                    {entry.title}
                  </h3>
                  <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-mhma-dark transition-colors">
                    Read Reflection <ChevronRight className="ml-1 w-4 h-4" />
                  </div>
                </Link>
              ))}
                </div>

                {!loading && journalEntries.length > 6 && (
                  <div className="text-center mt-8">
                    <button
                      type="button"
                      onClick={() => {
                        console.log("Show All Journal Entries clicked, current state:", showAll);
                        setShowAll(!showAll);
                      }}
                      className="inline-flex items-center px-8 py-3 bg-white text-mhma-teal font-bold rounded-full border-2 border-mhma-teal hover:bg-mhma-teal hover:text-white transition-all cursor-pointer"
                    >
                      {showAll ? 'Show Less' : `View All Entries (+${journalEntries.length - 6} more)`}
                    </button>
                  </div>
                )}
              )}
          </div>
        </main>

      {/* Footer */}
      <footer className="bg-mhma-dark mhma-pattern py-20 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="Logo" width={220} height={45} className="mx-auto mb-12 opacity-90" />
          <p className="text-gray-500 text-sm tracking-widest uppercase mb-4">© 2026 Mountain House Muslim Association</p>
          <div className="w-16 h-1 bg-mhma-gold mx-auto rounded-full opacity-30"></div>
        </div>
      </footer>
    </div>
  );
}
