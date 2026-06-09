"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MapPin, Mail, Phone, Heart, ChevronRight, ImageIcon, ListOrdered } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import NewsletterSignup from "@/app/components/NewsletterSignup";
import GalleryLightbox from "@/app/components/GalleryLightbox";
import { fetchMasjidUpdates, FirebaseMasjidUpdate } from "@/lib/firebase";
import { formatCampaignDollars, normalizeCampaignDollars } from "@/lib/campaign-stats";
import TestimonialsDisplay from "@/app/components/TestimonialsDisplay";
import BoardMemberCard from "@/app/components/BoardMemberCard";
import { boardOfDirectors } from "@/app/lib/board-data";

export default function MasjidConstructionPage() {
  const toEmbedUrl = (url: string): string => {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
      if (u.hostname.includes("youtube.com")) {
        if (u.pathname === "/watch" && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
        if (u.pathname.startsWith("/embed/")) return url;
      }
    } catch {}
    return url;
  };
    const [updates, setUpdates] = useState<FirebaseMasjidUpdate[]>([]);
    const [raisedFromDonations, setRaisedFromDonations] = useState(0);
    const [donorCount, setDonorCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [masjidLoaded, setMasjidLoaded] = useState(false);
    const [statsLoaded, setStatsLoaded] = useState(false);
  const [galleryView, setGalleryView] = useState<"grid" | "timeline">("grid");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
    useEffect(() => {
      const saved = localStorage.getItem("constructionGalleryView");
      if (saved === "grid" || saved === "timeline") setGalleryView(saved);
    }, []);

    useEffect(() => {
      fetchMasjidUpdates(20).then(data => { 
        setUpdates(data); 
        setMasjidLoaded(true); 
        setLoading(false); 
      }).catch(() => {
        setMasjidLoaded(true);
        setLoading(false);
      });
      fetch("/api/donation-totals").then(r => r.json()).then(d => {
        setRaisedFromDonations(d.constructionTotal || 0);
        setDonorCount(d.donorCount || 0);
        setStatsLoaded(true);
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch donation totals:", err);
        setStatsLoaded(true);
        setLoading(false);
      });
    }, []);

    const latest = updates[0];
    const goal = normalizeCampaignDollars(latest?.goal, 8_500_000);
    const raised = raisedFromDonations;
    const remaining = Math.max(0, goal - raised);
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
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Islamic Center Campaign</h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Building a permanent place of worship, education, and community for Mountain House.
            </p>
            <p className="text-sm text-mhma-gold/80 mt-4 italic max-w-2xl mx-auto">
              "Whoever builds a masjid for the sake of Allah, Allah will build for him a house in Paradise." — Bukhari &amp; Muslim
            </p>
          </div>
        </section>

        {/* Progress Bar */}
        {masjidLoaded && statsLoaded ? (
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
                    <p className="text-sm text-gray-500">Goal: {formatCampaignDollars(goal)}</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden shadow-inner border border-gray-200">
                    <div className="bg-mhma-gold h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-mhma-forest">{formatCampaignDollars(raised)} raised</span>
                    <span className="font-bold text-mhma-gold">{pct}%</span>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {statsLoaded ? (
                      <>{donorCount} donor{donorCount !== 1 ? "s" : ""} contributed</>
                    ) : (
                      "Loading donor count..."
                    )}
                  </p>
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
        ) : (
          <section className="bg-white border-b border-gray-200 py-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto" />
                <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto" />
                <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto" />
                <div className="flex justify-center pt-2">
                  <Link href="/pledge" className="inline-flex items-center gap-2 px-6 py-3 bg-mhma-gold text-mhma-forest font-bold rounded-lg hover:bg-amber-500 transition-all shadow-md">
                    <Heart className="w-5 h-5" /> Pledge Today
                  </Link>
                  <Link href="/donate" className="inline-flex items-center gap-2 px-6 py-3 bg-mhma-forest text-white font-bold rounded-lg hover:bg-mhma-forest-light transition-all shadow-md">
                    Donate Now <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Cards */}
        {masjidLoaded && statsLoaded ? (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
                <p className="text-3xl md:text-4xl font-bold text-gray-900">{formatCampaignDollars(goal)}</p>
                <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">Campaign Goal</p>
              </div>
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
                <p className="text-3xl md:text-4xl font-bold text-mhma-gold">{formatCampaignDollars(raised)}</p>
                <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">Raised So Far</p>
              </div>
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
                <p className="text-3xl md:text-4xl font-bold text-gray-900">{formatCampaignDollars(remaining)}</p>
                <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">Remaining</p>
              </div>
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
                <p className="text-3xl md:text-4xl font-bold text-gray-900">{donorCount}</p>
                <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">Donors Contributed</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
                <p className="text-4xl font-bold text-mhma-forest">—</p>
                <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">Campaign Goal</p>
              </div>
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
                <p className="text-4xl font-bold text-mhma-gold">—</p>
                <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">Raised So Far</p>
              </div>
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
                <p className="text-4xl font-bold text-gray-900">—</p>
                <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">Remaining</p>
              </div>
            </div>
          </section>
        )}

        {/* Project Overview */}
        {latest && (latest.narrative || latest.sqFootage || latest.capacity || latest.brochureUrl || latest.visionVideoUrl) && (
          <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Project Overview</h2>
              {latest.narrative && (
                <div className="prose prose-gray max-w-none mb-8">
                  <p className="text-gray-700 leading-relaxed">{latest.narrative}</p>
                </div>
              )}
              {(latest.sqFootage || latest.capacity || latest.communityImpact) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {latest.sqFootage ? (
                    <div className="bg-mhma-cream rounded-xl p-6 text-center border border-gray-200">
                      <p className="text-3xl font-bold text-mhma-forest">{latest.sqFootage.toLocaleString()}</p>
                      <p className="text-gray-500 text-sm mt-1">Sq Ft</p>
                    </div>
                  ) : null}
                  {latest.capacity ? (
                    <div className="bg-mhma-cream rounded-xl p-6 text-center border border-gray-200">
                      <p className="text-3xl font-bold text-mhma-gold">{latest.capacity.toLocaleString()}</p>
                      <p className="text-gray-500 text-sm mt-1">Worshipers Capacity</p>
                    </div>
                  ) : null}
                  {latest.communityImpact ? (
                    <div className="bg-mhma-cream rounded-xl p-6 text-center border border-gray-200">
                      <p className="text-3xl font-bold text-gray-900">{latest.communityImpact}</p>
                      <p className="text-gray-500 text-sm mt-1">Community Impact</p>
                    </div>
                  ) : null}
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-4">
                {latest.brochureUrl && (
                  <a href={latest.brochureUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-mhma-forest text-white font-bold rounded-lg hover:bg-mhma-forest-light transition-all shadow-md">
                    Download Brochure
                  </a>
                )}
                {latest.visionVideoUrl && (
                  <a href={toEmbedUrl(latest.visionVideoUrl)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-mhma-gold text-mhma-forest font-bold rounded-lg hover:bg-amber-500 transition-all shadow-md">
                    Watch Campaign Video
                  </a>
                )}
              </div>
              {latest.visionVideoUrl && (
                <div className="mt-8 aspect-video rounded-xl overflow-hidden shadow-lg">
                  <iframe src={toEmbedUrl(latest.visionVideoUrl)} className="w-full h-full" allowFullScreen></iframe>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Giving Tiers */}
        {latest?.givingTiers && latest.givingTiers.length > 0 && (
          <section className="py-16 bg-mhma-cream">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Giving Tiers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...latest.givingTiers].sort((a, b) => b.amount - a.amount).map((tier, i) => (
                  <div key={i} className={`bg-white rounded-2xl p-8 text-center border-2 shadow-lg ${i === 0 ? "border-mhma-gold" : "border-gray-100"}`}>
                    {i === 0 && <span className="inline-block text-xs font-bold bg-mhma-gold text-mhma-forest px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Most Popular</span>}
                    <p className="text-3xl font-bold text-mhma-forest mb-1">${tier.amount.toLocaleString()}+</p>
                    <p className="text-lg font-semibold text-gray-900 mb-2">{tier.name}</p>
                    {tier.description && <p className="text-sm text-gray-500">{tier.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Construction Updates Gallery */}
        {images.length > 0 && (
          <section className="bg-white py-12 border-y border-gray-200">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Construction Progress</h2>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => { setGalleryView("grid"); localStorage.setItem("constructionGalleryView", "grid"); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${galleryView === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    <ImageIcon className="w-3.5 h-3.5" /> Grid
                  </button>
                  <button onClick={() => { setGalleryView("timeline"); localStorage.setItem("constructionGalleryView", "timeline"); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${galleryView === "timeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    <ListOrdered className="w-3.5 h-3.5" /> Timeline
                  </button>
                </div>
              </div>

              {galleryView === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((u, i) => (
                    <div key={u.id || i} onClick={() => openLightbox(i)} className="bg-mhma-cream rounded-2xl overflow-hidden shadow-md border border-gray-200 cursor-pointer group">
                      <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                        <img src={u.image} alt={u.caption || "Construction"} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
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



        {/* Multiple Giving Options */}
        <section className="py-16 bg-mhma-cream border-y border-gray-200/60">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Other Ways to Give</h2>
            <p className="text-sm text-gray-600 mb-8 max-w-xl mx-auto">
              For monthly recurring support, use the <Link href="/donate" className="text-mhma-forest font-semibold hover:text-mhma-gold underline">Donate</Link> page and choose the Monthly option (similar to other masjid sustainer programs).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <p className="text-lg font-bold text-mhma-forest mb-2">Employer Matching</p>
                <p className="text-sm text-gray-600">Check if your employer offers a charitable matching gift program. Many companies will match your donation dollar-for-dollar.</p>
                <p className="text-xs text-gray-400 mt-3">For Benevity or other matching platforms, use board@mhma.info</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <p className="text-lg font-bold text-mhma-forest mb-2">Cryptocurrency</p>
                <p className="text-sm text-gray-600">Donate crypto assets and potentially reduce your tax liability. Contact our board to arrange a crypto transfer.</p>
                <p className="text-xs text-gray-400 mt-3">Email board@mhma.info to initiate</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <p className="text-lg font-bold text-mhma-forest mb-2">Waqf / Endowment</p>
                <p className="text-sm text-gray-600">Consider a lasting legacy through our Waqf (endowment) program. Your contributed principal is preserved while returns fund the masjid.</p>
                <p className="text-xs text-gray-400 mt-3">Contact board@mhma.info for details</p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Support the Campaign</h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Your donation brings us closer to having a permanent masjid. Every contribution counts.
            </p>
            <div className="bg-mhma-cream rounded-2xl p-8 max-w-lg mx-auto">
              <Link href="/donate" className="inline-flex items-center gap-2 px-8 py-3 bg-mhma-gold text-mhma-forest font-bold rounded-lg hover:bg-amber-500 transition-all shadow-lg text-lg">
              <Heart className="w-5 h-5" /> Donate Now
            </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <TestimonialsDisplay page="masjid-construction" />

        {/* Contact Info */}
        <section className="grid grid-cols-1 md:grid-cols-3">
          <div className="py-20 px-8 text-center bg-mhma-cream">
            <MapPin className="w-14 h-14 mx-auto mb-6 text-gray-700" />
            <div className="space-y-1 text-lg text-gray-700">
              <p>250 East Main Street,</p><p>Mountain House,</p><p>CA 95391</p>
            </div>
          </div>
          <div className="py-20 px-8 text-center bg-white">
            <Mail className="w-14 h-14 mx-auto mb-6 text-gray-800" />
            <p className="text-lg text-gray-800"><a href="mailto:board@mhma.info" className="hover:text-mhma-gold transition-colors">board@mhma.info</a></p>
          </div>
          <div className="py-20 px-8 text-center bg-mhma-cream">
            <Phone className="w-14 h-14 mx-auto mb-6 text-gray-700" />
            <p className="text-lg text-gray-700"><a href="tel:4087221043" className="hover:text-mhma-gold transition-colors">408.722.1043</a></p>
          </div>
        </section>
      </main>

      {/* Board Oversight */}
      <section className="py-16 bg-mhma-cream">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">Board <span className="text-mhma-gold">Oversight</span></h2>
          <div className="w-24 h-1 bg-mhma-gold mx-auto mb-4"></div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-10">The masjid construction project is overseen by our board members. Reach out with any questions.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[boardOfDirectors[0], boardOfDirectors[2], boardOfDirectors[5]].filter(Boolean).map((member, i) => (
              member ? <BoardMemberCard key={i} member={member} variant="compact" /> : null
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="MHMA Logo" width={200} height={45} className="h-12 w-auto" />
            </div>
            <div className="w-full max-w-sm mx-auto mb-6">
              <h3 className="text-sm font-semibold text-mhma-gold mb-2 text-center">Get Construction Updates</h3>
              <NewsletterSignup variant="hero" source="masjid-construction" />
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
