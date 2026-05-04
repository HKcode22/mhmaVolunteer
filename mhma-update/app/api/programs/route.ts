import { NextRequest, NextResponse } from 'next/server';

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://mhma-update.local/wp-json';

// Common parent IDs to try for programs (different environments may have different IDs)
const PROGRAM_PARENT_IDS = [70, 71, 72, 69, 68, 100, 200];

async function fetchProgramsWithMedia(parentId: number) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `${WP_API_URL}/wp/v2/pages?parent=${parentId}&per_page=100`,
      { next: { revalidate: 60 }, signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) return [];

    const programs = await response.json();

    // Fetch media URLs for programs with numeric image IDs
    const programsWithMedia = await Promise.all(
      programs.map(async (program: any) => {
        if (program.acf?.program_image && typeof program.acf.program_image === 'number') {
          try {
            const mediaResponse = await fetch(`${WP_API_URL}/wp/v2/media/${program.acf.program_image}`, {
              next: { revalidate: 300 }
            });
            if (mediaResponse.ok) {
              const media = await mediaResponse.json();
              return {
                ...program,
                acf: {
                  ...program.acf,
                  program_image: media.source_url || media.guid?.rendered || "",
                },
              };
            }
          } catch (e) {
            // Ignore media fetch errors
          }
        }
        return program;
      })
    );

    return programsWithMedia;
  } catch (error) {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try common parent IDs
    let programs: any[] = [];

    for (const parentId of PROGRAM_PARENT_IDS) {
      programs = await fetchProgramsWithMedia(parentId);
      if (programs.length > 0) break;
    }

    // If still no programs, try fetching all pages and filter by ACF program fields
    if (programs.length === 0) {
      try {
        const response = await fetch(
          `${WP_API_URL}/wp/v2/pages?per_page=100`,
          { next: { revalidate: 60 } }
        );
        if (response.ok) {
          const allPages = await response.json();
          // Filter pages that have program ACF fields
          programs = allPages.filter((page: any) =>
            page.acf?.program_title || page.acf?.program_description || page.acf?.program_image
          );
        }
      } catch (e) {
        // Ignore fallback fetch errors
      }
    }

    return NextResponse.json(programs);
  } catch (error) {
    return NextResponse.json({ error: `${error}` }, { status: 500 });
  }
}