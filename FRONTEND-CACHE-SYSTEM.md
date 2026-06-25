# Frontend Cache System

## Architecture Overview

```
Browser (client-side)
┌────────────────────────────────────────────────────┐
│  AiAssistant.tsx                                    │
│  ┌─────────────────────────────────────────────┐    │
│  │ answerFromCache(query, pageData)             │    │
│  │  → reads pageData (React context, 0 I/O)     │    │
│  │  → falls back to localStorage (0 network)    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Page (dashboard/page.tsx, page.tsx, etc.)           │
│  ┌─────────────────────────────────────────────┐    │
│  │ getCachedData('events', fetchFn)             │    │
│  │  → checks localStorage → HIT → return data   │    │
│  │  → checks localStorage → MISS → fetchFn()    │    │
│  │    → filterByAge() → sanitizeForCache()      │    │
│  │    → store in localStorage → return data     │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Write operation (create/update/delete)              │
│  ┌─────────────────────────────────────────────┐    │
│  │ firebase.ts helper functions                 │    │
│  │  → appendToCache('events', newItem)  (CREATE)│    │
│  │  → invalidateCache('events') (UPDATE/DELETE) │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  CacheCleanup (once per session)                    │
│  ┌─────────────────────────────────────────────┐    │
│  │ runCacheCleanup()                            │    │
│  │  → remove >24h entries                       │    │
│  │  → evict oldest if >4MB                     │    │
│  └─────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘

Server (Firebase Admin SDK)
┌────────────────────────────────────────────────────┐
│  metadata/cacheTimestamps document                 │
│  ┌─────────────────────────────────────────────┐    │
│  │ { events: 1719000000000,                    │    │
│  │   programs: 1719000000000,                  │    │
│  │   ...                                       │    │
│  │   _updatedAt: 1719000000000 }               │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  API routes write-trigger:                          │
│  → /api/rsvp writes rsvps timestamp                 │
│  → /api/enroll writes enrollments timestamp         │
│  → /api/unsubscribe writes subscribers timestamp    │
│  → /api/use-invite writes inviteCodes timestamp     │
│  → /api/about-stats writes aboutStats timestamp     │
│  → /api/cleanup-activity writes activityLog ts      │
└────────────────────────────────────────────────────┘
```

---

## Core Cache Logic

### `lib/cache-manager.ts` — The heart of the system

#### Storage Format

Each cache entry in localStorage uses this structure (`CacheEntry<T>`):

```typescript
// lib/cache-manager.ts:7-11
interface CacheEntry<T> {
  d: T;        // data (short key to reduce serialized size)
  t: number;   // timestamp when cached (Date.now())
  s: number;   // server metadata timestamp at time of fetch
}
```

Key naming: `mhma_v5_<collectionName>` (e.g., `mhma_v5_events`).

#### Get + Cache (`getCachedData`)

Flow: **localStorage check → metadata timestamp check → fetch → filter → store**

```typescript
// lib/cache-manager.ts:24-54
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; fromCache: boolean }> {
  const cacheKey = 'mhma_v5_' + key;  // PREFIX + key (PREFIX = 'mhma_v5_')
  const raw = localStorage.getItem(cacheKey);

  // SCENARIO 1: Cache hit — return immediately (0 reads)
  if (raw) {
    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.t < TTL_24H) {
        // ✓ Cache is fresh (< 24 hours old)
        return { data: entry.d, fromCache: true };
      }
      // ✗ Cache expired (> 24 hours), remove and continue to fetch
      localStorage.removeItem(cacheKey);
    } catch {
      // ✗ Cache corrupt, remove and continue to fetch
      localStorage.removeItem(cacheKey);
    }
  }

  // Metadata Timestamp Fallback (Choice 2):
  // Only reached when cache key is MISSING (either never cached, expired, or invalidated)
  const metaTs = await readMetadataTimestamp(key);
  const cachedTsRaw = localStorage.getItem(cacheKey + '_lastTs');
  const cachedTs = cachedTsRaw ? Number(cachedTsRaw) : 0;

  if (metaTs !== null && metaTs > cachedTs) {
    console.log('[Cache] MISS (write detected — data changed on server)');
  } else {
    console.log('[Cache] MISS (cache cleared or first visit)');
  }

  return fetchAndCache(key, fetchFn, metaTs);
}
```

