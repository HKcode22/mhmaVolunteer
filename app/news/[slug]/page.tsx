"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { fetchNewsBySlug, NewsItem } from "@/lib/firebase";
import { getCachedData } from "@/lib/cache-manager";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";

export default function NewsDetailPage() {
  const params = useParams();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.slug) return;
    getCachedData('news_' + params.slug, () => fetchNewsBySlug(params.slug as string)).then(({ data }) => { setItem(data); setLoading(false); }).catch(() => setLoading(false));
  }, [params.slug]);

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
        title={item ? item.title : "News"}
        highlightedText="News"
        subtitle={item ? `By ${item.authorName || "MHMA"} · ${fmtDate(item.createdAt)}` : ""}
        badgeText="Article"
      />
      <main className="py-16 px-4 max-w-3xl mx-auto">
        <Link href="/news" className="inline-flex items-center text-mhma-gold hover:text-amber-600 mb-8 font-semibold">
          <ArrowLeft className="h-4 w-4 mr-2" /> All News
        </Link>

        {loading ? (
          <p className="text-gray-400 text-center py-12">Loading...</p>
        ) : !item ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Article not found.</p>
            <Link href="/news" className="text-mhma-gold hover:underline mt-4 inline-block">Browse all news</Link>
          </div>
        ) : (
          <article className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            {item.image && (
              <img src={item.image} alt={item.title} className="w-full h-64 md:h-80 object-cover rounded-xl mb-8" />
            )}
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">{item.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
              {item.authorName && <span className="flex items-center gap-1"><User className="w-4 h-4" /> {item.authorName}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {fmtDate(item.createdAt)}</span>
            </div>
            <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
              {item.content}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
