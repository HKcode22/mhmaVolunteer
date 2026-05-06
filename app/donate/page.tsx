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
  MapPin,
  Mail,
  Phone,
  Heart,
  ShieldCheck,
  Globe,
  ArrowRight
} from "lucide-react";
import Navigation from "@/components/Navigation";

export default function DonatePage() {
  const stats = [
    { label: "Phase 1 Target", value: "$1.5M", color: "bg-mhma-teal" },
    { label: "Pledged to Date", value: "$750K", color: "bg-mhma-gold" },
    { label: "Current Balance", value: "$350K", color: "bg-mhma-dark" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-mhma-gold selection:text-white bg-[#FDFDFD]">
      <Navigation currentPage="donate" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden mhma-gradient mhma-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-mhma-gold/30 bg-mhma-gold/10 backdrop-blur-sm text-mhma-gold text-xs font-bold tracking-widest uppercase">
            Support Our Community
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif uppercase tracking-tight">
            Invest in <span className="text-mhma-gold italic">Aakhirah</span>
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
            Your contributions fuel our mission to serve the Mountain House community. 
            Build your legacy today through charity.
          </p>
        </div>
      </section>

      {/* Main Donation Section */}
      <main className="flex-grow">
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-stretch">
              
              {/* Left Side: Donation Form & Info */}
              <div className="lg:w-7/12 space-y-12">
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">Make a Difference</h2>
                  <div className="w-20 h-1.5 bg-mhma-gold rounded-full mb-8"></div>
                  <p className="text-gray-600 text-lg font-light leading-relaxed mb-8">
                    The Mountain House Muslim Association (MHMA) depends on the generous support of our community to provide religious services, educational programs, and youth development. 
                    We are currently raising funds for our permanent Islamic Center.
                  </p>
                </div>

                {/* Stripe Integration Block */}
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                     <Heart className="w-24 h-24 text-mhma-gold" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
                     <ShieldCheck className="w-6 h-6 mr-3 text-mhma-gold" />
                     Secure Online Donation
                   </h3>
                   <div className="min-h-[100px] flex justify-center">
                    <div className="w-full" ref={(el) => {
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
                   <p className="mt-8 text-xs text-gray-400 text-center uppercase tracking-widest font-medium">
                     All donations are 100% Tax Deductible
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                     <h4 className="font-bold text-gray-900 mb-2 font-serif uppercase tracking-tight">Recurring Donations</h4>
                     <p className="text-gray-500 text-sm font-light">Set up a monthly contribution to provide stable support for our operations and programs.</p>
                   </div>
                   <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                     <h4 className="font-bold text-gray-900 mb-2 font-serif uppercase tracking-tight">Zakat-ul-Maal</h4>
                     <p className="text-gray-500 text-sm font-light">Fulfill your religious obligation through our dedicated Zakat fund, distributed according to Islamic guidelines.</p>
                   </div>
                </div>
              </div>

              {/* Right Side: Stats & Contact */}
              <div className="lg:w-5/12 flex flex-col gap-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4">
                  {stats.map((stat, i) => (
                    <div key={i} className={`${stat.color} p-8 rounded-3xl shadow-lg text-white transform hover:scale-[1.02] transition-transform`}>
                       <p className="text-xs uppercase tracking-widest opacity-70 mb-2 font-bold">{stat.label}</p>
                       <p className="text-4xl md:text-5xl font-bold font-serif">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Info Grid */}
                <div className="flex-grow grid grid-cols-1 gap-4">
                   <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:border-mhma-gold transition-colors">
                     <MapPin className="w-8 h-8 text-mhma-gold mb-4 group-hover:scale-110 transition-transform" />
                     <p className="text-gray-900 font-bold mb-1">Visit Us</p>
                     <p className="text-gray-500 text-sm font-light">250 East Main Street,<br/>Mountain House, CA 95391</p>
                   </div>
                   <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:border-mhma-gold transition-colors">
                     <Mail className="w-8 h-8 text-mhma-gold mb-4 group-hover:scale-110 transition-transform" />
                     <p className="text-gray-900 font-bold mb-1">Email Us</p>
                     <p className="text-gray-500 text-sm font-light">board@mhma.info</p>
                   </div>
                   <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:border-mhma-gold transition-colors">
                     <Phone className="w-8 h-8 text-mhma-gold mb-4 group-hover:scale-110 transition-transform" />
                     <p className="text-gray-900 font-bold mb-1">Call Us</p>
                     <p className="text-gray-500 text-sm font-light">408.722.1043</p>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-mhma-dark mhma-pattern py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Image src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" alt="Logo" width={220} height={45} className="mx-auto mb-12 opacity-90" />
          <div className="flex justify-center space-x-6 mb-12">
             {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-mhma-gold transition-all border border-white/10">
                  <Icon className="w-5 h-5" />
                </a>
             ))}
          </div>
          <p className="text-gray-500 text-sm tracking-widest uppercase mb-4">© 2026 Mountain House Muslim Association</p>
          <div className="w-16 h-1 bg-mhma-gold mx-auto rounded-full opacity-30"></div>
        </div>
      </footer>
    </div>
  );
}
