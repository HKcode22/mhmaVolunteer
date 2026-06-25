'use client';

import { auth } from "./firebase-client";

const PREFIX = 'mhma_v5_';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  d: T;
  t: number;
  s: number;
}

// ─── Module-level batch metadata cache ───
let metaTsPromise: Promise<Record<string, number>> | null = null;
let metaTsCache: Record<string, number> | null = null;

async function fetchAllTimestamps(): Promise<Record<string, number>> {
  try {
    const res = await fetch('/api/metadata-timestamps', { cache: 'no-cache' });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

function getCurrentTimestamps(): Promise<Record<string, number>> {
  if (metaTsCache) return Promise.resolve(metaTsCache);
  if (!metaTsPromise) {
    metaTsPromise = fetchAllTimestamps().then(ts => {
      metaTsCache = ts;
      metaTsPromise = null;
      return ts;
    });
  }
  return metaTsPromise;
}

export function resetTimestampsCache(): void {
  metaTsCache = null;
  metaTsPromise = null;
}

// ─── Age filter (30-day rolling window) ───
function filterByAge<T>(items: T[], dateField = 'createdAt'): T[] {
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  return items.filter((item: any) => {
    const date = item?.[dateField];
    if (!date) return true;
    // Handle Firestore timestamp objects (serialized as {seconds, nanoseconds} or {type: 'firestore/timestamp/...'})
    if (typeof date === 'object' && date.seconds) {
      const ts = date.seconds * 1000 + Math.floor((date.nanoseconds || 0) / 1000000);
      return ts > cutoff;
    }
    if (typeof date === 'object' && date.type?.includes('firestore/timestamp')) {
      const ts = (date as any).seconds * 1000 + Math.floor(((date as any).nanoseconds || 0) / 1000000);
      return ts > cutoff;
    }
    const ts = date.toDate ? date.toDate().getTime() : new Date(date).getTime();
    return isNaN(ts) || ts > cutoff;
  });
}

// Keep localStorage safe by stripping base64 media (data URLs).
// We only sanitize fields we know can contain base64 blobs.
function sanitizeForCache(cacheKey: string, data: any): any {
  const MEDIA_KEYS = new Set(['events', 'programs', 'news', 'testimonials', 'masjidConstruction']);
  if (!MEDIA_KEYS.has(cacheKey)) return data;

  const MAX_DATA_URL_CHARS = 200_000;

  const stripBigDataUrl = (s: any) => {
    if (typeof s !== 'string') return s;
    if (!s.startsWith('data:')) return s;
    return s.length > MAX_DATA_URL_CHARS ? '' : s;
  };

  const stripAnyDataUrl = (s: any) => {
    if (typeof s !== 'string') return s;
    if (!s.startsWith('data:')) return s;
    return '';
  };

  const sanitizeItem = (item: any) => {
    if (!item || typeof item !== 'object') return item;

    const out = { ...item };

    if (cacheKey === 'events') {
      out.poster = stripBigDataUrl(out.poster);
    }

    if (cacheKey === 'programs') {
      out.image = stripBigDataUrl(out.image);
      out.imagePoster = stripBigDataUrl(out.imagePoster);
    }

    if (cacheKey === 'news') {
      out.image = stripBigDataUrl(out.image);
    }

    if (cacheKey === 'testimonials') {
      out.photo = stripBigDataUrl(out.photo);
    }

    if (cacheKey === 'masjidConstruction') {
      // Videos are usually huge; avoid storing base64 in localStorage.
      out.image = stripAnyDataUrl(out.image);
      out.video = stripAnyDataUrl(out.video);
    }

    return out;
  };

  if (Array.isArray(data)) return data.map(sanitizeItem);
  return sanitizeItem(data);
}

// ─── Cache entry helpers ───
function getEntry<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(PREFIX + key);
    return null;
  }
}

