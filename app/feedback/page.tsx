"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageSquare,
  Send,
  Check,
} from "lucide-react";
import Navigation from "@/app/components/Navigation";

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-mhma-cream font-sans">
      <Navigation currentPage="mhma" />

      <main className="pt-20">
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mhma-forest mb-6">
                <MessageSquare className="w-8 h-8 text-mhma-gold" />
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                Share Your <span className="text-mhma-gold">Feedback</span>
              </h1>
              <p className="text-gray-500 text-lg font-light max-w-xl mx-auto">
                Your voice helps us improve. Whether it is a suggestion, compliment, or concern — we want to hear from you.
              </p>
            </div>

            {submitted ? (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                <p className="text-gray-500">Your feedback has been received. JazakAllah Khair!</p>
                <button onClick={() => setSubmitted(false)}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light transition-colors font-medium text-sm">
                  Submit Another Response
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
                <form className="space-y-6" onSubmit={e => { e.preventDefault(); setSubmitted(true); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">First Name <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Your first name" required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mhma-gold bg-mhma-cream/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Your last name" required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mhma-gold bg-mhma-cream/50" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <input type="email" placeholder="your@email.com" required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mhma-gold bg-mhma-cream/50" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Feedback Type <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mhma-gold bg-mhma-cream/50">
                      <option value="">Select type...</option>
                      <option value="general">General Feedback</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="compliment">Compliment</option>
                      <option value="complaint">Complaint</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Details <span className="text-red-500">*</span></label>
                    <textarea rows={6} required placeholder="Tell us what is on your mind..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mhma-gold bg-mhma-cream/50 resize-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-3">
                      Do you wish to remain anonymous?
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="anonymous" value="yes"
                          className="w-4 h-4 text-mhma-gold focus:ring-mhma-gold border-gray-300" />
                        <span className="text-sm text-gray-600">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="anonymous" value="no" defaultChecked
                          className="w-4 h-4 text-mhma-gold focus:ring-mhma-gold border-gray-300" />
                        <span className="text-sm text-gray-600">No</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input type="checkbox" required
                      className="mt-1 h-4 w-4 text-mhma-gold border-gray-300 rounded focus:ring-mhma-gold" />
                    <label className="text-sm text-gray-500">
                      I have read and agree to the{" "}
                      <Link href="/rsvp-terms-and-conditions" className="text-mhma-gold hover:underline">Terms and Conditions</Link>{" "}
                      and{" "}
                      <Link href="/privacy-policy" className="text-mhma-gold hover:underline">Privacy Policy</Link>
                    </label>
                  </div>

                  <button type="submit"
                    className="w-full py-3.5 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-light font-bold text-base transition-colors flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Submit Feedback
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-mhma-dark text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image
                src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp"
                alt="MHMA Logo"
                width={200}
                height={45}
                className="h-12 w-auto opacity-90"
              />
            </div>
            <div className="flex space-x-4 mb-8">
              {[
                { href: "https://www.facebook.com/mhma95391", Icon: Facebook },
                { href: "https://www.instagram.com/mhma.ig/", Icon: Instagram },
                { href: "https://x.com/i/flow/login?redirect_after_login=%2Fmhmatweets", Icon: Twitter },
                { href: "https://www.linkedin.com/company/mountain-house-muslim-association/", Icon: Linkedin },
                { href: "https://www.youtube.com/@MHMAYouTube", Icon: Youtube },
              ].map(({ href, Icon }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-mhma-gold transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <div className="text-center text-gray-400 text-sm">
              <p>Copyright 2026 MHMA — Mountain House Muslim Association</p>
              <p className="text-xs text-gray-500 mt-1">MHMA is a 501(c)(3) tax-exempt organization.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
