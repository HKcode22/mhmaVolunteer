# Firestore Read Reduction Plan

## Current State

Your console confirms the cache WORKS now — all collections show `HIT age=21m`. But reads are still 596/hr and 131 in a peak minute. Those reads come from **5 sources that bypass the cache entirely**.

---

## Reads That Survive Even With Perfect Cache

On every authenticated page load, these always fire:

| Source | File : Line | Collection | Reads per Load | Can Eliminate? |
|--------|------------|------------|---------------|----------------|
| Auth role fetch | `lib/auth-context.tsx:47` | `users/{uid}` | 1 | YES |
| Dashboard layout prefs | `app/dashboard/page.tsx:108` | `users/{uid}` (SAME doc!) | 1 | YES — merge with auth |
| Theme settings | `lib/theme-context.tsx:39` | `userSettings/{uid}` | 1 | YES |
| Metadata timestamps | `cache-manager.ts` → `/api/metadata-timestamps` | `metadata/cacheTimestamps` | 1 | HARDER — needed by cache |
| aboutStats (when stale) | `app/api/about-stats/route.ts` | 12 collections (see below) | ~106 | YES |

**Items 1 and 2 read the exact same document** — that's 1 completely wasted read.

---

## The aboutStats Problem

The dashboard loads `aboutStats` via `getCachedData`. On cache HIT: 0 reads. But on **cache MISS or STALE**, the fetchFn calls `/api/about-stats` which server-side reads ALL documents from:

```
programs(14) + events(1) + users(10) + donations(5) + enrollments(15) +
rsvps(28) + subscribers(6) + contactSubmissions(5) + pledges(22) +
volunteers(0) + news(4) + aboutStats/stats(1)
```

**= ~106 document reads every time aboutStats goes stale.**

Since aboutStats data changes whenever ANY of these 12 collections changes, it goes stale frequently. The dashboard also reads THE SAME collections via `getCachedData`, so every doc is read twice on fresh loads.

---

## Step-by-Step Fix Plan

### Step 1: Fix `runCacheCleanup` Bug (Prevents Perpetual Refetches)

**File:** `lib/cache-cleanup.ts`

**Change:** Import `setEntry` from cache-manager.ts and use it instead of `localStorage.setItem`.

```typescript
// Line 3 — add import
import { PREFIX, THIRTY_DAYS_MS, MAX_ITEMS_BY_KEY, setEntry } from './cache-manager';

// Lines 122-124 — replace
if (entry.d.length < before || sanitizedChanged) {
  entry.t = Date.now();
  setEntry(logicalKey, entry);  // preserves v field
}
```

Without this fix, cache entries for events, programs, news, testimonials, masjidConstruction get their `v` field stripped on every page load → SCHEMA-MISMATCH → perpetual refetch.

**Impact:** Prevents 5+ collections from being refetched on every single reload.

---

### Step 2: Eliminate aboutStats Server-Side Reads (Biggest Reduction)

**File:** `app/api/about-stats/route.ts`

The GET handler reads 12 collections server-side to compute aggregate stats. Instead of reading 12 collections every time, create a **pre-computed stats document** in Firestore that gets updated on writes.

**Approach:**

**2a.** Create a single document `aboutStats/computed` that holds ALL the aggregates:
```typescript
{
  programsCount: 14,
  eventsCount: 1,
  usersCount: 10,
  totalDonationCount: 5,
  enrollmentCount: 15,
  rsvpCount: 28,
  subscriberCount: 6,
  contactCount: 5,
  pledgeCount: 22,
  volunteerCount: 0,
  newsCount: 4,
  raisedForMasjid: 124500,
  raisedForPrograms: 25000,
  // ... etc
}
```

**2b.** The GET handler reads just this ONE document instead of 12 collections:
```typescript
const statsSnap = await firestore.collection("aboutStats").doc("computed").get();
return NextResponse.json(statsSnap.data());
```
**106+ reads → 1 read.**

**2c.** Update the stats doc on every write operation. Add to every `add*`, `update*`, `delete*` function in `firebase.ts`:
- Increment/decrement counters when items are added/updated/deleted
- Or run a daily serverless function to recompute
- Or use the first page load of the day to trigger recomputation

Or simpler: **keep the client-side computation** since the dashboard already has all this data cached locally. The homepage already fetches events, programs, news, masjidConstruction via `getCachedData`. Remove aboutStats entirely and compute the stat card values from that cached data.

---

### Step 3: Cache the 3 Uncached `getDoc` Calls

**File:** `lib/theme-context.tsx`

```typescript
// Replace direct getDoc with cached read
useEffect(() => {
  if (!user) return;
  getCachedData(`userSettings_${user.uid}`, () =>
    getDoc(doc(db, "userSettings", user.uid)).then(snap => {
      if (snap.exists()) return snap.data();
      return {};
    })
  ).then(({ data }) => {
    if (data.theme) setThemeState(data.theme);
  }).catch(() => {});
}, [user]);
```

**File:** `lib/auth-context.tsx`

```typescript
// Cache the user doc read inside fetchUserData
const fetchUserData = async (uid: string) => {
  try {
    const { data } = await getCachedData(`user_${uid}`, () =>
      getDoc(doc(db, "users", uid)).then(snap => {
        if (snap.exists()) return snap.data();
        return {};
      })
    );
    // use data...
  } catch (err) { ... }
};
```

**File:** `app/dashboard/page.tsx`

