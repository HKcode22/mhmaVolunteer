# Frontend Cache System - Part 3 (Live-Data Freshness)

## Goal
Stop excessive Firestore reads on reload while ensuring that **all dynamic live data** stays fresh across multiple board-member browsers/tabs.

The system needs two guarantees:
1. **Warm reloads are cache reads (no Firestore reads).**
2. **After any write (create/update/delete), other browsers refresh on next reload** (no stale dashboards).

This part implements a unified “metadata touch” pipeline so that any write that changes a cached collection also updates a server-side timestamp. `getCachedData()` then invalidates localStorage when it detects newer server timestamps.

## Why this fixes stale/massive reads
Previously, some updates didn’t consistently update `metadata/cacheTimestamps.<collectionKey>`, so other browsers kept their local cache even after Firestore had changed.

This part enforces:
- **Client-side writes (board dashboard)** update metadata automatically (centralized).
- **Server-side writes (public/member API routes)** update metadata explicitly.
- **Public pages** no longer use heavy `no-store` endpoints for list/count derivation.

## Core data model
Every localStorage cache entry uses this shape:

```ts
type CacheEntry<T> = {
  d: T; // cached data
  t: number; // client timestamp for TTL
  s: number; // server metadata timestamp last observed for this key
};
```

LocalStorage key:
`mhma_v5_` + `<cacheKey>`

TTL:
`THIRTY_DAYS_MS` (30 days)

## Read path: `getCachedData(key, fetchFn)`
File: `lib/cache-manager.ts`

High-level flow:
1. Read localStorage entry `mhma_v5_<key>`
2. If the cached entry was created by an older retention policy, discard it (schema version mismatch)
3. Fetch current server timestamps (batched) from:
   - `/api/metadata-timestamps`
4. If cache entry exists and:
   - age < 30 days, and
   - `entry.s >= serverTs`
   => return cached data (0 Firestore reads)
5. Otherwise:
   - remove the entry
   - fetch from Firestore via `fetchFn`
   - store `{ d, t, s }` with `s = serverTs`

Key code:

```ts
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; fromCache: boolean }> {
  const entry = getEntry<T>(key);
  const now = Date.now();

  const allTs = await getCurrentTimestamps();
  const serverTs = allTs[key] ?? 0;

  if (entry) {
    const age = now - entry.t;
    if (age < THIRTY_DAYS_MS) {
      if (entry.s >= serverTs) {
        return { data: entry.d, fromCache: true };
      }
      removeEntry(key);
    } else {
      removeEntry(key);
    }
  }

  return fetchAndCache(key, fetchFn, serverTs);
}
```

## Write path: centralized metadata touch (board dashboard)
File: `lib/cache-manager.ts`

Any cache mutation that happens due to a Firestore write now:
1. Updates localStorage immediately
2. Calls `enqueueMetadataTouch([key])`
3. Debounces touches and POSTs to:
   - `/api/metadata-timestamps-touch`
4. Server writes `metadata/cacheTimestamps.<key> = now`
5. Other browsers reload => `getCachedData()` sees `serverTs` increased => invalidates and refetches

Where touches are enqueued:
- `appendToCache(key, item)` (create)
- `updateCachedItem(key, id, patch)` (update)
- `removeCachedItem(key, id)` (delete)
- `invalidateCache(keys)` (major invalidation)

Key code:

```ts
function enqueueMetadataTouch(keys: string[]): void {
  const now = Date.now();
  let added = false;

  keys.forEach(k => {
    if (!TOUCHABLE_KEY_SET.has(k)) return;
    touchPending.add(k as TouchableKey);
    added = true;
    setCacheServerTimestamp(k as any, now); // optimistic bump for the writer
  });

  if (!added) return;
  if (touchTimer) return;

  touchTimer = setTimeout(() => {
    touchTimer = null;
    const keysToTouch = Array.from(touchPending);
    touchPending.clear();
    if (keysToTouch.length === 0) return;

    void (async () => {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const res = await fetch('/api/metadata-timestamps-touch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ keys: keysToTouch }),
      });

      if (!res.ok) return;

      const json: any = await res.json().catch(() => null);
      const updatedAt = json?.updatedAt;
      if (typeof updatedAt === 'number') {
        keysToTouch.forEach(k => setCacheServerTimestamp(k, updatedAt));
      }
    })().catch(() => {});
  }, 250);
}
```

## Write path: server-side metadata touch (public/member API routes)
Client-side cache mutations only exist on board dashboards (client SDK writes).
Public/member submissions happen in server API routes, so these routes now update metadata directly.

Server routes updated in this part:
- `app/api/contact/route.ts`:
  - touches `metadata/cacheTimestamps.contactSubmissions`
