'use client';

import React from 'react';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Linkedin, 
  Users2, 
  GraduationCap, 
  Heart, 
  Map,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronRight,
  Landmark
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function MHMAPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-mhma-gold selection:text-white bg-[#FDFDFD]">
      <Navigation currentPage="mhma" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden mhma-gradient mhma-pattern">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 border border-mhma-gold rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 border border-mhma-gold rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-mhma-gold/30 bg-mhma-gold/10 backdrop-blur-sm">
            <p className="text-mhma-gold font-bold tracking-widest uppercase text-xs md:text-sm">Our Mission & Values</p>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight font-serif max-w-5xl mx-auto">
            We believe in <span className="text-mhma-gold italic">unity</span> and helping others.
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://donate.stripe.com/aEU3g43Or9LdaLm6oo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-10 py-4 bg-mhma-gold text-white font-bold rounded-full hover:bg-amber-600 transition-all shadow-xl"
            >
              DONATE TO OUR CAUSE <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Mission Detail Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
             <p className="text-mhma-gold font-bold tracking-widest uppercase text-sm mb-4">Mountain House Muslim Association</p>
             <h2 className="text-3xl md:text-5xl font-bold text-gray-900 font-serif mb-8">Serving with Faith & Integrity</h2>
             <div className="w-24 h-1.5 bg-mhma-gold mx-auto rounded-full"></div>
          </div>
          
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-light italic text-center mb-16">
            "Mountain House Muslim Association (MHMA) is a local non-profit focused on serving the Muslim community in Mountain House and surrounding areas."
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 font-serif flex items-center">
                <div className="w-10 h-10 rounded-xl bg-mhma-gold/10 flex items-center justify-center mr-4">
                  <Landmark className="w-5 h-5 text-mhma-gold" />
                </div>
                The Vision
              </h3>
              <p className="text-gray-600 leading-relaxed font-light">
                Mountain House Muslim Association (MHMA) is a Masjid dedicated to strengthening faith, building community, and serving the greater good. We strive to cultivate a vibrant, welcoming environment rooted in Islamic values where individuals and families can grow spiritually and connect meaningfully with one another.
              </p>
              <p className="text-gray-600 leading-relaxed font-light">
                Through regular congregational prayers, educational programs, and community gatherings, we seek to promote unity within the Muslim community and foster understanding and respect across faiths.
              </p>
            </div>
            <div className="space-y-6">
               <h3 className="text-2xl font-bold text-gray-900 font-serif flex items-center">
                <div className="w-10 h-10 rounded-xl bg-mhma-gold/10 flex items-center justify-center mr-4">
                  <Users2 className="w-5 h-5 text-mhma-gold" />
                </div>
                Nurturing the Future
              </h3>
              <p className="text-gray-600 leading-relaxed font-light">
                MHMA is deeply committed to nurturing the next generation. We provide a safe and supportive environment for our youth through religious education, mentorship, sports, leadership development, and wholesome recreational activities.
              </p>
              <p className="text-gray-600 leading-relaxed font-light">
                Our goal is to help young people develop strong character, confidence, and a lasting sense of belonging grounded in faith.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Pillars Section */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Community Service', icon: Users2, color: 'bg-[#e57373]', desc: 'Continuous involvement in the local community to build strong bonds with our neighbors.' },
            { title: 'Religious Activities', icon: Landmark, color: 'bg-mhma-gold', desc: 'Organizing Jumma, Taraweeh, and Eid prayers at the Unity Center and Central Park.' },
            { title: 'Education', icon: GraduationCap, color: 'bg-mhma-teal', desc: 'Weekend school, Islamic lectures, Halaqas, and Maktab for our community.' },
            { title: 'Youth Clubs', icon: Zap, color: 'bg-mhma-dark', desc: 'Healthy activities, Boy Scout troops, and many organized youth programs.' }
          ].map((pillar, i) => (
            <div key={i} className={`${pillar.color} py-20 px-8 text-center text-white transform hover:scale-105 transition-transform duration-300 relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-24 h-24 mx-auto mb-8 rounded-full border-2 border-white/20 flex items-center justify-center relative z-10 bg-white/5">
                <pillar.icon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest mb-4 font-serif relative z-10">{pillar.title}</h3>
              <p className="text-white/80 text-sm leading-relaxed font-light relative z-10">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values & Policy Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="bg-gray-50 rounded-3xl p-12 text-center border border-gray-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <ShieldCheck className="w-48 h-48" />
             </div>
             <p className="text-2xl font-bold text-gray-900 mb-6 font-serif">Equality and Fairness</p>
             <p className="text-gray-600 italic font-light leading-relaxed max-w-2xl mx-auto">
               The MHMA operates a strict non-discrimination policy prohibiting discrimination against any person or population protected under applicable US law and others. MHMA does not require adherence to or conversion to religious doctrine for a person or population to benefit from its programs.
             </p>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-mhma-dark mhma-pattern py-20 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <Image 
              src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" 
              alt="MHMA Logo" 
              width={250}
              height={50}
              className="mb-12 opacity-90"
            />
            
            <div className="flex space-x-6 mb-12">
              {[Facebook, Instagram, Twitter, Youtube, Linkedin].map((Icon, i) => (
                <a 
                  key={i}
                  href="#"
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-mhma-gold flex items-center justify-center transition-all hover:scale-110 border border-white/10"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            <p className="text-gray-500 text-sm tracking-widest uppercase">
              © Copyright 2010 - 2026 | Mountain House Muslim Association
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
