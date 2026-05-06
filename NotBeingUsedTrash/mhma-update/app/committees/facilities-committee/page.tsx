"use client";

import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/Navigation";

interface CommitteeMember {
  name: string;
  role: string;
  image: string;
}

const committeeMembers: CommitteeMember[] = [
  {
    name: "SYED FAISAL SHAHID",
    role: "COMMITTEE LEAD",
    image: "https://mhma.us/wp-content/uploads/2024/08/Syed-Shahid-profile.webp",
  },
  {
    name: "SAQIB MALIK",
    role: "COMMITTEE MEMBER",
    image: "https://mhma.us/wp-content/uploads/2024/01/Saqib-Malik-300-x-350.jpg",
  },
  {
    name: "IMRAN LODHI",
    role: "COMMITTEE MEMBER",
    image: "https://mhma.us/wp-content/uploads/2025/09/Imran-Khan-Lodhi.webp",
  },
  {
    name: "UMAR SEAR",
    role: "COMMITTEE MEMBER",
    image: "https://mhma.us/wp-content/uploads/2024/01/Umar-Sear-300-x-350.jpg",
  },
];

export default function FacilitiesCommitteePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="mhma" />

      <main className="pt-20">
        {/* Committee Title Section */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center uppercase mb-6">
              Facilities Committee
            </h1>
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-lg text-gray-700">
                The facilities committee is responsible for the smooth operation of the facility. It oversees the upkeep and maintenance of all facilities utilized by MHMA
              </p>
            </div>
          </div>
        </section>

        {/* Committee Members Section */}
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {committeeMembers.map((member, index) => (
                <div key={index} className="text-center">
                  <div className="relative w-[300px] h-[350px] mx-auto mb-4 overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 uppercase">
                    {member.name}
                  </h4>
                  <p className="text-gray-500 text-sm uppercase tracking-wide">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Back Button */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <Link
              href="/committees"
              className="inline-block bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-3 px-8 rounded transition-colors"
            >
              Back to Committees
            </Link>
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
