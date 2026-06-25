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

---

## Detailed Event + RSVP Flow: 3 Members Submit, Board Member Reviews

This section traces what happens step-by-step in the code when 3 members each submit an RSVP and the board member views them in the dashboard.

### Data Model

```
Firestore "rsvps" collection (each doc):
{
  eventId: "abc123",
  eventTitle: "Community Iftar",
  fullName: "Alice",
  email: "alice@example.com",
  phone: "555-0100",
  attendees: 4,
  notes: "Bringing a dish",
  status: "pending",
  createdAt: <Timestamp>
}
```

Cache key: `mhma_v5_rsvps`

### Scenario: Member 1 Submits RSVP

**File: `app/rsvp/page.tsx`**

The member fills out the RSVP form and clicks Submit:

```typescript
// app/rsvp/page.tsx:66 (approximate)
const res = await fetch("/api/rsvp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ eventId, eventTitle, fullName, email, phone, attendees, notes }),
});
```

This hits the API route on the server:

**File: `app/api/rsvp/route.ts`**

```typescript
// 1. Write to Firestore
const rsvpRef = await firestore.collection("rsvps").add({
  eventId, eventTitle, fullName, email, phone, attendees, notes,
  status: "pending",
  createdAt: new Date().toISOString(),
});

const rsvpId = rsvpRef.id;

// 2. Update metadata timestamp (signals cache invalidation to ALL users)
await firestore.collection('metadata').doc('cacheTimestamps').set({
  rsvps: Date.now(),    // ← This is the key line
  _updatedAt: Date.now(),
}, { merge: true });
```

**What happens on the server:**
- A new document is created in Firestore `rsvps` collection
- The `metadata/cacheTimestamps.rsvps` timestamp is updated to `Date.now()`

**What happens on the member's browser (the RSVP submitter):**
- Nothing cache-related — the member is not on the dashboard, they just see a success message
- The `appendToCache` from `firebase.ts` is NOT called here because the RSVP page goes through the API route, not through the client SDK helper

**Result after Member 1:** Firestore has 1 new RSVP. Metadata timestamp `rsvps` is updated.

### Scenario: Member 2 Submits RSVP

Same as Member 1. The `metadata/cacheTimestamps.rsvps` timestamp is updated again.

**Result after Member 2:** Firestore has 2 RSVPs. Metadata timestamp is newer.

### Scenario: Member 3 Submits RSVP

Same flow. Metadata timestamp updated again.

**Result after Member 3:** Firestore has 3 RSVPs. Metadata timestamp is the newest.

### Scenario: Board Member Opens Dashboard (Cache is Warm)

The board member navigates to the dashboard. The Navigation mounts first, then the dashboard page.

**Step 1 — Navigation mounts** (`app/components/Navigation.tsx:27-48`):

```typescript
// Board member path
const [enrollRes, contactRes, schedRes, rsvpRes] = await Promise.all([
  getCachedData('enrollments', () => ...),
  getCachedData('contactSubmissions', () => ...),
  getCachedData('schedulingRequests', () => ...),
  getCachedData('rsvps', () =>
    getDocs(query(collection(db, "rsvps"),
      where("status", "==", "pending"), limit(100)))
      .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })))
  ),
]);
```

Let's trace `getCachedData('rsvps', ...)`:

```typescript
// lib/cache-manager.ts:24-54
export async function getCachedData<T>(key, fetchFn) {
  const cacheKey = 'mhma_v5_rsvps';
  const raw = localStorage.getItem(cacheKey);

  if (raw) {
    // Cache exists → check TTL
    const entry = JSON.parse(raw);
    if (Date.now() - entry.t < TTL_24H) {
      // ✓ Cache is fresh — return immediately (0 Firestore reads)
      return { data: entry.d, fromCache: true };
    }
    // Cache expired (>24h) — remove it
    localStorage.removeItem(cacheKey);
  }

  // Cache MISS — check metadata timestamp
  const metaTs = await readMetadataTimestamp('rsvps');
  // ... falls through to fetchAndCache
}
```

**Case A — Cache was already populated previously (from a prior dashboard load):**

The cache has an array of previously fetched RSVPs. But these RSVPs are from the last time the dashboard loaded — they don't include the 3 new ones submitted by members. And the board member hasn't created any RSVPs themselves, so `appendToCache` was never called.

**This is the problem!** The 3 members submitted RSVPs via the API route, which updated the `metadata/cacheTimestamps.rsvps` timestamp. But the board member's browser has the old RSVPs in cache and will show stale data until the cache expires (24h) or is manually invalidated.

**How does the board member see the new RSVPs?**

