import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://mhma-update.local/wp-json';

export async function GET(request: NextRequest) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `${WP_API_URL}/wp/v2/pages?parent=199&per_page=100`,
      { next: { revalidate: 60 }, signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json([]); // Return empty array instead of error
    }

    const entries = await response.json();
    return NextResponse.json(entries);
  } catch (error) {
    console.warn('Journal API: Backend unavailable, returning empty:', error instanceof Error ? error.message : String(error));
    return NextResponse.json([]); // Return empty on timeout/backend down
  }
}