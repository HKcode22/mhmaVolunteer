'use client';

import { PREFIX, THIRTY_DAYS_MS } from './cache-manager';

const MAX_TOTAL_SIZE = 4 * 1024 * 1024;

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

      if (Date.now() - entry.t > THIRTY_DAYS_MS && entry.t > 0) {
        localStorage.removeItem(key);
        continue;
      }

      if (Array.isArray(entry.d) && !key.endsWith('_lastTs')) {
        const cutoff = Date.now() - THIRTY_DAYS_MS;
        const before = entry.d.length;
        let sanitizedChanged = false;
        entry.d = entry.d.filter((item: any) => {
          const date = item?.createdAt;
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

        // Reduce localStorage pressure by removing base64 posters from cached events.
        // (Rendering still works because the UI already falls back to a default poster.)
        const logicalKey = key.slice(PREFIX.length);
        if (logicalKey === 'events' && Array.isArray(entry.d)) {
          entry.d = entry.d.map((it: any) => {
            if (it && typeof it.poster === 'string' && it.poster.startsWith('data:')) {
              sanitizedChanged = true;
              return { ...it, poster: '' };
            }
            return it;
          });
        }

        if (entry.d.length < before || sanitizedChanged) {
          entry.t = Date.now();
          localStorage.setItem(key, JSON.stringify(entry));
        }
      }

      entries.push({ key, t: entry.t || 0, size });
    } catch {
      localStorage.removeItem(key);
    }
  }

  if (totalSize > MAX_TOTAL_SIZE) {
    entries.sort((a, b) => a.t - b.t);
    while (totalSize > MAX_TOTAL_SIZE && entries.length > 0) {
      const oldest = entries.shift()!;
      localStorage.removeItem(oldest.key);
      totalSize -= oldest.size;
    }
  }
}
