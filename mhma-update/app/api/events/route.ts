import { NextRequest, NextResponse } from 'next/server';

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://mhma-update.local/wp-json';

// Common parent IDs to try for events (different environments may have different IDs)
const EVENT_PARENT_IDS = [277, 152, 276, 278, 100, 200];

async function fetchEventsWithMedia(parentId: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `${WP_API_URL}/wp/v2/pages?parent=${parentId}&per_page=100`,
      { next: { revalidate: 60 }, signal: controller.signal }
    );
    clearTimeout(timeout);

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