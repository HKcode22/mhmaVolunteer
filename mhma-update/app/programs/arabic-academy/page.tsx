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
  ChevronLeft, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2,
  Edit
} from "lucide-react";
import Navigation from "@/components/Navigation";

export default function ArabicAcademyPage() {
  const [programData, setProgramData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [programId, setProgramId] = useState<number | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("jwt_token") : null;
    setIsLoggedIn(!!token);

    const fetchProgramData = async () => {
      try {
        const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
        const response = await fetch(`${WP_API_URL}/wp/v2/pages?slug=arabic-academy`);
        const data = await response.json();
        if (data && data.length > 0) {
          const page = data[0];
          setProgramId(page.id);
          const useHardcoded = page.acf?.use_hardcoded_version === true || page.acf?.[''] === true;
          
          if (useHardcoded) {
            setProgramData({
              title: "LEARN ARABIC LANGUAGE",
              description: "A Fully accredited Arabic language course designed to equip students with the ability to understand the Quranic language.",
              imageUrl: "https://mhma.us/wp-content/uploads/2016/08/Arabic.png",
              stat1Label: "Students",
              stat1Value: "25",
              stat2Label: "Days/Week",
              stat2Value: "5"
            });
          } else {
            let imageUrl = "";
            if (page.acf?.program_image && typeof page.acf.program_image === 'number') {
              const res = await fetch(`${WP_API_URL}/wp/v2/media/${page.acf.program_image}`);
              if (res.ok) {
                const media = await res.json();
                imageUrl = media.source_url;
              }
            } else if (page.acf?.program_image) {
              imageUrl = page.acf.program_image;
            }

            setProgramData({
              title: page.acf?.program_title || "LEARN ARABIC LANGUAGE",
              description: page.acf?.program_description || "A Fully accredited Arabic language course designed to equip students with the ability to understand the Quranic language.",
              content: page.content?.rendered || "",
              imageUrl: imageUrl,
              stat1Label: page.acf?.stat1_label || "Students",
              stat1Value: page.acf?.stat1_value || "25",
              stat2Label: page.acf?.stat2_label || "Days/Week",
              stat2Value: page.acf?.stat2_value || "5",
              additionalContent: page.acf?.additional_content || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching program data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgramData();
  }, []);

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
            {programData?.title || "Arabic Academy"}
          </h1>
          <div className="w-24 h-1.5 bg-mhma-gold mx-auto rounded-full"></div>
        </div>
      </section>

      <main className="flex-grow py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-7/12">
               {programData?.imageUrl && (
                  <div className="mb-12">
                    <img src={programData.imageUrl} alt="Program" className="rounded-3xl shadow-2xl w-full border border-gray-100" />
                  </div>
                )}
              <div className="prose prose-lg max-w-none text-gray-700 font-light leading-relaxed">
                <p className="text-xl text-mhma-teal font-medium mb-8 border-l-4 border-mhma-gold pl-6 italic">
                  {programData?.description}
                </p>
                {programData?.content && <div dangerouslySetInnerHTML={{ __html: programData.content }} />}
                {programData?.additionalContent && <div className="mt-12 p-8 bg-gray-50 rounded-3xl border border-gray-100" dangerouslySetInnerHTML={{ __html: programData.additionalContent }} />}
              </div>
            </div>

            <div className="lg:w-5/12 space-y-8">
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Enroll Today</h3>
                <p className="text-gray-500 text-sm mb-8 font-light">Join the Arabic Academy and unlock the beauty of the Quranic language.</p>
                <Link href="/register" className="flex items-center justify-center w-full py-4 bg-mhma-gold text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg uppercase tracking-widest">
                  REGISTER NOW <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                {isLoggedIn && (
                  <Link href={`/dashboard/programs/edit?id=${programId}`} className="flex items-center justify-center w-full py-3 mt-4 border-2 border-mhma-gold text-mhma-gold font-bold rounded-xl hover:bg-mhma-gold hover:text-white transition-all text-sm uppercase tracking-widest">
                    <Edit className="w-4 h-4 mr-2" /> Edit Program
                  </Link>
                )}
              </div>

              {(programData?.stat1Value || programData?.stat2Value) && (
                <div className="grid grid-cols-2 gap-4">
                  {programData?.stat1Value && (
                    <div className="bg-mhma-teal p-8 rounded-3xl text-center text-white shadow-lg">
                      <p className="text-3xl font-bold font-serif text-mhma-gold mb-1">{programData.stat1Value}</p>
                      <p className="text-xs uppercase tracking-widest opacity-70 font-medium">{programData.stat1Label}</p>
                    </div>
                  )}
                  {programData?.stat2Value && (
                    <div className="bg-mhma-dark p-8 rounded-3xl text-center text-white shadow-lg">
                      <p className="text-3xl font-bold font-serif text-mhma-gold mb-1">{programData.stat2Value}</p>
                      <p className="text-xs uppercase tracking-widest opacity-70 font-medium">{programData.stat2Label}</p>
                    </div>
                  )}
                </div>
              )}

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
      <footer className="bg-white py-16 border-t border-gray-100">
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
