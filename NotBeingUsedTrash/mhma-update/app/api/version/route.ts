import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '1.0.3',
    deployedAt: new Date().toISOString(),
    gitCommit: 'a7c1a96',
    features: [
      'Retry logic for Oracle backend',
      'Merged WP + hardcoded programs',
      'Fixed Show More buttons with type=button',
      'Quran verse consistent per day',
      'PageBanner component for all pages',
      'Journal Meta Fields plugin created'
    ],
    environment: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'not set'
  });
}