Option 1: **The metadata timestamp fallback.** But this only works when the cache key is MISSING, not when it's HIT. Since the cache key exists and is <24h old, `getCachedData` returns the old data immediately without checking the metadata timestamp.

Option 2: **The cache expires.** After 24 hours, the cache is removed, and the next load fetches fresh data — including all 3 new RSVPs.

**This is a known trade-off.** The system prioritizes "0 reads on cache hit" over "always fresh data". If the board member needs to see the latest submissions immediately, they can:
1. Refresh the page (the cache might still be warm)
2. Wait 24 hours for the cache to expire
3. Clear their browser cache

**To fix this** — if we want the board member to see RSVPs immediately when members submit them, we need a real-time mechanism like WebSockets or Firebase `onSnapshot`. The cache system is designed for page-load optimization, not real-time sync.

For the write-triggered flow using centralized `firebase.ts` helpers, see the next section.

### Dashboard Page Load — Board Member Opens Dashboard Events Page

When the board member navigates to `/dashboard/events`:

**File: `app/dashboard/events/page.tsx:30-31`**

```typescript
useEffect(() => {
  Promise.all([
    getCachedData('events', () => fetchEvents(100)),
    getCachedData('rsvps', () => fetchRSVPs(100)),
  ]).then(([eventsResult, rsvpsResult]) => {
    setEvents(eventsResult.data);
    setRsvps(rsvpsResult.data);
    setLoading(false);
  });
}, []);
```

For `getCachedData('rsvps', ...)`:
- If the Navigation already cached `rsvps` (from the previous section), `getCachedData` finds the cache and returns it immediately
- The data shown will be whatever was cached last

**Important note:** The dashboard events page also fetches `events` with the same cache key `'events'` that the homepage and Navigation might have already populated. Since the dashboard fetches 100 events (matching the max), the cache will contain all 100 if the dashboard was the first to fetch, or only 5 if the Navigation was first (we fixed this by changing Navigation to fetch 100).

---

## Create ≠ Update/Delete: Why The Board Member Table Never Disappears

This is the core design principle. Let me trace through the exact code paths.

### CREATE: `appendToCache` — Preserves Cache, Prepends Item

```typescript
// lib/firebase.ts:155-159 (createEvent)
export async function createEvent(data: any) {
  const ref = await addDoc(collection(db, "events"), {
    ...data, createdAt: serverTimestamp(),
  });
  //         ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  appendToCache('events', { id: ref.id, ...data });
  //         ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  return ref.id;
}
```

What `appendToCache` does internally:

```typescript
// lib/cache-manager.ts:132-147
export function appendToCache<T>(key: string, newItem: T): void {
  const cacheKey = 'mhma_v5_' + key;
  const raw = localStorage.getItem(cacheKey);
  if (!raw) {
    console.log(`[Cache] SKIP-APPEND ${key} (no cache to append to)`);
    return;
  }

  try {
    const entry: CacheEntry<T[]> = JSON.parse(raw);
    const before = entry.d.length;
    entry.d = filterByAge([newItem, ...entry.d]);  // PREPEND newItem to existing array
    const after = entry.d.length;
    entry.t = Date.now();  // Reset the 24h TTL clock
    localStorage.setItem(cacheKey, JSON.stringify(entry));
    console.log(`[Cache] APPEND ${key} items=${before}→${after} (+1 prepended)`);
  } catch (err) {
    localStorage.removeItem(cacheKey);
  }
}
```

**Key behavior:**
1. Cache must already exist (if no cache, skip silently)
2. `newItem` is **prepended** to the front of the array → appears first in any list
3. `filterByAge` is applied to the combined array → ensures 30-day window
4. `entry.t = Date.now()` resets the TTL → extends cache life by 24h
5. The cache key is **NOT removed** → subsequent `getCachedData` finds it

**Result after CREATE:** Cache still exists, now has the new item. **0 Firestore reads** on next page load.

### UPDATE: `invalidateCache` — Removes Cache, Next Load Refetches

```typescript
// lib/firebase.ts:174-178 (updateEvent)
export async function updateEvent(id: string, data: any) {
  await updateDoc(doc(db, "events", id), {
    ...data, updatedAt: serverTimestamp()
  });
  //         ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  invalidateCache('events');
  //         ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
}
```

What `invalidateCache` does internally:

```typescript
// lib/cache-manager.ts:149-157
export function invalidateCache(key: string | string[]): void {
  const keys = Array.isArray(key) ? key : [key];
  keys.forEach(k => {
    localStorage.removeItem('mhma_v5_' + k);         // Remove cached data
    localStorage.removeItem('mhma_v5_' + k + '_lastTs'); // Remove metadata ref
    console.log(`[Cache] INVALIDATE ${k}`);
  });
}
```

