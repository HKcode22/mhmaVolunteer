// lib/wordpress.ts - Headless WordPress GraphQL utility
// This file provides robust fetch functions to query the WordPress GraphQL API

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/graphql";

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic for flaky Oracle backend
 * Retries up to 3 times with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt + 1}/${maxRetries + 1} to ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        console.log(`Fetch succeeded on attempt ${attempt + 1}`);
        return response;
      }

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Fetch attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
        console.log(`Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      }
    }
  }

  throw lastError || new Error("Failed after retries");
}

/**
 * Generic GraphQL fetch function for WordPress
 * @param query - GraphQL query string
 * @param variables - Optional variables for the query
 * @returns Promise with the data or null on error
 */
export async function fetchGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T | null> {
  try {
    const response = await fetchWithRetry(WP_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      // Cache for 5 minutes to avoid hammering WordPress
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.warn(`WPGraphQL fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json();

    if (json.errors) {
      console.warn("WPGraphQL errors:", json.errors);
      return null;
    }

    return json.data as T;
  } catch (error) {
    console.warn("Failed to fetch from WordPress:", error);
    return null;
  }
}

// Types for MHMA Management ACF fields
// Field names match the GraphQL schema (camelCase)
export interface MHMASiteManagement {
  homeHeroText?: string;
  urgentAnnouncement?: string;
  fajr?: string;
  zuhr?: string;
  asr?: string;
  magribh?: string;
  isha?: string;
  activitiesList?: string;
}

/**
 * Fetch MHMA Site Management ACF fields
 * Tries multiple GraphQL queries in order of preference
 */
export async function fetchMHMAManagement(): Promise<MHMASiteManagement | null> {
  // Query the Homepage (/) which has the Site Management ACF fields
  const query = `
    query GetSiteManagement {
      page(id: "cG9zdDoyNA==", idType: ID) {
        id
        title
        mhmaManagement {
          homeHeroText
          urgentAnnouncement
          fajr
          zuhr
          asr
          magribh
          isha
          activitiesList
        }
      }
    }
  `;

  const data = await fetchGraphQL<{
    page: {
      mhmaManagement: MHMASiteManagement;
    }
  }>(query);

  return data?.page?.mhmaManagement || null;
}

// Types for WordPress Posts (Activities)
export interface WordPressPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  uri: string;
}

/**
 * Fetch WordPress Posts for Activities section
 * Returns posts sorted by date (newest first)
 */
export async function fetchActivitiesPosts(limit: number = 10): Promise<WordPressPost[]> {
  const query = `
    query GetActivitiesPosts($limit: Int!) {
      posts(first: $limit, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          title
          excerpt
          date
          uri
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  `;

  const data = await fetchGraphQL<{ posts: { nodes: WordPressPost[] } }>(query, { limit });
  return data?.posts?.nodes || [];
}

// Types for WordPress Events (pages with Event Details ACF)
export interface WordPressEvent {
  id: number;
  title: { rendered: string };
  acf: {
    event_poster?: string;
    event_date?: string;
    event_time?: string;
    event_location?: string;
    event_rsvp_link?: string;
    event_description?: string;
    event_name?: string;
  };
}

/**
 * Fetch WordPress Events from REST API (children of homepage)
 * Uses Next.js API route proxy to avoid CORS issues
 * Also fetches media URLs for event posters
 */
export async function fetchEvents(parentId: number = 277): Promise<WordPressEvent[]> {
  try {
    // Use Next.js API route proxy instead of direct WordPress call
    const timestamp = Date.now();
    const response = await fetch(`/api/events?parent=${parentId}&_=${timestamp}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Failed to fetch events: ${response.status}`);
      return [];
    }

    const events: WordPressEvent[] = await response.json();
    return events || [];
  } catch (error) {
    console.warn("Failed to fetch events:", error);
    return [];
  }
}

// Types for Programs
export interface WordPressProgram {
  id: number;
  title: { rendered: string };
  slug: string;
  acf?: {
    program_title?: string;
    program_description?: string;
    program_image?: string | number;
  };
}

/**
 * Fetch WordPress Programs from REST API
 * Uses Next.js API route proxy to avoid CORS issues
 */
export async function fetchPrograms(limit: number = 6): Promise<WordPressProgram[]> {
  try {
    const timestamp = Date.now();
    const response = await fetch(`/api/programs?_=${timestamp}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Failed to fetch programs: ${response.status}`);
      return [];
    }

    const programs: WordPressProgram[] = await response.json();
    return (programs || []).slice(0, limit);
  } catch (error) {
    console.warn("Failed to fetch programs:", error);
    return [];
  }
}

// Types for Journal entries
export interface WordPressJournalEntry {
  id: number;
  title: { rendered: string };
  slug: string;
  acf?: {
    journal_title?: string;
    date_published?: string;
    content?: string;
  };
  meta?: {
    journal_title?: string;
    date_published?: string;
    journal_content?: string;
  };
  content?: { rendered: string };
}

/**
 * Fetch WordPress Journal entries from REST API
 * Uses Next.js API route proxy to avoid CORS issues
 */
export async function fetchJournalEntries(limit: number = 3): Promise<WordPressJournalEntry[]> {
  try {
    const timestamp = Date.now();
    const response = await fetch(`/api/journal?_=${timestamp}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Failed to fetch journal entries: ${response.status}`);
      return [];
    }

    const entries: WordPressJournalEntry[] = await response.json();
    return (entries || []).slice(0, limit);
  } catch (error) {
    console.warn("Failed to fetch journal entries:", error);
    return [];
  }
}

/**
 * Utility hook data fetcher for client components
 * This is used for client-side data fetching with fallback
 */
export function useWordPressData<T>(
  fetcher: () => Promise<T | null>,
  defaultValue: T
): { data: T; loading: boolean; error: boolean } {
  // This is a placeholder for client-side fetching logic
  // In practice, you'd use React hooks here, but since this is a utility file,
  // we export the fetcher functions for use in useEffect hooks
  return { data: defaultValue, loading: false, error: false };
}
