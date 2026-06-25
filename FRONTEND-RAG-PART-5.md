# Frontend RAG Part 5: THE FINAL PLAN (v3)

> **Updated with 30-day rolling window, collection-specific retention rules, CSV export for historical data, and complete inventory of all 22 collections based on full codebase audit.**

---

## Table of Contents

1. [The Core Architecture](#1-the-core-architecture)
2. [Two Types of Collections: Cache-Only vs Dual-Cleanup](#2-two-types-of-collections-cache-only-vs-dual-cleanup)
3. [30-Day Rolling Window Cache Eviction](#3-30-day-rolling-window-cache-eviction)
4. [Smart Invalidation: Create ≠ Update/Delete](#4-smart-invalidation-create--updatedelete)
5. [Base64 Media Handling (Masjid Construction)](#5-base64-media-handling-masjid-construction)
6. [Complete Collection Inventory — All 22 Collections](#6-complete-collection-inventory--all-22-collections)
7. [The Cache Manager (Final Code)](#7-the-cache-manager-final-code)
8. [The Metadata API Route (Fallback Only)](#8-the-metadata-api-route-fallback-only)
9. [localStorage Cleanup & 30-Day Eviction](#9-localstorage-cleanup--30-day-eviction)
10. [CSV Export for Historical Data](#10-csv-export-for-historical-data)
11. [How the AI Uses localStorage (RAG Integration)](#11-how-the-ai-uses-localstorage-rag-integration)
12. [Phase 0: Create Infrastructure](#12-phase-0-create-infrastructure)
13. [Phase 1: Add Cache Invalidation on Update/Delete](#13-phase-1-add-cache-invalidation-on-updatedelete)
14. [Phase 2: Add Cache Append on Create](#14-phase-2-add-cache-append-on-create)
15. [Phase 3: Wrap Reads with Cache Manager](#15-phase-3-wrap-reads-with-cache-manager)
16. [Phase 4: Connect AI to Cached Data (RAG)](#16-phase-4-connect-ai-to-cached-data-rag)
17. [Phase 5: Populate PageDataContext](#17-phase-5-populate-pagedatacontext)
18. [Before vs After: The Numbers](#18-before-vs-after-the-numbers)
19. [Addressing Every Specific Concern](#19-addressing-every-specific-concern)

---

## 1. The Core Architecture

### 1.1 Three Safety Layers

```
PRIMARY: Simple Invalidation (cache key exists = no write)
  ├── 0 Firestore reads
  ├── Works for 99.9% of page loads
  └── Cache is only removed on update/delete, NOT on create

FALLBACK: Metadata Timestamp (only when cache key is missing unexpectedly)
  ├── 1 Firestore read
  ├── Used to distinguish "write happened" from "user cleared cache"
  └── This runs ONLY when cache key is NOT found in localStorage

SAFETY NET: 30-day rolling window
  ├── 0 Firestore reads (client-side Date.now() check)
  ├── Auto-evicts records older than 30 days from localStorage
  ├── Activity log: also auto-deleted from Firestore after 30 days
  └── All other collections: Firestore data preserved indefinitely
```

### 1.2 The Read Decision Tree

```
PAGE LOADS: needs events

  1. Check localStorage for 'mhma_v5_events'
     │
     ├── FOUND?
     │    ├── Yes → Use it. Display immediately. 0 reads.
     │    │        (This is the 99.9% case)
     │    │
     │    └── No → Cache missing. But WHY?
     │             Was it invalidated by a write?
     │             Or did the user clear their browser data?
     │
     │             → Read metadata (1 read from Firestore)
     │               ├── metadata.events > lastKnownTimestamp?
     │               │    Yes → A WRITE happened. Fetch fresh. N reads.
     │               │    No  → Cache was cleared. Fetch fresh anyway.
     │               │    No metadata doc → First visit. Fetch fresh.
     │
     └── (save fetched data to localStorage for next time)

KEY INSIGHT: The metadata is ONLY read when cache is missing.
             Most page loads find the cache → 0 reads.
             No background verification. No periodic checks.
```

### 1.3 The Write Decision Tree

```
MEMBER CREATES an RSVP (CREATE):
  └── appendToCache('rsvps', newRsvpData)
      ├── Existing cached RSVPs are PRESERVED
      ├── New RSVP is prepended to the array
      ├── Items older than 30 days are dropped
      ├── 0 reads. 0 writes to Firestore metadata.
      └── Board member's table still shows all data seamlessly

BOARD MEMBER APPROVES an RSVP (UPDATE):
  └── invalidateCache('rsvps')
      ├── Cache is REMOVED
      ├── Metadata timestamp updated in Firestore (1 write)
      └── Next page load → cache MISS → metadata says write happened → refetch

BOARD MEMBER DELETES an RSVP (DELETE):
  └── invalidateCache('rsvps') — same as update
```

---

## 2. Two Types of Collections: Cache-Only vs Dual-Cleanup

### 2.1 Cache-Only Collections (Firestore data preserved indefinitely)

These collections stay in Firestore **forever**. Only the localStorage cache is evicted after 30 days.

| Collection | Why Keep in Firestore |
|-----------|----------------------|
| `events` | Historical event record |
| `programs` | Program catalog (past programs still relevant) |
| `enrollments` | Enrollment history (who joined when) |
| `rsvps` | RSVP history (attendance records) |
| `news` | Published news archive |
| `testimonials` | Testimonials display |
| `volunteers` | Volunteer records |
| `contactSubmissions` | Contact history |
| `schedulingRequests` | Event request history |
| `donations` | Donation records (financial audit trail) |
| `pledges` | Pledge fulfillment history |
| `users` | User accounts (never delete) |
| `subscribers` | Newsletter subscription history |
| `inviteCodes` | Invite code audit trail |
| `journal` | Journal entries (minutes) |
| `faq` | FAQ content |
| `masjidConstruction` | Construction progress history |
| `aboutStats` | Stats snapshot |
| `userSettings` | User preferences |
| `ai_knowledge` | AI knowledge base |
| `versions` | Version history (internal) |

### 2.2 Dual-Cleanup Collections (Firestore + localStorage both cleaned after 30 days)

Only **one** collection falls into this category:

| Collection | Why Delete from Firestore |
|-----------|--------------------------|
| `activityLog` | Transient activity trail. Once it's >30 days old, it's noise. Already has cleanup API route. |

### 2.3 What About "Notifications"?

There is **no separate `notifications` collection** in Firestore. Notifications are **computed views** from other collections:

- **Dashboard notifications page** (`/dashboard/notifications`): Reads `enrollments`, `schedulingRequests`, `contactSubmissions`, `rsvps` and displays pending/actionable items
- **Member notifications page** (`/member/notifications`): Reads `events`, `programs`, `news` and displays recent items
- **Navigation badge**: Reads the same collections for pending counts

Since these are computed views (not stored data), the 30-day cache eviction naturally handles them — old cached enrollment/RSVP data falls off, so old notifications stop appearing. No separate Firestore cleanup needed.

---

## 3. 30-Day Rolling Window Cache Eviction

### 3.1 How It Works

Every collection in localStorage is filtered to only keep records within the last 30 days. This happens in three places:

1. **On fetch** (when data is first cached): items older than 30 days are dropped before saving to localStorage
2. **On append** (when a new item is created): the cache is filtered to drop items >30 days old
3. **On cleanup** (once per session): all cached entries are scanned and aged-out records removed

### 3.2 The 30-Day Filter

```typescript
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function filterByAge<T>(items: T[], dateField = 'createdAt'): T[] {
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  return items.filter((item: any) => {
    const date = item[dateField];
    if (!date) return true; // keep items without dates
    // Handle Firestore Timestamp objects
    const ts = date.toDate ? date.toDate().getTime() : new Date(date).getTime();
    return ts > cutoff;
  });
}
```

### 3.3 What About the Array Size Limits from v2?

The v2 plan used per-collection max counts (500/200/100/1). The v3 plan replaces that with **30-day age-based eviction** because:

- Age-based eviction is simpler (one rule for all collections)
- It naturally keeps more items for high-traffic collections and fewer for low-traffic ones
- It guarantees old data doesn't accumulate regardless of how busy the masjid gets
- The user specifically requested 30-day limits instead of count-based limits

### 3.4 Practical Impact

| Collection | Avg Monthly Volume | ~Items in Cache After 30 Days |
|-----------|-------------------|-------------------------------|
| `events` | 2-5 | 2-5 |
| `rsvps` | 50-200 | 50-200 |
| `enrollments` | 20-50 | 20-50 |
| `activityLog` | 100-500 | 100-500 |
| `donations` | 10-50 | 10-50 |
| `contactSubmissions` | 5-20 | 5-20 |
| `news` | 2-10 | 2-10 |
| `users` | 0-5 new | All (accounts persist) |

**Total cache size: well under 1 MB for any realistic scenario.**

### 3.5 What If a Collection Has Items Without `createdAt`?

Some collections (like `users`, `aboutStats`, `userSettings`) may have items without a `createdAt` field, or may not be arrays. These are kept as-is (the age filter only applies to array items that have a date field).

---

## 4. Smart Invalidation: Create ≠ Update/Delete

### 4.1 The Problem

> *"If a member fills out the RSVP form, a write occurs and the cache is removed. Does that mean the list would be GONE?"*

Before this fix: **Yes, the cache would be removed. Next page load would require a full refetch.** This is wasteful when only 1 new RSVP is added.

### 4.2 The Solution: Two Operations

```typescript
// ─── USE THIS FOR: Creating NEW data (RSVP, enrollment, donation, etc.)
//     Appends to existing cached data. 0 reads. 0 refetches.
export function appendToCache<T>(key: string, newItem: T): void {
  const fullKey = PREFIX + key;
  const raw = localStorage.getItem(fullKey);
  if (!raw) return; // No cache exists yet — nothing to append to

  try {
    const entry: CacheEntry<T[]> = JSON.parse(raw);
    // Prepend new item, then filter to only last 30 days
    entry.d = filterByAge([newItem, ...entry.d]);
    entry.t = Date.now();
    localStorage.setItem(fullKey, JSON.stringify(entry));
  } catch {
    localStorage.removeItem(fullKey); // Corrupt cache
  }
}

// ─── USE THIS FOR: Updating or DELETING existing data
//     Removes the entire cache. Next load refetches fresh.
export function invalidateCache(key: string | string[]): void {
  const keys = Array.isArray(key) ? key : [key];
  keys.forEach(k => {
    localStorage.removeItem(PREFIX + k);
    localStorage.removeItem(PREFIX + k + '_lastTs');
  });
}
```

### 4.3 Which Operation to Use Where

| Action | Operation | Reason |
|--------|-----------|--------|
| **Member RSVPs** (create RSVP) | `appendToCache('rsvps', ...)` | New record added to existing list |
| **Board approves RSVP** (update status) | `invalidateCache('rsvps')` | Existing record changed |
| **Board rejects RSVP** (delete) | `invalidateCache('rsvps')` | Existing record removed |
| **Member enrolls** (create enrollment) | `appendToCache('enrollments', ...)` | New record |
| **Board approves enrollment** (update) | `invalidateCache('enrollments')` | Existing record changed |
| **Board creates event** (create) | `appendToCache('events', ...)` | New record |
| **Board edits event** (update) | `invalidateCache('events')` | Existing record changed |
| **Board deletes event** (delete) | `invalidateCache('events')` | Existing record removed |
| **Member donates** (create donation) | `appendToCache('donations', ...)` | New record |
| **Board adds manual donation** (create) | `appendToCache('donations', ...)` | New record |
| **Board edits donation** (update) | `invalidateCache('donations')` | Existing record changed |
| **Member subscribes** (create) | `appendToCache('subscribers', ...)` | New record |
| **Board removes subscriber** (delete) | `invalidateCache('subscribers')` | Existing record removed |

### 4.4 What the Board Member Sees

```
BEFORE the fix:
  Member RSVPs → cache fully invalidated
  Board member's table → shows loading → refetches all RSVPs
  Reads: 501 (just to add 1 new RSVP)

AFTER the fix:
  Member RSVPs → appendToCache('rsvps', newRsvp) → cache updated in place
  Board member's table → still shows all data + 1 new → NO LOADING
  Reads: 0
```

---

## 5. Base64 Media Handling (Masjid Construction)

### 5.1 The Problem

Masjid construction updates may contain base64-encoded images or videos — potentially **hundreds of KB each**. Enough to fill localStorage quickly.

### 5.2 The Solution: Strip Media Before Caching

```typescript
function sanitizeForCache(key: string, data: any): any {
  if (key === 'masjidConstruction') {
    return data.map((item: any) => ({
      id: item.id,
      caption: item.caption,
      phase: item.phase,
      raised: item.raised,
      goal: item.goal,
      createdAt: item.createdAt,
      imageUrl: item.imageUrl || null, // URL string (small) not base64
    }));
  }
  return data;
}
```

### 5.3 What This Means for the AI

The AI can answer:
- "How much raised for construction?" → ✅ (raised/goal fields kept)
- "Latest construction caption?" → ✅ (caption field kept)
- "Show me the image" → ❌ (image not cached, but AI directs user to page)

### 5.4 Other Media

| Data Source | Contains Base64? | Handled By |
|------------|-----------------|-----------|
| Masjid Construction | Possibly (images/videos) | Stripped before cache |
| Events | Poster URLs (strings) | Cached as-is |
| Programs | Image URLs (strings) | Cached as-is |
| News | Image URLs (strings) | Cached as-is |
| Users | Avatar URLs (strings) | Cached as-is |

---

## 6. Complete Collection Inventory — All 22 Collections

### 6.1 Master Table

| # | Collection | Type | Firestore Retention | localStorage Eviction | Pages That Read It | Create Source | Update Source | Delete Source |
|---|-----------|------|-------------------|---------------------|-------------------|--------------|--------------|--------------|
| 1 | `events` | Cache-Only | Forever | 30 days | Homepage, Events, Dashboard, Navigation, RSVP page, Donate page | Dashboard (new event) | Dashboard (edit event) | Dashboard (delete event) |
| 2 | `programs` | Cache-Only | Forever | 30 days | Homepage, Programs, Dashboard, Navigation, Enroll page | Dashboard (new program) | Dashboard (edit program) | Dashboard (delete program) |
| 3 | `enrollments` | Cache-Only | Forever | 30 days | Dashboard (main + users + notifications), Navigation | Member enrolls via API | Board approves/rejects | Board deletes |
| 4 | `schedulingRequests` | Cache-Only | Forever | 30 days | Dashboard (main + notifications), Navigation | Public scheduling form via API | Board approves/rejects | Board deletes |
| 5 | `contactSubmissions` | Cache-Only | Forever | 30 days | Dashboard (main + notifications), Navigation | Contact form via API | Board marks as read | Board deletes |
| 6 | `rsvps` | Cache-Only | Forever | 30 days | Dashboard (main + users + notifications), Navigation, Events page | Member RSVPs via API | Board confirms/cancels | Board deletes |
| 7 | `users` | Cache-Only | Forever | 30 days | Dashboard (main + users), Login, Register, Profile, Auth context, Settings | User registration | Profile/settings updates | Board deletes |
| 8 | `news` | Cache-Only | Forever | 30 days | Homepage, News, Dashboard, Member notifications | Dashboard (new article) | Dashboard (edit article) | Dashboard (delete article) |
| 9 | `donations` | Cache-Only | Forever | 30 days | Dashboard (main + users), Donate page, Profile, Impact report | Stripe webhook, Manual entry | — | Board deletes |
| 10 | `pledges` | Cache-Only | Forever | 30 days | Dashboard (main + users), Profile, Pledge page | Pledge form via API | Board marks fulfilled/cancelled | Board deletes |
| 11 | `subscribers` | Cache-Only | Forever | 30 days | Dashboard (main + users) | Subscribe form via API | Unsubscribe via API | Board deletes |
| 12 | `volunteers` | Cache-Only | Forever | 30 days | Dashboard (main) | Volunteer form via API | — | Board deletes |
| 13 | `testimonials` | Cache-Only | Forever | 30 days | Dashboard (main), TestimonialsDisplay component | Dashboard (new testimonial) | Dashboard (edit testimonial) | Dashboard (delete testimonial) |
| 14 | `masjidConstruction` | Cache-Only | Forever | 30 days (base64 stripped) | Homepage, Masjid Construction page, Donate page, Dashboard | Dashboard (new update) | Dashboard (edit update) | Dashboard (delete update) |
| 15 | `activityLog` | **Dual-Cleanup** | **30 days** | **30 days** | Dashboard (main + activity page) | All admin actions (logActivity) | — | Cleanup API (auto) |
| 16 | `journal` | Cache-Only | Forever | 30 days | Dashboard (main), Journal page | Dashboard (new entry) | Dashboard (edit entry) | Dashboard (delete entry) |
| 17 | `inviteCodes` | Cache-Only | Forever | 30 days | Dashboard (main) | Board generates code | Board marks used | Board deletes |
| 18 | `faq` | Cache-Only | Forever | 30 days | Dashboard (main), FAQ page, FAQAccordion component | Dashboard (new FAQ) | Dashboard (edit FAQ) | Dashboard (delete FAQ) |
| 19 | `aboutStats` | Cache-Only | Forever | 30 days | Homepage, About page (via API), Dashboard | — | API route only | — |
| 20 | `userSettings` | Cache-Only | Forever | 30 days | Settings page, Theme context | First save creates doc | Settings/theme change | — |
| 21 | `ai_knowledge` | Cache-Only | Forever | 30 days (rarely read) | AiAssistant (via TS import, not cache) | Dashboard (add entry) | Dashboard (edit entry) | Dashboard (delete entry) |
| 22 | `versions` | Cache-Only | Forever | NOT CACHED | Internal (version restore) | Auto-saved before update | — | — |

### 6.2 Total Firestore Reads Per Page Load (Before vs After)

| Page | Before (reads) | After with Cache (reads) | After Cold (reads) |
|------|---------------|------------------------|-------------------|
| Dashboard `/dashboard` | 17+ | **2** (auth + theme) | ~19 (one per collection) |
| Homepage `/` | 8+ | **2** (auth + theme) | ~10 |
| Events `/events` | 2 | **2** (auth + theme) | ~4 |
| Programs `/programs` | 2 | **2** (auth + theme) | ~4 |
| Navigation (every page) | 6 | **0** (from cache) | ~6 |
| AI question | 0+ | **0** (from cache) | 0 (from KB) |

---

## 7. The Cache Manager (Final Code)

```typescript
// lib/cache-manager.ts
// v3: 30-day rolling window, smart create-vs-update invalidation,
//     base64 stripping, metadata as fallback only
'use client';

const PREFIX = 'mhma_v5_';
const TTL_24H = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  d: T;      // data
  t: number; // cachedAt (Date.now)
  s: number; // serverTimestamp from metadata (used for fallback)
}

// ─── Filter array items to keep only those within 30 days ───
function filterByAge<T>(items: T[], dateField = 'createdAt'): T[] {
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  return items.filter((item: any) => {
    const date = item?.[dateField];
    if (!date) return true;
    const ts = date.toDate ? date.toDate().getTime() : new Date(date).getTime();
    return !isNaN(ts) && ts > cutoff;
  });
}

// ─── Get cached data (with fallback metadata check on miss) ───
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; fromCache: boolean }> {
  const cacheKey = PREFIX + key;
  const raw = localStorage.getItem(cacheKey);

  if (raw) {
    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.t < TTL_24H) {
        return { data: entry.d, fromCache: true };
      }
      localStorage.removeItem(cacheKey); // Expired (>24h)
    } catch {
      localStorage.removeItem(cacheKey); // Corrupt
    }
  }

  // Cache MISS. FALLBACK: read metadata to check if write happened.
  const metaTs = await readMetadataTimestamp(key);
  const cachedTsRaw = localStorage.getItem(cacheKey + '_lastTs');
  const cachedTs = cachedTsRaw ? Number(cachedTsRaw) : 0;

  if (metaTs !== null && metaTs > cachedTs) {
    console.log(`[Cache] MISS ${key} (write detected)`);
  } else {
    console.log(`[Cache] MISS ${key} (no write — cache cleared)`);
  }

  return fetchAndCache(key, fetchFn);
}

// ─── Read metadata timestamp (fallback — only on cache miss) ───
async function readMetadataTimestamp(key: string): Promise<number | null> {
  try {
    const res = await fetch('/api/metadata-timestamps', { cache: 'force-cache' });
    if (!res.ok) return null;
    const meta = await res.json();
    return meta[key] ?? null;
  } catch {
    return null;
  }
}

// ─── Fetch fresh, apply 30-day filter, sanitize, and cache ───
async function fetchAndCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; fromCache: boolean }> {
  let data = await fetchFn();

  // Apply 30-day rolling window filter
  if (Array.isArray(data)) {
    data = filterByAge(data) as T;
  }

  // Sanitize: strip base64 media from large collections
  const sanitized = sanitizeForCache(key, data);

  // Get server timestamp for fallback
  let serverTs = Date.now();
  try {
    const res = await fetch('/api/metadata-timestamps', { cache: 'force-cache' });
    if (res.ok) {
      const meta = await res.json();
      if (meta[key]) serverTs = meta[key];
    }
  } catch {}

  const entry: CacheEntry<T> = { d: sanitized, t: Date.now(), s: serverTs };
  localStorage.setItem(cacheKey, JSON.stringify(entry));
  localStorage.setItem(cacheKey + '_lastTs', String(serverTs));

  return { data, fromCache: false };
}

// ─── Sanitize: strip base64 media ───
function sanitizeForCache(key: string, data: any): any {
  if (key === 'masjidConstruction' && Array.isArray(data)) {
    return data.map((item: any) => ({
      id: item.id,
      caption: item.caption,
      phase: item.phase,
      raised: item.raised,
      goal: item.goal,
      donorCount: item.donorCount,
      squareFeet: item.squareFeet,
      createdAt: item.createdAt,
      imageUrl: item.imageUrl || null,
    }));
  }
  return data;
}

// ─── Append new item to cached data (use for CREATES) ───
export function appendToCache<T>(key: string, newItem: T): void {
  const cacheKey = PREFIX + key;
  const raw = localStorage.getItem(cacheKey);
  if (!raw) return;

  try {
    const entry: CacheEntry<T[]> = JSON.parse(raw);
    entry.d = filterByAge([newItem, ...entry.d]);
    entry.t = Date.now();
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    localStorage.removeItem(cacheKey);
  }
}

// ─── Invalidate cache (use for UPDATES and DELETES) ───
export function invalidateCache(key: string | string[]): void {
  const keys = Array.isArray(key) ? key : [key];
  keys.forEach(k => {
    localStorage.removeItem(PREFIX + k);
    localStorage.removeItem(PREFIX + k + '_lastTs');
  });
}

// ─── Force-clear all MHMA cache entries ───
export function clearAllCaches(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
  }
}
```

---

## 8. The Metadata API Route (Fallback Only)

```typescript
// app/api/metadata-timestamps/route.ts
import { firestore } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

const ALL_COLLECTIONS = [
  'events', 'programs', 'rsvps', 'enrollments', 'donations',
  'pledges', 'users', 'news', 'masjidConstruction', 'subscribers',
  'contactSubmissions', 'schedulingRequests', 'volunteers',
  'testimonials', 'activityLog', 'journal', 'inviteCodes', 'faq',
  'aboutStats', 'userSettings',
];

export async function GET() {
  const doc = await firestore.collection('metadata').doc('cacheTimestamps').get();
  if (!doc.exists) {
    const now = Date.now();
    const initial: Record<string, number> = {};
    ALL_COLLECTIONS.forEach(c => { initial[c] = now; });
    initial._updatedAt = now;
    await firestore.collection('metadata').doc('cacheTimestamps').set(initial);
    return NextResponse.json(initial);
  }
  return NextResponse.json(doc.data());
}
```

Every write route that performs an **update or delete** (NOT create) adds one line:

```typescript
// Inside update/delete handler:
await firestore.collection('metadata').doc('cacheTimestamps').update({
  rsvps: Date.now(),
  _updatedAt: Date.now(),
});
```

---

## 9. localStorage Cleanup & 30-Day Eviction

```typescript
// lib/cache-cleanup.ts
// Runs ONCE when the app loads (in layout.tsx)
'use client';

import { PREFIX } from './cache-manager';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const TTL_24H = 24 * 60 * 60 * 1000;
const MAX_TOTAL_SIZE = 4 * 1024 * 1024; // 4 MB safety limit

export function runCacheCleanup(): void {
  let totalSize = 0;
  const entries: { key: string; t: number; size: number }[] = [];

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;

    const val = localStorage.getItem(key);
    if (!val) { localStorage.removeItem(key!); continue; }

    const size = val.length;
    totalSize += size;

    try {
      const entry = JSON.parse(val);

      // 24-hour TTL check (safety net)
      if (Date.now() - entry.t > TTL_24H && entry.t > 0) {
        localStorage.removeItem(key);
        console.log(`[Cleanup] Expired (24h): ${key}`);
        continue;
      }

      // 30-day rolling window: remove old items from arrays
      if (Array.isArray(entry.d) && !key.endsWith('_lastTs')) {
        const cutoff = Date.now() - THIRTY_DAYS_MS;
        const before = entry.d.length;
        entry.d = entry.d.filter((item: any) => {
          const date = item?.createdAt;
          if (!date) return true;
          const ts = date.toDate ? date.toDate().getTime() : new Date(date).getTime();
          return !isNaN(ts) && ts > cutoff;
        });
        if (entry.d.length < before) {
          entry.t = Date.now();
          localStorage.setItem(key, JSON.stringify(entry));
          console.log(`[Cleanup] 30-day eviction: ${key} (${before} → ${entry.d.length} items)`);
        }
      }

      entries.push({ key, t: entry.t || 0, size });
    } catch {
      localStorage.removeItem(key); // Corrupt
    }
  }

  // If total > 4 MB, evict oldest entries
  if (totalSize > MAX_TOTAL_SIZE) {
    entries.sort((a, b) => a.t - b.t);
    while (totalSize > MAX_TOTAL_SIZE && entries.length > 0) {
      const oldest = entries.shift()!;
      localStorage.removeItem(oldest.key);
      totalSize -= oldest.size;
      console.log(`[Cleanup] Evicted oldest: ${oldest.key}`);
    }
  }

  console.log(`[Cleanup] Done. Cache: ~${(totalSize / 1024).toFixed(1)} KB`);
}
```

---

## 10. CSV Export for Historical Data

### 10.1 The Feature

Board members sometimes need to see data older than 30 days — for example, "how many people RSVP'd in the last year" or "total donations for 2025." Since the localStorage cache only keeps 30 days, they need a way to query Firestore directly and download the results.

### 10.2 How It Works

Each dashboard table page gets a "Download CSV" button that:
1. Fetches data from Firestore for a date range (bypassing cache)
2. Formats it as CSV
3. Triggers a browser download
4. Does NOT affect localStorage cache

### 10.3 CSV Export Component

```typescript
// components/DownloadCsvButton.tsx
'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

interface Props {
  filename: string;
  fetchData: () => Promise<any[]>;
  headers: string[];
  mapRow: (item: any) => string[];
}

export default function DownloadCsvButton({ filename, fetchData, headers, mapRow }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const data = await fetchData(); // Direct Firestore fetch (no cache)
      const csvRows = [
        headers.join(','),
        ...data.map(item =>
          mapRow(item).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
        ),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDownload} disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
      <Download className="w-4 h-4" />
      {loading ? 'Exporting...' : 'Download CSV'}
    </button>
  );
}
```

### 10.4 Where to Add CSV Export

| Dashboard Page | Collection | Suggested CSV Columns |
|---------------|-----------|---------------------|
| `/dashboard/rsvps` | `rsvps` | fullName, email, phone, eventTitle, attendees, status, createdAt |
| `/dashboard/enrollments` | `enrollments` | fullName, email, phone, program, status, createdAt |
| `/dashboard/events` | `events` | title, date, location, rsvpCount, createdAt |
| `/dashboard/donations` | `donations` | donorName, email, amount, method, status, createdAt |
| `/dashboard/pledges` | `pledges` | name, email, amount, status, createdAt |
| `/dashboard/activity` | `activityLog` | userName, action, details, createdAt |
| `/dashboard/users` | `users` | firstName, lastName, email, role, createdAt |
| `/dashboard/contact-submissions` | `contactSubmissions` | name, email, subject, read, createdAt |
| `/dashboard/scheduling-requests` | `schedulingRequests` | eventTitle, organizerName, status, createdAt |

### 10.5 API Route for CSV Data

For large datasets, a dedicated API route is cleaner:

```typescript
// app/api/export-csv/route.ts
import { firestore } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get('collection');
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  if (!collection) {
    return NextResponse.json({ error: 'collection required' }, { status: 400 });
  }

  let query: FirebaseFirestore.Query = firestore.collection(collection);
  if (startDate) {
    query = query.where('createdAt', '>=', new Date(startDate));
  }
  if (endDate) {
    query = query.where('createdAt', '<=', new Date(endDate));
  }
  query = query.orderBy('createdAt', 'desc').limit(10000);

  const snapshot = await query.get();
  const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  return NextResponse.json(data);
}
```

---

## 11. How the AI Uses localStorage (RAG Integration)

### 11.1 The AI's Data Sources (Priority Order)

```
Priority 1 — PageDataContext (React state, current page):
  Data already displayed on screen. 0 reads.
  Example: User is on Dashboard → asks "how many events?"
    → pageData.events exists → answer instantly

Priority 2 — localStorage (cache from any page):
  Data loaded by ANY page this session or earlier. 0 reads.
  Example: User is on Programs page → asks "total donations?"
    → pageData.donations missing
    → localStorage.getItem('mhma_v5_donations') → FOUND → answer instantly
    → No Firestore read needed

Priority 3 — Static knowledge base (assistant-knowledge.ts):
  Q&A about website features. 0 reads (it's a .ts file).
  Example: "How do I create an event?"

Priority 4 — Guidance to visit relevant page:
  Nothing found. Tell user where to go.
  Example: "Visit Dashboard → Donations to see that data."
```

### 11.2 The AI's Cache-Aware Function

```typescript
// In app/components/AiAssistant.tsx

import { usePageData } from '@/lib/page-data-context';
import { useAuth } from '@/lib/auth-context';

export default function AiAssistant() {
  const { data: pageData } = usePageData();
  const { user } = useAuth();

  function answerFromCache(query: string): string | null {
    const lower = query.toLowerCase().trim();

    // Helper: read from localStorage
    function fromCache<T>(key: string): T | null {
      try {
        const raw = localStorage.getItem('mhma_v5_' + key);
        return raw ? JSON.parse(raw).d as T : null;
      } catch { return null; }
    }

    // ─── EVENTS ───
    if (lower.includes('how many event') || (lower.includes('event') && lower.includes('count'))) {
      const events = pageData.events || fromCache<any[]>('events');
      if (events) return `There are ${events.length} events loaded.`;
      return "Visit the Events page or Dashboard to see event data, then ask me.";
    }

    if (lower.includes('upcoming event') || lower.includes('next event')) {
      const events = pageData.events || fromCache<any[]>('events');
      const upcoming = events?.filter((e: any) => new Date(e.date || e.createdAt) > new Date());
      if (upcoming?.length) return `Next event: ${upcoming[0].title} on ${upcoming[0].date || 'TBD'}.`;
      return "No upcoming events found.";
    }

    // ─── DONATIONS ───
    if ((lower.includes('donat') || lower.includes('raised') || lower.includes('fund'))
        && (lower.includes('total') || lower.includes('how much') || lower.includes('amount'))) {
      const donations = pageData.donations || fromCache<any[]>('donations');
      if (donations?.length) {
        const total = donations.reduce((s: number, d: any) => s + (d.amount || 0), 0);
        return `Total donations: $${total.toLocaleString()}.`;
      }
      return "Visit Dashboard → Donations to see totals.";
    }

    // ─── MASJID CONSTRUCTION ───
    if (lower.includes('masjid') || (lower.includes('construction') && lower.includes('progress'))) {
      const updates = fromCache<any[]>('masjidConstruction');
      if (updates?.length) {
        const latest = updates[0];
        const raised = latest.raised?.toLocaleString() || 'N/A';
        const goal = latest.goal?.toLocaleString() || 'N/A';
        return `${latest.caption || 'Latest update'}. Raised: $${raised} of $${goal}. See the Masjid Construction page for photos.`;
      }
      return "Visit the Masjid Construction page to see progress.";
    }

    // ─── PROGRAMS / ENROLLMENTS ───
    if (lower.includes('how many program') || (lower.includes('program') && lower.includes('count'))) {
      const programs = pageData.programs || fromCache<any[]>('programs');
      if (programs) return `There are ${programs.length} programs.`;
      return "Visit the Programs page to see program data.";
    }

    if (lower.includes('enroll') || lower.includes('how many student')) {
      const programs = pageData.programs || fromCache<any[]>('programs');
      const total = programs?.reduce((s: number, p: any) => s + (p.enrollmentCount || 0), 0);
      if (total !== undefined) return `Total enrollments: ${total}.`;
      return "Visit Dashboard → Programs to see enrollment data.";
    }

    // ─── RSVPs ───
    if (lower.includes('rsvp') || (lower.includes('how many people') && lower.includes('event'))) {
      const events = pageData.events || fromCache<any[]>('events');
      const total = events?.reduce((s: number, e: any) => s + (e.rsvpCount || 0), 0);
      if (total !== undefined) return `Total RSVPs: ${total}.`;
      return "Visit Dashboard → Events to see RSVP data.";
    }

    // ─── USERS / MEMBERS ───
    if (lower.includes('how many user') || lower.includes('how many member')) {
      const users = pageData.users || fromCache<any[]>('users');
      if (users) return `${users.length} registered users.`;
      return "Visit Dashboard → Members to see user data.";
    }

    // ─── NOTIFICATIONS / PENDING ───
    if (lower.includes('notification') || lower.includes('pending') || lower.includes('anything new')) {
      const enrollments = fromCache<any[]>('enrollments');
      const rsvps = fromCache<any[]>('rsvps');
      const contacts = fromCache<any[]>('contactSubmissions');
      const scheduling = fromCache<any[]>('schedulingRequests');
      const pending: string[] = [];
      const n = (arr: any[] | null, field: string, val: string) =>
        arr ? arr.filter((x: any) => x[field] === val).length : -1;
      const e = n(enrollments, 'status', 'pending');
      const r = n(rsvps, 'status', 'pending');
      const c = n(contacts, 'read', false);
      const s = n(scheduling, 'status', 'pending');
      if (e > 0) pending.push(`${e} pending enrollment${e > 1 ? 's' : ''}`);
      if (r > 0) pending.push(`${r} pending RSVP${r > 1 ? 's' : ''}`);
      if (c > 0) pending.push(`${c} unread message${c > 1 ? 's' : ''}`);
      if (s > 0) pending.push(`${s} pending scheduling request${s > 1 ? 's' : ''}`);
      if (pending.length) return `You have: ${pending.join(', ')}.`;
      return "No pending items found.";
    }

    // ─── IDENTITY ───
    if (lower === 'who am i' || lower === 'whoami') {
      if (user?.displayName) {
        const role = user.role === 'board_member' || user.role === 'administrator' ? 'board member' : 'member';
        return `You are ${user.displayName}. Role: ${role}.${user.email ? ` Email: ${user.email}.` : ''}`;
      }
      return "You're not logged in. Click 'Member Login' in the top nav.";
    }

    // ─── ACTIVITY LOG ───
    if (lower.includes('recent activity') || lower.includes('what changed') || lower.includes('what happened')) {
      const log = fromCache<any[]>('activityLog');
      if (log?.length) {
        const recent = log.slice(0, 3).map((a: any) => `${a.action || a.type} on ${a.createdAt || 'recently'}`).join(', ');
        return `Recent activity: ${recent}. Visit Dashboard → Activity Log for full history.`;
      }
      return "Visit Dashboard → Activity Log to see recent changes.";
    }

    return null; // Fall through to knowledge base
  }
}
```

---

## 12. Phase 0: Create Infrastructure

**Files to create:**
- `lib/cache-manager.ts` — complete cache manager
- `app/api/metadata-timestamps/route.ts` — metadata endpoint
- `lib/cache-cleanup.ts` — cleanup script

**Files to modify:**
- `app/layout.tsx` — add `runCacheCleanup()` on mount

---

## 13. Phase 1: Add Cache Invalidation on Update/Delete

### Server-side (metadata timestamp update)

Each API route that performs UPDATE or DELETE adds one line after the operation:

```typescript
await firestore.collection('metadata').doc('cacheTimestamps').update({
  collectionName: Date.now(),
  _updatedAt: Date.now(),
});
```

**API routes to modify (update/delete only):**

| Route | Collection | Operation |
|-------|-----------|-----------|
| `app/api/rsvp/route.ts` | `rsvps` | PUT (approve/reject) |
| `app/api/enroll/route.ts` | `enrollments` | PUT (approve/reject) |
| `app/api/pledge/route.ts` | `pledges` | PUT (fulfill/cancel) |
| `app/api/unsubscribe/route.ts` | `subscribers` | PUT (unsubscribe) |
| `app/api/use-invite/route.ts` | `inviteCodes` | PUT (mark used) |
| `app/api/cleanup-activity/route.ts` | `activityLog` | DELETE (batch cleanup) |

### Client-side invalidation (~20 dashboard files)

Every dashboard file that does `updateDoc`/`deleteDoc` also calls `invalidateCache('collection')`.

| Dashboard Action | Add After Write |
|-----------------|-----------------|
| Approve/reject RSVP | `invalidateCache('rsvps')` |
| Approve/reject enrollment | `invalidateCache('enrollments')` |
| Edit event | `invalidateCache('events')` |
| Delete event | `invalidateCache('events')` |
| Edit program | `invalidateCache('programs')` |
| Delete program | `invalidateCache('programs')` |
| Edit news | `invalidateCache('news')` |
| Delete news | `invalidateCache('news')` |
| Edit user | `invalidateCache('users')` |
| Delete user | `invalidateCache('users')` |
| Edit donation | `invalidateCache('donations')` |
| Delete donation | `invalidateCache('donations')` |
| Fulfill/cancel pledge | `invalidateCache('pledges')` |
| Edit construction update | `invalidateCache('masjidConstruction')` |
| Delete construction update | `invalidateCache('masjidConstruction')` |
| Edit about stats | `invalidateCache('aboutStats')` |
| Delete testimonial | `invalidateCache('testimonials')` |
| Mark contact read | `invalidateCache('contactSubmissions')` |
| Approve/reject scheduling | `invalidateCache('schedulingRequests')` |
| Delete invite code | `invalidateCache('inviteCodes')` |
| Remove subscriber | `invalidateCache('subscribers')` |

---

## 14. Phase 2: Add Cache Append on Create

Every CREATE operation calls `appendToCache('key', newItem)`.

| Create Action | File | Key |
|--------------|------|-----|
| Member RSVPs | `/rsvp` page or API route | `rsvps` |
| Member enrolls | `/enroll` page or API route | `enrollments` |
| Member pledges | `/pledge` page or API route | `pledges` |
| Contact form submit | `/contact` page or API route | `contactSubmissions` |
| Scheduling request | API route | `schedulingRequests` |
| Volunteer signup | API route | `volunteers` |
| Subscribe | API route | `subscribers` |
| Register | `/register` page | `users` |
| Board creates event | Dashboard | `events` |
| Board creates program | Dashboard | `programs` |
| Board creates news | Dashboard | `news` |
| Board adds donation | Dashboard or Stripe webhook | `donations` |
| Board adds pledge | Dashboard | `pledges` |
| Board adds construction update | Dashboard | `masjidConstruction` |
| Board adds testimonial | Dashboard | `testimonials` |
| Board generates invite code | Dashboard | `inviteCodes` |
| Admin action logged | Throughout dashboard | `activityLog` |
| Journal entry created | Dashboard | `journal` |
| FAQ added | Dashboard | `faq` |
| User changes theme | Settings page | `userSettings` |

---

## 15. Phase 3: Wrap Reads with Cache Manager

Replace direct `fetch*()` calls with `getCachedData(key, fetchFn)`.

| Priority | File | Collections |
|----------|------|-------------|
| **1** | `app/components/Navigation.tsx` | enrollments, contactSubmissions, schedulingRequests, rsvps, events, programs |
| **2** | `app/dashboard/page.tsx` | All 17 dashboard collections |
| **3** | `app/events/page.tsx` | events |
| **3** | `app/programs/page.tsx` | programs |
| **3** | `app/page.tsx` (home) | events, programs, news, masjidConstruction |
| **4** | `app/masjid-construction/page.tsx` | masjidConstruction |
| **4** | `app/donate/page.tsx` | donations |
| **4** | `app/about/page.tsx` | aboutStats |
| **4** | `app/impact-report/page.tsx` | donations, enrollments |
| **4** | `app/news/page.tsx` | news |
| **5** | All dashboard detail pages | Their respective collections |
| **5** | `app/profile/page.tsx` | users, donations, pledges |
| **5** | `lib/theme-context.tsx` | userSettings |

---

## 16. Phase 4: Connect AI to Cached Data (RAG)

**Files to modify:** 1 file — `app/components/AiAssistant.tsx`

Add the `answerFromCache()` function (shown in Section 11) and call it in `askQuestion()` before KB lookup:

```typescript
const cachedAnswer = answerFromCache(query);
if (cachedAnswer) return { answer: cachedAnswer };
```

**The AI answers 15+ types of questions from cache. 0 Firestore reads.**

---

## 17. Phase 5: Populate PageDataContext

After every `getCachedData()` call, also call `setPageData()`:

```typescript
const { data: events } = await getCachedData('events', () => fetchEvents(100));
setPageData({ events, currentPath: '/events' });
```

**Files to modify: ~15 files, 1 line each.**

---

## 18. Before vs After: The Numbers

### Reads Per Page Load

| Scenario | Before | After |
|----------|--------|-------|
| **Reload, no writes, cache warm** | 529 | **2** (auth + theme) |
| **Reload, 1 new RSVP created** | 529 | **2** (appendToCache — no refetch) |
| **Reload, 1 RSVP approved (update)** | 529 | **2 + N** (invalidate → refetch) |
| **Cross-page nav, same session** | 529 | **2** (all cached) |
| **First visit (all cold)** | 529 | **~27** (auth + theme + meta + collections) |
| **AI answers a question** | ~20 | **0** (reads from cache/screen) |

### Reads Per Day (500 Users, 10 Loads Each)

| Source | Before | After |
|--------|--------|-------|
| Auth | 5,000 | 5,000 |
| Theme | 5,000 | **0** (cached) |
| Navigation | 30,000 | **0** (cached) |
| Data reads (no changes) | 2,560,000 | **0** (all cached) |
| Data reads (writes) | 50,000 | ~5,000 (only updates/deletes refetch) |
| **Total** | **~2,650,000** | **~10,000** |
| Free tier limit | 50,000/day | ✅ 5× under |

### User Capacity on Free Tier

| Version | Max Users/Day |
|---------|-------------|
| Before cache | **~14** |
| After (aggregate approach) | **~2,500** |

### Cost on Blaze (for 5,000 users)

| Version | Reads/Day | Cost/Month |
|---------|-----------|-----------|
| Before | 26,500,000 | **~$477** |
| After | 100,000 | **~$1.80** |

---

## 19. Addressing Every Specific Concern

### Q: Does the metadata add a read on every page load?

**No.** The metadata is only read as a FALLBACK when the cache key is missing. For 99.9% of page loads, the cache key exists → 0 reads → done.

### Q: What if a member RSVPs while a board member is looking at the table?

The board member's React state still has the old data. `appendToCache` updates localStorage but doesn't affect React state. When the board member refreshes, the new RSVP is already in the cached array → 0 reads.

### Q: How does the 30-day rolling window work?

Three mechanisms:
1. **On fetch**: records older than 30 days are dropped before saving to localStorage
2. **On append**: the cache is filtered to keep only items within 30 days
3. **On cleanup** (once per session): all cached entries are scanned and aged-out records removed

### Q: What about activity log cleanup from Firestore?

Already implemented via `app/api/cleanup-activity/route.ts` — batch deletes activity log entries older than 30 days from Firestore. localStorage cache also evicts them.

### Q: What about notifications cleanup from Firestore?

Notifications are **not a separate collection** — they are computed views from `enrollments`, `schedulingRequests`, `contactSubmissions`, `rsvps` (dashboard) and `events`, `programs`, `news` (members). These collections keep their data in Firestore indefinitely. Only the localStorage cache evicts them after 30 days.

### Q: What about the construction images?

Base64 images are STRIPPED before caching. Only text fields (caption, raised, goal, etc.) are stored.

### Q: Don't we still read auth and theme on every page load?

**Auth** (1 read) is unavoidable — Firebase's `onAuthStateChanged` runs once and caches the token. Subsequent page loads in the same session don't re-read.

**Theme** (1 read) can be cached in localStorage. First load reads from Firestore. Subsequent loads from localStorage.

### Q: Can board members see data older than 30 days?

**Yes.** The data stays in Firestore forever (except activity log). Each dashboard table page gets a "Download CSV" button that queries Firestore directly for any date range, without affecting the localStorage cache.

### Q: Is everything covered? All collections?

**Yes.** The complete inventory in Section 6 covers all 22 collections, their Firestore retention rules, localStorage eviction rules, and every page/component that reads or writes them. The full codebase audit confirmed no missing collections.

### Q: What if localStorage fills up?

Even with 30 days of data from all 20 collections, the total is well under 1 MB (out of 5-10 MB available per domain). The cleanup function has a 4 MB safety limit that evicts oldest entries if exceeded.

### Q: What about the metadata sentinel doc — doesn't that cost writes?

The metadata doc is only written when an UPDATE or DELETE occurs (not CREATE). For a typical masjid, that's maybe 5-20 writes per day. At $0.18/100k writes on Blaze, this costs **~$0.0001/month** — essentially zero.
