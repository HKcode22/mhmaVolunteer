"use client";

import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";

export default function ServingOurCommunityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="mhma" />

      <main className="pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/mhmapage" className="text-[#c9a227] hover:underline mb-4 inline-block">
              ← Back to MHMA
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Serving Our Community with Transparency</h1>
            <p className="text-xl text-gray-600">Building trust through open communication and accountability</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="prose prose-lg max-w-none">
              <img
                src="/Community-Response.webp"
                alt="Serving Our Community with Transparency"
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image
                src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp"
                alt="MHMA Logo"
                width={180}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm">
              © Copyright 2010-2026 | Mountain House Muslim Association
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