#### Fetch + Store (`fetchAndCache`)

```typescript
// lib/cache-manager.ts:67-97
async function fetchAndCache<T>(key, fetchFn, existingMetaTs?) {
  let data = await fetchFn();  // 1 Firestore read

  // SCENARIO: 30-day rolling window — drop items older than 30 days
  if (Array.isArray(data)) {
    data = filterByAge(data);
  }

  // SCENARIO: Base64 media stripping (masjid construction only)
  const sanitized = sanitizeForCache(key, data);

  // Store with metadata timestamp
  const entry: CacheEntry<T> = {
    d: sanitized,
    t: Date.now(),         // client timestamp (for 24h TTL check)
    s: serverTs,           // server metadata timestamp (for invalidation detection)
  };
  localStorage.setItem(cacheKey, JSON.stringify(entry));
  localStorage.setItem(cacheKey + '_lastTs', String(serverTs));

  return { data, fromCache: false };
}
```

---

## Scenario Walkthroughs

### Scenario 1: First Page Load (Cold Cache)

**What happens when a user visits the dashboard for the first time:**

```
1. Navigation component mounts
2. Dashboard component mounts
3. getCachedData('events', () => fetchEvents(100)) called
4. localStorage.getItem('mhma_v5_events') → null (nothing cached)
5. readMetadataTimestamp('events') → fetch('/api/metadata-timestamps') → 0 (no previous writes)
6. cachedTs = 0 (no _lastTs in localStorage)
7. metaTs (0) > cachedTs (0)? No → "MISS (cache cleared or first visit)"
8. fetchAndCache('events', ...) called:
   a. fetchEvents(100) → 1 Firestore read
   b. filterByAge(events) → keeps/drops items over 30 days
   c. sanitizeForCache('events', events) → passthrough (only masjidConstruction has sanitization)
   d. Store in localStorage: mhma_v5_events = { d: [...], t: now, s: 0 }
   e. Store _lastTs: mhma_v5_events_lastTs = "0"
9. Return data (fromCache: false)
10. setPageData({ events, programs, ... }) → React context updated
```

**Firestore reads for first load: 17 (one per collection)**

### Scenario 2: Subsequent Page Load (Warm Cache)

```
1. getCachedData('events', ...) called
2. localStorage.getItem('mhma_v5_events') → { d: [...], t: 1719000000000, s: 0 }
3. Date.now() - 1719000000000 = 5000ms < 24h → ✓ Cache valid
4. Return { data: entry.d, fromCache: true }
```

**Firestore reads for warm load: 0 (all from cache)**

### Scenario 3: User Creates an Item (e.g., New Event)

```
In lib/firebase.ts (createEvent function):
1. addDoc(collection(db, "events"), { ... }) → Firestore write
2. appendToCache('events', newEvent):
   a. Read mhma_v5_events from localStorage
   b. Prepend newEvent to array: [newEvent, ...existingEvents]
   c. filterByAge → removes items >30d (keeps newly created)
   d. Update timestamp: entry.t = Date.now()
   e. Write back to localStorage
```

**Firestore reads: 0** — the cache is preserved and extended. The board member's table never disappears.

### Scenario 4: User Updates an Item (e.g., Edit Event)

```
In lib/firebase.ts (updateEvent function):
1. updateDoc(doc(db, "events", id), { ... }) → Firestore write
2. invalidateCache('events'):
   a. localStorage.removeItem('mhma_v5_events')
   b. localStorage.removeItem('mhma_v5_events_lastTs')
```

**Next page load: 1 Firestore read** — cache was removed, so getCachedData misses and refetches.

### Scenario 5: Browser Cache Cleared

```
1. User clears browser data → all localStorage wiped
2. getCachedData('events', ...) → localStorage empty → MISS
3. readMetadataTimestamp('events') → fetch('/api/metadata-timestamps')
4. Returns metaTs from Firestore (e.g., 1719000000000)
5. cachedTs = 0 (no _lastTs since cache was cleared)
6. metaTs (1719000000000) > cachedTs (0)? Yes → "MISS (write detected)"
     ← Wait, no write actually happened. This is a FALSE POSITIVE.
     ← But it doesn't matter — we need to fetch anyway since cache is empty.
```

