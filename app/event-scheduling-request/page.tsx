"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function EventSchedulingRequestPage() {
  const [formData, setFormData] = useState({
    // Organizer
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    // Event Details
    eventTitle: "",
    eventCategory: "",
    eventDescription: "",
    start: "",
    end: "",
    // Host/Guest Speaker
    hasHostSpeaker: "",
    // Food
    hasFood: "",
    foodService: [] as string[],
    // Location
    location: "",
    facility: "",
    // Requirements
    roundTables: "",
    rectangularTables: "",
    chairs: "",
    equipment: [] as string[],
    // Volunteers/Helpers
    volunteers: "",
    helpers: "",
    // Flyer/Form
    rsvpRequired: "",
    paymentRequired: "",
    // Comments
    comments: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, value: string) => {
    setFormData((prev) => {
      const currentArray = prev[name as keyof typeof prev] as string[];
      if (currentArray.includes(value)) {
        return {
          ...prev,
          [name]: currentArray.filter((item) => item !== value),
        };
      } else {
        return {
          ...prev,
          [name]: [...currentArray, value],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    try {
      const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";

      // Create a new page for the event scheduling request
      const response = await fetch(`${WP_API_URL}/wp/v2/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Event Request: ${formData.eventTitle || "Untitled"}`,
          content: `
            <h3>Organizer</h3>
            <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Phone:</strong> ${formData.phone}</p>
            <p><strong>Country:</strong> ${formData.country}</p>
            <h3>Event Details</h3>
            <p><strong>Title:</strong> ${formData.eventTitle}</p>
            <p><strong>Category:</strong> ${formData.eventCategory}</p>
            <p><strong>Description:</strong> ${formData.eventDescription}</p>
            <p><strong>Start:</strong> ${formData.start}</p>
            <p><strong>End:</strong> ${formData.end}</p>
            <p><strong>Has Host/Speaker:</strong> ${formData.hasHostSpeaker}</p>
            <p><strong>Has Food:</strong> ${formData.hasFood}</p>
            <p><strong>Food Service:</strong> ${formData.foodService.join(", ")}</p>
            <p><strong>Location:</strong> ${formData.location}</p>
            <p><strong>Facility:</strong> ${formData.facility}</p>
            <p><strong>Round Tables:</strong> ${formData.roundTables}</p>
            <p><strong>Rectangular Tables:</strong> ${formData.rectangularTables}</p>
            <p><strong>Chairs:</strong> ${formData.chairs}</p>
            <p><strong>Equipment:</strong> ${formData.equipment.join(", ")}</p>
            <p><strong>Volunteers:</strong> ${formData.volunteers}</p>
            <p><strong>Helpers:</strong> ${formData.helpers}</p>
            <p><strong>RSVP Required:</strong> ${formData.rsvpRequired}</p>
            <p><strong>Payment Required:</strong> ${formData.paymentRequired}</p>
            <p><strong>Comments:</strong> ${formData.comments}</p>
          `,
          status: "pending", // Set to pending so board members can review
          parent: 277, // Events page parent
          acf: {
            organizer_first_name: formData.firstName,
            organizer_last_name: formData.lastName,
            organizer_email: formData.email,
            organizer_phone: formData.phone,
            organizer_country: formData.country,
            event_title: formData.eventTitle,
            event_category: formData.eventCategory,
            event_description: formData.eventDescription,
            event_start: formData.start,
            event_end: formData.end,
            has_host_speaker: formData.hasHostSpeaker,
            has_food: formData.hasFood,
            food_service: formData.foodService,
            location: formData.location,
            facility: formData.facility,
            round_tables: formData.roundTables,
            rectangular_tables: formData.rectangularTables,
            chairs: formData.chairs,
            equipment: formData.equipment,
            volunteers: formData.volunteers,
            helpers: formData.helpers,
            rsvp_required: formData.rsvpRequired,
            payment_required: formData.paymentRequired,
            comments: formData.comments,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      alert("Event scheduling request submitted successfully!");
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        country: "",
        eventTitle: "",
        eventCategory: "",
        eventDescription: "",
        start: "",
        end: "",
        hasHostSpeaker: "",
        hasFood: "",
        foodService: [],
        location: "",
        facility: "",
        roundTables: "",
        rectangularTables: "",
        chairs: "",
        equipment: [],
        volunteers: "",
        helpers: "",
        rsvpRequired: "",
        paymentRequired: "",
        comments: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit request. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="event-scheduling-request" />

      {/* Main Content */}
      <div className="pt-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Scheduling Request</h1>
          <p className="text-gray-600 mb-8">Please fill out the form below to request an event scheduling.</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Organizer Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Organizer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Event Details Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    id="eventTitle"
                    name="eventTitle"
                    value={formData.eventTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="eventCategory" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Category
                  </label>
                  <select
                    id="eventCategory"
                    name="eventCategory"
                    value={formData.eventCategory}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    required
                  >
                    <option value="">Please Select Category</option>
                    <option value="religious">Religious</option>
                    <option value="social">Social</option>
                    <option value="educational">Educational</option>
                    <option value="fundraising">Fundraising</option>
                    <option value="community">Community</option>
                    <option value="youth">Youth</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Description
                  </label>
                  <textarea
                    id="eventDescription"
                    name="eventDescription"
                    value={formData.eventDescription}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="Please provide as much information as possible, including event category detail if you selected other"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-2">
                      Start
                    </label>
                    <input
                      type="datetime-local"
                      id="start"
                      name="start"
                      value={formData.start}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-2">
                      End
                    </label>
                    <input
                      type="datetime-local"
                      id="end"
                      name="end"
                      value={formData.end}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Host/Guest Speaker Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Will there be a host or guest speaker?</h2>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasHostSpeaker"
                    value="yes"
                    checked={formData.hasHostSpeaker === "yes"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasHostSpeaker"
                    value="no"
                    checked={formData.hasHostSpeaker === "no"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">No</span>
                </label>
              </div>
            </div>

            {/* Food Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Will food be served?</h2>
              <div className="space-y-3 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasFood"
                    value="yes"
                    checked={formData.hasFood === "yes"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasFood"
                    value="no"
                    checked={formData.hasFood === "no"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">No</span>
                </label>
              </div>

              {formData.hasFood === "yes" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Food Service</h3>
                  <p className="text-sm text-gray-600 mb-3">Please select one or more options</p>
                  <div className="space-y-2">
                    {["Self-serve", "Catered", "Potluck", "Other"].map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.foodService.includes(option)}
                          onChange={() => handleCheckboxChange("foodService", option)}
                          className="w-4 h-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Event Location Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Location</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="Location"
                  />
                </div>
                <div>
                  <label htmlFor="facility" className="block text-sm font-medium text-gray-700 mb-2">
                    Facility
                  </label>
                  <select
                    id="facility"
                    name="facility"
                    value={formData.facility}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                  >
                    <option value="">Select Facility</option>
                    <option value="unity-center">Unity Center</option>
                    <option value="masjid">Masjid</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Requirements Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="roundTables" className="block text-sm font-medium text-gray-700 mb-2">
                    Round Tables
                  </label>
                  <input
                    type="number"
                    id="roundTables"
                    name="roundTables"
                    value={formData.roundTables}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="Please enter the number of round tables needed"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="rectangularTables" className="block text-sm font-medium text-gray-700 mb-2">
                    Rectangular Tables
                  </label>
                  <input
                    type="number"
                    id="rectangularTables"
                    name="rectangularTables"
                    value={formData.rectangularTables}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="Please enter the number of rectangular tables needed"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="chairs" className="block text-sm font-medium text-gray-700 mb-2">
                    Chairs
                  </label>
                  <input
                    type="number"
                    id="chairs"
                    name="chairs"
                    value={formData.chairs}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="Please enter the number of chairs needed"
                    min="0"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Equipment</h3>
                  <p className="text-sm text-gray-600 mb-3">Please select all require options</p>
                  <div className="space-y-2">
                    {["Projector", "Microphone", "Speakers", "Tables", "Chairs", "Other"].map((item) => (
                      <label key={item} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.equipment.includes(item)}
                          onChange={() => handleCheckboxChange("equipment", item)}
                          className="w-4 h-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Volunteers/Helpers Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Volunteers</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="volunteers" className="block text-sm font-medium text-gray-700 mb-2">
                    Volunteers
                  </label>
                  <input
                    type="number"
                    id="volunteers"
                    name="volunteers"
                    value={formData.volunteers}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="Please enter the number of volunteers needed"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="helpers" className="block text-sm font-medium text-gray-700 mb-2">
                    Helpers
                  </label>
                  <input
                    type="number"
                    id="helpers"
                    name="helpers"
                    value={formData.helpers}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                    placeholder="Please enter the number of paid helpers needed"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Flyer and Form Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Flyer and Form</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">RSVP Required</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="rsvpRequired"
                        value="yes"
                        checked={formData.rsvpRequired === "yes"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="rsvpRequired"
                        value="no"
                        checked={formData.rsvpRequired === "no"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">No</span>
                    </label>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Collection Required</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentRequired"
                        value="yes"
                        checked={formData.paymentRequired === "yes"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentRequired"
                        value="no"
                        checked={formData.paymentRequired === "no"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#c9a227] focus:ring-[#c9a227] border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments</h2>
              <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                  Please share any additional information that will help with the event planning, and flyer creation
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#c9a227] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#b89120] transition-colors focus:outline-none focus:ring-2 focus:ring-[#c9a227] focus:ring-offset-2"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© Copyright 2010- 2026 | Mountain House Muslim Association</p>
        </div>
      </footer>
    </div>
  );
}
