"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User, LogOut, MapPin, Mail, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

interface NavigationProps {
  currentPage?: string;
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isBoardMember, isLoggedIn, signOut } = useAuth();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (isBoardMember) {
      const fetchCounts = async () => {
        try {
          const [enrollSnap, contactSnap, schedSnap, rsvpSnap] = await Promise.all([
            getDocs(query(collection(db, "enrollments"), where("status", "==", "pending"), limit(100))),
            getDocs(query(collection(db, "contactSubmissions"), where("read", "==", false), limit(100))),
            getDocs(query(collection(db, "schedulingRequests"), where("status", "==", "pending"), limit(100))),
            getDocs(query(collection(db, "rsvps"), where("status", "==", "pending"), limit(100))),
          ]);
          setNotifCount(enrollSnap.size + contactSnap.size + schedSnap.size + rsvpSnap.size);
        } catch {}
      };
      fetchCounts();
      const interval = setInterval(fetchCounts, 60000);
      return () => clearInterval(interval);
    } else {
      // Regular members: check for new events/programs in last 7 days
      const fetchNewContent = async () => {
        try {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const [eventsSnap, programsSnap] = await Promise.all([
            getDocs(query(collection(db, "events"), orderBy("createdAt", "desc"), limit(5))),
            getDocs(query(collection(db, "programs"), orderBy("createdAt", "desc"), limit(5))),
          ]);
          let count = 0;
          eventsSnap.forEach(d => { const c = d.data().createdAt?.toDate?.(); if (c && c > weekAgo) count++; });
          programsSnap.forEach(d => { const c = d.data().createdAt?.toDate?.(); if (c && c > weekAgo) count++; });
          setNotifCount(count);
        } catch {}
      };
      fetchNewContent();
    }
  }, [user, isBoardMember]);

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
                <Link href="/dashboard/notifications" className="relative text-white hover:text-mhma-gold transition-colors">
                  <Bell className="w-4 h-4" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                      {notifCount > 99 ? "99+" : notifCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile" className="text-white hover:text-mhma-gold transition-colors flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> PROFILE
                </Link>
                <div className="relative group">
                  <Link href="/dashboard" className="text-white hover:text-mhma-gold font-medium transition-colors flex items-center gap-1">
                    DASHBOARD<span className="text-[10px]">▼</span>
                  </Link>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[70]">
                    <div className="bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5 w-72">
                      <div className="h-0.5 bg-mhma-gold w-full"></div>
                      <div className="flex">
                        <div className="flex-1 py-2">
                          <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Content</p>
                          <Link href="/dashboard/news" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">News</Link>
                          <Link href="/dashboard/programs" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Programs</Link>
                          <Link href="/dashboard/events" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Events</Link>
                          <Link href="/dashboard/testimonials" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Testimonials</Link>
                          <Link href="/dashboard/scheduling-requests" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Scheduling</Link>
                          <p className="px-4 py-1 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Financial</p>
                          <Link href="/dashboard/masjid-construction" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Construction</Link>
                          <Link href="/dashboard/donations" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Donations</Link>
                          <Link href="/dashboard/pledges" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Pledges</Link>
                        </div>
                        <div className="w-px bg-gray-100" />
                        <div className="flex-1 py-2">
                          <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Administration</p>
                          <Link href="/dashboard/activity" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Activity Log</Link>
                          <Link href="/dashboard/notifications" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Notifications</Link>
                          <Link href="/dashboard/analytics" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Analytics</Link>
                          <Link href="/dashboard/contact-submissions" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Contact</Link>
                          <Link href="/dashboard/users" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Members</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-gray-300 hover:text-red-400 transition-colors">LOGOUT</button>
              </>
            ) : isLoggedIn ? (
              <>
                <Link href="/member/notifications" className="relative text-white hover:text-mhma-gold transition-colors">
                  <Bell className="w-4 h-4" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                      {notifCount}
                    </span>
                  )}
                </Link>
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
                    <div className="w-44 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                      <div className="h-0.5 bg-mhma-gold w-full"></div>
                      <Link href="/board" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Board</Link>
                      <Link href="/committees" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Committees</Link>
                      <Link href="/bylaws" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Bylaws</Link>
                      <Link href="/news" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">News</Link>
                      <Link href="/community-transparency" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Community Transparency</Link>
                    </div>
                  </div>
              </div>

              <div className="relative group">
                <Link href="/events" className={`${navLinkClass("events")} ${currentPage === "events" ? "text-mhma-gold" : "text-gray-700"} flex items-center gap-1`}>
                  EVENTS<span className="text-[10px]">▼</span>
                </Link>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-44 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                      <div className="h-0.5 bg-mhma-gold w-full"></div>
                      <Link href="/rsvp" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">RSVP</Link>
                      <Link href="/event-scheduling-request" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Scheduling Request</Link>
                    </div>
                  </div>
              </div>

              {/* JOURNAL (commented out per board request)
              <Link href="/journal" className={`${navLinkClass("journal")} ${currentPage === "journal" ? "text-mhma-gold" : "text-gray-700"}`}>
                JOURNAL
              </Link>
              */}

              <div className="relative group">
                <Link href="/programs" className={`${navLinkClass("programs")} ${currentPage === "programs" ? "text-mhma-gold" : "text-gray-700"} flex items-center gap-1`}>
                  PROGRAMS<span className="text-[10px]">▼</span>
                </Link>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-44 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                      <div className="h-0.5 bg-mhma-gold w-full"></div>
                      <Link href="/enroll" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Enroll Now</Link>
                      <Link href="/zakat" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Zakat</Link>
                    </div>
                  </div>
              </div>

              <div className="relative group">
                <Link href="/donate" className={`${navLinkClass("donate")} ${currentPage === "donate" ? "text-mhma-gold" : "text-gray-700"} flex items-center gap-1`}>
                  DONATE<span className="text-[10px]">▼</span>
                </Link>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-44 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                      <div className="h-0.5 bg-mhma-gold w-full"></div>
                      <Link href="/masjid-construction" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Masjid Construction</Link>
                      <Link href="/pledge" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Pledge</Link>
                    </div>
                  </div>
              </div>

              <div className="relative group">
                <Link href="/contact" className={`${navLinkClass("contact")} ${currentPage === "contact" || currentPage === "subscribe" ? "text-mhma-gold" : "text-gray-700"} flex items-center gap-1`}>
                  CONTACT<span className="text-[10px]">▼</span>
                </Link>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-44 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                      <div className="h-0.5 bg-mhma-gold w-full"></div>
                      <Link href="/subscribe" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Newsletter</Link>
                      <Link href="/volunteer" className="block px-4 py-1.5 text-sm hover:bg-mhma-cream hover:text-mhma-forest">Volunteer</Link>
                    </div>
                  </div>
              </div>
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
            {/* <Link href="/journal" className="block py-2 text-gray-700 border-b border-gray-100">JOURNAL</Link> */}
            <Link href="/programs" className="block py-2 text-gray-700 border-b border-gray-100">PROGRAMS</Link>
            <Link href="/news" className="block py-2 text-gray-700 border-b border-gray-100">NEWS</Link>
            <Link href="/volunteer" className="block py-2 text-gray-700 border-b border-gray-100">VOLUNTEER</Link>
            <Link href="/donate" className="block py-2 text-gray-700 border-b border-gray-100">DONATE</Link>
            <Link href="/pledge" className="block py-2 text-gray-700 border-b border-gray-100 pl-6">↳ PLEDGE</Link>
            <Link href="/masjid-construction" className="block py-2 text-gray-700 border-b border-gray-100 pl-6">↳ CONSTRUCTION</Link>
            <Link href="/contact" className="block py-2 text-gray-700 border-b border-gray-100">CONTACT</Link>
            <Link href="/subscribe" className="block py-2 text-gray-700 border-b border-gray-100 pl-6">↳ NEWSLETTER</Link>
            <Link href="/volunteer" className="block py-2 text-gray-700 border-b border-gray-100 pl-6">↳ VOLUNTEER</Link>
            {isBoardMember ? (
              <>
                <Link href="/dashboard/notifications" className="block py-2 text-mhma-gold font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4" /> NOTIFICATIONS{notifCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{notifCount}</span>}
                </Link>
                <Link href="/profile" className="block py-2 text-mhma-gold font-semibold">PROFILE</Link>
                <Link href="/dashboard" className="block py-2 text-mhma-gold font-semibold">DASHBOARD</Link>
                <div className="grid grid-cols-2 gap-1 pl-6">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Content</p>
                    <Link href="/dashboard/news" className="block py-1 text-mhma-gold text-sm">↳ News</Link>
                    <Link href="/dashboard/programs" className="block py-1 text-mhma-gold text-sm">↳ Programs</Link>
                    <Link href="/dashboard/events" className="block py-1 text-mhma-gold text-sm">↳ Events</Link>
                    <Link href="/dashboard/testimonials" className="block py-1 text-mhma-gold text-sm">↳ Testimonials</Link>
                    <Link href="/dashboard/scheduling-requests" className="block py-1 text-mhma-gold text-sm">↳ Scheduling</Link>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2 mb-1">Financial</p>
                    <Link href="/dashboard/masjid-construction" className="block py-1 text-mhma-gold text-sm">↳ Construction</Link>
                    <Link href="/dashboard/donations" className="block py-1 text-mhma-gold text-sm">↳ Donations</Link>
                    <Link href="/dashboard/pledges" className="block py-1 text-mhma-gold text-sm">↳ Pledges</Link>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Admin</p>
                    <Link href="/dashboard/activity" className="block py-1 text-mhma-gold text-sm">↳ Activity Log</Link>
                    <Link href="/dashboard/notifications" className="block py-1 text-mhma-gold text-sm">↳ Notifications</Link>
                    <Link href="/dashboard/analytics" className="block py-1 text-mhma-gold text-sm">↳ Analytics</Link>
                    <Link href="/dashboard/contact-submissions" className="block py-1 text-mhma-gold text-sm">↳ Contact</Link>
                    <Link href="/dashboard/users" className="block py-1 text-mhma-gold text-sm">↳ Members</Link>
                  </div>
                </div>
              </>
            ) : isLoggedIn ? (
              <>
                <Link href="/dashboard/notifications" className="block py-2 text-mhma-gold font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4" /> NOTIFICATIONS{notifCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{notifCount}</span>}
                </Link>
                <Link href="/profile" className="block py-2 text-mhma-gold font-semibold">PROFILE</Link>
              </>
            ) : (
              <Link href="/login" className="block py-2 text-mhma-gold font-semibold">MEMBER LOGIN</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
