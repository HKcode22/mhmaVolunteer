"use client";

import { useState, useEffect } from "react";
import { useParams, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ChevronLeft,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface ProgramData {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  slug: string;
  acf?: {
    program_title?: string;
    program_description?: string;
    program_image?: any;
    program_image_poster?: any;
    use_hardcoded_version?: boolean;
    stat_1_label?: string;
    stat_1_value?: string;
    stat_2_label?: string;
    stat_2_value?: string;
    stat_3_label?: string;
    stat_3_value?: string;
    stat_4_label?: string;
    stat_4_value?: string;
    additional_content?: string;
  };
}

export default function DynamicProgramPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [programData, setProgramData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [posterImageUrl, setPosterImageUrl] = useState<string>("");

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("jwt_token") : null;
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
        const response = await fetch(`${WP_API_URL}/wp/v2/pages?slug=${slug}`);
        const data = await response.json();
        if (data.length > 0) {
          const program = data[0];
          setProgramData(program);

          if (program.acf?.program_image) {
            if (typeof program.acf.program_image === 'number') {
              const res = await fetch(`${WP_API_URL}/wp/v2/media/${program.acf.program_image}`);
              if (res.ok) {
                const media = await res.json();
                setImageUrl(media.source_url);
              }
            } else {
              setImageUrl(program.acf.program_image);
            }
          }

          if (program.acf?.program_image_poster) {
            if (typeof program.acf.program_image_poster === 'number') {
              const res = await fetch(`${WP_API_URL}/wp/v2/media/${program.acf.program_image_poster}`);
              if (res.ok) {
                const media = await res.json();
                setPosterImageUrl(media.source_url);
              }
            } else {
              setPosterImageUrl(program.acf.program_image_poster);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching program:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgramData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#FDFDFD]">
        <Navigation currentPage="programs" />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mhma-gold"></div>
        </div>
      </div>
    );
  }

  if (!programData) return redirect("/programs");

  const stats = [
    { label: programData.acf?.stat_1_label, value: programData.acf?.stat_1_value },
    { label: programData.acf?.stat_2_label, value: programData.acf?.stat_2_value },
    { label: programData.acf?.stat_3_label, value: programData.acf?.stat_3_value },
    { label: programData.acf?.stat_4_label, value: programData.acf?.stat_4_value },
  ].filter(s => s.label && s.value);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-mhma-gold selection:text-white bg-[#FDFDFD]">
      <Navigation currentPage="programs" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden mhma-gradient mhma-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Link href="/programs" className="inline-flex items-center text-mhma-gold font-bold mb-8 hover:-translate-x-2 transition-transform text-sm tracking-widest uppercase">
            <ChevronLeft className="w-4 h-4 mr-2" /> All Programs
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif uppercase tracking-tight">
            {programData.acf?.program_title || programData.title.rendered}
          </h1>
          <div className="w-24 h-1.5 bg-mhma-gold mx-auto rounded-full"></div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-grow py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Left Side: Content */}
            <div className="lg:w-7/12">
              <div className="prose prose-lg max-w-none text-gray-700 font-light leading-relaxed mb-12">
                {programData.content.rendered && (
                  <div className="mb-12" dangerouslySetInnerHTML={{ __html: programData.content.rendered }} />
                )}
                {programData.acf?.program_description && (
                  <div className="mb-12" dangerouslySetInnerHTML={{ __html: programData.acf.program_description }} />
                )}
                {posterImageUrl && (
                  <div className="my-16">
                    <img src={posterImageUrl} alt="Program Poster" className="rounded-3xl shadow-2xl w-full border border-gray-100" />
                  </div>
                )}
                {programData.acf?.additional_content && (
                  <div className="mt-12 p-8 bg-gray-50 rounded-3xl border border-gray-100" dangerouslySetInnerHTML={{ __html: programData.acf.additional_content }} />
                )}
              </div>
            </div>

            {/* Right Side: Info Panel */}
            <div className="lg:w-5/12 space-y-8">
              {/* Join Card */}
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <CheckCircle2 className="w-24 h-24 text-mhma-gold" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Interested in joining?</h3>
                <p className="text-gray-500 text-sm mb-8 font-light">Be part of our growing community and benefit from our specialized educational programs.</p>
                <Link href="/register" className="flex items-center justify-center w-full py-4 bg-mhma-gold text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg uppercase tracking-widest">
                  REGISTER NOW <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                {isLoggedIn && (
                  <Link
                    href={`/dashboard/programs/edit?id=${programData.id}`}
                    className="flex items-center justify-center w-full py-3 mt-4 border-2 border-mhma-gold text-mhma-gold font-bold rounded-xl hover:bg-mhma-gold hover:text-white transition-all text-sm uppercase tracking-widest"
                  >
                    Edit Program
                  </Link>
                )}
              </div>

              {/* Stats Grid */}
              {stats.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-mhma-teal p-8 rounded-3xl text-center text-white shadow-lg">
                      <p className="text-3xl font-bold font-serif text-mhma-gold mb-1">{stat.value}</p>
                      <p className="text-xs uppercase tracking-widest opacity-70 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Map Card */}
              <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-100 h-[300px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0977704984784!2d-121.5405094!3d37.7786645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80900c02b5b8f353%3A0xa8e69c4f6e63c44a!2sMountain%20House%20Unity%20Center!5e0!3m2!1sen!2sus!4v1699400000000!5m2!1sen!2sus"
                  width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                ></iframe>
              </div>

              {/* Quote Block */}
              <div className="bg-mhma-dark p-10 rounded-3xl text-white relative mhma-pattern">
                <div className="text-4xl text-mhma-gold opacity-50 mb-4 font-serif">"</div>
                <p className="text-lg italic font-light mb-6 leading-relaxed">Understanding the language of the Quran gives the reader a better understanding of the message from Allah (SWT)</p>
                <div className="flex items-center">
                  <div className="w-10 h-0.5 bg-mhma-gold mr-4"></div>
                  <p className="text-xs font-bold uppercase tracking-widest text-mhma-gold">Oussama Saafien • Board Trustee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="Logo" width={200} height={40} className="mx-auto mb-12 opacity-80" />
          <div className="flex justify-center space-x-6 mb-12">
             {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-mhma-gold hover:text-white transition-all border border-gray-100">
                  <Icon className="w-4 h-4" />
                </a>
             ))}
          </div>
          <p className="text-gray-400 text-xs tracking-widest uppercase font-medium">© 2026 Mountain House Muslim Association</p>
        </div>
      </footer>
    </div>
  );
}