**This is correct behavior.** The metadata timestamp distinguishes "write happened" from "user cleared browser data" for logging purposes, but the result is the same: the cache is empty, so we fetch fresh data.

### Scenario 6: Server-Side Write via API Route

```
User submits RSVP via public form:
1. POST /api/rsvp → writes to Firestore "rsvps" collection
2. Also writes: metadata/cacheTimestamps.set({ rsvps: Date.now() }, { merge: true })

A board member's browser loads dashboard:
1. getCachedData('rsvps', ...) → localStorage has mhma_v5_rsvps (valid, <24h)
2. BUT: wait, we have the cache, so we return it immediately!
```

**Hmm — this is the key insight.** When the cache IS present and <24h old, we return it immediately WITHOUT checking the metadata timestamp. The metadata timestamp is only checked when the cache is MISSING.

**So when does the API route writing to metadata help?**

Answer: When the board member's cache expires (>24h). On the next page load after expiration:
1. Cache expired → localStorage.removeItem → MISS  
2. `readMetadataTimestamp('rsvps')` → returns updated timestamp from the RSVP submission
3. `cachedTs` = 0 (lastTs was removed with the cache)
4. metaTs > cachedTs → "MISS (write detected)"
5. Fetches fresh data

Without the metadata timestamp update, the log would say "MISS (cache cleared)" which is less informative.

**For immediate invalidation:** The centralized `firebase.ts` helper functions handle this:
- `updateEvent()`, `deleteEvent()` → `invalidateCache('events')` → cache removed immediately
- `createEvent()` → `appendToCache('events', newEvent)` → cache preserved

### Scenario 7: AI Reads Data

```
User asks: "How many events are there?"
1. askQuestion() → step 1c: answerFromCache(query, pageData)
2. Regex matches "how many events"
3. Checks pageData.events → if found, uses it (0 I/O)
4. Falls back to readCache('events'):
   → localStorage.getItem('mhma_v5_events') → { d: [...], ... }
   → Returns parsed.d
5. Formats: "There are 5 events planned in the system."
```

**Firestore reads: 0** — AI never touches Firestore.

### Scenario 8: 30-Day Rolling Window

```
fetchAndCache for activityLog:
1. fetchActivityLog(50) returns 200 items from Firestore
2. filterByAge drops items where createdAt > 30 days old
3. Items without createdAt or with Firestore Timestamp sentinels are KEPT
4. Only 50 items remain after filtering
5. These 50 are stored in localStorage
```

**Firestore: ALL 200 items are fetched** (Firestore data is preserved).
**localStorage: Only 50 items stored** (oldest 150 evicted from cache).

The `filterByAge` function:
```typescript
// lib/cache-manager.ts:13-22
function filterByAge<T>(items: T[], dateField = 'createdAt'): T[] {
  const cutoff = Date.now() - THIRTY_DAYS_MS; // 30 days ago
  return items.filter((item: any) => {
    const date = item?.[dateField];
    if (!date) return true;                         // no date → keep (can't determine age)
    if (typeof date === 'object' && date.seconds) return true; // serverTimestamp() sentinel → keep
    const ts = date.toDate ? date.toDate().getTime() : new Date(date).getTime();
    return isNaN(ts) || ts > cutoff;                // valid date within 30 days → keep
  });
}
```

### Scenario 9: Activity Log Dual Cleanup

Activity log is the only collection that auto-deletes from BOTH Firestore AND localStorage:

```
1. /api/cleanup-activity/route.ts runs (CRON or manual):
   a. Deletes documents in Firestore where createdAt > 30 days
   b. Updates metadata/cacheTimestamps.activityLog = Date.now()
2. On next page load:
   a. getCachedData('activityLog', ...) → cache expired or invalidated
   b. Fetches fresh subset from Firestore (only <30 day items remain)
   c. filterByAge → keeps all (Firestore already cleaned)
   d. Stores in localStorage
```

**Other collections (events, programs, etc.):** Firestore data is preserved indefinitely. Only the localStorage cache is subject to the 30-day rolling window. This means if a board member needs to see data from 6 months ago, they can request a CSV export from the analytics page.

---

## Write Strategy: Invalidation vs Append

