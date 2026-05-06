"use client";

import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";

export default function CommunityCommitmentPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Commitment and Connection</h1>
            <p className="text-xl text-gray-600">A Weekend of Purpose at MHMA</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed text-lg">
                This weekend at MHMA was a perfect reflection of what makes our community strong — dedication, teamwork, and shared values. In just two days, we witnessed two outstanding events: a meaningful Hajj Workshop and an engaging Lego competition. Both reminded us how powerful it is when we come together to learn, grow, and support one another.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">A Spiritual Journey: The Hajj Workshop</h2>
              <p className="text-gray-700 leading-relaxed">
                On Saturday, Sister Khadeja led a deeply impactful Hajj Workshop. Her clarity, care, and depth of knowledge made the session an inspiring experience for attendees of all ages. She walked us through the meaning and steps of Hajj with a perfect blend of information and reflection.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                This workshop wasn't just about learning — it was about connecting with our faith. Through her leadership, Sister Khadeja helped participants understand the spiritual purpose behind each step of the pilgrimage. It was an experience that left a lasting impression on everyone present.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Learning Through Play: The Lego Competition</h2>
              <p className="text-gray-700 leading-relaxed">
                On Sunday, the community gathered again for a different kind of event — the Lego competition, led and organized by Muhammad Waqas. This event focused on structured model-building, where children followed standard designs to complete their projects.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                While creativity wasn't the focus, the event was still full of valuable moments. The kids showed focus, patience, and teamwork. They supported each other, followed instructions carefully, and completed their models with pride. It was a joy to see so many young faces fully engaged, learning to follow guidelines while having fun in a positive, social setting.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Thanks to Muhammad Waqas's thoughtful planning and calm leadership, the competition was well-run and enjoyable for all.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Volunteers: The Silent Engines Behind Every Event</h2>
              <p className="text-gray-700 leading-relaxed">
                At the heart of both events — and every event at MHMA — are our incredible volunteers. These individuals consistently give their time, energy, and effort to serve the community, often without recognition. They take on tasks large and small, always with dedication and care.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Their behind-the-scenes work is what makes everything possible. From setting up venues to managing logistics, greeting guests to cleaning up afterward — they do it all. And they do it with heart. We are endlessly grateful for their contribution.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Members: The Backbone of MHMA</h2>
              <p className="text-gray-700 leading-relaxed">
                We also want to sincerely thank our MHMA members. Your support through membership fees is what sustains this organization and allows us to host events like these — not just occasionally, but dozens of times every month.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Your commitment to MHMA helps us provide consistent, high-quality programming for people of all ages. It allows us to plan, grow, and serve. By maintaining your membership, you're not just helping the organization run — you're investing in the future of this community.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">The Children: Our Shared Joy</h2>
              <p className="text-gray-700 leading-relaxed">
                And of course, a special thanks to the children who participated in the Lego competition. You brought focus, fun, and friendliness to the event. Your patience, willingness to follow the rules, and kind attitude toward each other made the day a success.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Your smiles are the reason we work so hard to organize these events. Seeing you enjoy, learn, and grow — that's the greatest reward for all of us.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Looking Ahead</h2>
              <p className="text-gray-700 leading-relaxed">
                This weekend was a wonderful snapshot of what MHMA does all year round. With dozens of activities each month, there is always something happening — something to learn, something to celebrate, and someone to connect with.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                To Sister Khadeja, Muhammad Waqas, every volunteer, every member, and every participant: thank you. You are what makes MHMA not just an organization, but a true community.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4 font-semibold">
                Let's keep the momentum going — together.
              </p>
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