- `app/api/submit-volunteer/route.ts`:
  - touches `metadata/cacheTimestamps.volunteers`
- `app/api/event-scheduling/route.ts`:
  - touches `metadata/cacheTimestamps.schedulingRequests`
- `app/api/pledge/route.ts`:
  - touches `metadata/cacheTimestamps.pledges`
- `app/api/stripe-webhook/route.ts`:
  - touches `metadata/cacheTimestamps.donations`
- `app/api/subscribe/route.ts`:
  - touches `metadata/cacheTimestamps.subscribers`

Example (pattern) used:
```ts
const now = Date.now();
await firestore.collection("metadata").doc("cacheTimestamps").set(
  { <collectionKey>: now, _updatedAt: now },
  { merge: true },
);
```

## Metadata touch authorization
File: `app/api/metadata-timestamps-touch/route.ts`

This endpoint:
- verifies Firebase ID token from `Authorization: Bearer <token>`
- role-checks user is `board_member` or `administrator`
- allows touches for the configured list of cache keys (all dynamic collections this app caches)

## Base64 sanitization + cleanup (prevents localStorage quota failures)
File: `lib/cache-manager.ts`
- `setEntry()` now sanitizes base64 `data:` fields for known image/video keys:
  - `events.poster` (strip if too large)
  - `programs.image`, `programs.imagePoster` (strip if too large)
  - `news.image` (strip if too large)
  - `testimonials.photo` (strip if too large)
  - `masjidConstruction.image` and `masjidConstruction.video` (strip any `data:`)

File: `lib/cache-cleanup.ts`
- mirrors sanitization for existing cached entries
- trims cached arrays using `MAX_ITEMS_BY_KEY` (e.g. programs capped at 50)
- enforces the 30-day TTL for the whole cache entry and evicts if total localStorage exceeds 4MB

## Public pages: remove remaining `no-store` heavy endpoints
### Events page
File: `app/events/page.tsx`
- uses `getCachedData('events', ...)` and `getCachedData('rsvps', ...)`
- computes RSVP counts client-side from cached RSVPs
- no longer uses the old `/api/events` no-store path

### Programs page
File: `app/programs/page.tsx`
- removes `fetch('/api/programs', { cache: "no-store" })`
- computes enrollment counts from cached `enrollments`

## Notification counters: avoid overwriting caches with filtered subsets
File: `app/components/Navigation.tsx`
- board-member notification fetches now pull full arrays (still limited) for:
  - `enrollments`, `contactSubmissions`, `schedulingRequests`, `rsvps`
- pending/unread counts are computed client-side

This prevents Navigation from “priming” `rsvps` or other cache keys with only a filtered subset.

## Scenario flows (step-by-step)

### A) Warm reload: no writes since last cache
Example: board member opens `/dashboard/events`.
1. `getCachedData('events')` reads localStorage entry
2. fetches server timestamps once from `/api/metadata-timestamps`
3. `entry.s >= serverTs` => cache HIT
4. UI renders without Firestore reads for `events`

Expected console markers:
- `[Cache] HIT events`

### B) Board creates/updates/deletes an Event (cross-browser freshness)
1. Board dashboard calls Firestore write via `lib/firebase.ts`
2. After the write, the client cache is updated via:
   - `appendToCache('events', ...)`
   - or `updateCachedItem('events', ...)`
   - or `removeCachedItem('events', ...)`
3. Those cache functions call `enqueueMetadataTouch(['events'])`
4. The metadata touch endpoint writes:
   - `metadata/cacheTimestamps.events = <now>`
5. In another browser:
   - on reload, `getCachedData('events')` sees `serverTs > entry.s`
   - invalidates the local entry and refetches from Firestore

Expected console markers on the other browser:
- `[Cache] STALE events (server ts=... > cache ts=...)`

### C) Three members submit RSVP (public form) and board sees it
Assume 3 different members submit RSVP around the same time.

1. Each member POSTs to `/api/rsvp`
2. The API route writes each RSVP to Firestore (`collection("rsvps").add(...)`)
3. Each API request updates:
   - `metadata/cacheTimestamps.rsvps = Date.now()`

Board-member browser:
4. On the next time the board page calls `getCachedData('rsvps')` (typically after a reload):
   - `getCachedData()` reads the local `entry.s` from localStorage
   - it fetches the latest server timestamp from `/api/metadata-timestamps`
   - because server `rsvps` ts increased, `entry.s < serverTs`
   - `getCachedData()` removes the local cache entry and refetches `rsvps`

So in this scenario:
- The RSVPs are **saved to Firestore** via the API (not written into localStorage at save time).
- The board reads from localStorage only when the cache is a HIT.
- After member writes, the *first* board reload will refetch `rsvps` from Firestore to stay fresh.

