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
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Events API: Attempt ${attempt + 1}/${maxRetries + 1} for ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

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
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Events API: Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed after retries');
}

async function fetchEventsWithMedia(parentId: string) {
  try {
    const response = await fetchWithRetry(
      `${WP_API_URL}/wp/v2/pages?parent=${parentId}&per_page=100`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) return [];

    const events = await response.json();

    // Fetch media URLs for events with numeric poster IDs
    const eventsWithMedia = await Promise.all(
      events.map(async (event: any) => {
        if (event.acf?.event_poster && typeof event.acf.event_poster === 'number') {
          try {
            const mediaResponse = await fetch(`${WP_API_URL}/wp/v2/media/${event.acf.event_poster}`, {
              next: { revalidate: 300 }
            });
            if (mediaResponse.ok) {
              const media = await mediaResponse.json();
              return {
                ...event,
                acf: {
                  ...event.acf,
                  event_poster: media.source_url || media.guid?.rendered || "",
                },
              };
            }
          } catch (e) {
            // Ignore media fetch errors
          }
        }
        return event;
      })
    );

    return eventsWithMedia;
  } catch (error) {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedParentId = searchParams.get('parent') || '277';

  try {
    // Try ALL parent IDs and merge results (don't stop at first match)
    const allEventsMap = new Map();

    // Always try the requested parent first
    const requestedEvents = await fetchEventsWithMedia(requestedParentId);
    requestedEvents.forEach((event: any) => {
      if (event.id) allEventsMap.set(event.id, event);
    });

    // Then try all other parent IDs and merge
    for (const parentId of EVENT_PARENT_IDS) {
      if (parentId.toString() === requestedParentId) continue;
      const parentEvents = await fetchEventsWithMedia(parentId.toString());
      parentEvents.forEach((event: any) => {
        if (event.id) allEventsMap.set(event.id, event);
      });
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