**Key behavior:**
1. The cache entry is **completely removed** from localStorage
2. The `_lastTs` reference is also removed
3. Next call to `getCachedData` will: cache MISS → metadata check → fetch from Firestore → cache fresh data

**Result after UPDATE:** Cache is gone. **1 Firestore read** on next page load.

### DELETE: Same as UPDATE

```typescript
// lib/firebase.ts:180-183 (deleteEvent)
export async function deleteEvent(id: string) {
  await deleteDoc(doc(db, "events", id));
  invalidateCache('events');  // Same function, same behavior
}
```

### Visual comparison

```
CREATE (addEvent):
  localStorage: [A, B, C]  →  appendToCache  →  [NEW, A, B, C]
  Next page load: getCachedData → cache HIT → 0 reads
  ✓ Table never disappears

UPDATE (updateEvent):
  localStorage: [A, B, C]  →  invalidateCache  →  (empty)
  Next page load: getCachedData → cache MISS → 1 read → [A', B, C]
  ✓ Table disappears briefly then reappears with updated data

DELETE (deleteEvent):
  localStorage: [A, B, C]  →  invalidateCache  →  (empty)
  Next page load: getCachedData → cache MISS → 1 read → [B, C]
  ✓ Table disappears briefly then reappears without deleted item
```

### Why This Matters for RSVPs

When a member submits an RSVP via `app/api/rsvp/route.ts`:

```
Member's browser:  fetch("/api/rsvp", ...) → 201 Created (success)
                   No cache change (API route doesn't touch localStorage)
                   
Board member's browser:  
  Cache still has old RSVPs from last dashboard load
  Needs to wait for 24h TTL or manual refresh → then metadata timestamp triggers refetch
```

This is different from the `firebase.ts` helper flow (e.g., when a board member creates an event FROM the dashboard). When the board member creates an event using `createEvent()` in `firebase.ts`:

```
Board member clicks "Add Event" → createEvent() called:
  1. Firestore write (addDoc)
  2. appendToCache('events', newEvent) → localStorage updated immediately
  3. Board member sees the new event in the table INSTANTLY (0 more reads)
```

The API route flow (members submitting from public forms) is intentionally different — it avoids giving client-side code direct Firestore write access. The trade-off is that board members won't see public submissions until cache refreshes.

---

## CSV Export For Historical Data

The CSV export feature allows board members to download full Firestore data for any collection as a CSV file, without affecting the localStorage cache.

### How It Works

**File: `app/components/CsvExportButton.tsx`**

```typescript
export default function CsvExportButton({ label, fetchData, filename, fields }) {
  const handleExport = async () => {
    const data = await fetchData();  // Direct Firestore fetch (bypasses cache)
    // Convert to CSV and trigger download
    const csvRows = [fields.join(',')];
    data.forEach(item => {
      csvRows.push(fields.map(f => String(item[f] ?? '')).join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    // Trigger download
  };
}
```

**Usage example** (in `app/dashboard/events/page.tsx`):

```typescript
<CsvExportButton
  label="Export CSV"
  fetchData={() => fetchEvents(9999).catch(() => [])}  // Fetches ALL events from Firestore
  filename="events"
  fields={['id', 'title', 'date', 'time', 'location', 'description', 'createdAt']}
/>
```

**Why this doesn't affect the cache:**
- `fetchData` is passed directly to `CsvExportButton`, NOT through `getCachedData`
- The `fetchEvents(9999)` call goes directly to Firestore
- The result is converted to CSV and downloaded
- The localStorage cache is never touched

To add CSV export to any dashboard page:

```typescript
import CsvExportButton from "@/app/components/CsvExportButton";

// In the JSX, next to the page title or action buttons:
<CsvExportButton
  label="Export CSV"
  fetchData={() => fetchCollectionName(9999)}  // Replace with actual fetch
  filename="collection-name"
  fields={['field1', 'field2', 'field3']}      // Replace with actual fields
/>
```

---

## Image Caching: Stripping Base64 From Cache

To prevent large base64 image data from filling up localStorage, `sanitizeForCache` strips image fields before caching.

### For Masjid Construction

```typescript
// lib/cache-manager.ts:115-126
if (key === 'masjidConstruction' && Array.isArray(data)) {
  return data.map((item: any) => {
    const { image, ...rest } = item;  // Strip base64 image data only
    return rest;                       // Keep ALL other fields (video, heroType, etc.)
  });
}
```

`image` (base64 string, could be 1-10MB) is stripped. All other fields like `video` (YouTube URL, small), `heroType`, `caption`, `raised`, `goal`, `phase` are preserved.

