import { NextRequest, NextResponse } from 'next/server';

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://mhma-update.local/wp-json';

export async function GET(request: NextRequest) {
  try {
    console.log('Test API: Calling WordPress...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `${WP_API_URL}/wp/v2/pages?parent=277&per_page=2`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    console.log('Test API: Response status:', response.status);
    const text = await response.text();
    console.log('Test API: Response length:', text.length);
    
    return NextResponse.json({ 
      status: response.status,
      length: text.length,
      preview: text.substring(0, 200)
    });
  } catch (error: any) {
    console.error('Test API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