Where the “append thing” happens:
5. `appendToCache('rsvps', ...)` does **not** run for member submissions.
   - Member submissions are server API writes, not client SDK writes.
   - `appendToCache` is only used for board-dashboard client-side writes in `lib/firebase.ts`.

### D) Member submits Contact submission
Same pattern as C, but for:
- collection key: `contactSubmissions`
- route: `app/api/contact/route.ts`

### E) Member submits Volunteer
- collection key: `volunteers`
- route: `app/api/submit-volunteer/route.ts`

### F) Member submits Scheduling request
- collection key: `schedulingRequests`
- route: `app/api/event-scheduling/route.ts`

### G) Member submits Pledge
- collection key: `pledges`
- route: `app/api/pledge/route.ts`

### H) Stripe donation completed
- collection key: `donations`
- route: `app/api/stripe-webhook/route.ts`

### I) Newsletter subscribe
- collection key: `subscribers`
- route: `app/api/subscribe/route.ts`

### J) Base64 media handling
1. Board adds an image/video (often as `data:` URLs)
2. When cached, `setEntry()` sanitizes media fields to prevent localStorage quota blowups
3. `runCacheCleanup()` sanitizes old cached entries too
4. If poster/media is stripped, UI falls back (and metadata invalidation ensures the next refetch gets fresh server data)

## Detailed: update/delete writes and what happens in localStorage

This addresses the common confusion in the older docs (“write empties localStorage”).

### Board write (client SDK) path
When a board member updates/creates/deletes a cached collection, the client-side Firestore helper updates **localStorage in-place**.

Where it happens:
- `lib/firebase.ts` calls cache mutation helpers after Firestore succeeds:
  - CREATE: `appendToCache(<key>, newItem)`
  - UPDATE: `updateCachedItem(<key>, id, patch)`
  - DELETE: `removeCachedItem(<key>, id)`
- Those helpers live in `lib/cache-manager.ts` and they:
  1. read the cached entry (`mhma_v5_<key>`)
  2. update `entry.d` (prepend/merge/remove)
  3. bump `entry.t = Date.now()`
  4. write back with `setEntry()` (also sanitizes + stamps `entry.v`)

Important:
- For UPDATE/DELETE, we do **not** wipe the whole cache key.
- We only remove a cache key when `getCachedData()` determines it is stale.

### Member write (server API route) path
For public/member forms, there is no `appendToCache()` on the board client because the member writes happen in Next.js API routes.
Instead, the API route updates:
- Firestore collection (`rsvps`, `contactSubmissions`, etc.)
- `metadata/cacheTimestamps.<key>`

### Read path: how does `getCachedData()` decide to refetch?
In `lib/cache-manager.ts`, `getCachedData(<key>)`:

1. Reads local `entry` from `mhma_v5_<key>`
2. If `entry.v` is missing/old, it discards the cache entry (prevents pruned/empty data from old retention rules)
3. Checks TTL: if cache entry is older than `THIRTY_DAYS_MS`, it refetches
4. Fetches server metadata timestamps from `/api/metadata-timestamps`
5. Compares freshness:
   - If `entry.s >= serverTs`: return cached data (0 reads from Firestore for that key)
   - Else: `removeEntry(key)` and refetch via `fetchFn`

So the “write empties localStorage then next read fetches” pattern is only true when:
- a cache key is fully invalidated via `invalidateCache(key)`, or
- `getCachedData()` removes it because it detected a newer server timestamp.


## Validation checklist (what to test locally)
1. Build/compile:
   - `npm run build` should succeed
2. Warm cache:
   - clear localStorage, open a dashboard page once
   - then reload; verify you see cache HIT logs and reduced Firestore reads
3. Cross-browser freshness:
   - open two incognito tabs as a board member
   - perform a board write (create/update/delete)
   - refresh the other tab and verify it logs `[Cache] STALE <key>`
4. Public pages:
   - `/events` should not use the old `/api/events` no-store scanning path
   - `/programs` should not use the old `/api/programs` no-store scanning path
5. Base64:
   - add/update a poster/video and ensure the app doesn’t crash from localStorage quota errors

## Files touched in this part (important ones)
- `lib/cache-manager.ts`
- `lib/cache-cleanup.ts`
- `app/api/metadata-timestamps-touch/route.ts`
- `app/api/contact/route.ts`
- `app/api/submit-volunteer/route.ts`
- `app/api/event-scheduling/route.ts`
- `app/api/pledge/route.ts`
- `app/api/stripe-webhook/route.ts`
- `app/api/subscribe/route.ts`
- `app/components/Navigation.tsx`
- `app/events/page.tsx`
- `app/programs/page.tsx`

