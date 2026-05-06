import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://mhma-update.local/wp-json';

// Common parent IDs to try for programs (different environments may have different IDs)
// Reduced list to prevent overwhelming Oracle backend
const PROGRAM_PARENT_IDS = [70, 71, 72];

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
      console.log(`Programs API: Attempt ${attempt + 1}/${maxRetries + 1} for ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        console.log(`Programs API: Success on attempt ${attempt + 1}`);
        return response;
      }

      // Don't retry on 4xx errors
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.warn(`Programs API: Attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : String(error));

      if (attempt < maxRetries) {
        const backoffMs = Math.min(500 * Math.pow(2, attempt), 3000);
        console.log(`Programs API: Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed after retries');
}

async function fetchPrograms(parentId: number) {
  try {
    const response = await fetchWithRetry(
      `${WP_API_URL}/wp/v2/pages?parent=${parentId}&per_page=100`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) return [];

    const programs = await response.json();
    // Return raw programs WITHOUT concurrent media fetching (prevents Oracle crash)
    return programs;
  } catch (error) {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try ALL parent IDs and merge results (sequential to avoid Oracle crash)
    const allProgramsMap = new Map();

    for (const parentId of PROGRAM_PARENT_IDS) {
      const programs = await fetchPrograms(parentId);
      programs.forEach((program: any) => {
        if (program.id) allProgramsMap.set(program.id, program);
      });
    }

    // If still no programs, try fetching all pages and filter by ACF program fields
    if (allProgramsMap.size === 0) {
      try {
        const response = await fetch(
          `${WP_API_URL}/wp/v2/pages?per_page=100`,
          { next: { revalidate: 60 } }
        );
        if (response.ok) {
          const allPages = await response.json();
          // Filter pages that have program ACF fields
          const programs = allPages.filter((page: any) =>
            page.acf?.program_title || page.acf?.program_description || page.acf?.program_image
          );
          programs.forEach((program: any) => {
            if (program.id) allProgramsMap.set(program.id, program);
          });
        }
      } catch (e) {
        // Ignore fallback fetch errors
      }
    }

    const mergedPrograms = Array.from(allProgramsMap.values());
    console.log(`Programs API: Found ${mergedPrograms.length} total programs from all parents`);
    return NextResponse.json(mergedPrograms);
  } catch (error) {
    return NextResponse.json({ error: `${error}` }, { status: 500 });
  }
}