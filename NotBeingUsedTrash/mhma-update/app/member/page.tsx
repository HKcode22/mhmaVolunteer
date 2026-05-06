"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  Facebook,
  Instagram,
  Menu,
  X,
  Twitter,
  Linkedin,
  Youtube,
  Landmark,
  BookOpen,
  Heart,
  User,
  FileText,
  ArrowRight,
} from "lucide-react";

const meetingMinutes = [
  {
    id: 1,
    title: "Minutes for MHMA Board of Trustees Meeting – 04-Mar-26",
    excerpt: "MHMA Board of Trustees Meeting - 04-Mar-26",
    date: "March 4, 2026",
    href: "#",
  },
  {
    id: 2,
    title: "Minutes for MHMA Board of Trustees Meeting – 27-Feb-26",
    excerpt: "MHMA Board of Trustees Meeting - 27-Feb-26",
    date: "February 27, 2026",
    href: "#",
  },
  {
    id: 3,
    title: "BOD Minutes for MHMA Board of Directors Meeting – 21-Jan-26",
    excerpt: "MHMA Board of Directors Meeting - 21-Jan-26",
    date: "January 21, 2026",
    href: "#",
  },
  {
    id: 4,
    title: "Minutes for MHMA Board of Trustees Meeting – 13-Jan-26",
    excerpt: "MHMA Board of Trustees Meeting - 13-Jan-26",
    date: "January 13, 2026",
    href: "#",
  },
  {
    id: 5,
    title: "Minutes for MHMA Board Meeting – 11-Jan-26",
    excerpt: "MHMA Board Meeting - 11-Jan-26",
    date: "January 11, 2026",
    href: "#",
  },
  {
    id: 6,
    title: "Minutes for MHMA Board of Trustees Meeting – 06-Jan-26",
    excerpt: "MHMA Board of Trustees Meeting - 06-Jan-26",
    date: "January 6, 2026",
    href: "#",
  },
];

export default function MemberPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState(6);

  const loadMorePosts = () => {
    setVisiblePosts((prev) => prev + 3);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0">
              <Link href="/" className="block">
                <Image
                  src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp"
                  alt="MHMA Logo"
                  width={180}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <div className="hidden lg:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-[#c9a227] transition-colors font-medium">
                HOME
              </Link>
              <div
                className="relative"
                onMouseEnter={() => setAboutDropdownOpen(true)}
                onMouseLeave={() => setAboutDropdownOpen(false)}
              >
                <button className="flex items-center text-gray-700 hover:text-[#c9a227] transition-colors font-medium">
                  <Landmark className="mr-1 h-4 w-4" />
                  MHMA
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {aboutDropdownOpen && (
                  <div className="absolute top-full left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-50">
                    <Link href="/board" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      BOARD
                    </Link>
                    <Link href="/committees" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      COMMITTEES
                    </Link>
                    <Link href="/bylaws" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      BYLAWS
                    </Link>
                    <Link href="/feedback" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      FEEDBACK
                    </Link>
                  </div>
                )}
              </div>
              <div
                className="relative"
                onMouseEnter={() => setProgramsDropdownOpen(true)}
                onMouseLeave={() => setProgramsDropdownOpen(false)}
              >
                <button className="flex items-center text-gray-700 hover:text-[#c9a227] transition-colors font-medium">
                  <BookOpen className="mr-1 h-4 w-4" />
                  PROGRAMS
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {programsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-0 w-56 bg-white shadow-lg rounded-md py-2 z-50">
                    <Link href="/programs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      ALL PROGRAMS
                    </Link>
                    <Link href="/programs/maktab-program" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      MHMA MAKTAB
                    </Link>
                    <Link href="/zakat" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#c9a227]">
                      ZAKAT
                    </Link>
                  </div>
                )}
              </div>
              <Link href="/donate" className="flex items-center text-gray-700 hover:text-[#c9a227] transition-colors font-medium">
                <Heart className="mr-1 h-4 w-4" />
                DONATE
              </Link>
              <Link href="/login" className="flex items-center text-gray-700 hover:text-[#c9a227] transition-colors font-medium">
                <User className="mr-1 h-4 w-4" />
                LOGIN
              </Link>
            </div>
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-[#c9a227] p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  HOME
                </Link>
                <Link href="/board" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  BOARD
                </Link>
                <Link href="/committees" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  COMMITTEES
                </Link>
                <Link href="/programs" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  PROGRAMS
                </Link>
                <Link href="/donate" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  DONATE
                </Link>
                <Link href="/login" className="block px-3 py-2 text-gray-700 hover:text-[#c9a227] font-medium">
                  LOGIN
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {/* Blog Posts Grid */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Member Resources</h1>
              <div className="w-24 h-1 bg-[#c9a227] mx-auto"></div>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                Access meeting minutes, important documents, and stay updated with MHMA board activities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetingMinutes.slice(0, visiblePosts).map((post) => (
                <article
                  key={post.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-[#c9a227]/10 rounded-full flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-[#c9a227]" />
                      </div>
                      <span className="text-sm text-gray-500">{post.date}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
                      <Link href={post.href} className="hover:text-[#c9a227] transition-colors">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                    <Link
                      href={post.href}
                      className="inline-flex items-center text-[#c9a227] font-medium hover:underline"
                    >
                      Read More
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {visiblePosts < meetingMinutes.length + 3 && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMorePosts}
                  className="inline-block bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-3 px-8 rounded transition-colors"
                >
                  Load More Posts
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Call to Action Section */}
        <section
          className="py-24 px-4 bg-cover bg-center bg-fixed relative"
          style={{
            backgroundImage: `url('https://mhma.us/wp-content/uploads/2016/08/home-footer.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white uppercase mb-6">
              Change a life today
            </h2>
            <div className="w-24 h-1 bg-white/50 mx-auto mb-8"></div>
            <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
              As long as poverty, injustice & inequality persist, none of us can truly rest. 
              It doesn&apos;t take much to change a life, Get in touch today and start making the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/volunteer"
                className="inline-block bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold py-3 px-8 rounded transition-colors"
              >
                VOLUNTEER
              </Link>
              <Link
                href="/donate"
                className="inline-block bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-3 px-8 rounded transition-colors"
              >
                DONATE NOW
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image
                src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp"
                alt="MHMA Logo"
                width={200}
                height={45}
                className="h-12 w-auto"
              />
            </div>
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
            <div className="text-center text-gray-400 text-sm">
              <p>Copyright 2024 MHMA - Mountain House Muslim Association</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
