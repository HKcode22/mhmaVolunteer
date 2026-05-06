'use client';

import React, { useState } from 'react';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Mail, Phone, Map, BookMarked, MessageSquare, DollarSign } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function BoardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const boardOfDirectors = [
    {
      name: 'Umar Sear',
      title: 'President',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Umar-Sear-300-x-350.jpg',
      socials: [
        { type: 'facebook', url: 'https://www.facebook.com/umar.sear/', color: '#3b5998' },
        { type: 'youtube', url: 'https://www.youtube.com/@UmarSear', color: '#cd201f' },
        { type: 'linkedin', url: 'https://www.linkedin.com/in/usear/', color: '#0077b5' },
        { type: 'email', url: 'mailto:umar.sear@mhma.info', color: '#000000' },
        { type: 'phone', url: 'tel:4087221043', color: '#000000' }
      ]
    },
    {
      name: 'Asad Siddique',
      title: 'General Secretary',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Asad-Siddiqui-300-x-350-257x300.jpg',
      socials: [{ type: 'email', url: 'mailto:asad.siddique@mhma.info', color: '#000000' }]
    },
    {
      name: 'Saqib Malik',
      title: 'Treasurer',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Saqib-Malik-300-x-350.jpg',
      socials: [{ type: 'email', url: 'mailto:saqib.malik@mhma.info', color: '#000000' }]
    },
    {
      name: 'Mohamed Mohamed',
      title: 'Director',
      image: 'https://mhma.us/wp-content/uploads/2025/11/Mohamed-Mohamed.jpg',
      socials: [{ type: 'email', url: 'mailto:asif.alvi@mhma.info', color: '#000000' }]
    },
    {
      name: 'Sadia Khan',
      title: 'Director',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Sadia-Khan-300-x-350.jpg',
      socials: [{ type: 'email', url: 'mailto:sadia.khan@mhma.info', color: '#000000' }]
    },
    {
      name: 'Sarfaraz Shaikh',
      title: 'Director',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Sarfaraz-Shaik-300-x-350.jpg',
      socials: [{ type: 'email', url: 'mailto:sarfaraz.shaikh@mhma.info', color: '#000000' }]
    },
    {
      name: 'Mohamed Basha',
      title: 'Director',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Mohammad-Basha-300-x-350-257x300.jpg',
      socials: [{ type: 'email', url: 'mailto:mohamed.basha@mhma.info', color: '#000000' }]
    },
    {
      name: 'Oussama Saafien',
      title: 'Director',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Oussama-Saafien-300-x-350.jpg',
      socials: [{ type: 'email', url: 'mailto:oussama.saafien@mhma.info', color: '#000000' }]
    },
    {
      name: 'Faisal Shahid',
      title: 'Director',
      image: 'https://mhma.us/wp-content/uploads/2024/08/Syed-Shahid-profile.webp',
      socials: [{ type: 'email', url: 'mailto:faisal.shahid@mhma.info', color: '#000000' }]
    }
  ];

  const boardOfTrustees = [
    {
      name: 'Asad Jafri',
      title: 'Director',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Asad-Jafri-300-x-350.jpg',
      socials: [{ type: 'email', url: 'mailto:asad.jafri@mhma.info', color: '#000000' }]
    },
    {
      name: 'Zafar Khan',
      title: 'Trustee',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Zafar-Khan-300-x-350.jpg',
      socials: [{ type: 'email', url: 'mailto:zafar.khan@mhma.info', color: '#000000' }]
    },
    {
      name: 'Kanishka Ramyar',
      title: 'Trustee',
      image: 'https://mhma.us/wp-content/uploads/2025/11/Kanishka-Ramyar.jpg',
      socials: [{ type: 'email', url: 'mailto:kanishka.ramyar@mhma.info', color: '#000000' }]
    },
    {
      name: 'Shahzad Ali',
      title: 'Trustee',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Shehzad-Ali-300-x-350.jpg',
      socials: [{ type: 'email', url: 'mailto:shahzad.ali@mhma.info', color: '#000000' }]
    },
    {
      name: 'Tariq Khan',
      title: 'Trustee',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Tariq-Khan-300-x-350.jpg',
      socials: [{ type: 'email', url: 'mailto:tariq.khan@mhma.info', color: '#000000' }]
    },
    {
      name: 'Owais Khalid',
      title: 'Trustee',
      image: 'https://mhma.us/wp-content/uploads/2024/01/Owais-Khalid-300-x-350.jpg',
      socials: [{ type: 'email', url: 'mailto:owais.khalid@mhma.info', color: '#000000' }]
    },
    {
      name: 'Nazeer Shaik',
      title: 'Trustee',
      image: 'https://mhma.us/wp-content/uploads/2025/11/Nazeer-Shaik.jpg',
      socials: [{ type: 'email', url: 'mailto:nazeer.shaik@mhma.info', color: '#000000' }]
    }
  ];

  const getSocialIcon = (type: string) => {
    switch (type) {
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navigation currentPage="mhma" />

      <main className="pt-20">
      {/* Board of Directors Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8 uppercase tracking-wide">
            Board of Directors
          </h1>
          <p className="text-gray-600 text-center max-w-4xl mx-auto mb-16 leading-relaxed">
            The MHMA Board of Directors manages the day-to-day operations of our organization. Consisting of nine elected members from the Mountain House community, the Board includes a <strong>President</strong>, <strong>Secretary</strong>, and <strong>Treasurer</strong>, along with additional <strong>directors</strong> to meet our community&apos;s functional needs. The Board oversees daily operations and administrative matters, implements programs and services for the community, manages operational finances and budgets, coordinates committees and community activities, and executes the vision set by the Board of Trustees. Board members serve four-year terms and meet at least once a month to discuss and guide <strong>MHMA&apos;s operations</strong>, with all meetings including an open session where voting members may attend as observers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {boardOfDirectors.map((person, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-3 mx-auto w-48 h-56 overflow-hidden rounded shadow-lg border-4 border-gray-100">
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-white p-6 border border-gray-100 rounded shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{person.name}</h3>
                  <p className="text-amber-500 text-sm uppercase tracking-wide mb-4">{person.title}</p>
                  <div className="flex justify-center space-x-3">
                    {person.socials.map((social, idx) => (
                      <a
                        key={idx}
                        href={social.url}
                        target={social.type !== 'email' && social.type !== 'phone' ? '_blank' : undefined}
                        rel={social.type !== 'email' && social.type !== 'phone' ? 'noopener noreferrer' : undefined}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-colors text-gray-600"
                        style={{ color: social.color }}
                        aria-label={social.type}
                      >
                        {getSocialIcon(social.type)}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Board of Trustees Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8 uppercase tracking-wide">
            Board of Trustees
          </h1>
          <p className="text-gray-600 text-center max-w-4xl mx-auto mb-16 leading-relaxed">
            The MHMA Board of Trustees provides <strong>strategic leadership</strong> and <strong>governance oversight</strong> for our organization. Consisting of seven members, the Trustees ensure MHMA remains true to its mission and <strong>Islamic principles</strong>. The Board of Trustees holds and manages all <strong>MHMA property</strong> in trust for the community, and is responsible for all <strong>regulatory compliance</strong>, insurance, and legal matters. They oversee major decisions including <strong>construction</strong> and <strong>fundraising</strong>, provide advisory support to the Board of Directors. Board members serve four-year staggered terms to ensure continuity of leadership and work collaboratively with the Board of Directors, meeting regularly to ensure alignment on MHMA&apos;s <strong>direction</strong> and <strong>goals</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {boardOfTrustees.map((person, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-3 mx-auto w-48 h-56 overflow-hidden rounded shadow-lg border-4 border-gray-100">
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-white p-6 border border-gray-100 rounded shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{person.name}</h3>
                  <p className="text-amber-500 text-sm uppercase tracking-wide mb-4">{person.title}</p>
                  <div className="flex justify-center space-x-3">
                    {person.socials.map((social, idx) => (
                      <a
                        key={idx}
                        href={social.url}
                        target={social.type !== 'email' ? '_blank' : undefined}
                        rel={social.type !== 'email' ? 'noopener noreferrer' : undefined}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-colors text-gray-600"
                        style={{ color: social.color }}
                        aria-label={social.type}
                      >
                        {getSocialIcon(social.type)}
                      </a>
                    ))}
                  </div>
                </div>
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
