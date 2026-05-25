"use client";

// ── JOURNAL DETAIL PAGE (commented out per board request) ──
// Original code preserved in /journal/[slug] backup. Uncomment function body to restore.

import Link from "next/link";
import Image from "next/image";
import { Edit3 } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchJournalEntryBySlug } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

const journalContent: Record<string, { title: string; content: string; date: string; attendees: string; data?: any; isImage?: boolean; imageUrl?: string }> = {
};

export default function JournalEntryPage() {
  return null;
}
