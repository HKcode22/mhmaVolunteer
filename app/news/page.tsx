"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Edit3, Clock, User } from "lucide-react";
import { fetchNews, NewsItem } from "@/lib/firebase";
import { getCachedData } from "@/lib/cache-manager";
import { usePageData } from "@/lib/page-data-context";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";

export default function NewsListPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { setPageData } = usePageData();

  useEffect(() => {
    getCachedData('news', () => fetchNews(50)).then(({ data }) => { setItems(data); setPageData({ news: data }); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fmtDate = (d: any) => {
    if (!d) return "";
    if (d.toDate) return d.toDate().toLocaleDateString();
    if (typeof d === "string") return new Date(d).toLocaleDateString();
    return "";
  };

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="news" />
      <PageBanner
        title="News & Announcements"
        highlightedText="News"
        subtitle="Stay informed with the latest updates and announcements from MHMA."
        badgeText="Updates"
      />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-[400px]" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No news articles yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(n => (
                <Link key={n.id} href={`/news/${n.slug}`}
                  className="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 group hover:border-mhma-gold transition-all duration-300">
                  {/* Image Area */}
                  <div className="relative aspect-[16/10] bg-gray-50 overflow-hidden">
                    {n.image ? (
                      <img src={n.image} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Edit3 className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  {/* Info Area */}
                  <div className="p-5 bg-white flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-mhma-gold transition-colors mb-2 line-clamp-2">{n.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">{n.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-100">
                      {n.authorName && (
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {n.authorName}</span>
                      )}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(n.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