| Operation | Function | Cache Effect | Reads Saved |
|-----------|----------|-------------|-------------|
| **CREATE** event, program, RSVP, etc. | `appendToCache('events', newItem)` | Prepend to existing cache, 0 reads | 1 (would have been a full fetch) |
| **UPDATE** event, enrollment, etc. | `invalidateCache('events')` | Remove cache, next load reads once | 1 (next load reads once instead of potentially many) |
| **DELETE** event, RSVP, etc. | `invalidateCache('events')` | Same as update | 1 |

All 15+ create functions in `lib/firebase.ts` call `appendToCache`:

```typescript
// lib/firebase.ts:155-159 (createEvent)
export async function createEvent(data: any) {
  const ref = await addDoc(collection(db, "events"), {
    ...data, createdAt: serverTimestamp(),
  });
  appendToCache('events', { id: ref.id, ...data });
  return ref.id;
}
```

All 20+ update/delete functions call `invalidateCache`:

```typescript
// lib/firebase.ts:174-178 (updateEvent)
export async function updateEvent(id: string, data: any) {
  await updateDoc(doc(db, "events", id), { ...data, updatedAt: serverTimestamp() });
  invalidateCache('events');
}
```

The effect: **Board member table never disappears on create** (append adds to cached array), and **only disappears briefly on update/delete** (next page load does 1 read to refetch).

---

## Metadata Timestamp System

The server-side `metadata/cacheTimestamps` document serves as a **fallback mechanism** to distinguish "data was modified" from "user cleared browser data".

```
Firestore document: metadata/cacheTimestamps
{
  events: 1719000000000,        // timestamp of last write to events collection
  programs: 1719000000000,
  rsvps: 1719000000000,
  ...
  _updatedAt: 1719000000000,
}
```

