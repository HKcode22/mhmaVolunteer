"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook, Instagram, Twitter, Linkedin, Youtube,
  Heart, BookOpen, ArrowRight, ChevronRight, Sparkles, Zap, Star, Edit3
} from "lucide-react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/lib/auth-context";

interface Program {
  id: string;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  useHardcodedVersion?: boolean;
}

const hardcodedPrograms = [
  { title: "Youth Sports League", description: "Healthy sports activity for the youth", image: "https://mhma.us/wp-content/uploads/2024/06/Youth-Sports-League.webp", href: "/programs/youth-sports-league" },
  { title: "Ladies Meetup", description: "Weekly ladies get together, fun activities & food.", image: "https://mhma.us/wp-content/uploads/2024/06/Ladies-Meetup.webp", href: "/programs/ladies-meetup" },
  { title: "Learn 3D Printing", description: "Learn how to design and print 3D objects", image: "https://mhma.us/wp-content/uploads/2024/06/3D-Printing.webp", href: "/programs/learn-3d-printing" },
  { title: "Urdu Academy", description: "Urdu Ka Safar (The Journey of Urdu)", image: "https://mhma.us/wp-content/uploads/2024/06/Urdu-Academy.webp", href: "/programs/urdu-academy" },
  { title: "Maktab Program", description: "Quran Recitation and Islamic Studies Program", image: "https://mhma.us/wp-content/uploads/2024/06/Maktab.webp", href: "/programs/maktab-program" },
  { title: "Family Night", description: "Bringing together the Muslim families of Mountain House.", image: "https://mhma.us/wp-content/uploads/2024/06/Family-Night.webp", href: "/programs/family-night" },
  { title: "Jummah And Salah", description: "Jummah and Salah at the Unity Center", image: "https://mhma.us/wp-content/uploads/2024/06/Jummah.webp", href: "/programs/jummah-and-salah" },
  { title: "Islamic Center of Mountain House", description: "We are committed to building this center of excellence.", image: "https://mhma.us/wp-content/uploads/2024/06/Islamic-Center-of-Mountain-House.webp", href: "/programs/islamic-center-of-mountain-house" },
  { title: "WISH", description: "Weekend Islamic schooling and sports for youth", image: "https://mhma.us/wp-content/uploads/2024/06/Hifz-Program-2.webp", href: "/programs/wish" },
  { title: "Quran Hifz Program", description: "Quran memorization for boys and girls", image: "https://mhma.us/wp-content/uploads/2024/06/Hifz-Program.webp", href: "/programs/quran-hifz-program" },
  { title: "Boy Scouts", description: "Scouting activities for Boys and Girls", image: "https://mhma.us/wp-content/uploads/2024/06/Scouts.webp", href: "/programs/boy-scouts" },
  { title: "Arabic Academy", description: "Arabic language course for Quranic understanding.", image: "https://mhma.us/wp-content/uploads/2016/08/Arabic.png", href: "/programs/arabic-academy" },
];

import PageBanner from "@/app/components/PageBanner";

