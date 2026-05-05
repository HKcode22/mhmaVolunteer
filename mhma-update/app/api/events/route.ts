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
    // First try the requested parent ID
    let events = await fetchEventsWithMedia(requestedParentId);

    // If no events found, try other common parent IDs
    if (events.length === 0) {
      for (const parentId of EVENT_PARENT_IDS) {
        if (parentId.toString() !== requestedParentId) {
          events = await fetchEventsWithMedia(parentId.toString());
          if (events.length > 0) break;
        }
      }
    }

    // If still no events, try fetching all pages and filter by ACF event fields
    if (events.length === 0) {
      try {
        const response = await fetch(
          `${WP_API_URL}/wp/v2/pages?per_page=100`,
          { next: { revalidate: 60 } }
        );
        if (response.ok) {
          const allPages = await response.json();
          // Filter pages that have event ACF fields
          events = allPages.filter((page: any) =>
            page.acf?.event_date || page.acf?.event_poster || page.acf?.event_time
          );
        }
      } catch (e) {
        // Ignore fallback fetch errors
      }
    }

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: `${error}` }, { status: 500 });
  }
}