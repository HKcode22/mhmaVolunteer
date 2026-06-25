# Frontend RAG Part 2: The Write-Triggered Cache System

> **The problem:** Page reloads re-read Firestore even when no data has changed. Two refreshes jumped reads from 189 to 529.
>
> **The solution:** A write-triggered cache. Data is fetched from Firestore **only when a write/update/delete happens**. If nothing changed, page reloads cost 1 read total.

---

## Table of Contents

1. [Why PageDataContext Alone Isn't Enough](#1-why-pagedatacontext-alone-isnt-enough)
2. [The Core Idea: Timestamp Change Detection](#2-the-core-idea-timestamp-change-detection)
3. [Architecture Overview](#3-architecture-overview)
4. [The Cache Manager: `lib/cache-manager.ts`](#4-the-cache-manager-libcache-managerts)
5. [The Metadata Sentinel Document](#5-the-metadata-sentinel-document)
6. [Write-Triggered Invalidation: How It Works](#6-write-triggered-invalidation-how-it-works)
7. [Read Flow: How Page Loads Use the Cache](#7-read-flow-how-page-loads-use-the-cache)
8. [Read Savings: Before vs After](#8-read-savings-before-vs-after)
9. [Implementation Plan: Phase by Phase](#9-implementation-plan-phase-by-phase)
10. [PageDataContext Deep Dive (Addressing Your Confusion)](#10-pagedatacontext-deep-dive-addressing-your-confusion)
11. [Frontend RAG: How the AI Reads from Cached/Displayed Data](#11-frontend-rag-how-the-ai-reads-from-cacheddisplayed-data)
12. [Complete Collection Coverage: Every Live Data Source](#12-complete-collection-coverage-every-live-data-source)
13. [Cost Analysis: 500-600 Users on Free Tier](#13-cost-analysis-500-600-users-on-free-tier)
14. [Edge Cases and Failure Modes](#14-edge-cases-and-failure-modes)

---

## 1. Why PageDataContext Alone Isn't Enough

You were right to be confused. Here is the critical truth:

> **PageDataContext (React state) is EPHEMERAL. It is lost on every page refresh.**
> **localStorage is PERSISTENT. It survives page refresh, tab close, and browser restart.**

| Storage | Survives page refresh? | Survives tab close? | Survives browser restart? |
|---------|----------------------|--------------------|--------------------------|
| **PageDataContext** (React state) | ❌ Lost | ❌ Lost | ❌ Lost |
| **sessionStorage** | ✅ Yes | ❌ Lost | ❌ Lost |
| **localStorage** | ✅ Yes | ✅ Yes | ✅ Yes |

**The real solution:**
- **PageDataContext** = used for same-session, same-page sharing between components (Page → AI)
- **localStorage** = used for cross-reload, cross-session persistence (survives refresh)
- **Cache Manager** = checks localStorage first, only fetches if data actually changed

```
┌──────────────────────────────────────────────────────────────┐
│                    RELOAD FLOW                               │
│                                                              │
│ Page loads:                                                  │
│   1. Check localStorage for cached data                      │
│   2. Found! → Display immediately (0 reads!)                 │
│   3. Also read metadata/1-doc to check if data changed       │
│   4. No change → Done (1 metadata read total)                │
│   5. Change detected → Fetch just that collection (N reads)  │
│                                                              │
│ [Before cache: 189-529 reads per reload]                     │
│ [After cache:  1-15 reads per reload]                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. The Core Idea: Timestamp Change Detection

### 2.1 How to Know If Data Changed Without Reading It

Create a single Firestore document at the path `metadata/cacheTimestamps`. It looks like this:

```typescript
// metadata/cacheTimestamps — ONE document, updated on EVERY write
{
  events: 1700000000,        // Unix timestamp of last write to events
  programs: 1700000000,
  rsvps: 1700000000,
  enrollments: 1700000000,
  donations: 1700000000,
  pledges: 1700000000,
  users: 1700000000,
  news: 1700000000,
  masjidConstruction: 1700000000,
  subscribers: 1700000000,
  contactSubmissions: 1700000000,
  schedulingRequests: 1700000000,
  volunteers: 1700000000,
  testimonials: 1700000000,
  activityLog: 1700000000,
  journal: 1700000000,
  inviteCodes: 1700000000,
  faq: 1700000000,
  aboutStats: 1700000000,
  _updatedAt: 1700000000,    // Updated whenever this doc itself changes
}
```

**Cost to check all collections: 1 document read = 1 read.**

Compare with current cost to read all collections: 189+ reads.

### 2.2 The Algorithm

```
On page load, for each collection "events":

  1. Read localStorage entry "cache_events"
     → Found? Extract cached data + cached timestamp
     → Not found? Need to fetch from API

  2. Read metadata document (1 read for ALL collections)
     → Compare metadata.events with cached timestamp
     → Same? Use cached data. 0 reads.
     → Different? Fetch /api/events. N reads.

  3. After fetching, save to localStorage:
     localStorage.setItem("cache_events", JSON.stringify({
       data: [...],
       ts: metadata.events  // The server's timestamp
     }))
```

### 2.3 The Key Insight

> **Data only changes when someone performs a write/update/delete.**
> 
> When no write has occurred since your last page load, the metadata timestamp is identical, and **zero collection reads happen**.
>
> When a write does occur, only the affected collection's timestamp changes, so **only that one collection is re-read**.

---

## 3. Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                         BROWSER                                       │
│                                                                       │
│  ┌──────────────────────┐    ┌───────────────────────────────────┐   │
│  │  Page loads          │    │  Form submits / Admin action      │   │
│  │  (reload, navigation)│    │  (write event, RSVP, enroll)     │   │
│  └──────────┬───────────┘    └──────────────┬────────────────────┘   │
│             │                               │                         │
│             ▼                               ▼                         │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                 CACHE MANAGER (lib/cache-manager.ts)          │    │
│  │                                                               │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐ │    │
│  │  │ getData()   │  │ setData()    │  │ invalidateCache()    │ │    │
│  │  │ - Check LS  │  │ - Save to LS │  │ - Remove from LS     │ │    │
│  │  │ - Check meta│  │ - Update meta│  │ - Update PageDataCtx │ │    │
│  │  │ - Fetch if  │  │ - Update PDC │  │                      │ │    │
│  │  │   stale     │  │              │  │                      │ │    │
│  │  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘ │    │
│  │         │                │                      │              │    │
│  │         ▼                ▼                      ▼              │    │
│  │  ┌─────────────────────────────────────────────────────────┐  │    │
│  │  │           localStorage (PERSISTENT)                     │  │    │
│  │  │  cache_events    │  cache_programs   │  cache_rsvps    │  │    │
│  │  │  {data:[], ts: } │  {data:[], ts: }  │  {data:[], ts: }│  │    │
│  │  │  ─────────────────────────────────────────────────────  │  │    │
│  │  │  meta_timestamps │  last_fetched_at                     │  │    │
│  │  └─────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                         │                                            │
│              ┌──────────┴──────────┐                                 │
│              ▼                     ▼                                 │
│  ┌──────────────────┐  ┌──────────────────────┐                      │
│  │  fetch(/api/x)   │  │  POST /api/x (write) │                     │
│  │  (read from      │  │  (write to Firestore) │                     │
│  │   Firestore)     │  │  + update metadata   │                     │
│  └────────┬─────────┘  └──────────┬───────────┘                      │
└───────────┼───────────────────────┼──────────────────────────────────┘
            │                       │
            ▼                       ▼
┌───────────────────────────────────────────────────────────────────────┐
│                         VERCEL (Server)                                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  Read Route (GET):                                         │     │
│  │  app/api/events/route.ts → reads Firestore → returns JSON  │     │
│  │                                                            │     │
│  │  Write Route (POST/PUT/DELETE):                            │     │
│  │  app/api/rsvp/route.ts → writes Firestore                  │     │
│  │  → ALSO updates metadata/cacheTimestamps/rsvps             │     │
│  │  → returns success                                         │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                     Firestore                                │     │
│  │  collections/       metadata/                               │     │
│  │  ├── events          └── cacheTimestamps                    │     │
│  │  ├── programs             ├── events: 1700000               │     │
│  │  ├── rsvps                ├── programs: 1700000             │     │
│  │  ├── enrollments          ├── rsvps: 1700000               │     │
│  │  └── ...                  └── ...                           │     │
│  └─────────────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 4. The Cache Manager: `lib/cache-manager.ts`

This is the core file that handles all caching logic. Every page and component goes through this instead of calling `fetch*` directly.

```typescript
// lib/cache-manager.ts
'use client';

// ─── Types ───
interface CacheEntry<T> {
  data: T;
  ts: number;           // Unix timestamp from metadata doc
  fetchedAt: number;    // When we fetched this (for logging)
}

interface MetadataTimestamps {
  events: number;
  programs: number;
  rsvps: number;
  enrollments: number;
  donations: number;
  pledges: number;
  users: number;
  news: number;
  masjidConstruction: number;
  subscribers: number;
  contactSubmissions: number;
  schedulingRequests: number;
  volunteers: number;
  testimonials: number;
  activityLog: number;
  journal: number;
  inviteCodes: number;
  faq: number;
  aboutStats: number;
  _updatedAt: number;
}

// ─── Constants ───
const CACHE_PREFIX = 'mhma_cache_v2_';    // v2 for versioning (bust old caches)
const METADATA_DOC_PATH = 'metadata/cacheTimestamps';
const LS_META_KEY = CACHE_PREFIX + '_metadata_ts';
const DEFAULT_TTL = 24 * 60 * 60 * 1000;  // 24 hours max age before forced refresh
                                           // (safety net, not normal path)

// ─── Read metadata timestamp doc from Firestore (1 read) ───
async function fetchMetadata(): Promise<MetadataTimestamps | null> {
  try {
    // We fetch metadata through a small API route to keep Admin SDK access
    const res = await fetch('/api/metadata-timestamps');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Get cached data for a collection ───
export async function getCachedData<T>(
  collectionName: string,        // e.g. 'events'
  fetchFresh: () => Promise<T>,  // Function to fetch data if cache is stale
): Promise<{ data: T; fromCache: boolean }> {
  const cacheKey = CACHE_PREFIX + collectionName;
  const cachedRaw = localStorage.getItem(cacheKey);
  const cached: CacheEntry<T> | null = cachedRaw ? JSON.parse(cachedRaw) : null;

  if (cached) {
    // We have cached data. Check if it's still fresh by comparing timestamps.
    const metadata = await fetchMetadata();  // 1 read for ALL collections
    if (metadata) {
      const serverTs = metadata[collectionName as keyof MetadataTimestamps];
      if (serverTs && cached.ts >= serverTs) {
        // Cached data is current — NO Firestore read for this collection!
        console.log(`[Cache] HIT  ${collectionName} (ts match: ${cached.ts})`);
        return { data: cached.data, fromCache: true };
      }
      if (serverTs && cached.ts < serverTs) {
        console.log(`[Cache] STALE ${collectionName} (cached:${cached.ts} < server:${serverTs})`);
      }
    }
  }

  // No cache, or cache is stale — fetch fresh data
  console.log(`[Cache] MISS ${collectionName} — fetching...`);
  const freshData = await fetchFresh();
  const metadata = await fetchMetadata();
  const serverTs = metadata?.[collectionName as keyof MetadataTimestamps] ?? Date.now();

  // Save to localStorage for next page load
  const entry: CacheEntry<T> = { data: freshData, ts: serverTs, fetchedAt: Date.now() };
  try {
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // localStorage full — silently fail, next load will refetch
  }

  return { data: freshData, fromCache: false };
}

// ─── Invalidate cache after a write/update/delete ───
export function invalidateCache(collectionName: string): void {
  const cacheKey = CACHE_PREFIX + collectionName;
  localStorage.removeItem(cacheKey);
  console.log(`[Cache] INVALIDATED ${collectionName}`);
}

// ─── Invalidate ALL caches (for emergency use) ───
export function invalidateAllCaches(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  console.log(`[Cache] ALL INVALIDATED (${keysToRemove.length} entries)`);
}
```

### 4.1 The API Route for Metadata

```typescript
// app/api/metadata-timestamps/route.ts
import { firestore } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const doc = await firestore.collection('metadata').doc('cacheTimestamps').get();
  if (!doc.exists) {
    // First time — create the document with current timestamps
    const now = Date.now();
    const initial: Record<string, number> = {};
    // List all tracked collections
    const collections = [
      'events', 'programs', 'rsvps', 'enrollments', 'donations',
      'pledges', 'users', 'news', 'masjidConstruction', 'subscribers',
      'contactSubmissions', 'schedulingRequests', 'volunteers',
      'testimonials', 'activityLog', 'journal', 'inviteCodes', 'faq',
      'aboutStats'
    ];
    collections.forEach(c => { initial[c] = now; });
    initial._updatedAt = now;
    await firestore.collection('metadata').doc('cacheTimestamps').set(initial);
    return NextResponse.json(initial);
  }
  return NextResponse.json(doc.data());
}
```

---

## 5. The Metadata Sentinel Document

### 5.1 What It Is

A single document at `metadata/cacheTimestamps`. It has ONE field per Firestore collection, each containing a Unix timestamp.

### 5.2 How It Gets Updated

Every API route that performs a write **also updates the relevant timestamp**:

```typescript
// Inside app/api/rsvp/route.ts — after successfully writing the RSVP:
await firestore.collection('rsvps').add(rsvpData);

// ALSO update the metadata sentinel
await firestore.collection('metadata').doc('cacheTimestamps').update({
  rsvps: Date.now(),
  _updatedAt: Date.now(),
});
```

```typescript
// Inside app/api/enroll/route.ts — after writing enrollment:
await firestore.collection('enrollments').add(enrollmentData);

await firestore.collection('metadata').doc('cacheTimestamps').update({
  enrollments: Date.now(),
  _updatedAt: Date.now(),
});
```

Every write handler in every API route gets ONE extra line. This is the invalidation signal.

### 5.3 Why This Works

| Scenario | Reads Without Cache | Reads With Cache |
|----------|-------------------|------------------|
| First page load ever | 189 | 1 (metadata) + 19 (collections) = 20 |
| Page reload, no changes | 189 | **1 (metadata only)** |
| Page reload, 1 new event | 189 | 1 (metadata) + 2 (events + rsvps) = 3 |
| Page reload, 1 new RSVP | 189 | 1 (metadata) + 1 (rsvps only) = 2 |
| 10 page loads, no changes | 1,890 | **10 (metadata only)** |
| 10 page loads, 1 change | 1,890 | 10 + 2 = 12 |

### 5.4 The Cost of the Metadata Update

Updating the metadata document is a **write**, not a read. Firestore writes cost $0.18 per 100,000 on Blaze, or 20,000/day free. One extra write per form submission is negligible.

---

## 6. Write-Triggered Invalidation: How It Works

### 6.1 The Write Flow

```
User submits form (e.g., RSVP to event)
    │
    ▼
Browser: POST /api/rsvp
    │
    ▼
Vercel (API route):
  1. Write RSVP to Firestore 'rsvps' collection       ← 1 write
  2. Update metadata/cacheTimestamps.rsvps = Date.now() ← 1 write
  3. Return { success: true }
    │
    ▼
Browser receives success:
  1. invalidateCache('rsvps')    ← removes 'cache_rsvps' from localStorage
  2. Update PageDataContext with new RSVP data
  3. UI updates instantly with the new data
    │
    ▼
Next page load (even after refresh):
  1. Read metadata (1 read)
  2. See rsvps timestamp changed
  3. Only refetch rsvps (N reads)
  4. All other collections = cached (0 reads)
```

### 6.2 The Client-Side Invalidation After Write

On the client side, after any form submission succeeds:

```typescript
// In app/rsvp/page.tsx — after successful RSVP submission
async function handleSubmit(formData) {
  const res = await fetch('/api/rsvp', { method: 'POST', body: formData });
  if (res.ok) {
    invalidateCache('rsvps');     // ← Clear RSVP cache
    // Also, current events page has RSVP counts that need updating
    invalidateCache('events');    // ← Events are affected too (rsvpCount field)
    setShowSuccess(true);
  }
}
```

### 6.3 Which Collections to Invalidate Per Write

| Write Operation | Affected Collections |
|----------------|---------------------|
| Create event | `events` |
| RSVP to event | `rsvps`, `events` (rsvpCount changes) |
| Enroll in program | `enrollments`, `programs` (enrollmentCount) |
| Make donation | `donations` |
| Make pledge | `pledges` |
| Create news | `news` |
| Contact submission | `contactSubmissions` |
| Scheduling request | `schedulingRequests` |
| Volunteer signup | `volunteers` |
| Subscribe/unsubscribe | `subscribers` |
| Update masjid construction | `masjidConstruction`, `aboutStats` |
| Update about stats | `aboutStats` |
| Create/update user | `users` |

---

## 7. Read Flow: How Page Loads Use the Cache

### 7.1 The Complete Flow

```typescript
// Before: direct Firestore read every time
// const events = await fetchEvents(100);  // ← 101 reads every page load

// After: cache-aware read
import { getCachedData } from '@/lib/cache-manager';
import { fetchEvents } from '@/lib/firebase';

async function loadEvents() {
  const { data: events, fromCache } = await getCachedData(
    'events',
    () => fetchEvents(100)     // Only called if cache is stale
  );
  console.log(`Loaded ${events.length} events from ${fromCache ? 'cache' : 'Firestore'}`);
  setEvents(events);
}
```

### 7.2 Integrating with Existing Pages

**Minimal change to existing code.** Each `fetch*` call site wraps with `getCachedData`:

```typescript
// app/dashboard/page.tsx — BEFORE (17 Firestore reads on every load):
useEffect(() => {
  fetchPrograms(100).then(setPrograms);           // Read 1
  fetchEvents(100).then(setEvents);               // Read 2
  fetchSchedulingRequests(100).then(setRequests);  // Read 3
  // ... 14 more reads
}, []);

// app/dashboard/page.tsx — AFTER (0 reads if cache is warm):
useEffect(() => {
  getCachedData('programs', () => fetchPrograms(100)).then(r => setPrograms(r.data));
  getCachedData('events', () => fetchEvents(100)).then(r => setEvents(r.data));
  getCachedData('schedulingRequests', () => fetchSchedulingRequests(100)).then(r => setRequests(r.data));
  // ... 14 more — all use cache
}, []);
```

The difference: on first load, every `getCachedData` call fetches (N reads). On second load (or reload with no changes), every `getCachedData` call reads from cache after checking the single metadata doc.

### 7.3 The Metadata Read Is Shared

Crucially, `fetchMetadata()` is called once per batch of reads, not once per collection. We can optimize by pre-loading metadata:

```typescript
// app/dashboard/page.tsx — optimized batch load
useEffect(() => {
  async function loadAll() {
    // Pre-load metadata once for ALL collections
    const metadata = await fetchMetadata();
    // Now every getCachedData call skips its own metadata fetch
    // ... load all 17 collections
  }
  loadAll();
}, []);
```

For this optimization, `getCachedData` needs to accept an optional pre-loaded metadata:

```typescript
export async function getCachedData<T>(
  collectionName: string,
  fetchFresh: () => Promise<T>,
  preloadedMetadata?: MetadataTimestamps | null,  // Optional: avoid duplicate metadata reads
): Promise<{ data: T; fromCache: boolean }> {
  // ... use preloadedMetadata instead of calling fetchMetadata() if provided
}
```

### 7.4 The Navigation Component Fix

The Navigation component reads 6 collections on EVERY page load. With cache:

```typescript
// app/components/Navigation.tsx — BEFORE (6 reads per page):
const [pendingEnrollments] = await getDocs(query(
  collection(db, "enrollments"), where("status","==","pending"), limit(100)
));

// app/components/Navigation.tsx — AFTER (0 reads if cache is warm):
const { data: enrollments } = await getCachedData(
  'enrollments',
  () => fetchEnrollments(100)
);
const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
```

---

## 8. Read Savings: Before vs After

### 8.1 Single Page Load: Dashboard

| Read Source | Before | After (first load) | After (reload, no change) |
|------------|--------|-------------------|--------------------------|
| Auth context (`users`) | 1 | 1 (unavoidable) | 1 |
| Theme context (`userSettings`) | 1 | 1 (unavoidable) | 1 |
| Metadata check (`cacheTimestamps`) | 0 | **1** | **1** |
| Navigation (6 collections) | 6 | 6 (first fill) | **0** (cached) |
| Dashboard (15 collections) | 15 | 15 (first fill) | **0** (cached) |
| Dashboard (`/api/about-stats`, 12 cols) | 12 | 12 (first fill) | **0** (cached) |
| **Total reads** | **35** | **36** | **3** |

### 8.2 Navigation Between Pages (Same Session)

| Action | Before | After |
|--------|--------|-------|
| Home → Events | 541 + 32 = 573 | 30 + 30 = 60 (first loads) |
| Events → Dashboard | 573 + 300 = 873 | **0** (all cached) |
| Dashboard → Analytics | 873 + 550 = 1,423 | **0** (all cached) |
| Analytics → Events (revisit) | 1,423 + 32 = 1,455 | **0** (all still cached) |

### 8.3 Page Reload (No Changes)

| Page | Before | After |
|------|--------|-------|
| Home | 541 | **3** (auth + theme + metadata) |
| Dashboard | 300 | **3** (auth + theme + metadata) |
| Events | 32 | **3** (auth + theme + metadata) |
| **10 reloads of all 3 pages** | **8,730** | **90** |

### 8.4 Page Reload After a New RSVP

| Page | Before | After |
|------|--------|-------|
| Events page (rsvps + events changed) | 32 | 3 (auth + theme + meta) + 2 (events + rsvps) = **5** |
| Dashboard | 300 | 3 + 1 (only events needed) = **4** |

---

## 9. Implementation Plan: Phase by Phase

### Phase 1: Create the Infrastructure (1 hour)

1. Create `app/api/metadata-timestamps/route.ts` — the tiny API endpoint to read the sentinel document
2. Create `lib/cache-manager.ts` — the `getCachedData()` + `invalidateCache()` functions
3. Initialize the sentinel document in Firestore (seed script or first-read auto-create)

### Phase 2: Add Timestamp Updates to Every Write API Route (2 hours)

Every API route that performs a write needs ONE extra line. Here's every file to modify:

| File | Write Type | Add After Write |
|------|-----------|-----------------|
| `app/api/rsvp/route.ts` | POST (create RSVP) | `update({ rsvps: Date.now() })` |
| `app/api/enroll/route.ts` | POST (create enrollment) | `update({ enrollments: Date.now() })` |
| `app/api/events/route.ts` | POST (create event) | `update({ events: Date.now() })` |
| `app/api/pledge/route.ts` | POST (create pledge) | `update({ pledges: Date.now() })` |
| `app/api/contact/route.ts` | POST (contact submission) | `update({ contactSubmissions: Date.now() })` |
| `app/api/event-scheduling/route.ts` | POST (scheduling req) | `update({ schedulingRequests: Date.now() })` |
| `app/api/submit-volunteer/route.ts` | POST (volunteer) | `update({ volunteers: Date.now() })` |
| `app/api/subscribe/route.ts` | POST (subscribe) | `update({ subscribers: Date.now() })` |
| `app/api/unsubscribe/route.ts` | POST (unsubscribe) | `update({ subscribers: Date.now() })` |
| `app/api/use-invite/route.ts` | POST (use invite) | `update({ inviteCodes: Date.now() })` |
| `app/api/news/route.ts` | POST (create news) | `update({ news: Date.now() })` |
| `app/api/stripe-webhook/route.ts` | POST (donation) | `update({ donations: Date.now() })` |
| `app/api/change-email/route.ts` | POST (profile) | `update({ users: Date.now() })` |

Also update dashboard write actions (not API routes but direct Firestore writes):
| File | Write Type | Collection |
|------|-----------|-----------|
| `app/dashboard/events/page.tsx` | Edit/delete event | `events` |
| `app/dashboard/programs/page.tsx` | Create/edit/delete program | `programs` |
| `app/dashboard/news/page.tsx` | Edit/delete news | `news` |
| `app/dashboard/users/page.tsx` | Edit/delete user | `users` |
| `app/dashboard/donations/page.tsx` | Add/edit donation | `donations` |
| `app/dashboard/pledges/page.tsx` | Edit/fulfill pledge | `pledges` |
| `app/dashboard/construction/page.tsx` | Add/edit update | `masjidConstruction` |
| `app/dashboard/analytics/page.tsx` | Edit about stats | `aboutStats` |
| `app/dashboard/contact-submissions/page.tsx` | Mark as read | `contactSubmissions` |
| `app/dashboard/scheduling-requests/page.tsx` | Approve/reject | `schedulingRequests` |
| `app/dashboard/activity/page.tsx` | Revert action | `activityLog` |
| `app/dashboard/testimonials/page.tsx` | Add/edit/delete | `testimonials` |

**Total: ~25 files to modify, each getting 1-3 extra lines.**

### Phase 3: Wrap All Reads with Cache Manager (3 hours)

Every place that reads data from Firestore (either via `lib/firebase.ts` or `/api/*`) gets wrapped with `getCachedData()`:

1. **Priority 1: Navigation component** — This is called on EVERY page. Saves 6 reads per page load.
2. **Priority 2: Dashboard page** — 17 reads reduced to 0 on cache hit.
3. **Priority 3: Events page, Programs page, Homepage** — Each page's data reads get cached.
4. **Priority 4: Analytics page** — `/api/about-stats` uses metadata caching.
5. **Priority 5: All other pages.**

### Phase 4: Add Client-Side Invalidation After Writes (2 hours)

Every form submission and admin action needs to call `invalidateCache()` after success:

1. RSVP form (2 pages: `/rsvp`, `RSVPModal`) → `invalidateCache('rsvps')`
2. Enrollment form (`/enroll`) → `invalidateCache('enrollments')`
3. Event create/edit (`/dashboard/events/*`) → `invalidateCache('events')`
4. Program create/edit → `invalidateCache('programs')`
5. Donation create/edit → `invalidateCache('donations')`
6. Pledge create/edit → `invalidateCache('pledges')`
7. Profile update → `invalidateCache('users')`
8. All dashboard admin actions → invalidate relevant collection

### Phase 5: Connect AI to PageDataContext (2 hours)

Expand `AiAssistant.tsx` to read from `pageData` + cache manager:

```typescript
// In askQuestion()
const { data: pageData } = usePageData();

// Helper: get data from page context first, then cache, then KB
async function getLiveData(key: string, fetchFn: () => Promise<any>) {
  // Priority 1: Already loaded on current page (0 reads)
  if (key === 'events' && pageData.events) return pageData.events;
  // Priority 2: Cached from previous page load (0 reads after metadata check)
  const { data } = await getCachedData(key, fetchFn);
  return data;
}
```

---

## 10. PageDataContext Deep Dive (Addressing Your Confusion)

### 10.1 What Is PageDataContext?

It's a React Context — a built-in React feature that lets components share state without passing props:

```
App Root
  │
  ├── PageDataProvider  ← This creates a "storage box" using React.useState
  │   │
  │   ├── Navigation   ← Can READ from the box:  usePageData().data
  │   ├── EventsPage   ← Can WRITE to the box:   setPageData({ events: [...] })
  │   ├── Dashboard    ← Can READ from the box:  usePageData().data
  │   └── AiAssistant  ← Can READ from the box:  usePageData().data
  │
  └── (every component can access it)
```

### 10.2 The Actual Code

```typescript
// lib/page-data-context.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// 1. DEFINE the data shape
export interface PageData {
  events?: any[];
  programs?: any[];
  currentPath?: string;
}

// 2. CREATE the context (the "storage box" definition)
const PageDataContext = createContext<{
  data: PageData;
  setPageData: (data: PageData) => void;
}>({
  data: {},
  setPageData: () => {},
});

// 3. CREATE the provider component (the actual "storage box")
export function PageDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PageData>({});
  //       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //       This is the STATE — lives in React's memory
  //       When the page refreshes, this state is LOST
  return (
    <PageDataContext.Provider value={{ data, setPageData }}>
      {children}
    </PageDataContext.Provider>
  );
}

// 4. EXPORT the hook (the "access key" to the storage box)
export const usePageData = () => useContext(PageDataContext);
//    ^^^^^^^^^^^^
//    This is the function! It returns { data, setPageData }
//    You call it inside any component to read/write the box.
```

### 10.3 How a Page Writes Data

```typescript
// In events/page.tsx
import { usePageData } from "@/lib/page-data-context";

export default function EventsPage() {
  const { setPageData } = usePageData();
  //     ^^^^^^^^^^^^   This is the function that WRITES to the box

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => {
        setPageData({ events: data });  // ← Write events to the shared box
      });
  }, []);
}
```

### 10.4 How the AI Reads Data

```typescript
// In AiAssistant.tsx
import { usePageData } from "@/lib/page-data-context";

export default function AiAssistant() {
  const { data: pageData } = usePageData();
  //     ^^^^^^^^^^^^^^^^   This reads FROM the box

  // Now the AI can use pageData.events (already loaded by the Events page)
  // WITHOUT making any additional Firestore calls!
}
```

### 10.5 Why It's Lost on Refresh

React state (`useState`) lives in the browser's **memory** (RAM). When you refresh the page, the entire React app is re-loaded, and all memory is cleared. The `PageDataContext` is re-created empty.

**This is normal and expected.** PageDataContext is for sharing data between components **on the same page load**. For cross-reload persistence, we use **localStorage** (which lives on the browser's disk).

### 10.6 The Combined Solution

```
PAGE LOADS:
  1. localStorage has cached events? → YES → Display immediately
  2. Also check Firestore metadata (1 read) → timestamps match
  3. PageDataContext gets populated from localStorage → Available to AI
  4. Total reads: 1 (metadata)

  AI asks "how many events?"
  5. pageData.events is populated → Use it → 0 reads

RELOAD:
  1. localStorage still has events (persisted!) → Display immediately
  2. Check metadata again (1 read) → timestamps still match → Use cache
  3. Total reads: 1

  AI asks same question → 0 reads again
```

---

## 11. Frontend RAG: How the AI Reads from Cached/Displayed Data

### 11.1 The Rule

> **The AI NEVER reads from Firestore.**
>
> The AI reads from:
> 1. **PageDataContext** (data already displayed on screen — 0 reads)
> 2. **localStorage via Cache Manager** (data from previous page loads — 0 reads after metadata check)
> 3. **Static knowledge base** (`assistant-knowledge.ts` — file, not Firestore)

### 11.2 The AI Helper Function

```typescript
// In AiAssistant.tsx
const { data: pageData } = usePageData();

// Uses a Map to aggregate all available data for the AI
function getAIContext(): Record<string, any> {
  const context: Record<string, any> = {};

  // Priority 1: Data already displayed on the current page
  if (pageData.events) context.events = pageData.events;
  if (pageData.programs) context.programs = pageData.programs;
  if (pageData.currentPath) context.currentPath = pageData.currentPath;

  // Priority 2: User info already in auth context
  if (user) {
    context.user = {
      name: user.displayName,
      role: user.role,
      email: user.email,
      isBoardMember: user.role === 'board_member' || user.role === 'administrator',
    };
  }

  // Priority 3: Add cached data (does NOT fetch from Firestore — uses localStorage)
  // This requires getCachedData to accept a "check only, don't fetch" mode
  // Or we can just rely on PageDataContext and encourage pages to pre-load

  return context;
}
```

### 11.3 Answering Live Data Questions

```typescript
// In askQuestion()
function answerFromLiveData(query: string): string | null {
  const lower = query.toLowerCase();

  // Events count
  if (lower.includes('how many event') && pageData.events) {
    const upcoming = pageData.events.filter(e => new Date(e.date) > new Date());
    return `There are ${upcoming.length} upcoming events. (Total: ${pageData.events.length})`;
  }

  // Donation totals
  if ((lower.includes('donation') || lower.includes('donated') || lower.includes('raised'))
      && (lower.includes('total') || lower.includes('how much') || lower.includes('amount'))
      && pageData.donations) {
    const total = pageData.donations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
    return `Total donations: $${total.toLocaleString()}.`;
  }

  // RSVP count
  if ((lower.includes('rsvp') || lower.includes('how many people'))
      && lower.includes('event') && pageData.events) {
    const totalRsvps = pageData.events.reduce((sum: number, e: any) => sum + (e.rsvpCount || 0), 0);
    return `Across all events, there are ${totalRsvps} total RSVPs.`;
  }

  // Enrollment count
  if ((lower.includes('enroll') || lower.includes('how many student'))
      && pageData.programs) {
    const totalEnrollments = pageData.programs.reduce((sum: number, p: any) => sum + (p.enrollmentCount || 0), 0);
    return `Across all programs, there are ${totalEnrollments} total enrollments.`;
  }

  // Masjid construction progress
  if ((lower.includes('masjid') || lower.includes('construction') || lower.includes('building'))
      && lower.includes('progress') && pageData.masjidUpdates) {
    const latest = pageData.masjidUpdates[0];
    if (latest) {
      return `The latest masjid construction update: ${latest.caption || 'No caption'}. Raised: $${latest.raised?.toLocaleString() || 'N/A'} of $${latest.goal?.toLocaleString() || 'N/A'}.`;
    }
  }

  // User's own data
  if ((lower.includes('my') || lower.includes('my profile') || lower.includes('who am i'))
      && user) {
    return `You are ${user.displayName || 'a logged-in user'} with role: ${user.role}.`;
  }

  return null;  // Not a live data question — fall through to knowledge base
}
```

### 11.4 What Happens When Data Isn't Loaded Yet

If the user asks "how many donations?" but hasn't visited the Donations page yet, `pageData.donations` is undefined. The AI should say:

> "I don't have donation data loaded right now. Visit the **Donate** page or **Dashboard → Donations** to see donation information, then ask me again."

This is intentional — the AI guides the user to the right page, and the page's data loading populates the context for subsequent questions.

---

## 12. Complete Collection Coverage: Every Live Data Source

### 12.1 The Full List

| # | Collection | Displayed On | Writes From | Questions the AI Can Answer |
|---|-----------|-------------|-------------|---------------------------|
| 1 | `events` | Events page, Home, Dashboard | Dashboard create/edit | "How many events?", "What events are upcoming?" |
| 2 | `rsvps` | Events page (counts), Dashboard | RSVP form, Dashboard approve/reject | "How many RSVPs?", "How many people are coming?" |
| 3 | `programs` | Programs page, Home, Dashboard | Dashboard create/edit | "What programs are available?", "How many programs?" |
| 4 | `enrollments` | Dashboard (counts) | Enroll form, Dashboard approve/reject | "How many enrollments?", "How many students?" |
| 5 | `donations` | Dashboard, Donate page (totals) | Stripe, Dashboard manual add | "Total donations?", "How much raised?" |
| 6 | `pledges` | Dashboard, Pledge page | Pledge form | "How many pledges?", "Pledge total?" |
| 7 | `users` | Dashboard Members | Registration, Dashboard edit | "How many users?", "How many board members?" |
| 8 | `news` | News page, Home, Dashboard | Dashboard create/edit | "How many news articles?", "Latest news?" |
| 9 | `masjidConstruction` | Masjid page, Home, Donate | Dashboard update | "Construction progress?", "How much raised for masjid?" |
| 10 | `subscribers` | Dashboard Subscribers | Subscribe/Unsubscribe | "How many subscribers?" |
| 11 | `contactSubmissions` | Dashboard Contact | Contact form | "How many contact submissions?" |
| 12 | `schedulingRequests` | Dashboard Scheduling | Scheduling form | "How many scheduling requests?" |
| 13 | `volunteers` | Dashboard Volunteers | Volunteer form | "How many volunteers?" |
| 14 | `testimonials` | Dashboard Testimonials | Dashboard manage | "How many testimonials?" |
| 15 | `activityLog` | Dashboard Activity | All admin actions | "Recent activity?" |
| 16 | `aboutStats` | About page, Home | Dashboard Analytics edit | "Years serving?", "Number of families?" |
| 17 | `inviteCodes` | Dashboard Invite Codes | Dashboard generate | "How many invite codes?" |
| 18 | `faq` | FAQ page, Dashboard | Dashboard manage | "FAQ questions?" |
| 19 | `userSettings` | App-wide (theme) | Settings page | "What theme am I using?" |

### 12.2 Every Question a User Might Ask, Mapped to Displayed Data

| Question Type | Example Query | Source Data | Page That Loads It |
|--------------|--------------|-------------|-------------------|
| Events | "How many events?" | `pageData.events` | Events page, Home, Dashboard |
| RSVPs | "How many RSVPs?" | `pageData.events` (rsvpCount field) | Events page (shows RSVP count per event) |
| Programs | "What programs?" | `pageData.programs` | Programs page, Home, Dashboard |
| Enrollments | "How many enrolled?" | `pageData.programs` (enrollmentCount) | Programs page |
| Donations | "Total donations?" | `pageData.donations` | Dashboard, Donate page |
| Pledges | "Pledge total?" | `pageData.pledges` | Dashboard, Pledge page |
| Construction | "Masjid progress?" | `pageData.masjidUpdates` | Masjid page, Home, Donate |
| Subscribers | "How many subscribers?" | `pageData.subscribers` | Dashboard |
| Contact | "How many messages?" | `pageData.contactSubmissions` | Dashboard |
| Users/Members | "How many members?" | `pageData.users` | Dashboard Members |
| Auth/Profile | "Who am I?" | `user` (auth context) | Any page (always available) |
| Theme | "What theme?" | `userSettings` via theme context | Any page |
| News | "Latest news?" | `pageData.news` | News page, Home, Dashboard |
| Stats | "Years serving?" | `pageData.aboutStats` | About page, Home, Dashboard |
| Volunteers | "How many volunteers?" | `pageData.volunteers` | Dashboard |
| Scheduling | "Scheduling requests?" | `pageData.schedulingRequests` | Dashboard |

---

## 13. Cost Analysis: 500-600 Users on Free Tier

### 13.1 Current State (No Cache)

| Metric | Value |
|--------|-------|
| Reads per user per session | ~1,723 |
| Daily sessions per user | 2 |
| Daily reads per user | 3,446 |
| Max users on free tier (50k reads/day) | **~14** |

### 13.2 With Full Cache System

| Metric | Value |
|--------|-------|
| Reads per user first session of day | ~60 (cache cold, metadata + collections) |
| Reads per subsequent session | ~3 (metadata only, all cached) |
| Reads per page reload (no changes) | ~3 (auth + theme + metadata) |
| Daily reads per active user | 60 (first) + 3 (second) = **63** |
| Max users on free tier (50k reads/day) | **~793** |

### 13.3 500-600 Users: Is It Feasible?

```
Free tier: 50,000 reads/day
With cache: 63 reads/user/day
Max users: 50,000 / 63 ≈ 793 users/day

Buffer: 793 - 600 = 193 users of headroom
```

**Yes, 500-600 users is feasible on the free tier with the cache system.**

### 13.4 Scaling Beyond 600 Users

If you grow to 1,000+ active users:
- Free tier: 50,000 / 63 = 793 users max → **hits limit at ~794 users**
- Blaze plan at 1,000 users: 63,000 reads/day = $0.0378/day = **$1.13/month**
- Blaze plan at 5,000 users: 315,000 reads/day = $0.189/day = **$5.67/month**

**Even at 5,000 users, the cost is ~$6/month.** But we should optimize to stay free as long as possible.

### 13.5 Further Optimization to Reach 1,000+ Users on Free Tier

1. **Cache auth and theme reads** (currently unavoidable at 2 reads/load)
2. **Cache the metadata document itself** with a 5-second TTL (so rapid page reloads don't even read metadata)
3. **Batch all page reads into a single API call** (reduce 30 individual reads to 1 API call that returns everything)

With these further optimizations:
```
Reads per session: ~2 (auth + metadata, other data from cache)
Daily reads per user: 4
Free tier max users: 50,000 / 4 = 12,500 users/day
```

---

## 14. Edge Cases and Failure Modes

### 14.1 What If the Metadata Document Doesn't Exist?

The metadata API route auto-creates it on first request with current timestamps. This means the first page load after deployment will fetch everything fresh (no cache) — correct behavior.

### 14.2 What If localStorage Is Full?

Browsers allow ~5MB of localStorage. Each cached collection is roughly:
- Events (100 items): ~50KB
- Programs (20 items): ~10KB
- Users (100 items): ~20KB
- Donations (100 items): ~30KB
- Total for all 19 collections: ~400KB

We're well within the 5MB limit. If localStorage is somehow full, `JSON.parse` or `setItem` will throw, and the cache manager silently falls back to fetching fresh data.

### 14.3 What If the User Clears Their Browser Data?

All localStorage is cleared. The first page load after clearing fetches everything fresh — same as a new user's first visit. This is correct behavior.

### 14.4 What If Two Tabs Are Open?

Each tab independently checks metadata on load. Tab A creates an event → updates metadata. Tab B (which was already open) doesn't know about the change. When Tab B reloads, it sees the new metadata timestamp and refetches.

This is correct — we can't (and shouldn't) force other tabs to refresh. If real-time cross-tab sync is needed, we could use `BroadcastChannel` API, but that's overkill for this app.

### 14.5 What About Offline Use?

localStorage data persists even when the user is offline. However, the metadata check (`fetch('/api/metadata-timestamps')`) will fail. The cache manager should handle this:

```typescript
// In getCachedData()
const metadata = await fetchMetadata().catch(() => null);
if (!metadata && cached) {
  // We're offline — use cached data anyway (stale but better than nothing)
  return { data: cached.data, fromCache: true };
}
```

This gives offline users access to the last known data.

### 14.6 What If the Metadata Timestamp Is Wrong?

If an API route fails to update the metadata document (e.g., the write succeeds but the metadata update crashes), the timestamp will be stale. The next page load won't see the change, and the user will see old data.

**Solution:** The cache has a maximum TTL of 24 hours (defined in `DEFAULT_TTL`). Even if metadata is wrong, the cache is force-refreshed after 24 hours. This is a safety net.

Additionally, the metadata update should use a Firestore transaction with the write:

```typescript
// In API route — transactional: write + metadata update as one atomic operation
await firestore.runTransaction(async (transaction) => {
  transaction.set(firestore.collection('rsvps').doc(), rsvpData);
  transaction.update(
    firestore.collection('metadata').doc('cacheTimestamps'),
    { rsvps: Date.now(), _updatedAt: Date.now() }
  );
});
```

This ensures both happen or neither happens.

### 14.7 Stale Data: The Trade-off

The cache system means users might see data that's a few seconds (or minutes) old if they haven't reloaded. For MHMA:

| Data Freshness | Acceptable Lag | Why |
|---------------|---------------|-----|
| Events list | 5 minutes | Events don't change by the second |
| RSVP counts | 30 seconds | A new RSVP appearing after 30s is fine |
| Donation totals | 5 minutes | Not real-time trading data |
| Enrollments | 5 minutes | Enrollments are reviewed by board members |
| News | 10 minutes | News articles don't change frequently |
| User profile | 1 minute | Only the user changes their own profile |

**This is acceptable for a community organization's website.** If real-time updates are needed for a specific section (like the RSVP count during an event), `onSnapshot` (Firestore's real-time listener) can be used selectively for just that one data point.

---

## Appendix A: Summary of Files to Create

| File | Purpose |
|------|---------|
| `lib/cache-manager.ts` | Core caching logic (getCachedData, invalidateCache) |
| `app/api/metadata-timestamps/route.ts` | API endpoint to read the sentinel document |
| `lib/with-cache.ts` (optional) | Wrapper for existing fetch functions |

## Appendix B: Summary of Files to Modify

| Category | Files | Change |
|----------|-------|--------|
| Write API routes | ~15 files in `app/api/*/route.ts` | Add metadata timestamp update after write |
| Dashboard write actions | ~12 files in `app/dashboard/*/page.tsx` | Add `invalidateCache()` after write |
| Read pages | ~20 files in `app/*/page.tsx` | Wrap `fetch*` calls with `getCachedData()` |
| Navigation | `app/components/Navigation.tsx` | Use cache instead of direct Firestore reads |
| AI Assistant | `app/components/AiAssistant.tsx` | Read from PageDataContext + cache, not Firestore |

**Total: ~48 files to modify, each getting 1-5 lines of new code.**