export default function ProgramsPage() {
  const { isBoardMember } = useAuth();
  useEffect(() => { document.title = "Our Programs | MHMA | Mountain House"; }, []);
  const [wpPrograms, setWpPrograms] = useState<Program[]>([]);
  const [firestorePrograms, setFirestorePrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllPrograms = async () => {
      try {
        const timestamp = Date.now();
        const [wpRes, fsPrograms] = await Promise.all([
          fetch(`/api/programs?_=${timestamp}`, { cache: 'no-store' }),
          import('@/lib/firebase').then(m => m.fetchPrograms(20)),
        ]);

        if (wpRes.ok) {
          const data = await wpRes.json();
          setWpPrograms(data);
        }
        setFirestorePrograms(fsPrograms || []);
      } catch (err) {
        console.error("Failed to fetch programs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllPrograms();
  }, []);

  // Merge programs from Firestore, WordPress API, and hardcoded fallback
  const allPrograms: Array<{ title: string; description: string; image: string; href: string; slug?: string; id?: string; isFirestore?: boolean }> = [...hardcodedPrograms];

  // Add WordPress API programs
  wpPrograms.forEach(wpProgram => {
    const existingSlugs = allPrograms.map(p => p.href.replace('/programs/', ''));
    if (!existingSlugs.includes(wpProgram.slug)) {
      allPrograms.push({
        title: wpProgram.title || "Untitled",
        description: wpProgram.description || "",
        image: wpProgram.image || "",
        href: `/programs/${wpProgram.slug}`,
        slug: wpProgram.slug,
      });
    }
  });

  // Add Firestore programs
  firestorePrograms.forEach((fp: any) => {
    const slug = fp.slug || fp.title?.toLowerCase().replace(/\s+/g, '-');
    const existingSlugs = allPrograms.map(p => p.href.replace('/programs/', ''));
    if (slug && !existingSlugs.includes(slug)) {
      allPrograms.push({
        title: fp.title || "Unnamed Program",
        description: fp.description || "",
        image: fp.image || "",
        href: `/programs/${slug}`,
        slug,
        id: fp.id,
        isFirestore: true,
      });
    }
  });

  const displayPrograms = allPrograms;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-mhma-gold selection:text-white bg-mhma-cream">
      <Navigation currentPage="programs" />

      <PageBanner
        title="Our Programs"
        highlightedText="Programs"
        subtitle="Nurturing minds and souls through tradition-based learning and community engagement. Discover programs for all ages and interests."
        badgeText="Faith & Education"
      />

      {/* Main Grid */}
      <main className="flex-grow py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="animate-pulse bg-gray-50 rounded-3xl h-[400px] border border-gray-100"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {displayPrograms.map((program) => {
                const displayTitle = program.title;
                const displayDesc = program.description;

                return (
                  <Link 
                    key={program.href} 
                    href={program.href}
                    className={`flex flex-col rounded-3xl shadow-sm border group hover:border-mhma-gold hover:shadow-xl transition-all duration-500 overflow-hidden relative bg-mhma-forest border-mhma-forest-light`}
                  >
                    {isBoardMember && (
                      <Link href={program.id ? `/dashboard/programs/edit?id=${program.id}` : "/dashboard/programs"} onClick={(e) => e.stopPropagation()} className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1.5 bg-mhma-forest/80 backdrop-blur-sm text-mhma-gold text-[10px] font-bold rounded-lg hover:bg-mhma-gold hover:text-white transition-colors" title="Edit program">
                        <Edit3 className="w-3 h-3" /> EDIT
                      </Link>
                    )}
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                      <Image
                        src={program.image}
                        alt={displayTitle}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-mhma-dark/20 group-hover:bg-mhma-dark/40 transition-colors"></div>
                      <div className="absolute top-4 left-4">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow text-white">
                      <h3 className="text-lg font-bold mb-3 font-serif group-hover:text-mhma-gold transition-colors text-white">{displayTitle}</h3>
                      <p className="text-sm leading-relaxed mb-4 font-light line-clamp-2 text-gray-200">{displayDesc}</p>
                      <div className="mt-auto space-y-3">
                        <Link
                          href="/enroll"
                          className="block w-full text-center px-4 py-2.5 bg-mhma-gold text-mhma-forest text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-amber-600 transition-all shadow-md"
                        >
                          Enroll Now
                        </Link>
                        <Link 
                          href={program.href}
                          className="block w-full text-center text-xs font-bold uppercase tracking-widest hover:underline text-mhma-gold">
                          Learn More <ChevronRight className="ml-1 w-4 h-4 inline group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Secondary Banner */}
      <section className="py-24 bg-mhma-dark text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Sparkles className="w-12 h-12 text-mhma-gold mx-auto mb-8" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 font-serif">Community Enrichment</h2>
          <p className="text-gray-400 text-lg mb-12 font-light">
            Don't see a program that fits your needs? We're always looking for new ideas and volunteers to lead community initiatives.
          </p>
          <Link href="/feedback" className="inline-flex items-center px-10 py-4 bg-mhma-gold text-white font-bold rounded-full hover:bg-amber-600 transition-all shadow-xl">
            SUGGEST A PROGRAM <Zap className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="Logo" width={220} height={45} className="mx-auto mb-12 opacity-80" />
          <div className="flex justify-center space-x-6 mb-12">
             {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-mhma-gold hover:text-white transition-all border border-gray-100">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