```typescript
// Remove the redundant getDoc(doc(db, "users", uid)) entirely
// The auth-context already has this data (role, displayName, etc.)
// Store dashboard layout prefs ON the user doc — read from cached auth data
// OR cache it separately:
useEffect(() => {
  if (user?.uid) {
    getCachedData(`user_layout_${user.uid}`, () =>
      getDoc(doc(db, "users", user.uid)).then(snap => {
        if (snap.exists()) return snap.data();
        return {};
      })
    ).then(({ data }) => {
      if (data.dashboardOrder) setLayoutOrder(data.dashboardOrder);
      if (data.quickOrder) setQuickOrder(data.quickOrder);
    });
  }
}, [user?.uid]);
```

**Impact:** 3 reads → 0 reads after first load.

---

### Step 4: Add In-Flight Dedup in `getCachedData`

**File:** `lib/cache-manager.ts`

Add a promise map so when Navigation + Dashboard both request `enrollments` simultaneously, only one Firestore query fires:

```typescript
// At module level
const inFlightFetches = new Map<string, Promise<{data: any; fromCache: boolean}>>();

// In getCachedData, replace the MISS section:
if (entry && entry.s >= serverTs && age < THIRTY_DAYS_MS && (entry.v ?? 0) === CACHE_SCHEMA_VERSION) {
  // HIT
  return { data: entry.d, fromCache: true };
}

// Check for in-flight fetch
const existing = inFlightFetches.get(key);
if (existing) {
  return existing;
}

const promise = fetchAndCache(key, fetchFn, serverTs);
inFlightFetches.set(key, promise);
promise.finally(() => inFlightFetches.delete(key));
return promise;
```

**Impact:** Eliminates duplicate reads when Navigation + Dashboard fetch the same 4 collections in parallel (~55 duplicate doc reads eliminated on cold load).

---

### Step 5: Fix the 3 Uncached Public Pages

Wrap their direct `fetch*` calls with `getCachedData`:

| File | Line | Current | Fix |
|------|------|---------|-----|
| `app/contact/faq/page.tsx` | 14 | `fetchFAQs(100)` | `getCachedData('faq', () => fetchFAQs(100))` |
| `app/rsvp/page.tsx` | 43 | `fetchEvents(100)` | `getCachedData('events', () => fetchEvents(100))` |
| `app/enroll/page.tsx` | 25 | `fetchPrograms(50)` | `getCachedData('programs', () => fetchPrograms(50))` |

---

### Step 6: Fix `handleGenerateCode` Uncached Fetch

**File:** `app/dashboard/page.tsx:236`

```typescript
// Current:
const codes = await fetchInviteCodes();
// Fix:
const { data: codes } = await getCachedData('inviteCodes', () => fetchInviteCodes());
```

---

### Step 7: Reduce Metadata Timestamp Fetch Frequency

**File:** `lib/cache-manager.ts`

The metadata timestamps are fetched on every `getCachedData` call (first one per page load via `fetchAllTimestamps`). Add a 60-second in-memory TTL so that rapid page navigations don't re-fetch:

```typescript
let metaTsCache: Record<string, number> | null = null;
let metaTsFetchedAt = 0;
const META_TS_TTL = 60_000; // 60 seconds

async function fetchAllTimestamps(): Promise<Record<string, number>> {
  if (metaTsCache && Date.now() - metaTsFetchedAt < META_TS_TTL) {
    return metaTsCache;
  }
  const res = await fetch('/api/metadata-timestamps', { cache: 'no-cache' });
  if (!res.ok) return metaTsCache || {};
  const ts = await res.json();
  metaTsCache = ts;
  metaTsFetchedAt = Date.now();
  return ts;
}
```

This doesn't reduce Firestore reads (still 1 per page load), but reduces redundant API calls during rapid navigation.

---

## Read Reduction Projection

After all steps applied:

| Scenario | Before | After | Reduction |
|----------|--------|-------|-----------|
| **Cold load** (first visit) | 258 reads | ~120 reads | 53% |
| **Warm reload** (same user, cache hit) | 258 reads | **1 read** | 99.6% |
| **Soft navigation** (between pages) | 100-150 reads | **0 reads** | 100% |

The **1 remaining read** on warm reload is the `metadata/cacheTimestamps` doc, which is required to validate cache freshness. Every `getCachedData` call will HIT after that.

---

## 30-Day Per-Entry Eviction — Already Works Correctly

Your existing code handles this per-entry:

```typescript
// In getCachedData (cache-manager.ts:192-193)
const age = now - entry.t;   // each entry has its own t timestamp
if (age < THIRTY_DAYS_MS) { ... }

// In runCacheCleanup (cache-cleanup.ts:24)
if (Date.now() - entry.t > THIRTY_DAYS_MS && entry.t > 0) {
  localStorage.removeItem(key);  // entry evicted independently
}
```

Each cache entry has its own `t` (timestamp of when it was cached). A collection cached 10 days ago will be evicted in 20 days; one cached yesterday will last 29 more days. **No changes needed here.**

---

## Summary: Files to Change

| Step | File | Lines Changed | Read Reduction |
|------|------|--------------|----------------|
| 1 | `lib/cache-cleanup.ts` | 3 lines | Prevents perpetual refetches |
| 2 | `app/api/about-stats/route.ts` | Rewrite GET handler | **~106 reads → 1 read** |
| 3 | `lib/auth-context.tsx` | ~5 lines | 1 read → 0 on warm |
| 3 | `app/dashboard/page.tsx:108` | ~5 lines | 1 read → 0 on warm |
| 3 | `lib/theme-context.tsx` | ~5 lines | 1 read → 0 on warm |
| 4 | `lib/cache-manager.ts` | ~15 lines | ~55 duplicate reads eliminated |
| 5 | 3 page files | 3 lines each | Cache hits on revisit |
| 6 | `app/dashboard/page.tsx:236` | 1 line | 1 read eliminated |
| 7 | `lib/cache-manager.ts` | ~5 lines | Prevents redundant API calls |
