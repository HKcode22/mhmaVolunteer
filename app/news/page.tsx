"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronRight, Edit3 } from "lucide-react";
import { fetchNews, NewsItem } from "@/lib/firebase";
import Navigation from "@/app/components/Navigation";

export default function NewsListPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews(50).then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fmtDate = (d: any) => {
    if (!d) return "";
    if (d.toDate) return d.toDate().toLocaleDateString();
    if (typeof d === "string") return new Date(d).toLocaleDateString();
    return "";
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="news" />
      <div className="pt-32 pb-16 px-4 max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-6 font-semibold">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Link>
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">News</h1>
        <p className="text-gray-500 mb-8">Latest updates and announcements from MHMA.</p>

        {loading ? (
          <p className="text-gray-400 text-center py-12">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No news articles yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map(n => (
              <Link key={n.id} href={`/news/${n.slug}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-mhma-gold transition-colors">{n.title}</h2>
                    <p className="text-gray-500 mt-1">{n.excerpt}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      {n.authorName && <span>By {n.authorName}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(n.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-2 group-hover:text-mhma-gold transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
