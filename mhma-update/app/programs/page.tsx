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
  Heart,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Zap,
  Star
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Program {
  id: number;
  title: {
    rendered: string;
  };
  slug: string;
  acf?: {
    program_title?: string;
    program_description?: string;
    program_image?: any;
    use_hardcoded_version?: boolean;
  };
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

import PageBanner from "@/components/PageBanner";

export default function ProgramsPage() {
  const [wpPrograms, setWpPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
        const response = await fetch(`${WP_API_URL}/wp/v2/pages?parent=70&per_page=100`);
        if (!response.ok) throw new Error("Failed to fetch programs");
        const data = await response.json();
        setWpPrograms(data);
      } catch (err) {
        console.error("Failed to fetch programs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  // Merge hardcoded programs with WordPress programs
  // WordPress programs are ADDED to the list (not replace)
  const allPrograms = [...hardcodedPrograms];
  wpPrograms.forEach(wpProgram => {
    // Avoid duplicates by checking slug
    if (!allPrograms.some(p => p.slug === wpProgram.slug)) {
      allPrograms.push({
        title: wpProgram.title?.rendered || wpProgram.title || "Untitled",
        description: wpProgram.acf?.program_description || "",
        image: typeof wpProgram.acf?.program_image === 'number' 
          ? `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/media/${wpProgram.acf.program_image}`
          : wpProgram.acf?.program_image || "",
        href: `/programs/${wpProgram.slug}`,
        slug: wpProgram.slug
      });
    }
  });

  const displayPrograms = showAll ? allPrograms : allPrograms.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-mhma-gold selection:text-white bg-[#FDFDFD]">
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
                const programSlug = program.href.replace('/programs/', '');
                const wpVersion = wpPrograms.find(wp => wp.slug === programSlug);

                // Determine if we should use WordPress data or hardcoded
                // Use WordPress data only if:
                // 1. WordPress version exists
                // 2. use_hardcoded_version is explicitly false
                // 3. Has valid program_title or program_description
                const hasValidWpData = wpVersion &&
                  wpVersion.acf?.use_hardcoded_version === false &&
                  (wpVersion.acf?.program_title || wpVersion.acf?.program_description);

                // Use WordPress title if valid, otherwise fallback to hardcoded
                const displayTitle = hasValidWpData
                  ? (wpVersion.acf?.program_title || wpVersion.title.rendered || program.title)
                  : program.title;

                // Use WordPress description if valid, otherwise fallback to hardcoded
                const displayDesc = hasValidWpData
                  ? (wpVersion.acf?.program_description || program.description)
                  : program.description;

                return (
                  <Link 
                    key={program.href} 
                    href={program.href}
                    className="flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 group hover:border-mhma-gold hover:shadow-xl transition-all duration-500 overflow-hidden"
                  >
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
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-gray-900 mb-3 font-serif group-hover:text-mhma-gold transition-colors">{displayTitle}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-6 font-light line-clamp-2">{displayDesc}</p>
                      <div className="mt-auto flex items-center text-mhma-gold text-xs font-bold uppercase tracking-widest">
                        Learn More <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
      <section className="py-24 bg-mhma-dark mhma-pattern text-white">
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
              )}

              {!loading && allPrograms.length > 6 && (
                <div className="text-center mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Show All clicked, current state:", showAll);
                      setShowAll(!showAll);
                    }}
                    className="inline-flex items-center px-8 py-3 bg-white text-mhma-teal font-bold rounded-full border-2 border-mhma-teal hover:bg-mhma-teal hover:text-white transition-all cursor-pointer"
                  >
                    {showAll ? 'Show Less' : `View All Programs (+${allPrograms.length - 6} more)`}
                  </button>
                </div>
              )}
      </footer>
    </div>
  );
}
