'use client';

/**
 * Cache Debug Utility
 * 
 * Paste this in browser console to verify cache state:
 *   import { dumpCache, simulateColdLoad } from '@/lib/cache-debug';
 *   dumpCache();
 * 
 * Or copy-paste the IIFE version below.
 */

const PREFIX = 'mhma_v5_';

export function dumpCache(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  keys.sort();
  console.log(`\n═══════════════════ CACHE DUMP ═══════════════════`);
  console.log(`Total cache entries: ${keys.length}`);
  console.log(`Total localStorage size: ~${(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB`);
  console.log(`──────────────────────────────────────────────────`);
  let totalSize = 0;
  keys.forEach(k => {
    const collection = k.replace(PREFIX, '').replace('_lastTs', '');
    const raw = localStorage.getItem(k);
    if (!raw) return;
    const size = raw.length;
    totalSize += size;
    const isLastTs = k.endsWith('_lastTs');
    if (isLastTs) {
      console.log(`  ${collection} (metadata timestamp): ${raw}`);
    } else {
      try {
        const parsed = JSON.parse(raw);
        const data = parsed.d;
        const count = Array.isArray(data) ? data.length : 'N/A';
        const age = ((Date.now() - parsed.t) / 1000 / 60).toFixed(1);
        const expiresIn = Math.max(0, Math.round((24 * 60 * 60 * 1000 - (Date.now() - parsed.t)) / 1000 / 60));
        console.log(`  ${collection.padEnd(25)} ${String(count).padStart(4)} items  ${age.padStart(6)}m old  ${expiresIn}m TTL  ${(size / 1024).toFixed(1)} KB`);
      } catch {
        console.log(`  ${collection} (corrupt)`);
      }
    }
  });
  console.log(`──────────────────────────────────────────────────`);
  console.log(`Total cache data size: ~${(totalSize / 1024).toFixed(1)} KB`);
  console.log(`Estimated Firestore reads saved: ${keys.filter(k => !k.endsWith('_lastTs')).length * 5} (conservative)`);
  console.log(`══════════════════════════════════════════════════\n`);
}

export function clearCache(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
  console.log(`[Cache] Cleared ${keys.length} cache entries`);
}

export function simulateColdLoad(key?: string): void {
  if (key) {
    localStorage.removeItem(PREFIX + key);
    localStorage.removeItem(PREFIX + key + '_lastTs');
    console.log(`[Cache] Simulated cold load for '${key}' — cache cleared, next fetch will hit Firestore`);
  } else {
    clearCache();
    console.log(`[Cache] Simulated full cold load — all caches cleared`);
  }
}

export function checkReadCount(): void {
  const lastTsKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX) && k.endsWith('_lastTs')) {
      lastTsKeys.push(k);
    }
  }
  const dataKeys = lastTsKeys.map(k => k.replace('_lastTs', ''));
  const accessed = dataKeys.filter(k => localStorage.getItem(k));
  const missed = dataKeys.filter(k => !localStorage.getItem(k));
  console.log(`\n═══════════════ READ COUNT CHECK ═══════════════`);
  console.log(`Collections cached: ${dataKeys.length}`);
  console.log(`  ✓ Cache HIT (0 reads): ${accessed.length}`);
  console.log(`  ✗ Cache MISS (1 read each): ${missed.length}`);
  console.log(`Estimated page load reads: ${missed.length + 2} (${missed.length} cache misses + 2 uncacheable: auth+theme)`);
  console.log(`Savings: ${dataKeys.length} collections × ${accessed.length}/${dataKeys.length} hit ratio`);
  console.log(`═══════════════════════════════════════════════\n`);
}

// Self-executing version for console paste:
// (function(){const P='mhma_v5_',k=[];for(let i=0;i<localStorage.length;i++){const l=localStorage.key(i);if(l?.startsWith(P))k.push(l)}k.sort();console.log('Cache:',k.length,'entries');k.forEach(c=>{const r=localStorage.getItem(c);if(!r)return;try{const p=JSON.parse(r);console.log(' ',c.replace(P,''),Array.isArray(p.d)?p.d.length:'?','items,',Math.round((Date.now()-p.t)/60000)+'m old')}catch{}})})()
