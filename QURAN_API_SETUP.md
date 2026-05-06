# Quran Foundation API Setup Guide

## Is the API Free?

Yes, the Quran Foundation API is **free to use**. However, you need to register your application to get API credentials (Client ID and Client Secret). This is for security and rate limiting purposes, not for payment.

## How to Get Access

1. Go to https://quran.foundation
2. Scroll down to the "Quran Foundation API Portal" section
3. Click the **"Request Access"** button
4. Fill out the request form with:
   - Your name
   - Email address
   - Project description (e.g., "MHMA website - displaying random Quranic verses")
   - Your website URL
5. Submit the request

## Approval Process

The Quran Foundation team will review your request and approve it. This may take a few days. Once approved, you'll receive:
- **Client ID**: Your application's unique identifier
- **Client Secret**: Your application's secret key

## Current Status

**The current implementation already works perfectly** with:
- ✅ Arabic text display
- ✅ English translation
- ✅ 24-hour caching (refreshes daily)
- ✅ Beautiful formatting
- ✅ No API credentials needed

The fallback verses I implemented include authentic Quranic verses with Arabic and English. You can use this indefinitely without needing API access.

## When to Request API Access

Request API access if you want:
- Random verses from the entire Quran (6,236 verses)
- Multiple translation options
- Audio recitations
- More advanced features

For basic daily verse display, the current implementation is sufficient.

## Step 3: Add Credentials to Environment Variables

Add these to your `.env.local` file:

```env
QURAN_API_CLIENT_ID=your_client_id_here
QURAN_API_CLIENT_SECRET=your_client_secret_here
```

## Step 4: Update the Code

Once you have the credentials, update `/app/page.tsx` to implement the actual API call:

```typescript
const fetchQuranVerse = async (): Promise<QuranVerse> => {
  try {
    const clientId = process.env.NEXT_PUBLIC_QURAN_API_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_QURAN_API_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Quran API credentials not configured");
    }

    // Step 1: Get OAuth2 token
    const tokenResponse = await fetch('https://api.quran.foundation/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'content',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get OAuth2 token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Fetch random verse
    const verseResponse = await fetch('https://api.quran.foundation/content/api/v4/verses/random', {
      headers: {
        'x-auth-token': accessToken,
        'x-client-id': clientId,
      },
    });

    if (!verseResponse.ok) {
      throw new Error('Failed to fetch verse');
    }

    const verseData = await verseResponse.json();

    return {
      text: verseData.verse.text_uthmani || '',
      translation: verseData.verse.translations?.[0]?.text || '',
      reference: `[Quran, ${verseData.verse.chapter_id}:${verseData.verse.verse_number}]`,
      arabic: verseData.verse.text_uthmani || '',
    };
  } catch (error) {
    console.error("Error fetching Quran verse:", error);
    // Return fallback verse on error
    return {
      text: "And hold fast by the covenant of Allah all together and be not disunited",
      translation: "And hold fast by the covenant of Allah all together and be not disunited",
      reference: "[Quran, 3:103]",
      arabic: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا"
    };
  }
};
```

## Current Implementation

The current implementation uses:
- **Fallback verses** with Arabic text and English translation
- **24-hour caching** via localStorage
- **Loading states** for better UX
- **Graceful fallback** if API fails

Once you provide the credentials, I can replace the fallback implementation with the actual API calls.

## Features

- ✅ 24-hour cache (verse refreshes daily)
- ✅ Arabic text display (right-to-left)
- ✅ English translation
- ✅ Beautiful formatting
- ✅ Loading states
- ✅ Error handling with fallback
- ⏳ Actual API integration (waiting for credentials)

## Notes

- The Quran Foundation API is free but requires registration
- OAuth2 tokens are valid for a limited time (typically 1 hour)
- The current implementation caches verses for 24 hours to reduce API calls
- Arabic text is displayed with proper RTL (right-to-left) direction