function setEntry<T>(key: string, entry: CacheEntry<T>): void {
  try {
    const sanitizedData = sanitizeForCache(key, entry.d);
    const sanitized: CacheEntry<T> = { ...entry, d: sanitizedData } as CacheEntry<T>;
    localStorage.setItem(PREFIX + key, JSON.stringify(sanitized));
  } catch (err) {
    // localStorage quota exceeded (common if base64 media was cached).
    console.warn(`[Cache] STORE-FAIL ${key}:`, err);
  }
}

function removeEntry(key: string): void {
  localStorage.removeItem(PREFIX + key);
  localStorage.removeItem(PREFIX + key + '_lastTs');
}

// ─── Get data: checks cache, validates freshness via metadata, fetches if needed ───
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; fromCache: boolean }> {
  const entry = getEntry<T>(key);
  const now = Date.now();

  // Get current server timestamps (batched, fetched once per page load)
  const allTs = await getCurrentTimestamps();
  const serverTs = allTs[key] ?? 0;

  if (entry) {
    // Cache exists — check TTL
    const age = now - entry.t;
    if (age < THIRTY_DAYS_MS) {
      // Cache is fresh — check if server has newer data
      if (entry.s >= serverTs) {
        // ✓ No writes since cache — return cached data (0 reads)
        console.log(`[Cache] HIT  ${key} age=${(age / 1000 / 60).toFixed(0)}m`);
        return { data: entry.d, fromCache: true };
      }
      // Server has newer data — invalidate and refetch
      console.log(`[Cache] STALE ${key} (server ts=${serverTs} > cache ts=${entry.s})`);
      removeEntry(key);
    } else {
      // TTL expired
      console.log(`[Cache] EXP  ${key} age=${(age / 1000 / 60 / 60).toFixed(1)}h`);
      removeEntry(key);
    }
  }

  // Cache MISS — fetch fresh data
  console.log(`[Cache] MISS ${key} (fetching from Firestore)`);
  return fetchAndCache(key, fetchFn, serverTs);
}

// ─── Fetch from Firestore and store in cache ───
async function fetchAndCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  serverTs: number,
): Promise<{ data: T; fromCache: boolean }> {
  let data = (await fetchFn()) as T;

  const preCount = Array.isArray(data) ? data.length : 0;
  if (Array.isArray(data)) {
    data = filterByAge(data as any[]) as T;
    const postCount = Array.isArray(data) ? data.length : 0;
    if (postCount < preCount) {
      console.log(`[Cache] AGE-FILTER ${key}: dropped ${preCount - postCount} items`);
    }
  }

  const entry: CacheEntry<T> = { d: data, t: Date.now(), s: serverTs };
  setEntry(key, entry);

  const count = Array.isArray(data) ? data.length : 'N/A';
  console.log(`[Cache] STORE ${key} items=${count} size=${JSON.stringify(entry).length}B`);
  return { data, fromCache: false };
}

// ─── CREATE: prepend item to existing cache (0 reads, no invalidation) ───
export function appendToCache<T>(key: string, newItem: T): void {
  enqueueMetadataTouch([key]);
  const entry = getEntry<T[]>(key);
  if (!entry) {
    console.log(`[Cache] SKIP-APPEND ${key} (no cache to append to)`);
    return;
  }

  try {
    const before = entry.d.length;
    entry.d = filterByAge([newItem, ...entry.d]);
    entry.t = Date.now();
    setEntry(key, entry as CacheEntry<T>);
    console.log(`[Cache] APPEND ${key} items=${before}→${entry.d.length}`);
  } catch (err) {
    console.warn(`[Cache] APPEND-FAIL ${key}:`, err);
    removeEntry(key);
  }
}

// ─── UPDATE: merge partial data into specific cached item (no full invalidation) ───
export function updateCachedItem(key: string, id: string, partialData: Record<string, any>): void {
  enqueueMetadataTouch([key]);
  const entry = getEntry<any[]>(key);
  if (!entry || !Array.isArray(entry.d)) {
    console.log(`[Cache] SKIP-UPDATE ${key} (no cache or not an array)`);
    return;
  }

  const idx = entry.d.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    console.log(`[Cache] SKIP-UPDATE ${key} (item ${id} not found in cache)`);
    return;
  }

  entry.d[idx] = { ...entry.d[idx], ...partialData };
  entry.t = Date.now();
  setEntry(key, entry);
  console.log(`[Cache] UPDATE ${key} item=${id} (replaced in-place, cache preserved)`);
}

