'use client';

import { PREFIX, TTL_24H, THIRTY_DAYS_MS } from './cache-manager';

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

      if (Date.now() - entry.t > TTL_24H && entry.t > 0) {
        localStorage.removeItem(key);
        continue;
      }

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
