# Frontend RAG Part 5: THE FINAL PLAN

> **This is it.** The complete, finalized plan combining Choice 1 (Simple Invalidation) as primary with Choice 2 (Metadata Timestamp) as background verification. The AI RAG integration. localStorage cleanup. Everything.

---

## Table of Contents

1. [The Combined Approach: How Both Choices Work Together](#1-the-combined-approach-how-both-choices-work-together)
2. [The Cache Manager (Final Code)](#2-the-cache-manager-final-code)
3. [The Metadata API Route (Background Verification)](#3-the-metadata-api-route-background-verification)
4. [localStorage Cleanup Algorithm](#4-localstorage-cleanup-algorithm)
5. [How the AI Uses localStorage (RAG Integration)](#5-how-the-ai-uses-localstorage-rag-integration)
6. [Phase 0: Create Infrastructure](#6-phase-0-create-infrastructure)
7. [Phase 1: Add Invalidation to Every Write Handler](#7-phase-1-add-invalidation-to-every-write-handler)
8. [Phase 2: Wrap Fetches with Cache Manager](#8-phase-2-wrap-fetches-with-cache-manager)
9. [Phase 3: Background Metadata Verification](#9-phase-3-background-metadata-verification)
10. [Phase 4: Connect AI to Cached Data (RAG)](#10-phase-4-connect-ai-to-cached-data-rag)
11. [Phase 5: localStorage Cleanup & Maintenance](#11-phase-5-localstorage-cleanup--maintenance)
12. [Phase 6: Populate PageDataContext](#12-phase-6-populate-pagedatacontext)
13. [Before vs After: The Numbers](#13-before-vs-after-the-numbers)

---

## 1. The Combined Approach: How Both Choices Work Together

### 1.1 The Core Principle

```
Choice 1 (Simple Invalidation) — PRIMARY, FAST, 0 reads
  └── Cache key in localStorage? → Display immediately → DONE
      └── (99.9% of all page loads)

Choice 2 (Metadata Timestamp) — BACKGROUND VERIFICATION, 1 read
  └── Cache displayed? In background, verify with metadata
      └── Timestamps match? → Nothing to do
      └── Timestamp newer? → Silently refresh cache
      └── (Only runs if cache > 30 seconds old)
```

### 1.2 The Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAGE LOADS                                     │
│                                                                   │
│  1. Check localStorage for cache key                              │
│     │                                                             │
│     ├── FOUND? ──► 2a. Display IMMEDIATELY (0 reads)             │
│     │             2b. Is cache > 30 seconds old?                   │
│     │                 ├── YES → Background: fetch metadata (1 read)│
│     │                 │           → Compare timestamps             │
│     │                 │             ├── Match → do nothing         │
│     │                 │             └── Stale → refetch (N reads)  │
│     │                 │                  + update localStorage     │
│     │                 │                  + dispatch event for UI   │
│     │                 └── NO → Done (0 reads total)               │
│     │                                                             │
│     └── NOT FOUND? ──► 3. Was it removed by a write?             │
│                         ├── YES → Fetch fresh (N reads)            │
│                         ├── NO (user cleared data) → Fetch (N)    │
│                         └── Save to localStorage + metadata ts    │
│                                                                   │
│  ═══════════════════════════════════════════════════════════════  │
│                                                                   │
│                    WRITE HAPPENS                                   │
│                                                                   │
│  1. Form submit → API route writes to Firestore                   │
│  2. API route updates metadata timestamp (1 extra write)          │
│  3. API returns { success: true, metadata: { events: 1719000000 }}│
│  4. Browser calls: invalidateCache('events') — removes from LS   │
│  5. Browser saves: new timestamp in LS metadata cache             │
│                                                                   │
│  ═══════════════════════════════════════════════════════════════  │
│                                                                   │
│                    BACKGROUND VERIFICATION (30s+)                  │
│                                                                   │
│  Only runs if cache was FOUND (Choice 1 succeeded).               │
│  Only runs if cache is > 30 seconds old.                          │
│                                                                   │
│  1. fetch('/api/metadata-timestamps') → 1 read                    │
│  2. Compare server timestamp with cached timestamp                │
│  3. If server > cached → refetch in background → update UI       │
│  4. If server == cached → do nothing                              │
│                                                                   │
│  WHY only > 30 seconds?                                           │
│  - Rapid reloads (every 5 seconds) never trigger background check │
│  - Only checks when user has been on the page for > 30 seconds    │
│  - Catches edge cases where invalidation failed                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 The Three Layers of Safety

```
Layer 1 (Instant — 0 reads):
  Cache key exists in localStorage → data is fresh
  This is correct 99.9% of the time because any write removes the key.

Layer 2 (Background — 1 read, only after 30s):
  Metadata timestamp check confirms cache is fresh
  Catches the 0.1% case where invalidation failed.

Layer 3 (Safety Net — 0 reads, client-side only):
  24-hour TTL forces cache refresh
  Even if both Layer 1 and Layer 2 fail, data never stays stale > 24h.
```

### 1.4 Read Cost of the Combined Approach

| Scenario | Choice 1 Only | Combined (Choice 1 + Choice 2 Background) |
|----------|--------------|------------------------------------------|
| Reload, cache < 30s old | **0 reads** (display) | **0 reads** (display + skip background) |
| Reload, cache > 30s old, no changes | **0 reads** | **1 read** (background verify, matches) |
| Reload, cache > 30s old, write since | **0 reads** (still displays old) | **1 + N reads** (verify detects stale, refetch) |
| Reload, cache missing | **N reads** | **N reads** |
| Cross-page nav, cache < 30s | **0 reads** | **0 reads** |
| Average: 10 loads/day, 1 write | **~N + 2 auth + 2 theme** | **~N + 2 auth + 2 theme + 1 meta** |

**The difference:** +1 metadata read only on loads where cache > 30 seconds old. If you load 10 pages in 5 minutes (rapid navigation), 0 background checks. If you stay on one page for 2 minutes and reload, 1 background check.

---

## 2. The Cache Manager (Final Code)

```typescript
// lib/cache-manager.ts
// COMBINED APPROACH: Choice 1 (Simple Invalidation) + Choice 2 (Metadata Verification)
'use client';

const PREFIX = 'mhma_v5_';
const TTL_24H = 24 * 60 * 60 * 1000;
const BG_VERIFY_AFTER_MS = 30_000;  // Only background-verify if cache older than 30s

interface CacheEntry<T> {
  d: T;      // data
  t: number; // cachedAt timestamp (Date.now())
  s: number; // serverTimestamp from metadata doc at time of cache
}

// ─── Display cached data instantly, THEN verify in background ───
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; fromCache: boolean }> {
  const cacheKey = PREFIX + key;
  const raw = localStorage.getItem(cacheKey);

  if (raw) {
    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      const age = Date.now() - entry.t;

      // Layer 3: 24-hour safety net (client-side, 0 reads)
      if (age >= TTL_24H) {
        localStorage.removeItem(cacheKey);
        console.log(`[Cache] EXPIRED ${key} (>24h old)`);
      } else {
        // Layer 1: Display immediately from cache (0 reads!)
        console.log(`[Cache] HIT ${key} (age: ${Math.round(age / 1000)}s)`);

        // Layer 2: Background verification (only if cache > 30s old)
        if (age > BG_VERIFY_AFTER_MS) {
          verifyInBackground(key, entry, fetchFn);
        }

        return { data: entry.d, fromCache: true };
      }
    } catch {
      localStorage.removeItem(cacheKey); // Corrupt cache — refetch
    }
  }

  // Cache missing or expired — fetch fresh
  return fetchAndCache(key, fetchFn);
}

// ─── Background verification: 1 metadata read to confirm freshness ───
async function verifyInBackground<T>(
  key: string,
  entry: CacheEntry<T>,
  fetchFn: () => Promise<T>,
): Promise<void> {
  try {
    const res = await fetch('/api/metadata-timestamps');
    if (!res.ok) return;
    const metadata = await res.json();
    const serverTs = metadata[key];
    if (serverTs === undefined) return; // Collection not tracked in metadata

    if (serverTs > entry.s) {
      // A write happened that our invalidation didn't catch (edge case)
      console.log(`[Cache] BACKGROUND STALE ${key} (cached:${entry.s} < server:${serverTs})`);
      const fresh = await fetchFn();
      const newEntry: CacheEntry<T> = { d: fresh, t: Date.now(), s: serverTs };
      localStorage.setItem(PREFIX + key, JSON.stringify(newEntry));
      // Notify the page that data was updated
      window.dispatchEvent(new CustomEvent('mhma-cache-update', {
        detail: { key, data: fresh }
      }));
    } else {
      console.log(`[Cache] BACKGROUND VERIFIED ${key} (ts match: ${serverTs})`);
      // Update the cachedAt timestamp so we don't re-verify too soon
      entry.t = Date.now();
      localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    }
  } catch {
    // Metadata fetch failed — cache is acceptable, do nothing
    console.log(`[Cache] BACKGROUND VERIFY FAILED ${key} — using cache as-is`);
  }
}

// ─── Fetch fresh and cache ───
async function fetchAndCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; fromCache: boolean }> {
  console.log(`[Cache] MISS ${key} — fetching...`);
  const data = await fetchFn();

  // Try to get server timestamp from metadata (best-effort)
  let serverTs = Date.now();
  try {
    const res = await fetch('/api/metadata-timestamps');
    if (res.ok) {
      const metadata = await res.json();
      if (metadata[key]) serverTs = metadata[key];
    }
  } catch { /* Use Date.now() as fallback */ }

  const entry: CacheEntry<T> = { d: data, t: Date.now(), s: serverTs };
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    console.warn(`[Cache] localStorage full for ${key}`);
  }
  return { data, fromCache: false };
}

// ─── Invalidate: Call AFTER a successful write ───
export function invalidateCache(key: string | string[]): void {
  const keys = Array.isArray(key) ? key : [key];
  keys.forEach(k => {
    localStorage.removeItem(PREFIX + k);
    console.log(`[Cache] INVALIDATED ${k}`);
  });
}

// ─── Listen for cache updates (to refresh UI without reload) ───
export function onCacheUpdate(
  key: string,
  callback: (data: any) => void,
): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail.key === key) callback(detail.data);
  };
  window.addEventListener('mhma-cache-update', handler);
  return () => window.removeEventListener('mhma-cache-update', handler);
}

// ─── Force-clear a specific cache entry ───
export function clearCache(key: string): void {
  localStorage.removeItem(PREFIX + key);
}
```

---

## 3. The Metadata API Route (Background Verification)

```typescript
// app/api/metadata-timestamps/route.ts
import { firestore } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

const ALL_COLLECTIONS = [
  'events', 'programs', 'rsvps', 'enrollments', 'donations',
  'pledges', 'users', 'news', 'masjidConstruction', 'subscribers',
  'contactSubmissions', 'schedulingRequests', 'volunteers',
  'testimonials', 'activityLog', 'journal', 'inviteCodes', 'faq',
  'aboutStats',
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

### 3.1 Every Write Route Updates the Metadata

Every API route that writes data gets ONE LINE:

```typescript
// Inside app/api/rsvp/route.ts — after the write succeeds:

await firestore.collection('rsvps').add(rsvpData);

// ONE EXTRA LINE: Update metadata timestamp
await firestore.collection('metadata').doc('cacheTimestamps').update({
  rsvps: Date.now(),
  _updatedAt: Date.now(),
});
```

---

## 4. localStorage Cleanup Algorithm

### 4.1 Why Cleanup Is Needed

You asked about board members seeing lots of data filling up localStorage. Here's the reality:

| Concern | Actual Situation |
|---------|-----------------|
| Max localStorage size | 5-10 MB per domain |
| Our total cached data | ~1 MB (all 19 collections) |
| How fast it fills | Very slowly: 1 MB even with thousands of records |
| Risk of filling up | **Virtually zero** for MHMA's scale |

But since you want a cleanup system, here's one built into the cache manager.

### 4.2 Automatic Cleanup (Built-in)

```typescript
// These are already built into the cache manager above:

// 1. 24-hour TTL: caches older than 24 hours are removed on access
//    Every load checks: if (age >= TTL_24H) localStorage.removeItem(key)

// 2. Corrupt data: if JSON.parse fails, cache is removed
//    try { JSON.parse(raw) } catch { localStorage.removeItem(key) }
```

### 4.3 Periodic Cleanup (Runs Once Per Session)

```typescript
// lib/cache-cleanup.ts
// Called ONCE when the app loads (in layout.tsx)
'use client';

import { PREFIX } from './cache-manager'; // or redefine

const CACHE_PREFIX = 'mhma_v5_';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
const MAX_TOTAL_SIZE = 4 * 1024 * 1024;    // 4 MB safety limit (leave room)

export function runCacheCleanup(): void {
  const now = Date.now();
  let totalSize = 0;

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;

    const value = localStorage.getItem(key);
    if (!value) { localStorage.removeItem(key!); continue; }

    // Size tracking
    totalSize += value.length;

    try {
      const entry = JSON.parse(value);
      // Remove if older than 24 hours
      if (now - entry.t > MAX_CACHE_AGE) {
        localStorage.removeItem(key);
        console.log(`[CacheCleanup] Removed expired: ${key}`);
      }
    } catch {
      // Corrupt entry — remove
      localStorage.removeItem(key);
      console.log(`[CacheCleanup] Removed corrupt: ${key}`);
    }
  }

  // If total size exceeds limit, remove oldest entries
  if (totalSize > MAX_TOTAL_SIZE) {
    const entries: { key: string; t: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(CACHE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw);
        entries.push({ key, t: entry.t || 0 });
      } catch {}
    }
    entries.sort((a, b) => a.t - b.t); // Oldest first
    while (totalSize > MAX_TOTAL_SIZE && entries.length > 0) {
      const oldest = entries.shift()!;
      localStorage.removeItem(oldest.key);
      totalSize -= oldest.key.length; // approximate
      console.log(`[CacheCleanup] Evicted oldest: ${oldest.key}`);
    }
  }

  console.log(`[CacheCleanup] Complete. Total cache size: ~${(totalSize / 1024).toFixed(1)} KB`);
}
```

> **This cleanup runs once per session** (called from `layout.tsx`). It's not a periodic task. It doesn't add reads. It just scans localStorage, removes expired/corrupt entries, and evicts oldest if total exceeds 4 MB.

### 4.4 What Board Members Should Actually Do

> **Board members don't need to manage localStorage manually.** The cleanup handles it automatically. Delete events/programs/users from the Dashboard as you normally would — that cleans up the Firebase data. The localStorage cache handles itself.

If a board member ever sees a "localStorage full" warning in their browser (which they won't unless they have 5+ MB of unrelated data from other websites), they can:
1. Open DevTools → Application → Local Storage
2. Right-click on the domain → Clear
3. Refresh the page

That clears all cache, and the app refetches fresh data on next load (same as first visit behavior).

---

## 5. How the AI Uses localStorage (RAG Integration)

### 5.1 The AI's Data Sources (Priority Order)

```
When the AI answers a question, it checks these sources IN ORDER.
It NEVER reads from Firestore directly.

Priority 1: PageDataContext (React state — current page's displayed data)
  → "How many events?" → pageData.events exists? YES → answer from it
  → 0 reads, data is on screen RIGHT NOW

Priority 2: localStorage (cached from ANY page visited this session or earlier)
  → "Total donations?" → pageData.donations missing
  → Check localStorage 'mhma_v5_donations' → FOUND → answer from it
  → 0 reads (cache hit from earlier Dashboard visit)

Priority 3: Static knowledge base (assistant-knowledge.ts)
  → "How do I create an event?" → no live data match
  → Fall through to KB → answer from .ts file
  → 0 reads (file in codebase, not Firestore)

Priority 4: "I don't have that information"
  → Nothing matched → tell user to visit the relevant page
  → 0 reads

══════════════════════════════════════════════════════════════════

The AI NEVER calls fetch('/api/...') to answer a question.
It reads from what's already loaded or cached.
```

### 5.2 The AI's Cache-Aware Answering Function

```typescript
// In app/components/AiAssistant.tsx

import { usePageData } from '@/lib/page-data-context';
import { useAuth } from '@/lib/auth-context';

export default function AiAssistant() {
  const { data: pageData } = usePageData();
  const { user } = useAuth();

  // ─── Answer questions using cached/displayed data ONLY ───
  function answerFromLiveData(query: string): string | null {
    const lower = query.toLowerCase();

    // ─── Helper: read from localStorage directly ───
    function fromCache<T>(key: string): T | null {
      try {
        const raw = localStorage.getItem('mhma_v5_' + key);
        if (!raw) return null;
        return JSON.parse(raw).d as T;
      } catch { return null; }
    }

    // ═══════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════

    if (lower.includes('how many event') || (lower.includes('event') && lower.includes('count'))) {
      const events = pageData.events || fromCache<any[]>('events');
      if (events) return `There are ${events.length} events loaded.`;
      return "Visit the Events page or Dashboard to see event data, then ask me.";
    }

    if (lower.includes('upcoming event') || lower.includes('next event')) {
      const events = pageData.events || fromCache<any[]>('events');
      if (events?.length) {
        const now = new Date();
        const upcoming = events.filter(e => new Date(e.date || e.createdAt) > now);
        if (upcoming.length > 0) {
          const next = upcoming[0];
          return `Next event: ${next.title} on ${next.date || 'TBD'}.`;
        }
        return "No upcoming events found.";
      }
      return "Visit the Events page to see event data.";
    }

    // ═══════════════════════════════════════════════════════
    // DONATIONS / FUNDRAISING
    // ═══════════════════════════════════════════════════════

    if ((lower.includes('donat') || lower.includes('raised') || lower.includes('fund')) &&
        (lower.includes('total') || lower.includes('how much') || lower.includes('amount'))) {
      const donations = pageData.donations || fromCache<any[]>('donations');
      if (donations?.length) {
        const total = donations.reduce((s: number, d: any) => s + (d.amount || 0), 0);
        return `Total donations: $${total.toLocaleString()}.`;
      }
      return "Visit Dashboard → Donations to see donation totals, then ask me.";
    }

    if (lower.includes('masjid') || lower.includes('construction') && lower.includes('progress')) {
      const updates = pageData.masjidUpdates || fromCache<any[]>('masjidConstruction');
      if (updates?.length) {
        const latest = updates[0];
        return `Latest construction update: ${latest.caption || 'No caption'}. Raised: $${(latest.raised || 0).toLocaleString()} of $${(latest.goal || 0).toLocaleString()}.`;
      }
      return "Visit the Masjid Construction page to see progress.";
    }

    // ═══════════════════════════════════════════════════════
    // PROGRAMS / ENROLLMENTS
    // ═══════════════════════════════════════════════════════

    if (lower.includes('how many program') || (lower.includes('program') && lower.includes('count'))) {
      const programs = pageData.programs || fromCache<any[]>('programs');
      if (programs) return `There are ${programs.length} programs.`;
      return "Visit the Programs page to see program data.";
    }

    if (lower.includes('enroll') || lower.includes('how many student')) {
      const programs = pageData.programs || fromCache<any[]>('programs');
      if (programs?.length) {
        const total = programs.reduce((s: number, p: any) => s + (p.enrollmentCount || 0), 0);
        return `Total enrollments across all programs: ${total}.`;
      }
      return "Visit Dashboard → Programs to see enrollment data.";
    }

    // ═══════════════════════════════════════════════════════
    // RSVPs
    // ═══════════════════════════════════════════════════════

    if (lower.includes('rsvp') || (lower.includes('how many people') && lower.includes('event'))) {
      const events = pageData.events || fromCache<any[]>('events');
      if (events?.length) {
        const totalRsvps = events.reduce((s: number, e: any) => s + (e.rsvpCount || 0), 0);
        return `Total RSVPs across all events: ${totalRsvps}.`;
      }
      return "Visit Dashboard → Events to see RSVP data.";
    }

    // ═══════════════════════════════════════════════════════
    // USERS / MEMBERS
    // ═══════════════════════════════════════════════════════

    if (lower.includes('how many user') || lower.includes('how many member') || lower.includes('total member')) {
      const users = pageData.users || fromCache<any[]>('users');
      if (users) return `There are ${users.length} registered users.`;
      return "Visit Dashboard → Members to see user data.";
    }

    // ═══════════════════════════════════════════════════════
    // IDENTITY (from auth context — always available)
    // ═══════════════════════════════════════════════════════

    if (lower === 'who am i' || lower === 'whoami' || lower === 'who am i?') {
      if (user?.displayName) {
        return `You are ${user.displayName}. Role: ${user.role === 'board_member' || user.role === 'administrator' ? 'board member' : 'member'}.${user.email ? ` Email: ${user.email}.` : ''}`;
      }
      return "You're not logged in. Click 'Member Login' in the top nav.";
    }

    // ═══════════════════════════════════════════════════════
    // CURRENT PAGE
    // ═══════════════════════════════════════════════════════

    if (lower.includes('what page') || lower.includes('where am i') || lower.includes('current page')) {
      const path = pageData.currentPath || (typeof window !== 'undefined' ? window.location.pathname : '');
      return `You're on the ${path || 'unknown'} page.`;
    }

    // ═══════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════════════

    if (lower.includes('notification') || lower.includes('any updates') || lower.includes('anything new')) {
      const enrollments = fromCache<any[]>('enrollments');
      const rsvps = fromCache<any[]>('rsvps');
      const contacts = fromCache<any[]>('contactSubmissions');
      const scheduling = fromCache<any[]>('schedulingRequests');

      const pending: string[] = [];
      if (enrollments) { const n = enrollments.filter((e: any) => e.status === 'pending').length; if (n) pending.push(`${n} pending enrollments`); }
      if (rsvps) { const n = rsvps.filter((r: any) => r.status === 'pending').length; if (n) pending.push(`${n} pending RSVPs`); }
      if (contacts) { const n = contacts.filter((c: any) => !c.read).length; if (n) pending.push(`${n} unread messages`); }
      if (scheduling) { const n = scheduling.filter((s: any) => s.status === 'pending').length; if (n) pending.push(`${n} pending scheduling requests`); }

      if (pending.length) return `You have: ${pending.join(', ')}.`;
      return "No pending items found.";
    }

    // ═══════════════════════════════════════════════════════
    // NOT A LIVE DATA QUESTION — let it fall through to KB
    // ═══════════════════════════════════════════════════════

    return null;
  }

  // This function is called from askQuestion before the KB lookup:
  // const liveAnswer = answerFromLiveData(query);
  // if (liveAnswer) return { answer: liveAnswer };
}
```

### 5.3 How the AI Handles Missing Data

```
User asks: "How many donations?"

Step 1: AI checks PageDataContext → donations? → NO
Step 2: AI checks localStorage → 'mhma_v5_donations'? → NO
Step 3: AI returns: "Visit Dashboard → Donations to see donation totals, then ask me."
Step 4: User visits Dashboard → Dashboard fetches donations → cached in LS
Step 5: User asks again → PageDataContext has it now → answers instantly
```

The AI **guides** the user to the right page, which loads + caches the data. Subsequent questions about the same data are answered instantly (0 reads).

---

## 6. Phase 0: Create Infrastructure

**Files to create:**
- `lib/cache-manager.ts` — the combined cache manager (~80 lines)
- `app/api/metadata-timestamps/route.ts` — metadata endpoint (~35 lines)
- `lib/cache-cleanup.ts` — optional cleanup script (~50 lines)

**Files to modify:**
- `app/layout.tsx` — import and run `runCacheCleanup()` once on mount

**Estimated time: 1 hour**

---

## 7. Phase 1: Add Invalidation to Every Write Handler

**What to do:** After every successful write (form submit, admin action), add ONE line: `invalidateCache('collectionName')`.

**Files to modify: ~38 files, 1 line each.**

### Public Form Submissions (10 files)

| File | Line to Add After Success |
|------|--------------------------|
| `app/rsvp/page.tsx` | `invalidateCache(['rsvps', 'events'])` |
| `app/enroll/page.tsx` | `invalidateCache(['enrollments', 'programs'])` |
| `app/pledge/page.tsx` | `invalidateCache('pledges')` |
| `app/contact/page.tsx` | `invalidateCache('contactSubmissions')` |
| `app/event-scheduling-request/page.tsx` | `invalidateCache('schedulingRequests')` |
| `app/volunteer/page.tsx` | `invalidateCache('volunteers')` |
| `app/subscribe/page.tsx` | `invalidateCache('subscribers')` |
| `app/register/page.tsx` | `invalidateCache(['inviteCodes', 'users'])` |
| `app/components/RSVPModal.tsx` | `invalidateCache(['rsvps', 'events'])` |
| `app/components/NewsletterSignup.tsx` | `invalidateCache('subscribers')` |

### Dashboard Admin Actions (18 files)

| Dashboard Page | Line to Add After Write |
|----------------|------------------------|
| `events/*` create/edit/delete | `invalidateCache('events')` |
| `events/*` approve/reject RSVP | `invalidateCache(['rsvps', 'events'])` |
| `programs/*` create/edit/delete | `invalidateCache('programs')` |
| `programs/*` approve/reject enrollment | `invalidateCache(['enrollments', 'programs'])` |
| `news/*` create/edit/delete | `invalidateCache('news')` |
| `news/*` trigger notification | `invalidateCache('subscribers')` |
| `users/*` edit/delete | `invalidateCache('users')` |
| `donations/*` add/edit/delete | `invalidateCache('donations')` |
| `pledges/*` edit/fulfill/cancel | `invalidateCache('pledges')` |
| `masjid-construction/*` add/edit | `invalidateCache('masjidConstruction')` |
| `analytics/*` edit about stats | `invalidateCache('aboutStats')` |
| `contact-submissions/*` mark read | `invalidateCache('contactSubmissions')` |
| `scheduling-requests/*` approve/reject | `invalidateCache('schedulingRequests')` |
| `testimonials/*` add/edit/delete | `invalidateCache('testimonials')` |
| `activity/*` revert action | `invalidateCache('activityLog')` |
| `invite-codes/*` generate/delete | `invalidateCache('inviteCodes')` |
| `subscribers/*` manage | `invalidateCache('subscribers')` |
| `settings/*` change anything | `invalidateCache(['users', 'userSettings'])` |

### Server-Side (Metadata Update — 15 API Routes)

Every write API route gets ONE LINE after the write:

| API Route | Line to Add After Write |
|-----------|------------------------|
| `app/api/rsvp/route.ts` | `update({ rsvps: Date.now() })` |
| `app/api/enroll/route.ts` | `update({ enrollments: Date.now() })` |
| `app/api/pledge/route.ts` | `update({ pledges: Date.now() })` |
| `app/api/contact/route.ts` | `update({ contactSubmissions: Date.now() })` |
| `app/api/event-scheduling/route.ts` | `update({ schedulingRequests: Date.now() })` |
| `app/api/submit-volunteer/route.ts` | `update({ volunteers: Date.now() })` |
| `app/api/subscribe/route.ts` | `update({ subscribers: Date.now() })` |
| `app/api/unsubscribe/route.ts` | `update({ subscribers: Date.now() })` |
| `app/api/news/route.ts` | `update({ news: Date.now() })` |
| `app/api/stripe-webhook/route.ts` | `update({ donations: Date.now() })` |
| `app/api/events/route.ts` (POST) | `update({ events: Date.now() })` |
| `app/api/programs/route.ts` (POST) | `update({ programs: Date.now() })` |
| `app/api/use-invite/route.ts` | `update({ inviteCodes: Date.now() })` |
| `app/api/change-email/route.ts` | `update({ users: Date.now() })` |
| `app/api/notify-event/route.ts` | `update({ subscribers: Date.now() })` |
| `app/api/notify-news/route.ts` | `update({ subscribers: Date.now() })` |
| `app/api/notify-program/route.ts` | `update({ subscribers: Date.now() })` |
| `app/api/notify-quarterly/route.ts` | `update({ donations: Date.now() })` |
| `app/api/notify-monthly/route.ts` | `update({ donations: Date.now() })` |

**Estimated time: 2 hours**

---

## 8. Phase 2: Wrap Fetches with Cache Manager

**What to do:** Replace direct `fetch*()` calls with `getCachedData(key, fetchFn)`.

**Files to modify: ~20 files, 2-3 lines each.**

### Priority 1: Navigation (saves 6 reads per page load)

```
app/components/Navigation.tsx

BEFORE:
  const enrollSnap = await getDocs(query(collection(db, "enrollments"), where("status", "==", "pending")));
  const contactSnap = await getDocs(query(collection(db, "contactSubmissions"), where("read", "==", false)));
  // ... 4 more reads

AFTER:
  const { data: enrollments } = await getCachedData('enrollments', () => fetchEnrollments(500));
  const { data: contacts } = await getCachedData('contactSubmissions', () => fetchContactSubmissions(500));
  // ... 4 more, all wrapped with getCachedData
  const pendingEnrollments = enrollments.filter((e: any) => e.status === 'pending');
  const unreadContacts = contacts.filter((c: any) => !c.read);
```

### Priority 2: Dashboard (saves 17 reads per load)

```
app/dashboard/page.tsx
→ Wrap all 17 fetch* calls with getCachedData()
```

### Priority 3: Key Public Pages

```
app/events/page.tsx        → getCachedData('events', () => fetchEvents(100))
app/programs/page.tsx      → getCachedData('programs', () => fetchPrograms(20))
app/page.tsx (home)        → getCachedData for events, programs, news, masjidConstruction
app/masjid-construction/page.tsx → getCachedData('masjidConstruction', ...)
app/donate/page.tsx        → getCachedData('donations', ...)
app/about/page.tsx         → getCachedData('aboutStats', ...)
app/impact-report/page.tsx → getCachedData for donations, enrollments
app/news/page.tsx          → getCachedData('news', ...)
```

### Priority 4: Dashboard Detail Pages

```
app/dashboard/analytics/page.tsx           → wrap all data fetches
app/dashboard/events/page.tsx              → getCachedData('events', ...)
app/dashboard/programs/page.tsx            → getCachedData('programs', ...)
app/dashboard/users/page.tsx               → getCachedData('users', ...)
app/dashboard/donations/page.tsx           → getCachedData('donations', ...)
app/dashboard/pledges/page.tsx             → getCachedData('pledges', ...)
app/dashboard/news/page.tsx                → getCachedData('news', ...)
app/dashboard/contact-submissions/page.tsx → getCachedData('contactSubmissions', ...)
app/dashboard/masjid-construction/page.tsx → getCachedData('masjidConstruction', ...)
app/dashboard/scheduling/page.tsx          → getCachedData('schedulingRequests', ...)
app/dashboard/subscribers/page.tsx         → getCachedData('subscribers', ...)
app/dashboard/testimonials/page.tsx        → getCachedData('testimonials', ...)
app/dashboard/activity/page.tsx            → getCachedData('activityLog', ...)
app/dashboard/invite-codes/page.tsx        → getCachedData('inviteCodes', ...)
```

### Priority 5: Auth and Theme

| File | Change |
|------|--------|
| `lib/theme-context.tsx` | Cache `userSettings` in localStorage after first read |

**Estimated time: 3 hours**

---

## 9. Phase 3: Background Metadata Verification

**What to do:** The cache manager already has `verifyInBackground()` built in. No extra files needed.

**But:** Every write API route needs to update the metadata document. This was already listed in Phase 1 (server-side section).

**No additional work beyond what's in Phase 1.** The `verifyInBackground()` function automatically:
- Runs when cache > 30 seconds old
- Fetches metadata (1 read)
- Compares timestamps
- Refetches if stale
- Updates UI via CustomEvent

**Estimated time: 0 hours (already built into the cache manager)**

---

## 10. Phase 4: Connect AI to Cached Data (RAG)

**What to do:** Add the `answerFromLiveData()` function to `AiAssistant.tsx`.

**Files to modify: 1 file.**

```
app/components/AiAssistant.tsx

Changes:
1. Import usePageData from page-data-context
2. Import getCachedData (for cases where AI needs to read from LS directly)
3. Add answerFromLiveData() function (shown in Section 5)
4. Call it in askQuestion() before falling through to KB:

   const liveAnswer = answerFromLiveData(query);
   if (liveAnswer) return { answer: liveAnswer };
```

**Not a single Firestore read.** The AI reads from:
- PageDataContext (already displayed)
- localStorage (cached from any page)
- Static knowledge base

**Estimated time: 1 hour**

---

## 11. Phase 5: localStorage Cleanup & Maintenance

**What to do:** Add the cleanup script and call it from layout.

**Files to create:** `lib/cache-cleanup.ts` (~50 lines)
**Files to modify:** `app/layout.tsx` (add 1 import + 1 call)

```typescript
// In app/layout.tsx
'use client'; // Only if not already at the top

import { useEffect } from 'react';
import { runCacheCleanup } from '@/lib/cache-cleanup';

// Add inside the provider-wrapped component:
useEffect(() => { runCacheCleanup(); }, []);
```

**Estimated time: 0.5 hours**

---

## 12. Phase 6: Populate PageDataContext

**What to do:** After every `getCachedData()` call, also call `setPageData({ ... })`.

**Files to modify: ~15 files, 1 line each.**

```
app/events/page.tsx              → setPageData({ events: data, currentPath: '/events' })
app/programs/page.tsx            → setPageData({ programs: data, currentPath: '/programs' })
app/dashboard/page.tsx           → setPageData({ events, programs, donations, ... })
app/page.tsx (home)              → setPageData({ events, programs, news, ... })
app/masjid-construction/page.tsx → setPageData({ masjidUpdates: data })
app/donate/page.tsx              → setPageData({ donations: data })
app/about/page.tsx               → setPageData({ aboutStats: data })
app/impact-report/page.tsx       → setPageData({ donations: data })
app/news/page.tsx                → setPageData({ news: data })
app/profile/page.tsx             → setPageData({ user: profileData })
// All dashboard detail pages    → setPageData({ ...relevant data })
```

**Estimated time: 0.5 hours**

---

## 13. Before vs After: The Numbers

### Reads Per Page Load

| Scenario | Before | After (Combined) |
|----------|--------|-----------------|
| Reload, no writes, cache < 30s | 529 | **2** (auth + theme only) |
| Reload, no writes, cache > 30s | 529 | **3** (auth + theme + 1 metadata verify) |
| Reload, 1 write, cache < 30s | 529 | **2 + N** (only changed collections) |
| Reload, 1 write, cache > 30s | 529 | **3 + N** |
| Cross-page nav, cache < 30s | 529 | **2** |
| First visit ever (all cold) | 529 | **~25** (auth + theme + all collections) |
| User clears browser data | 529 | **~25** (same as first visit) |
| AI answers a question | ~20 (live-knowledge.ts) | **0** (reads from cache/screen) |

### Reads Per Day (500 Users, 10 Loads Each)

| Metric | Before | After (Combined) |
|--------|--------|-----------------|
| Auth reads | 500 × 10 = 5,000 | 5,000 (unavoidable) |
| Theme reads | 500 × 10 = 5,000 | 0 (cached in LS) |
| Data reads (no writes) | 500 × 10 × 519 = 2,595,000 | **0** (all cached) |
| Metadata reads (30s+ old) | 0 | ~500 × 5 = 2,500 (half of loads) |
| Writes per day | ~50 | ~50 (unavoidable) |
| **Total reads** | **~2,605,000** | **~7,550** |
| Free tier limit | 50,000/day | ✅ **6.6× under limit** |

### User Capacity on Free Tier

| Scenario | Max Users on Free Tier |
|----------|----------------------|
| Before cache | **~14 users/day** |
| After (no background verify) | **~2,500 users/day** |
| After (with background verify, 50% of loads) | **~1,666 users/day** |

### Cost on Blaze (Pay-as-You-Go)

| Scenario | Reads/Day | Cost/Day | Cost/Month |
|----------|-----------|----------|------------|
| Before, 500 users | 2,605,000 | $1.56 | **$46.89** |
| After, 500 users | 7,550 | **$0.005** | **$0.14** |
| After, 5,000 users | 75,500 | **$0.045** | **$1.36** |
| After, 50,000 users | 755,000 | **$0.45** | **$13.59** |

---

## Appendix: Summary of All Files

### Files to Create (3)

| File | Lines | Purpose |
|------|-------|---------|
| `lib/cache-manager.ts` | ~80 | Core caching logic (Choice 1 + Choice 2 combined) |
| `app/api/metadata-timestamps/route.ts` | ~35 | Metadata endpoint for background verification |
| `lib/cache-cleanup.ts` | ~50 | One-time cleanup of expired/overflowing caches |

### Files to Modify (~55)

| Category | Count | Change |
|----------|-------|--------|
| Public form pages | 10 | Add 1 line: `invalidateCache(...)` |
| Dashboard admin pages | 18 | Add 1 line: `invalidateCache(...)` |
| API routes (server-side) | 19 | Add 1 line: metadata timestamp update |
| Fetch wrapper pages | 20 | Wrap `fetch*` with `getCachedData(...)` |
| Navigation | 1 | Replace 6 reads with `getCachedData` |
| Theme context | 1 | Cache userSettings in localStorage |
| AI Assistant | 1 | Add `answerFromLiveData()` function |
| Layout | 1 | Add cleanup call |
| PageDataContext pages | 15 | Add `setPageData(...)` after cache read |

**Total: 3 new files + ~55 modified files.**
**Estimated total time: 8-10 hours.**
**Result: 529 → ~2-3 reads per page reload (99.5% reduction).**
