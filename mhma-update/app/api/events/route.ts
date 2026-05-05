import { NextRequest, NextResponse } from 'next/server';

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://mhma-update.local/wp-json';

// Common parent IDs to try for events (different environments may have different IDs)
// 280 = Events page (original events), 277 = Alternative events parent
const EVENT_PARENT_IDS = [280, 277, 152, 276, 278, 100, 200];

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic for flaky Oracle backend
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Events API: Attempt ${attempt + 1}/${maxRetries + 1} for ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        console.log(`Events API: Success on attempt ${attempt + 1}`);
        return response;
      }

      // Don't retry on 4xx errors
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.warn(`Events API: Attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : String(error));

      if (attempt < maxRetries) {
        const backoffMs = Math.min(500 * Math.pow(2, attempt), 3000);
        console.log(`Events API: Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed after retries');
}

async function fetchEvents(parentId: string) {
  try {
    const response = await fetchWithRetry(
      `${WP_API_URL}/wp/v2/pages?parent=${parentId}&per_page=100`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) return [];

    const events = await response.json();
    // Return raw events WITHOUT concurrent media fetching (prevents Oracle crash)
    // Frontend handles image URL construction
    return events;
  } catch (error) {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedParentId = searchParams.get('parent') || '277';

  try {
    // Try parent IDs sequentially (NOT concurrently) to avoid Oracle crash
    const allEventsMap = new Map();

    // Try requested parent first
    const requestedEvents = await fetchEvents(requestedParentId);
    requestedEvents.forEach((event: any) => {
      if (event.id) allEventsMap.set(event.id, event);
    });

    // Only try other parents if first one found nothing
    if (allEventsMap.size === 0) {
      for (const parentId of EVENT_PARENT_IDS) {
        if (parentId.toString() === requestedParentId) continue;
        const parentEvents = await fetchEvents(parentId.toString());
        parentEvents.forEach((event: any) => {
          if (event.id) allEventsMap.set(event.id, event);
        });
        if (allEventsMap.size > 0) break; // Stop once we find events
      }
    }

    // Fallback: try fetching all pages with ACF event fields
    if (allEventsMap.size === 0) {
      try {
        const response = await fetch(
          `${WP_API_URL}/wp/v2/pages?per_page=100`,
          { next: { revalidate: 60 } }
        );
        if (response.ok) {
          const allPages = await response.json();
          const events = allPages.filter((page: any) =>
            page.acf?.event_date || page.acf?.event_poster || page.acf?.event_time
          );
          events.forEach((event: any) => {
            if (event.id) allEventsMap.set(event.id, event);
          });
        }
      } catch (e) {
        // Ignore fallback fetch errors
      }
    }

    const mergedEvents = Array.from(allEventsMap.values());
    console.log(`Events API: Found ${mergedEvents.length} total events from all parents`);

    return NextResponse.json(mergedEvents);
  } catch (error) {
    return NextResponse.json({ error: `${error}` }, { status: 500 });
  }
}