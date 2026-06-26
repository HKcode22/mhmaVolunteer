# Frontend Cache System - Part 2 (Fixed Implementation)

## Issues Fixed

### 1. Cache Cleanup Filter Logic (lib/cache-cleanup.ts:32-38)

**Problem:** The filter condition `!isNaN(ts) && ts > cutoff` was **inverted** - it removed valid items and kept invalid/older items.

**Fix:** Changed to `isNaN(ts) || ts > cutoff` to match the `filterByAge` logic in cache-manager.ts, keeping items that have no date OR are within 30 days.

Also added proper handling for serialized Firestore timestamps (objects with `seconds` and `nanoseconds` properties).

### 2. Firestore Timestamp Serialization (lib/cache-manager.ts:45-54, lib/cache-cleanup.ts:32-42)

**Problem:** When Firestore Timestamp objects are serialized to localStorage (via `JSON.stringify`), they become plain objects like `{seconds: 1780615226, nanoseconds: 402000000}` or `{type: "firestore/timestamp/1.0", seconds: ...}`. The code was checking `date.toDate()` which doesn't exist on serialized objects.

**Fix:** Added proper handling for serialized timestamps:
```typescript
if (typeof date === 'object' && date.seconds) {
  const ts = date.seconds * 1000 + Math.floor((date.nanoseconds || 0) / 1000000);
  return ts > cutoff;
}
```

### 3. Navigation Overwriting Full Data with Filtered Subsets

**Problem:** Navigation component was calling `setPageData()` with only pending/unread items, overwriting the full dataset that Dashboard needed. This caused:
- Dashboard to show stale/empty data
- AI assistant to report incorrect counts
- Board members missing events, programs, etc.

**Fix:** Navigation now:
1. Reads directly from localStorage cache using `readCache()` helper
2. Only extracts counts from the cached data without modifying pageData
3. Still fetches fresh data if cache is missing, but uses the full dataset from cache

### 4. Metadata Cache Not Invalidated on Cache Invalidation

**Problem:** When `invalidateCache()` was called, it removed the cache entry but the module-level `metaTsCache` remained, causing stale metadata comparisons on subsequent loads.

**Fix:** Added `resetTimestampsCache()` call inside `invalidateCache()`:
```typescript
export function invalidateCache(key: string | string[]): void {
  // ... remove entries ...
  resetTimestampsCache(); // Clear metadata cache too
}
```

## Key Design Decisions (Corrected)

### Cache Read Strategy
```
getCachedData() flow:
1. Check localStorage entry exists
2. If exists and < 24h old:
   a. Check metadata timestamp (only if entry.s >= serverTs)
   b. If server has newer data → invalidate and fetch
   c. Otherwise → return cached data (0 reads)
3. If missing or expired → fetch from Firestore + metadata timestamp
```

### Firestore Timestamps in Cache
All timestamps are stored as:
- Serialized Firestore timestamps: `{seconds: number, nanoseconds: number}` or `{type: "firestore/timestamp/1.0", ...}`
- ISO date strings: `"2026-06-08T02:04:28.097Z"`
- Native Date objects (rare, for client-only timestamps)

The `filterByAge` function now properly handles all three formats.

### 30-Day Rolling Window for Board Members

The `runCacheCleanup()` function runs once per session and:
1. Removes entries older than 24 hours (TTL check) - keeps cache fresh
2. Filters items within cached arrays older than 30 days - keeps localStorage under 4MB
3. Evicts oldest collections if total size > 4MB

**Important:** This only affects localStorage cache. All Firestore data is preserved indefinitely. For CSV exports, the system fetches directly from Firestore (bypassing cache).

## Correct Behavior Summary

| Operation | Cache Effect | Firestore Reads |
|-----------|--------------|-----------------|
| Board member creates event (via dashboard) | `appendToCache` prepends new item to existing array | 0 |
| Board member updates event | `updateCachedItem` modifies specific item in-place | 0 |
| Board member deletes event | `removeCachedItem` removes specific item | 0 |
| Member submits RSVP (public form) | API writes to Firestore + metadata timestamp | 0 on member side |
| Board member loads dashboard (warm cache) | Cache hit, metadata check passed | 0 |
| Board member loads dashboard (stale server) | Cache invalidated via metadata check | 1 |

## What the Documentation Got Wrong

### Scenario: Update Event
The documentation stated `invalidateCache('events')` on update, but the actual code uses `updateCachedItem('events', id, data)`. This is the **correct behavior** - update modifies in-place rather than clearing all cache.

Same for delete - `removeCachedItem` removes just the specific item, not the entire cache.

### Scenario: API Route Writes
When members submit RSVP/enrollment via API routes:
1. Data is written to Firestore
2. Metadata timestamp is updated
3. Board member's browser: if cache < 24h old, they see stale data until cache expires
4. This is intentional - real-time updates would require WebSockets or `onSnapshot`

If immediate updates are needed, consider:
- Using Firebase's `onSnapshot` for real-time listeners
- Implementing periodic cache refresh for board members
- Using Server-Sent Events (SSE) to push cache invalidation signals

## Testing Verification Steps

1. **Clear localStorage** and load dashboard - expect 17-18 Firestore reads
2. **Refresh dashboard** - expect 0 reads (all from cache)
3. **Create event** - expect 0 reads, new event appears immediately
4. **Update event** - expect 0 reads during update, cache updated in-place
5. **Delete event** - expect 0 reads during delete, item removed from cache in-place
6. **Submit RSVP as member** - board member sees it only after cache expires (24h) or manual refresh
7. **Check cache entries** - verify timestamps are correctly parsed, 30-day filter works

## CSV Export Enhancement

Currently, CSV export fetches directly from Firestore with `limit(9999)`. To add date range filtering:

1. Add UI for date range selection before export
2. Pass date params to the fetch function
3. The export bypasses cache entirely - always fresh from Firestore

---

*This document supersedes the incorrect scenarios described in FRONTEND-CACHE-SYSTEM.md*
*All code changes have been applied to: lib/cache-manager.ts, lib/cache-cleanup.ts, app/components/Navigation.tsx*