// ─── DELETE: remove specific item from cached array (no full invalidation) ───
export function removeCachedItem(key: string, id: string): void {
  enqueueMetadataTouch([key]);
  const entry = getEntry<any[]>(key);
  if (!entry || !Array.isArray(entry.d)) {
    console.log(`[Cache] SKIP-REMOVE ${key} (no cache or not an array)`);
    return;
  }

  const before = entry.d.length;
  entry.d = entry.d.filter((item: any) => item.id !== id);
  if (entry.d.length === before) {
    console.log(`[Cache] SKIP-REMOVE ${key} (item ${id} not found)`);
    return;
  }

  entry.t = Date.now();
  setEntry(key, entry as CacheEntry<any>);
  console.log(`[Cache] REMOVE ${key} item=${id} (${before}→${entry.d.length})`);
}

// ─── Full invalidation (only for major schema changes) ───
export function invalidateCache(key: string | string[]): void {
  const keys = Array.isArray(key) ? key : [key];
  enqueueMetadataTouch(keys);
  keys.forEach(k => {
    removeEntry(k);
    console.log(`[Cache] INVALIDATE ${k}`);
  });
  resetTimestampsCache();
}

// Sync the cached `s` (server metadata timestamp) after we touch metadata.
// This prevents immediate refetches for the browser that performed the write.
export function setCacheServerTimestamp(key: string, serverTs: number): void {
  const entry = getEntry<any>(key);
  if (!entry) return;
  entry.s = serverTs;
  entry.t = Date.now();
  setEntry(key, entry as CacheEntry<any>);
}

// ─── Metadata touch (cross-browser invalidation) ───
// Any client-side cache mutation that corresponds to a Firestore write should
// also bump `metadata/cacheTimestamps.<key>` so other browsers refresh on reload.
const TOUCHABLE_KEYS = [
  'events',
  'programs',
  'rsvps',
  'enrollments',
  'donations',
  'pledges',
  'users',
  'news',
  'masjidConstruction',
  'subscribers',
  'contactSubmissions',
  'schedulingRequests',
  'volunteers',
  'testimonials',
  'activityLog',
  'journal',
  'inviteCodes',
  'faq',
  'aboutStats',
  'userSettings',
] as const;

type TouchableKey = (typeof TOUCHABLE_KEYS)[number];

const TOUCHABLE_KEY_SET = new Set<string>(TOUCHABLE_KEYS as unknown as string[]);

let touchTimer: ReturnType<typeof setTimeout> | null = null;
let touchPending = new Set<TouchableKey>();

function enqueueMetadataTouch(keys: string[]): void {
  const now = Date.now();

  let added = false;
  keys.forEach(k => {
    if (!TOUCHABLE_KEY_SET.has(k)) return;
    const typed = k as TouchableKey;
    touchPending.add(typed);
    added = true;

    // Optimistically bump local `s` so the writer doesn't refetch on next load.
    setCacheServerTimestamp(typed as any, now);
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
      if (!idToken) {
        console.warn('[MetadataTouch] missing Firebase idToken; skipping:', keysToTouch);
        return;
      }

      const res = await fetch('/api/metadata-timestamps-touch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ keys: keysToTouch }),
      });

      if (!res.ok) {
        console.warn('[MetadataTouch] request failed:', res.status, keysToTouch);
        return;
      }

      const json: any = await res.json().catch(() => null);
      const updatedAt = json?.updatedAt;
      if (typeof updatedAt === 'number') {
        keysToTouch.forEach(k => setCacheServerTimestamp(k, updatedAt));
      }
    })().catch(err => console.warn('[MetadataTouch] request error:', err));
  }, 250);
}

export function clearAllCaches(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
  }
  metaTsCache = null;
  metaTsPromise = null;

  if (touchTimer) clearTimeout(touchTimer);
  touchTimer = null;
  touchPending.clear();
}

export { PREFIX, THIRTY_DAYS_MS };
