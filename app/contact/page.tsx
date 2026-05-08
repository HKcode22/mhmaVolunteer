"use client";

import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import { MapPin, Mail, Phone, Send, ChevronRight, Clock, Users } from "lucide-react";

import PageBanner from "@/components/PageBanner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";
      const response = await fetch(`${WP_API_URL}/mhma/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send message");
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="contact" />

      <PageBanner
        title="Contact Us"
        highlightedText="Us"
        subtitle="We're here to help. Reach out with any question, request, or feedback."
      />

      {/* Contact Info Cards */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              We'd Love to Hear From You
            </h2>
            <p className="text-gray-600">
              Whether you have a question about our programs, services, or just want to say salaam — our team is here for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Email Card */}
            <a href="mailto:info@mhma.info" className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-200 hover:border-amber-400">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Mail className="w-7 h-7 text-amber-600 group-hover:text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-amber-600 font-medium">info@mhma.info</p>
              <p className="text-gray-500 text-sm mt-2">We typically respond within 24-48 hours</p>
            </a>

            {/* Phone Card */}
            <div className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-200 hover:border-amber-400">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Phone className="w-7 h-7 text-amber-600 group-hover:text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Call Us</h3>
              <p className="text-amber-600 font-medium">(209) 555-0123</p>
              <p className="text-gray-500 text-sm mt-2">Available during office hours</p>
            </div>

            {/* Location Card */}
            <a href="#directions" className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-200 hover:border-amber-400">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <MapPin className="w-7 h-7 text-amber-600 group-hover:text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-gray-700">250 E. Main St.</p>
              <p className="text-gray-700">Mountain House, CA 95391</p>
            </a>
          </div>
        </div>
      </section>

      {/* Office Hours */}
      <section className="py-12 bg-amber-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-amber-600" />
              <h2 className="text-2xl font-serif font-bold text-gray-900">Office Hours</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Monday - Friday</span>
                <span className="font-medium text-gray-900">10:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Saturday</span>
                <span className="font-medium text-gray-900">10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Sunday</span>
                <span className="font-medium text-gray-900">Closed</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Jumu'ah Prayer</span>
                <span className="font-medium text-gray-900">1:00 PM & 2:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Send Us a <span className="text-amber-600">Message</span>
            </h2>
            <div className="w-24 h-1 bg-amber-400 mx-auto"></div>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <p className="text-green-800 font-semibold text-lg">Thank you for your message!</p>
              <p className="text-green-600">We'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-8 shadow-lg">
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="How can we help you?"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Write your message here..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto px-8 py-4 bg-amber-500 text-white font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-amber-600 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Directions Section */}
      <section id="directions" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Get <span className="text-amber-600">Directions</span>
            </h2>
            <div className="w-24 h-1 bg-amber-400 mx-auto mb-4"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're located at the Unity Center in Mountain House. Easy access from Highway 205 and surrounding areas.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="aspect-video w-full bg-gray-200 relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153!2d-121.5423!3d37.7782!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80900e1c3c9c!2sMountain+House%2C+CA!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "400px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              ></iframe>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">MHMA - Mountain House Muslim Association</h3>
                  <p className="text-gray-600">250 E. Main Street, Mountain House, CA 95391</p>
                </div>
                <a
                  href="https://maps.google.com/?q=250+E+Main+St+Mountain+House+CA+95391"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-teal-800 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-lg"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Mountain House Muslim Association
          </p>
        </div>
      </footer>
    </div>
  );
}
