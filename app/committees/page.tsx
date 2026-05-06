'use client';

import React from 'react';
import { Facebook, Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function CommitteesPage() {

  const committees = [
    {
      name: 'Facilities Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Facility-committee.webp',
      href: '/committees/facilities-committee'
    },
    {
      name: 'Public Relations Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Public-Relations-committee.webp',
      href: '/committees/pr-committee'
    },
    {
      name: 'Finance Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Finance-committee.webp',
      href: '/committees/finance-committee'
    },
    {
      name: 'Membership Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Membership-committee.webp',
      href: '/committees/membership-committee'
    },
    {
      name: 'Zakat Committee',
      image: 'https://mhma.us/wp-content/uploads/2025/01/Zakat-committee.webp',
      href: '/committees/zakat-committee'
    },
    {
      name: 'Hidaya Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Hidaya-committee.webp',
      href: '/committees/hidaya-committee'
    },
    {
      name: 'Youth Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Youth-committee.webp',
      href: '/committees/youth-committee'
    },
    {
      name: 'Masjid Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Masjid-committee.webp',
      href: '/committees/masjid-committee'
    },
    {
      name: 'Fundraising Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Fundraising-committee.webp',
      href: '/committees/fundraising-committee'
    },
    {
      name: 'Funeral Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/08/Funeral-committee.webp',
      href: '/committees/funeral-committee'
    },
    {
      name: 'Education Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Education-committee.webp',
      href: '/committees/education-committee'
    },
    {
      name: 'Website Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Website-committee.webp',
      href: '/committees/website-committee'
    },
    {
      name: 'Events Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Events-committee.webp',
      href: '/committees/events-committee'
    },
    {
      name: 'Communication Committee',
      image: 'https://mhma.us/wp-content/uploads/2024/05/Communication-committee.webp',
      href: '/committees/communications-committee'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navigation currentPage="mhma" />

      <main className="pt-20">
      {/* Committees Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4 uppercase tracking-wide">
            Mountain House Muslim Association Committees
          </h1>
          <p className="text-gray-600 text-center max-w-4xl mx-auto mb-16 leading-relaxed">
            The MHMA shall have statutory committees to assist the Board of Directors and Board of Trustees and encourage larger community involvement in the administration and operation of the MHMA. The committees&apos; goals, objectives, and budget shall be set annually by the board of directors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {committees.map((committee, index) => (
              <div key={index} className="text-center">
                <a 
                  href={committee.href}
                  className="block hover:opacity-90 transition-opacity"
                  aria-label={committee.name}
                >
                  <div className="relative mx-auto w-full max-w-[400px] overflow-hidden">
                    <img
                      src={committee.image}
                      alt={committee.name}
                      className="w-full h-auto object-cover"
                      width="500"
                      height="500"
                    />
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="py-12 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <img 
              src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" 
              alt="MHMA Logo" 
              className="h-16 mx-auto"
              width="300"
              height="61"
            />
          </div>
        </div>

        <div className="py-6 bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              © Copyright 2010- 2026 | Mountain House Muslim Association
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/mhma95391" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-amber-500 flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/mhma.ig/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-amber-500 flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/mhmuslims" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-amber-500 flex items-center justify-center transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@mhmuslimassociation" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-amber-500 flex items-center justify-center transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/company/mountain-house-muslim-association" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-amber-500 flex items-center justify-center transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
