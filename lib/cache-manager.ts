'use client';

const PREFIX = 'mhma_v5_';
const TTL_24H = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  d: T;
  t: number;
  s: number;
}

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
        console.log(`[Cache] HIT  ${key} age=${((Date.now() - entry.t) / 1000 / 60).toFixed(0)}m`);
        return { data: entry.d, fromCache: true };
      }
      console.log(`[Cache] EXP  ${key} age=${((Date.now() - entry.t) / 1000 / 60 / 60).toFixed(1)}h > 24h TTL`);
      localStorage.removeItem(cacheKey);
    } catch (parseErr) {
      console.warn(`[Cache] CORRUPT ${key}:`, parseErr);
      localStorage.removeItem(cacheKey);
    }
  }

  const metaTs = await readMetadataTimestamp(key);
  const cachedTsRaw = localStorage.getItem(cacheKey + '_lastTs');
  const cachedTs = cachedTsRaw ? Number(cachedTsRaw) : 0;

  if (metaTs !== null && metaTs > cachedTs) {
    console.log(`[Cache] MISS ${key} (write detected meta=${metaTs} cached=${cachedTs})`);
  } else if (metaTs === null) {
    console.log(`[Cache] MISS ${key} (metadata API failed, fresh fetch)`);
  } else {
    console.log(`[Cache] MISS ${key} (no write — cache cleared or first visit)`);
  }

  return fetchAndCache(key, fetchFn, metaTs);
}

async function readMetadataTimestamp(key: string): Promise<number | null> {
  try {
    const res = await fetch('/api/metadata-timestamps', { cache: 'force-cache' });
    if (!res.ok) {
      console.warn(`[Cache] META-API ${key} returned ${res.status}`);
      return null;
    }
    const meta = await res.json();
    return meta[key] ?? null;
  } catch (err) {
    console.warn(`[Cache] META-API ${key} fetch failed:`, err);
    return null;
  }
}

async function fetchAndCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  existingMetaTs?: number | null,
): Promise<{ data: T; fromCache: boolean }> {
  const cacheKey = PREFIX + key;
  let data = (await fetchFn()) as T;

  const preCount = Array.isArray(data) ? data.length : 0;
  if (Array.isArray(data)) {
    data = filterByAge(data as any[]) as T;
    const postCount = Array.isArray(data) ? data.length : 0;
    if (postCount < preCount) {
      console.log(`[Cache] AGE-FILTER ${key}: dropped ${preCount - postCount} items over 30d`);
    }
  }

  const sanitized = sanitizeForCache(key, data);

  let serverTs = existingMetaTs ?? Date.now();
  if (existingMetaTs === undefined) {
    try {
      const res = await fetch('/api/metadata-timestamps', { cache: 'force-cache' });
      if (res.ok) {
        const meta = await res.json();
        if (meta[key]) serverTs = meta[key];
      }
    } catch {}
  }

  const entry: CacheEntry<T> = { d: sanitized, t: Date.now(), s: serverTs };
  localStorage.setItem(cacheKey, JSON.stringify(entry));
  localStorage.setItem(cacheKey + '_lastTs', String(serverTs));

  const count = Array.isArray(data) ? data.length : 'N/A';
  console.log(`[Cache] STORE ${key} items=${count} size=${JSON.stringify(entry).length}B`);
  return { data, fromCache: false };
}

function sanitizeForCache(key: string, data: any): any {
  if (key === 'masjidConstruction' && Array.isArray(data)) {
    return data.map((item: any) => {
      const { image, ...rest } = item;
      return rest;
    });
  }
  if ((key === 'events' || key === 'programs' || key === 'news') && Array.isArray(data)) {
    return data.map((item: any) => {
      const { image, poster, ...rest } = item;
      return rest;
    });
  }
  return data;
}

export function appendToCache<T>(key: string, newItem: T): void {
  const cacheKey = PREFIX + key;
  const raw = localStorage.getItem(cacheKey);
  if (!raw) {
    console.log(`[Cache] SKIP-APPEND ${key} (no cache to append to)`);
    return;
  }

  try {
    const entry: CacheEntry<T[]> = JSON.parse(raw);
    const before = entry.d.length;
    entry.d = filterByAge([newItem, ...entry.d]);
    const after = entry.d.length;
    entry.t = Date.now();
    localStorage.setItem(cacheKey, JSON.stringify(entry));
    console.log(`[Cache] APPEND ${key} items=${before}→${after} (+1 prepended)`);
  } catch (err) {
    console.warn(`[Cache] APPEND-FAIL ${key}: removing corrupt cache`, err);
    localStorage.removeItem(cacheKey);
  }
}

export function invalidateCache(key: string | string[]): void {
  const keys = Array.isArray(key) ? key : [key];
  keys.forEach(k => {
    localStorage.removeItem(PREFIX + k);
    localStorage.removeItem(PREFIX + k + '_lastTs');
    console.log(`[Cache] INVALIDATE ${k}`);
  });
}

export function clearAllCaches(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
  }
}

export { PREFIX, TTL_24H, THIRTY_DAYS_MS };
