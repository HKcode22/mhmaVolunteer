'use client';

const PREFIX = 'mhma_v5_';
const TTL_24H = 24 * 60 * 60 * 1000;
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
    if (typeof date === 'object' && date.seconds) return true;
    const ts = date.toDate ? date.toDate().getTime() : new Date(date).getTime();
    return isNaN(ts) || ts > cutoff;
  });
}

// No sanitization needed — all fields are required for rendering

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
  localStorage.setItem(PREFIX + key, JSON.stringify(entry));
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
    if (age < TTL_24H) {
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
  keys.forEach(k => {
    removeEntry(k);
    console.log(`[Cache] INVALIDATE ${k}`);
  });
}

export function clearAllCaches(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
  }
  metaTsCache = null;
  metaTsPromise = null;
}

export { PREFIX, TTL_24H, THIRTY_DAYS_MS };
