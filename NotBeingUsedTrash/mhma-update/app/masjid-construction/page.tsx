"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import Navigation from "@/components/Navigation";

export default function MasjidConstructionPage() {
  const [countersLoaded, setCountersLoaded] = useState(false);

  // Stats for the counter section
  const stats = [
    { label: "Target", value: "1,500,000", suffix: "" },
    { label: "Pledged", value: "750,000", suffix: "" },
    { label: "Donated", value: "350,000", suffix: "" },
  ];

  useEffect(() => {
    // Simulate counter animation
    const timer = setTimeout(() => setCountersLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="donate" />

      <main className="pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/donate" className="text-[#c9a227] hover:underline mb-4 inline-block">
              ← Back to Donate
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">MHMA Masjid Construction</h1>
            <p className="text-xl text-gray-600">Help us build our community's spiritual home</p>
          </div>
        </div>

        {/* Donation Section */}
        <section className="min-h-[600px]">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side - Donation Form */}
            <div className="lg:w-2/3 bg-gray-100 py-16 px-8 lg:px-16">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
                  Support the Masjid Construction Project
                </h2>
                
                {/* Stripe Buy Button */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div ref={(el) => {
                    if (el && typeof window !== 'undefined') {
                      // Clear and inject Stripe button
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

                <p className="text-gray-600 mt-6 text-sm">
                  Your donation will help us build a permanent masjid for the Mountain House Muslim community, providing a dedicated space for prayers, educational programs, and community gatherings.
                </p>
              </div>
            </div>

            {/* Right Side - Stats with Background */}
            <div 
              className="lg:w-1/3 py-16 px-8 relative bg-cover bg-center"
              style={{
                backgroundImage: 'url(https://mhma.us/wp-content/uploads/2016/08/home-content-bg-1.jpg)',
              }}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative z-10">
                <div className="space-y-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center text-white">
                      <p className="text-sm uppercase tracking-wider mb-2 opacity-80">
                        {stat.label}
                      </p>
                      <p className="text-5xl md:text-6xl font-bold">
                        {stat.value}
                        {stat.suffix}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="grid grid-cols-1 md:grid-cols-3">
          {/* Address */}
          <div 
            className="py-20 px-8 text-center text-white relative bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://mhma.us/wp-content/uploads/2016/08/donate3.jpg)',
            }}
          >
            <div className="absolute inset-0 bg-[#c9a227]/90"></div>
            <div className="relative z-10">
              <MapPin className="w-14 h-14 mx-auto mb-6" />
              <div className="space-y-1 text-lg">
                <p>250 East Main Street,</p>
                <p>Mountain House,</p>
                <p>CA 95391</p>
              </div>
            </div>
          </div>

          {/* Email */}
          <div 
            className="py-20 px-8 text-center text-white relative bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://mhma.us/wp-content/uploads/2016/08/donate2.jpg)',
            }}
          >
            <div className="absolute inset-0 bg-[#1a1a1a]/90"></div>
            <div className="relative z-10">
              <Mail className="w-14 h-14 mx-auto mb-6" />
              <p className="text-lg">
                <a 
                  href="mailto:board@mhma.info" 
                  className="hover:text-[#c9a227] transition-colors"
                >
                  board@mhma.info
                </a>
              </p>
            </div>
          </div>

          {/* Phone */}
          <div 
            className="py-20 px-8 text-center text-white relative bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://mhma.us/wp-content/uploads/2016/08/donate1.jpg)',
            }}
          >
            <div className="absolute inset-0 bg-[#b49c2e]/90"></div>
            <div className="relative z-10">
              <Phone className="w-14 h-14 mx-auto mb-6" />
              <p className="text-lg">
                <a 
                  href="tel:4087221043" 
                  className="hover:text-white/80 transition-colors"
                >
                  408.722.1043
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="mb-6">
              <Image
                src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp"
                alt="MHMA Logo"
                width={200}
                height={45}
                className="h-12 w-auto"
              />
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 mb-8">
              <a
                href="https://www.facebook.com/mhma95391"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/mhma.ig/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/i/flow/login?redirect_after_login=%2Fmhmatweets"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/mountain-house-muslim-association/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@MHMAYouTube"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c9a227] transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>

            {/* Copyright */}
            <div className="text-center text-gray-400 text-sm">
              <p>Copyright 2024 MHMA - Mountain House Muslim Association</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
