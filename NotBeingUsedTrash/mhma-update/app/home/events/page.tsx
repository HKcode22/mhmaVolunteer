"use client";

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function EventsPage() {
  useEffect(() => {
    // Redirect to homepage with hash for activities section
    window.location.href = '/#activities';
  }, []);

  return null;
}
