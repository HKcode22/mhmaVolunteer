"use client";

import Image from "next/image";
import Navigation from "@/components/Navigation";
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";

export default function CommunityTransparencyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="community-transparency" />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 uppercase tracking-wide">
            Community <span className="text-amber-400">Transparency</span>
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Serving our community with honesty, integrity, and accountability
          </p>
        </div>
      </section>

      {/* Main Content - Image Display */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="p-8">
              <Image
                src="https://mhma.us/wp-content/uploads/2024/12/Community-Response.jpg"
                alt="Community Response"
                width={1200}
                height={800}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 uppercase tracking-wide">
            Our Commitment to <span className="text-amber-600">Transparency</span>
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            At MHMA, we believe in complete transparency with our community. 
            We are committed to keeping you informed about our operations, 
            finances, and all activities that serve the Muslim community in 
            Mountain House and beyond.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/journal"
              className="px-8 py-3.5 bg-teal-800 text-white font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-teal-700 transition-all"
            >
              View Journal Archives
            </a>
            <a
              href="/bylaws"
              className="px-8 py-3.5 border-2 border-teal-800 text-teal-800 font-semibold text-sm uppercase tracking-wider rounded-lg hover:bg-teal-800 hover:text-white transition-all"
            >
              View Bylaws
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-900 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Image 
            src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" 
            alt="Logo" 
            width={220} 
            height={45} 
            className="mx-auto mb-8 opacity-90" 
          />
          <div className="flex justify-center space-x-6 mb-8">
             {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-amber-500 transition-all">
                  <Icon className="w-5 h-5" />
                </a>
             ))}
          </div>
          <p className="text-gray-400 text-sm tracking-widest uppercase">© 2026 Mountain House Muslim Association</p>
        </div>
      </footer>
    </div>
  );
}