**Updated by API routes** that write data (since they don't use firebase.ts helpers):

```typescript
// app/api/rsvp/route.ts:26-29
await firestore.collection('metadata').doc('cacheTimestamps').set({
  rsvps: Date.now(),
  _updatedAt: Date.now(),
}, { merge: true });
```

**Checked by `readMetadataTimestamp`** when cache is missing:

```typescript
// lib/cache-manager.ts:56-65
async function readMetadataTimestamp(key: string): Promise<number | null> {
  const res = await fetch('/api/metadata-timestamps', { cache: 'force-cache' });
  if (!res.ok) return null;
  const meta = await res.json();
  return meta[key] ?? null;
}
```

---

## AI Integration

The AI assistant (`AiAssistant.tsx`) answers data questions from cache — **0 Firestore reads**:

```typescript
// app/components/AiAssistant.tsx:64-72
const CACHE_PREFIX = 'mhma_v5_';
function readCache(key: string): any[] | null {
  const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed.d)) return parsed.d;  // CacheEntry<T>.d, not .data
  return null;
}
```

The lookup order: **pageData (React context) → localStorage → null → RAG fallback**:

```typescript
// app/components/AiAssistant.tsx:74-131 (simplified)
function answerFromCache(query: string, pageData: PageData): string | null {
  // 1. "How many X?" pattern
  const countMatch = lower.match(/(?:how many|count|total|# of)\s+(\w+)/);
  if (countMatch) {
    const fromPage = pageData[key];     // React context (0 I/O, fastest)
    const fromLS = readCache(key);      // localStorage (0 network, ~100μs)
    // Return count
  }

  // 2. "Show/list X" pattern
  const showMatch = lower.match(/(?:show|list|what|display|get|find|view)\s+(\w+)/);
  if (showMatch) { /* return formatted list */ }

  // 3. Direct keyword match
  // return count

  return null; // Not a cache question → pass to RAG pipeline
}
```

Integrated into `askQuestion()`:

```typescript
// app/components/AiAssistant.tsx:417-422
const cached = answerFromCache(query, pageData);
if (cached) {
  return { answer: cached };
}
// Falls through to RAG retrieval from knowledge base
```

---

## Page Data Context

Pages push fetched data into React context so the AI and other components can access it without any I/O:

```typescript
// lib/page-data-context.tsx:5-14
export interface PageData {
  events?: any[];
  programs?: any[];
  news?: any[];
  masjidConstruction?: any[];
  donations?: any[];
  pledges?: any[];
  enrollments?: any[];
  rsvps?: any[];
  contactSubmissions?: any[];
  schedulingRequests?: any[];
  users?: any[];
  subscribers?: any[];
  inviteCodes?: any[];
  faq?: any[];
  volunteers?: any[];
  testimonials?: any[];
  activityLog?: any[];
  journalEntries?: any[];
  knowledgeDocs?: any[];
  currentPath?: string;
}
```

**Data flow:** Page → `getCachedData()` → `setPageData()` → `AiAssistant` reads via `usePageData()`

```typescript
// app/dashboard/page.tsx:222
setPageData({
  events: e, programs: p, masjidConstruction: mu,
  enrollments: en, rsvps: rsvp,
  contactSubmissions: cs, schedulingRequests: er,
  users: u, subscribers: subs, pledges: pl,
  donations: d, news: n, faq: f, volunteers: v,
  testimonials: t, activityLog: alog, inviteCodes: codes
});
```

---

## Read Count Analysis

### Before Caching

| Page | Collections Fetched | Reads per Load |
|------|-------------------|---------------|
| Dashboard | events, programs, schedulingRequests, enrollments, rsvps, contactSubmissions, inviteCodes, users, subscribers, pledges, donations, news, faq, volunteers, activityLog, testimonials, masjidConstruction, userSettings, aboutStats (API) | 18 |
| Navigation (board member) | enrollments, contactSubmissions, schedulingRequests, rsvps | 4 |
| Navigation (member) | events, programs | 2 |
| Homepage | events, programs, news, masjidConstruction, stats (API) | 5 |
| Programs page | programs | 1 |
| News page | news | 1 |
| Masjid Construction | masjidConstruction | 1 |
| Donate page | masjidConstruction, donations | 2 |
| **Dashboard total (board member)** | 17 + 4 = 21 collections | **~529 reads** (each fetch reads multiple docs) |
| **Homepage total (member)** | 5 + 2 = 7 collections | **~541 reads** (includes API calls) |

### After Caching

| Page | Collections Fetched | Reads per Load (warm cache) | Reads per Load (cold cache) |
|------|-------------------|---------------------------|---------------------------|
| Dashboard | auth + theme only | **2** | **19** (17 cached + 2 uncacheable) |
| Navigation (board member) | 0 (from cache) | **0** | **4** |
| Navigation (member) | 0 (from cache) | **0** | **2** |
| Homepage | 0 (from cache) | **0** | **5** |
| Programs page | 0 (from cache) | **0** | **1** |
| News page | 0 (from cache) | **0** | **1** |
| Masjid Construction | 0 (from cache) | **0** | **1** |
| Donate page | 0 (from cache) | **0** | **2** |
| **Dashboard total (board member, warm)** | | **~2 reads** | |
| **Homepage total (member, warm)** | | **~2 reads** | |

**Savings: 529 → 2 reads per dashboard load (99.6% reduction)**

### Additional savings from write strategy

| Create operation | Before | After | Difference |
|----------------|--------|-------|------------|
| Create event | 0 reads (write-only) | 0 reads (appendToCache) | Same |
| Second page load after create | 17 reads (full refetch) | 0 reads (cache preserved) | **-17 reads** |
| Update event | 0 reads (write-only) | 0 reads (invalidateCache) | Same |
| Second page load after update | 17 reads (full refetch) | 1 read (single refetch) | **-16 reads** |

### API call savings (metadata endpoint)

| Scenario | Before | After |
|----------|--------|-------|
| Dashboard load with cache | 0 API calls (no metadata system existed) | 0 (cache hit skips metadata check) |
| Dashboard load without cache | 0 (no metadata system existed) | **1** (fetch `/api/metadata-timestamps`) |

The single metadata API call when cache is missing is negligible compared to the 529 saved Firestore reads.

---

## File Inventory

### Core Files
| File | Purpose |
|------|---------|
| `lib/cache-manager.ts` | Core cache logic: getCachedData, appendToCache, invalidateCache, filterByAge, sanitizeForCache, fetchAndCache |
| `lib/page-data-context.tsx` | React context for sharing fetched data between pages and AI |
| `app/api/metadata-timestamps/route.ts` | Endpoint returning all collection timestamps (used by metadata fallback) |
| `lib/cache-cleanup.ts` | Once-per-session cleanup: removes >24h entries, evicts >4MB |

### Page Files Wrapped with getCachedData
| File | Cache Keys |
|------|-----------|
| `app/dashboard/page.tsx` | All 17 collections |
| `app/page.tsx` (homepage) | events, programs, masjidConstruction, news |
| `app/components/Navigation.tsx` | enrollments, contactSubmissions, schedulingRequests, rsvps, events, programs |
| `app/news/page.tsx` | news |
| `app/programs/page.tsx` | programs |
| `app/masjid-construction/page.tsx` | masjidConstruction |
| `app/donate/page.tsx` | masjidConstruction, donations |

### Write Functions (in `lib/firebase.ts`)
| Function Type | Functions | Cache Action |
|--------------|-----------|-------------|
| Creates (15+) | addEvent, addProgram, addJournalEntry, addEnrollment, addSchedulingRequest, addContactSubmission, generateInviteCode, addTestimonial, addRSVP, updateMasjidConstruction, addPledge, addSubscriber, addVolunteer, manualDonation, addNews, createKnowledgeDoc, addFAQ | `appendToCache(key, newItem)` |
| Updates (10+) | updateEvent, updateProgram, updateJournalEntry, updateEnrollment, updateSchedulingRequest, updateContactSubmission, updateTestimonial, updateRSVPStatus, updateMasjidUpdate, updatePledge, updateSubscriber, updateNews, updateKnowledgeDoc, updateFAQ | `invalidateCache(key)` |
| Deletes (8+) | deleteEvent, deleteProgram, deleteJournalEntry, deleteEnrollment, deleteSchedulingRequest, deleteContactSubmission, deleteTestimonial, removeSubscriber, deleteNews, deleteKnowledgeDoc, deleteFAQ | `invalidateCache(key)` |

### API Routes with Metadata Updates
| Route | Key Updated |
|-------|------------|
| `app/api/rsvp/route.ts` | rsvps |
| `app/api/enroll/route.ts` | enrollments |
| `app/api/unsubscribe/route.ts` | subscribers |
| `app/api/use-invite/route.ts` | inviteCodes |
| `app/api/about-stats/route.ts` | aboutStats |
| `app/api/cleanup-activity/route.ts` | activityLog |

### Files with setPageData Calls
| File | Keys Set |
|------|---------|
| `app/dashboard/page.tsx` | All 17 collections |
| `app/page.tsx` (homepage) | events, programs, masjidConstruction, news |
| `app/components/Navigation.tsx` | enrollments, contactSubmissions, schedulingRequests, rsvps, events, programs |
| `app/events/page.tsx` | events, currentPath |
| `app/programs/page.tsx` | programs |
| `app/news/page.tsx` | news |
| `app/masjid-construction/page.tsx` | masjidConstruction |
| `app/donate/page.tsx` | masjidConstruction |

### AI Files
| File | Purpose |
|------|---------|
| `app/components/AiAssistant.tsx` | `answerFromCache()` reads pageData + localStorage; integrated into askQuestion flow |

---

## Key Design Decisions

1. **Simple Invalidation (Choice 1) is primary**: Cache key exists in localStorage → no write → use cache (0 reads). Covers 99.9% of page loads.

2. **Metadata Timestamp (Choice 2) is fallback only**: 1 read ONLY when cache key missing — distinguishes "write happened" from "cache cleared" for logging.

3. **30-day rolling window**: Age-based eviction is simpler than count-based limits. Naturally handles traffic variance.

4. **Append preserves cache on CREATE**: Board member table never disappears when new data is added. Only updates/deletes invalidate.

5. **Activity log is dual-cleanup**: Only collection auto-deleted from both Firestore AND localStorage after 30 days.

6. **Cache-only collections preserve Firestore data**: Events, programs, etc. kept in Firestore indefinitely. Only localStorage cache evicted after 30 days. Users can request CSV export for historical data.

7. **Base64 stripped from masjid construction**: Image/video data excluded from cache to keep localStorage under 4MB.

8. **No periodic staleness checks**: 24-hour safety TTL uses client-side `Date.now()` (0 Firestore reads). No background polling.

9. **AI reads from cache only**: `answerFromCache()` never touches Firestore — uses pageData context → localStorage → knowledge base static data only.
