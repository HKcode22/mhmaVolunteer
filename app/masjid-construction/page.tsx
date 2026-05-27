"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MapPin, Mail, Phone, Heart, ChevronRight, ImageIcon, ListOrdered } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import NewsletterSignup from "@/app/components/NewsletterSignup";
import GalleryLightbox from "@/app/components/GalleryLightbox";
import { fetchMasjidUpdates, FirebaseMasjidUpdate } from "@/lib/firebase";

export default function MasjidConstructionPage() {
  const [updates, setUpdates] = useState<FirebaseMasjidUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryView, setGalleryView] = useState<"grid" | "timeline">("grid");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchMasjidUpdates(20).then(data => { setUpdates(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const latest = updates[0];
  const goal = latest?.goal || 0;
  const raised = latest?.raised || 0;
  const pct = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
  const images = useMemo(() => {
    return updates
      .filter(u => u.image)
      .sort((a, b) => {
        const da = a.progressDate || "";
        const db = b.progressDate || "";
        return da.localeCompare(db); // ascending by date
      });
  }, [updates]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen bg-mhma-cream">
      <Navigation currentPage="masjid-construction" />

      <main className="pt-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-mhma-forest via-mhma-forest-mid to-mhma-forest-light py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Islamic Center Campaign</h1>
            <p className="text-lg md:text-xl text-mhma-sage/90 max-w-2xl mx-auto">
              Building a permanent place of worship, education, and community for Mountain House.
            </p>
          </div>
        </section>

        {/* Progress Bar */}
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-4xl mx-auto px-4">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto" />
              </div>
            ) : goal > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold text-mhma-forest uppercase tracking-wider">Masjid Fund</p>
                  <p className="text-sm text-gray-500">Goal: ${goal.toLocaleString()}</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden shadow-inner border border-gray-200">
                  <div className="bg-mhma-gold h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-mhma-forest">${raised.toLocaleString()} raised</span>
                  <span className="font-bold text-mhma-gold">{pct}%</span>
                </div>
                <div className="flex justify-center gap-4 pt-2">
                  <Link href="/pledge" className="inline-flex items-center gap-2 px-6 py-3 bg-mhma-gold text-mhma-forest font-bold rounded-lg hover:bg-amber-500 transition-all shadow-md">
                    <Heart className="w-5 h-5" /> Pledge Today
                  </Link>
                  <Link href="/donate" className="inline-flex items-center gap-2 px-6 py-3 bg-mhma-forest text-white font-bold rounded-lg hover:bg-mhma-forest-light transition-all shadow-md">
                    Donate Now <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Campaign data coming soon.</p>
                <Link href="/pledge" className="inline-flex items-center gap-2 px-6 py-3 bg-mhma-gold text-mhma-forest font-bold rounded-lg hover:bg-amber-500 transition-all mt-4 shadow-md">
                  <Heart className="w-5 h-5" /> Pledge Today
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Stats Cards */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
              <p className="text-4xl font-bold text-mhma-forest">{goal > 0 ? `$${(goal / 1000000).toFixed(1)}M` : "—"}</p>
              <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">Campaign Goal</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
              <p className="text-4xl font-bold text-mhma-gold">{goal > 0 ? `$${(raised / 1000000).toFixed(1)}M` : "—"}</p>
              <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">Raised So Far</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
              <p className="text-4xl font-bold text-gray-900">{goal > 0 ? `$${((goal - raised) / 1000000).toFixed(1)}M` : "—"}</p>
              <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">Remaining</p>
            </div>
          </div>
        </section>

        {/* Construction Updates Gallery */}
        {images.length > 0 && (
          <section className="bg-white py-12 border-y border-gray-200">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Construction Progress</h2>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setGalleryView("grid")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${galleryView === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    <ImageIcon className="w-3.5 h-3.5" /> Grid
                  </button>
                  <button onClick={() => setGalleryView("timeline")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${galleryView === "timeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    <ListOrdered className="w-3.5 h-3.5" /> Timeline
                  </button>
                </div>
              </div>

              {galleryView === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((u, i) => (
                    <div key={u.id || i} onClick={() => openLightbox(i)} className="bg-mhma-cream rounded-2xl overflow-hidden shadow-md border border-gray-200 cursor-pointer group">
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={u.image} alt={u.caption || "Construction"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-4">
                        {u.phase && (
                          <span className="inline-block text-xs font-semibold bg-mhma-gold/20 text-mhma-forest px-2 py-0.5 rounded-full mb-2">{u.phase}</span>
                        )}
                        {u.caption && <p className="text-sm text-gray-700">{u.caption}</p>}
                        {u.progressDate && <p className="text-xs text-gray-400 mt-1">{u.progressDate}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {galleryView === "timeline" && (
                <div className="relative">
                  <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-mhma-gold/30 -translate-x-1/2" />
                  {images.map((u, i) => (
                    <div key={u.id || i} className="relative mb-8 md:mb-12">
                      <div className={`flex flex-col md:flex-row items-start gap-4 md:gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                        {/* Timeline dot */}
                        <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-mhma-gold border-4 border-white shadow -translate-x-1/2 mt-2 z-10" />

                        {/* Content */}
                        <div className={`ml-10 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8"}`}>
                          <div onClick={() => openLightbox(i)} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 cursor-pointer group transition-shadow hover:shadow-lg">
                            <div className="aspect-[16/9] overflow-hidden">
                              <img src={u.image} alt={u.caption || "Construction"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {u.progressDate && <span className="text-xs font-bold text-mhma-gold">{u.progressDate}</span>}
                                {u.phase && (
                                  <span className="text-xs font-semibold bg-mhma-forest/10 text-mhma-forest px-2 py-0.5 rounded-full">{u.phase}</span>
                                )}
                              </div>
                              {u.caption && <p className="text-sm text-gray-700">{u.caption}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Spacer for alternating layout */}
                        <div className="hidden md:block md:w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Lightbox */}
        {lightboxOpen && (
          <GalleryLightbox
            images={images.map(u => ({ src: u.image!, caption: u.caption, phase: u.phase, date: u.progressDate }))}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
            onPrev={() => setLightboxIndex(i => (i - 1 + images.length) % images.length)}
            onNext={() => setLightboxIndex(i => (i + 1) % images.length)}
          />
        )}

        {/* Videos */}
        {updates.filter((u): u is FirebaseMasjidUpdate & { video: string } => !!u.video).length > 0 && (
          <section className="py-12">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Video Updates</h2>
              <div className="space-y-6">
                {updates.filter((u): u is FirebaseMasjidUpdate & { video: string } => !!u.video).map((u, i) => (
                  <div key={u.id || i} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200">
                    <div className="aspect-video" dangerouslySetInnerHTML={{ __html: u.video }} />
                    {u.caption && <p className="p-4 text-sm text-gray-700">{u.caption}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Donate Section */}
        <section className="bg-gradient-to-br from-mhma-forest via-mhma-forest-mid to-mhma-forest-light py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Support the Campaign</h2>
            <p className="text-mhma-sage/90 mb-8 max-w-xl mx-auto">
              Your donation brings us closer to having a permanent masjid. Every contribution counts.
            </p>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 max-w-lg mx-auto">
              <div ref={(el) => {
                if (el && typeof window !== 'undefined') {
                  el.innerHTML = '';
                  const script = document.createElement('script');
                  script.src = 'https://js.stripe.com/v3/buy-button.js';
                  script.async = true;
                  el.appendChild(script);
                  const button = document.createElement('stripe-buy-button');
                  button.setAttribute('buy-button-id', 'buy_btn_1O6UR8KkhNmRB0QYd4bijFKq');
                  button.setAttribute('publishable-key', 'pk_live_51Nz3brKkhNmRB0QYiQmU7j48IR0VIVgI5fUW9boK2NGoz2ZzhCSn8n4EivbkAzovFpZja1l4mAyFshV5izioBIJK00h8ttma6x');
                  el.appendChild(button);
                }
              }} />
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="grid grid-cols-1 md:grid-cols-3">
          <div className="py-20 px-8 text-center text-white relative bg-cover bg-center" style={{ backgroundImage: 'url(https://mhma.us/wp-content/uploads/2016/08/donate3.jpg)' }}>
            <div className="absolute inset-0 bg-mhma-gold/90" />
            <div className="relative z-10">
              <MapPin className="w-14 h-14 mx-auto mb-6" />
              <div className="space-y-1 text-lg">
                <p>250 East Main Street,</p><p>Mountain House,</p><p>CA 95391</p>
              </div>
            </div>
          </div>
          <div className="py-20 px-8 text-center text-white relative bg-cover bg-center" style={{ backgroundImage: 'url(https://mhma.us/wp-content/uploads/2016/08/donate2.jpg)' }}>
            <div className="absolute inset-0 bg-black/80" />
            <div className="relative z-10">
              <Mail className="w-14 h-14 mx-auto mb-6" />
              <p className="text-lg"><a href="mailto:board@mhma.info" className="hover:text-mhma-gold transition-colors">board@mhma.info</a></p>
            </div>
          </div>
          <div className="py-20 px-8 text-center text-white relative bg-cover bg-center" style={{ backgroundImage: 'url(https://mhma.us/wp-content/uploads/2016/08/donate1.jpg)' }}>
            <div className="absolute inset-0 bg-amber-800/90" />
            <div className="relative z-10">
              <Phone className="w-14 h-14 mx-auto mb-6" />
              <p className="text-lg"><a href="tel:4087221043" className="hover:text-white/80 transition-colors">408.722.1043</a></p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="MHMA Logo" width={200} height={45} className="h-12 w-auto" />
            </div>
            <div className="flex space-x-4 mb-8">
              {[
                { href: "https://www.facebook.com/mhma95391", icon: Facebook },
                { href: "https://www.instagram.com/mhma.ig/", icon: Instagram },
                { href: "https://x.com/i/flow/login?redirect_after_login=%2Fmhmatweets", icon: Twitter },
                { href: "https://www.linkedin.com/company/mountain-house-muslim-association/", icon: Linkedin },
                { href: "https://www.youtube.com/@MHMAYouTube", icon: Youtube },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-mhma-gold transition-colors">
                  <s.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <p className="text-gray-400 text-sm">Copyright 2026 MHMA - Mountain House Muslim Association</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
