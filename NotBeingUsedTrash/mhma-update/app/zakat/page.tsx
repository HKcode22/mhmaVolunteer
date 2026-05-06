"use client";

import { Facebook, Instagram, Twitter, Linkedin, Youtube, Download, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/Navigation";

const zakatSteps = [
  {
    number: "1",
    title: "Collection",
    description:
      "Funds are collected through secure channels and kept in a dedicated Zakat account, completely separate from operational funds. Each contribution is tracked and verified to ensure proper handling.",
  },
  {
    number: "2",
    title: "Verification of Recipients",
    description:
      "We carefully verify that potential recipients fall under the eight categories eligible for Zakat as specified in the Quran (Surah At-Tawbah, 9:60): The poor, the needy, Zakat collectors, those whose hearts are to be reconciled, freeing slaves, those in debt, in the cause of Allah, and the wayfarer. Applicants can submit their requests through our secure, confidential application form. We understand the sensitive nature of financial hardship and guarantee complete privacy – all information shared will be treated with absolute confidentiality and accessed only by authorized Zakat administrators.",
  },
  {
    number: "3",
    title: "Documentation",
    description:
      "Every Zakat transaction is thoroughly documented. We maintain detailed records of donors, recipients, amounts, and distribution dates. These records are regularly audited by independent Islamic scholars.",
  },
  {
    number: "4",
    title: "Distribution",
    description:
      "Zakat is distributed promptly to avoid delays. Priority is given based on urgency of need. We ensure recipients receive 100% of allocated funds with no deductions for administrative costs.",
  },
  {
    number: "5",
    title: "Reporting",
    description:
      "Monthly reports detail all Zakat distributions, including total amounts collected and disbursed, number of beneficiaries helped, and categories of assistance provided. These reports are available to all donors.",
  },
];

export default function ZakatPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="programs" />

      <main className="pt-20">
        {/* Zakat Title Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Our Transparent Zakat Distribution Process
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              The{" "}
              <Link
                href="/committees/zakat-committee"
                className="text-[#c9a227] hover:underline font-medium"
              >
                Zakat Committee
              </Link>{" "}
              follows strict Islamic guidelines and maintain complete
              transparency in collecting and distributing Zakat funds.
            </p>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-12 max-w-2xl mx-auto">
              <p className="text-gray-700 mb-4">
                All zakat related requests should be emailed to{" "}
                <a
                  href="mailto:zakat@mhma.info"
                  className="text-[#c9a227] hover:underline font-medium inline-flex items-center"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  zakat@mhma.info
                </a>
              </p>
              <a
                href="https://mhma.us/wp-content/uploads/2025/01/Zakat-and-Sadqah-Application.docx"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-[#b49c2e] hover:bg-[#8c7622] text-white font-semibold py-3 px-6 rounded transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Zakat Application
              </a>
            </div>

            {/* Separator */}
            <div className="w-full max-w-xs mx-auto border-t border-gray-200 mb-12"></div>

            {/* Zakat Steps */}
            <div className="space-y-8 text-left">
              {zakatSteps.map((step, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-[#c9a227] hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-[#c9a227] text-white rounded-full text-sm font-bold mr-3">
                      {step.number}
                    </span>
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed pl-11">
                    {step.description}
                  </p>
                </div>
              ))}
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
