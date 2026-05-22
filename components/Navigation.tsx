"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User, LogOut, MapPin, Mail, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavigationProps {
  currentPage?: string;
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isBoardMember, isLoggedIn, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const navLinkClass = (page: string) =>
    `text-sm font-semibold tracking-wide inline-block px-2 py-2 transition-all duration-200 hover:text-mhma-gold`;

  return (
    <nav className="fixed w-full z-50 top-0">
      <div className="bg-mhma-forest text-xs py-2">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="hidden md:flex items-center gap-4 text-white/90">
            <a href="mailto:info@mhma.info" className="flex items-center gap-1.5 hover:text-mhma-gold transition-colors">
              <Mail className="w-3.5 h-3.5" />
              <span>info@mhma.info</span>
            </a>
            <span className="text-white/30">|</span>
            <a href="/contact#directions" className="flex items-center gap-1.5 hover:text-mhma-gold transition-colors">
              <MapPin className="w-3.5 h-3.5" />
              <span>250 E. Main St., Mountain House 95391</span>
            </a>
          </div>

          <div className="flex items-center gap-4 ml-auto relative z-[60]">
            {isBoardMember ? (
              <>
                <Link href="/profile" className="text-white hover:text-mhma-gold transition-colors flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> PROFILE
                </Link>
                <div className="relative group">
                  <Link href="/dashboard" className="text-white hover:text-mhma-gold font-medium transition-colors flex items-center gap-1">
                    DASHBOARD<span className="text-[10px]">▼</span>
                  </Link>
                  <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[70]">
                    <div className="w-44 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                      <div className="h-0.5 bg-mhma-gold w-full"></div>
                      <Link href="/dashboard" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">DASHBOARD</Link>
                      <Link href="/dashboard/analytics" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">ANALYTICS</Link>
                      <Link href="/dashboard/notifications" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">NOTIFICATIONS</Link>
                      <Link href="/dashboard/activity" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">ACTIVITY LOG</Link>
                    </div>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-gray-300 hover:text-red-400 transition-colors">LOGOUT</button>
              </>
            ) : isLoggedIn ? (
              <>
                <Link href="/profile" className="text-white hover:text-mhma-gold transition-colors flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> PROFILE
                </Link>
                <span className="text-white/70 text-xs">Welcome, {user?.displayName || "Member"}</span>
                <button onClick={handleLogout} className="text-gray-300 hover:text-red-400 transition-colors">LOGOUT</button>
              </>
            ) : (
              <Link href="/login" className="text-white hover:text-mhma-gold font-medium transition-colors flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> MEMBER LOGIN
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp"
                alt="MHMA Logo"
                width={200}
                height={45}
                className="h-11 md:h-12 w-auto"
              />
            </Link>

            <div className="hidden lg:flex items-center gap-3">
              <Link href="/" className={`${navLinkClass("home")} ${currentPage === "home" ? "text-mhma-gold" : "text-gray-700"}`}>
                HOME
              </Link>

              <div className="relative group">
                <Link href="/about" className={`${navLinkClass("about")} ${currentPage === "about" ? "text-mhma-gold" : "text-gray-700"} flex items-center gap-1`}>
                  ABOUT<span className="text-[10px]">▼</span>
                </Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="w-48 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                    <div className="h-0.5 bg-mhma-gold w-full"></div>
                    <Link href="/about" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">ABOUT US</Link>
                    <Link href="/board" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">BOARD</Link>
                    <Link href="/committees" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">COMMITTEES</Link>
                    <Link href="/bylaws" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">BYLAWS</Link>
                    <Link href="/community-transparency" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">COMMUNITY TRANSPARENCY</Link>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <Link href="/events" className={`${navLinkClass("events")} ${currentPage === "events" ? "text-mhma-gold" : "text-gray-700"} flex items-center gap-1`}>
                  EVENTS<span className="text-[10px]">▼</span>
                </Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="w-48 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                    <div className="h-0.5 bg-mhma-gold w-full"></div>
                    <Link href="/events" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">ALL EVENTS</Link>
                    <Link href="/rsvp" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">RSVP</Link>
                    <Link href="/event-scheduling-request" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">SCHEDULING REQUEST</Link>
                  </div>
                </div>
              </div>

              <Link href="/journal" className={`${navLinkClass("journal")} ${currentPage === "journal" ? "text-mhma-gold" : "text-gray-700"}`}>
                JOURNAL
              </Link>

              <div className="relative group">
                <Link href="/programs" className={`${navLinkClass("programs")} ${currentPage === "programs" ? "text-mhma-gold" : "text-gray-700"} flex items-center gap-1`}>
                  PROGRAMS<span className="text-[10px]">▼</span>
                </Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="w-48 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                    <div className="h-0.5 bg-mhma-gold w-full"></div>
                    <Link href="/programs" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">ALL PROGRAMS</Link>
                    <Link href="/enroll" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">ENROLL NOW</Link>
                    <Link href="/zakat" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">ZAKAT</Link>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <Link href="/donate" className={`${navLinkClass("donate")} ${currentPage === "donate" ? "text-mhma-gold" : "text-gray-700"} flex items-center gap-1`}>
                  DONATE<span className="text-[10px]">▼</span>
                </Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="w-48 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                    <div className="h-0.5 bg-mhma-gold w-full"></div>
                    <Link href="/donate" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">GENERAL DONATION</Link>
                    <Link href="/masjid-construction" className="block px-3 py-2 text-sm hover:bg-mhma-cream hover:text-mhma-forest text-center">MASJID CONSTRUCTION</Link>
                  </div>
                </div>
              </div>

              <Link href="/contact" className={`${navLinkClass("contact")} ${currentPage === "contact" ? "text-mhma-gold" : "text-gray-700"}`}>
                CONTACT
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-700 p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-2">
            <Link href="/" className="block py-2 text-gray-700 font-semibold border-b border-gray-100">HOME</Link>
            <Link href="/about" className="block py-2 text-gray-700 border-b border-gray-100">ABOUT</Link>
            <Link href="/events" className="block py-2 text-gray-700 border-b border-gray-100">EVENTS</Link>
            <Link href="/rsvp" className="block py-2 text-gray-700 border-b border-gray-100">RSVP</Link>
            <Link href="/journal" className="block py-2 text-gray-700 border-b border-gray-100">JOURNAL</Link>
            <Link href="/programs" className="block py-2 text-gray-700 border-b border-gray-100">PROGRAMS</Link>
            <Link href="/donate" className="block py-2 text-gray-700 border-b border-gray-100">DONATE</Link>
            <Link href="/contact" className="block py-2 text-gray-700">CONTACT</Link>
            {isBoardMember ? (
              <>
                <Link href="/profile" className="block py-2 text-mhma-gold font-semibold">PROFILE</Link>
                <Link href="/dashboard" className="block py-2 text-mhma-gold font-semibold">DASHBOARD</Link>
                <Link href="/dashboard/analytics" className="block py-2 text-mhma-gold font-semibold pl-6">↳ Analytics</Link>
                <Link href="/dashboard/notifications" className="block py-2 text-mhma-gold font-semibold pl-6">↳ Notifications</Link>
                <Link href="/dashboard/activity" className="block py-2 text-mhma-gold font-semibold pl-6">↳ Activity Log</Link>
              </>
            ) : isLoggedIn ? (
              <Link href="/profile" className="block py-2 text-mhma-gold font-semibold">PROFILE</Link>
            ) : (
              <Link href="/login" className="block py-2 text-mhma-gold font-semibold">MEMBER LOGIN</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
