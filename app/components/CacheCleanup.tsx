'use client';

import { useEffect } from 'react';
import { runCacheCleanup } from '@/lib/cache-cleanup';

export default function CacheCleanup() {
  useEffect(() => {
    runCacheCleanup();
  }, []);

  return null;
}