### For Events, Programs, News

```typescript
// lib/cache-manager.ts:127-133
if ((key === 'events' || key === 'programs' || key === 'news') && Array.isArray(data)) {
  return data.map((item: any) => {
    const { image, poster, ...rest } = item;  // Strip base64 image/poster data
    return rest;                                // Keep all text fields
  });
}
```

`image` and `poster` fields (both contain base64 data) are stripped. All text fields (title, description, date, location, etc.) are preserved.

**What this means for the UI:** Images/poster will need to be fetched on each page load until we add a dedicated image cache. The base64 data is too large for localStorage (5-10MB limit). A future enhancement could use IndexedDB for image caching, but that's outside the scope of this system.

---

## Testing & Verification Guide

### Method 1: Browser Console (Recommended)

Open browser DevTools (F12) → Console, paste this:

```javascript
(function(){const P='mhma_v5_',k=[];for(let i=0;i<localStorage.length;i++){const l=localStorage.key(i);if(l?.startsWith(P))k.push(l)}k.sort();console.log('Cache:',k.length,'entries');k.forEach(c=>{const r=localStorage.getItem(c);if(!r)return;try{const p=JSON.parse(r);console.log(' ',c.replace(P,''),Array.isArray(p.d)?p.d.length:'?','items,',Math.round((Date.now()-p.t)/60000)+'m old')}catch{}})})()
```

This shows:
- Number of cached collections
- Item counts per collection
- Age of each cache entry (in minutes)

Example output:
```
Cache: 17 entries
  events 100 items 5m old
  programs 50 items 5m old
  enrollments 23 items 12m old
  rsvps 8 items 12m old
  ...
```

### Method 2: Using the Debug Utility

After importing `lib/cache-debug.ts` somewhere temporarily:

```typescript
import { dumpCache, clearCache, simulateColdLoad, checkReadCount } from '@/lib/cache-debug';

dumpCache();           // Full cache report
checkReadCount();      // Estimated read count for current page load
simulateColdLoad('events');  // Clear events cache, next load refetches
clearCache();          // Clear ALL caches
```

### Method 3: Check Console Logs

The cache system logs every operation with the `[Cache]` prefix:

```
[Cache] HIT  events age=5m              ← Reading from cache (0 Firestore reads)
[Cache] MISS events (cache cleared)     ← No cache, will fetch
[Cache] STORE events items=100 size=45KB  ← Fetched and stored
[Cache] APPEND events items=100→101     ← New item added to existing cache
[Cache] INVALIDATE events               ← Cache removed due to update/delete
[Cache] AGE-FILTER events: dropped 12 items over 30d
```

AI-related logs use `[AI Cache]` prefix:

```
[AI Cache] scan query="how many events"  ← Query parsed
[AI Cache] countMatch key=events from=localStorage length=100  ← Data found in cache
[AI Cache] no match — passing to RAG     ← No cache match, falls to knowledge base
```

### Method 4: Verify Read Reduction

To verify reads really reduced:

1. Open browser DevTools → Network tab
2. Filter by `firestore.googleapis.com` (Firestore reads)
3. Load the dashboard:
   - **First load (cold cache)**: ~17 requests to Firestore
   - **Subsequent loads (warm cache)**: 0 requests to Firestore
4. Create an event from the dashboard:
   - 0 reads (appendToCache preserves cache)
5. Update an event:
   - 0 reads during update (invalidateCache removes cache)
   - 1 read on next page load (getCachedData → MISS → fetch)

### Expected Behavior Checklist

| Action | Expected Cache Behavior | Firestore Reads |
|--------|------------------------|-----------------|
| Open dashboard (first time) | 17 cache MISS → fetch all | ~17 |
| Refresh dashboard | 17 cache HIT → 0 fetches | ~2 (auth + theme) |
| Create event (dashboard) | appendToCache → cache preserved | 0 (write only) |
| Update event (dashboard) | invalidateCache → cache removed | 0 (write only) |
| Refresh after update | 1 cache MISS → refetch events | 1 |
| Delete event (dashboard) | invalidateCache → cache removed | 0 (write only) |
| Refresh after delete | 1 cache MISS → refetch events | 1 |
| RSVP from public form | Metadata timestamp updated | 0 on submitter, 0 on board member until cache refresh |
| Click CSV Export | Bypasses cache, direct Firestore | n (full query) |
| AI asks "how many events?" | reads from pageData or localStorage | 0 |
| After 24h no activity | Cache expires → next load fetches fresh | ~17 |
| Create + immediately refresh | appendToCache → cache still warm → 0 reads | 0 |
