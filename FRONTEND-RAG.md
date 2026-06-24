# Frontend RAG: Eliminating Duplicate Firestore Reads

> **What this document is:** A complete architectural analysis of every Firestore read in the MHMA app. We identify every duplicate read, explain why they happen, propose a **Frontend RAG** system to eliminate them, and give you the implementation plan.

> **What this document is NOT:** This is not about the AI model (SmolLM2). It's about the **data pipeline** — how data moves from Firestore → page → AI, and how to stop asking Firestore for the same data over and over.

---

## Table of Contents

1. [How API Routes Work (Your Confusion Answered)](#1-how-api-routes-work-your-confusion-answered)
2. [The Firestore Read Problem: 189 Reads Per Dashboard Load](#2-the-firestore-read-problem-189-reads-per-dashboard-load)
3. [Complete Read Catalog: Every Single Firestore Read](#3-complete-read-catalog-every-single-firestore-read)
4. [Duplicate Read Analysis: Where We Waste Reads](#4-duplicate-read-analysis-where-we-waste-reads)
5. [Frontend RAG: The Solution](#5-frontend-rag-the-solution)
6. [PageDataContext: The Shared Store](#6-pagedatacontext-the-shared-store)
7. [Implementation Plan: What to Do and Why](#7-implementation-plan-what-to-do-and-why)
8. [Caching Strategies: Surviving Page Reloads](#8-caching-strategies-surviving-page-reloads)
9. [User Capacity Estimation: How Many Users Can We Support?](#9-user-capacity-estimation-how-many-users-can-we-support)
10. [Firebase Free Tier vs Blaze: When Reads Matter](#10-firebase-free-tier-vs-blaze-when-reads-matter)

---

## 1. How API Routes Work (Your Confusion Answered)

You said:
> *"How does https://mhma-update.vercel.app/api/events lead to a JSON file with the data? I'm confused."*

> *"How does Vercel run backend code like Firebase Admin?"*

> *"Where in the code are we reading data from Firestore to put it on the front end?"*

### 1.1 What is an API Route?

An API route is a file at `app/api/events/route.ts` that Next.js (running on Vercel) automatically turns into a **serverless function endpoint**.

**There is no JSON file sitting on a disk.** The JSON is generated **on the fly** every time you visit that URL. Here is exactly what happens:

```
Your browser
    │  You visit: https://mhma-update.vercel.app/api/events
    ▼
Vercel's server (somewhere in AWS Lambda)
    │  1. Receives your HTTP GET request
    │  2. Runs app/api/events/route.ts
    │  3. The code connects to Firestore (Google's cloud)
    │  4. Reads the `events` collection and the `rsvps` collection
    │  5. Combines them into a JSON array
    │  6. Returns: Response.json([{ title: "Eid", rsvpCount: 15 }])
    ▼
Your browser receives the JSON response
```

The code that does this is at `app/api/events/route.ts`:

```typescript
// app/api/events/route.ts (LINE 12-13)
// THIS runs on Vercel's server, NOT in your browser
const eventsSnap = await firestore.collection('events')
  .orderBy('createdAt', 'desc')
  .limit(limitCount)
  .get();                              // ← Reads `events` from Firestore

const rsvpsSnap = await firestore.collection('rsvps').get();
                                       // ← Reads `rsvps` from Firestore

// Combine them into JSON and send back
return Response.json(eventsWithRsvpCounts);
```

**Key insight:** The `firestore` object at the top of that file comes from Firebase Admin SDK:

```typescript
// app/lib/firebase-admin.ts
import admin from 'firebase-admin';
//    ^^^^ This is the SERVER-side Firebase SDK.
//    It has full access to Firestore with NO security rules.
//    It can only run on Vercel's server, not in a browser.

const adminDb = admin.firestore();
//             ^^^^ This connects to the SAME Firestore database
//             as the client SDK, but using service account credentials
//             stored as environment variables on Vercel.
```

### 1.2 Why Does Vercel Run Backend Code?

Vercel is not just a static file host. Vercel is a **serverless platform**. When you run `vercel deploy`, it:

1. Detects any files in `app/api/**/route.ts`
2. Packages them as **AWS Lambda functions** (serverless)
3. Deploys them alongside your frontend
4. Maps the URL `/api/events` to that Lambda function

Your `vercel.json` or Next.js config tells Vercel this is a server application, not just static files:

```json
// vercel.json (simplified)
{
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

When Next.js builds, it separates:
- **Static pages** (HTML/CSS/JS served as files)
- **Server components** (rendered on each request)
- **API routes** (`app/api/**/route.ts`) → become serverless functions

### 1.3 The Data Flow: Browser → Vercel → Firestore → Back

```
                    LAYER 1 (Client SDK)               LAYER 2 (API Routes)           LAYER 3 (Server)
                    ═══════════════════               ════════════════════           ═════════════════
                
Browser/App  ────►  firebase Client SDK ────►   Firestore directly
(page load)         (reads/writes with                          ▲
                    user security rules)                         │
                                                                 │
                    fetch("/api/events")  ──►  Next.js Route  ──┤──► Admin SDK ──► Firestore
                    (HTTP request)              app/api/events/      (no security     (reads data)
                                                route.ts             rules, uses
                                                                     service account)
                    ◄──── JSON response ◄────
```

**Your browser** never connects directly to Firestore for events data. It says:

```typescript
// app/events/page.tsx (LINE 63)
const response = await fetch(`/api/events?_=${timestamp}`);
//                                  ^^^^^^^^^^^^^^^^^^^
//  1. Browser makes HTTP request to Vercel
//  2. Vercel runs the API route code
//  3. API route reads from Firestore via Admin SDK
//  4. API route returns JSON
//  5. Browser receives JSON
```

### 1.4 Where Is the "Read from Firestore and Show on Screen" Code?

This is the piece you couldn't find. It's split into two parts:

**Part 1 — Server reads from Firestore** (`app/api/events/route.ts`):
```typescript
// LINE 12-13: Reads from Firestore (on Vercel server)
const eventsSnap = await firestore.collection('events').get();
const rsvpsSnap = await firestore.collection('rsvps').get();
```

**Part 2 — Browser displays the data** (`app/events/page.tsx`):
```typescript
// LINE 63-69: Fetches from the API route
const response = await fetch(`/api/events?_=${timestamp}`);
const data = await response.json();
//  ^^^^ data = [{ title: "Eid Festival", rsvpCount: 15 }, ...]

// LINE 71-107: Maps JSON into slides and renders them
const eventSlides = data.map((event: any) => ({
  eventName: event.title,
  rsvpCount: event.rsvpCount,
  // ... more fields
}));
setSlides(eventSlides);  // React re-renders with the data
```

Then in the JSX (same file):
```tsx
{slides.map((slide) => (
  <div key={slide.id}>
    <h3>{slide.eventName}</h3>
    <span>{slide.rsvpCount} RSVPs</span>
  </div>
))}
```

**The "read from Firestore" happens on Vercel's server.** The **"display on screen"** happens in your browser via React state (`slides`). The bridge between them is `fetch("/api/events")`.

### 1.5 Are API Routes a "Bridge"?

> *"Are we saying we created API endpoints or a bridge connecting our application to Vercel's server and Vercel connecting to Firestore?"*

**Yes, exactly.** An API route is both:
- An **endpoint** (a URL you can visit)
- A **bridge** (a piece of Vercel's infrastructure that connects browser → Firestore)

```
Browser  ──HTTP──►  Vercel (API Route)  ──Admin SDK──►  Firestore
                     ↑                                       ↑
                The bridge                             The database
```

### 1.6 How Does Next.js Know `app/api/` Is Special?

**Because of the folder name.** Next.js has a convention:

| Folder | What it becomes |
|--------|----------------|
| `app/api/events/route.ts` | `GET /api/events` (serverless function) |
| `app/api/rsvp/route.ts` | `POST /api/rsvp` (serverless function) |
| `app/events/page.tsx` | `/events` (page, rendered in browser) |

There is no configuration file needed. The folder structure IS the routing:

```
app/
├── api/
│   ├── events/route.ts     ← Becomes: https://site.com/api/events
│   ├── rsvp/route.ts       ← Becomes: https://site.com/api/rsvp
│   └── about-stats/route.ts← Becomes: https://site.com/api/about-stats
├── events/page.tsx         ← Becomes: https://site.com/events
└── layout.tsx              ← Wraps everything
```

**If you put a file at `app/api/anything/route.ts`, Next.js automatically turns it into a serverless endpoint.** This is why the folder is named `api` — it's the convention Next.js uses to know "this is backend code, not a page."

---

## 2. The Firestore Read Problem: 189 Reads Per Dashboard Load

Your read count hit **189** with just you testing. Here's exactly why.

### 2.1 Anatomy of a Single Dashboard Page Load

When you visit `/dashboard` (board member), here is every Firestore read that fires:

| # | Source | What It Reads | Read Type |
|---|--------|---------------|-----------|
| 1 | `auth-context.tsx` | `users/{uid}` | Document read |
| 2 | `theme-context.tsx` | `userSettings/{uid}` | Document read |
| 3 | Navigation component | `enrollments` (pending, 100) | Query (N docs) |
| 4 | Navigation component | `contactSubmissions` (unread, 100) | Query (N docs) |
| 5 | Navigation component | `schedulingRequests` (pending, 100) | Query (N docs) |
| 6 | Navigation component | `rsvps` (pending, 100) | Query (N docs) |
| 7 | Navigation component | `events` (5) | Query (5 docs) |
| 8 | Navigation component | `programs` (5) | Query (5 docs) |
| 9 | `dashboard/page.tsx` | `fetchPrograms(100)` | Query (N docs) |
| 10 | `dashboard/page.tsx` | `fetchEvents(100)` | Query (N docs) |
| 11 | `dashboard/page.tsx` | `fetchSchedulingRequests(100)` | Query (N docs) |
| 12 | `dashboard/page.tsx` | `fetchEnrollments(100)` | Query (N docs) |
| 13 | `dashboard/page.tsx` | `fetchRSVPs(100)` | Query (N docs) |
| 14 | `dashboard/page.tsx` | `fetchContactSubmissions(100)` | Query (N docs) |
| 15 | `dashboard/page.tsx` | `fetchInviteCodes()` | Query (N docs) |
| 16 | `dashboard/page.tsx` | `fetchUsers(100)` | Query (N docs) |
| 17 | `dashboard/page.tsx` | `fetchSubscribers(100)` | Query (N docs) |
| 18 | `dashboard/page.tsx` | `fetchPledges(100)` | Query (N docs) |
| 19 | `dashboard/page.tsx` | `fetchDonations(100)` | Query (N docs) |
| 20 | `dashboard/page.tsx` | `fetchAllNews(100)` | Query (N docs) |
| 21 | `dashboard/page.tsx` | `fetchFAQs(100)` | Query (N docs) |
| 22 | `dashboard/page.tsx` | `fetchVolunteers(100)` | Query (N docs) |
| 23 | `dashboard/page.tsx` | `fetchActivityLog(50)` | Query (N docs) |
| 24 | `dashboard/page.tsx` | `fetchTestimonials(50)` | Query (N docs) |
| 25 | `dashboard/page.tsx` | `fetchMasjidUpdates()` | Query (N docs) |
| 26 | `dashboard/page.tsx` | `GET /api/about-stats` (12 collections) | Query (12x N docs) |

**That's 26+ read operations on a single page load.** Each query returns multiple documents, so a single query like "fetchEvents(100)" reads 100 documents. But Firestore counts each query as 1 read + N document reads.

> **Firestore billing:** A query with 100 results = 1 read for the query + 100 reads for the documents = 101 reads.

### 2.2 The Duplicate Problem

The same data is read **multiple times** on the same page:

| Data | Read by Navigation | Read by Dashboard | Also read by API route | Unique? |
|------|-------------------|-------------------|----------------------|---------|
| `enrollments` | ✅ Navigation (pending count) | ✅ Dashboard (full list) | ✅ `/api/enrollment-count` | ❌ 3x |
| `events` | ✅ Navigation (5 recent) | ✅ Dashboard (100) | ✅ `/api/events` | ❌ 3x |
| `programs` | ✅ Navigation (5 recent) | ✅ Dashboard (100) | | ❌ 2x |
| `rsvps` | ✅ Navigation (pending count) | ✅ Dashboard (100) | ✅ `/api/events` | ❌ 3x |
| `users` | | ✅ Dashboard (100) | ✅ `/api/about-stats` | ❌ 2x |
| `donations` | | ✅ Dashboard (100) | ✅ `/api/about-stats` | ❌ 2x |
| `pledges` | | ✅ Dashboard (100) | ✅ `/api/about-stats` | ❌ 2x |

### 2.3 The Reload Problem

> *"Every time I reload my page, data is grabbed from Firestore again."*

**Yes. Every page load is a fresh read.** There is no client-side cache. Here's why:

```typescript
// app/dashboard/page.tsx (LINE 177-194)
useEffect(() => {
  // This fires EVERY time the component mounts (every page load)
  fetchPrograms(100).then(setPrograms);
  fetchEvents(100).then(setEvents);
  fetchSchedulingRequests(100).then(setRequests);
  // ... 14 more fetch calls
}, []);
//   ^^^ Empty dependency array = runs once per mount
//   Page navigation or refresh = new mount = new reads
```

The `useEffect(() => { ... }, [])` pattern with an empty dependency array means: "run this once when the component first renders." But "once" means once per **page load**. Every refresh, every navigation — it all counts.

### 2.4 Cross-Page Duplication

The same API endpoint is called from multiple pages:

| API Route | Called From | Collections Read per Request |
|-----------|-------------|------------------------------|
| `GET /api/about-stats` | Homepage, About page, Dashboard, Analytics | **12 collections per call** |

Result: If a user visits Homepage → About → Dashboard → Analytics in one session, `/api/about-stats` is called **4 times**, each reading 12 collections = **48 Firestore reads for the same data**.

---

## 3. Complete Read Catalog: Every Single Firestore Read

### 3.1 Client-Side Direct Reads (Layer 1 — `firebase/firestore` Client SDK)

| Function | File | Collection | Trigger |
|----------|------|-----------|---------|
| `fetchEvents(limit)` | `lib/firebase.ts:140` | `events` | Every call (many pages) |
| `fetchEventById(id)` | `lib/firebase.ts:146` | `events/{id}` | Every call |
| `fetchPrograms(limit)` | `lib/firebase.ts:194` | `programs` | Every call (many pages) |
| `fetchProgramBySlug(slug)` | `lib/firebase.ts:200` | `programs` (where slug) | Every program detail load |
| `fetchJournalEntries(limit)` | `lib/firebase.ts:265` | `journal` | Every call |
| `fetchEnrollments(limit)` | `lib/firebase.ts:316` | `enrollments` | Every call (many pages) |
| `fetchSchedulingRequests(limit)` | `lib/firebase.ts:359` | `schedulingRequests` | Every call (many pages) |
| `fetchContactSubmissions(limit)` | `lib/firebase.ts:402` | `contactSubmissions` | Every call (many pages) |
| `validateInviteCode(code)` | `lib/firebase.ts:477` | `inviteCodes` (where code, unused) | Register form submit |
| `fetchInviteCodes()` | `lib/firebase.ts:492` | `inviteCodes` | Every call |
| `fetchUsers(limit)` | `lib/firebase.ts:523` | `users` | Every call (many pages) |
| `fetchTestimonials(limit)` | `lib/firebase.ts:544` | `testimonials` | Every call |
| `fetchActivityLog(limit)` | `lib/firebase.ts:592` | `activityLog` | Every call |
| `fetchRSVPs(limit)` | `lib/firebase.ts:685` | `rsvps` | Every call |
| `fetchRSVPsByEvent(eventId)` | `lib/firebase.ts:691` | `rsvps` (where eventId) | Every event detail load |
| `fetchMasjidUpdates(limit)` | `lib/firebase.ts:815` | `masjidConstruction` | Every call |
| `fetchPledgesByUser(userId)` | `lib/firebase.ts:860` | `pledges` (where userUid) | Profile page load |
| `fetchPledges(limit)` | `lib/firebase.ts:885` | `pledges` | Every call |
| `fetchSubscribers(limit)` | `lib/firebase.ts:921` | `subscribers` | Every call |
| `fetchVolunteers(limit)` | `lib/firebase.ts:956` | `volunteers` | Every call |
| `fetchDonations(limit)` | `lib/firebase.ts:989` | `donations` | Every call |
| `fetchDonationsByUser(userId)` | `lib/firebase.ts:1012` | `donations` (where donorId) | Profile page load |
| `fetchNews(limit)` | `lib/firebase.ts:1076` | `news` | Every call |
| `fetchAllNews(limit)` | `lib/firebase.ts:1094` | `news` | Every call |
| `fetchNewsBySlug(slug)` | `lib/firebase.ts:1100` | `news` (where slug) | News detail page |
| `fetchKnowledgeDocs(limit)` | `lib/firebase.ts:1151` | `ai_knowledge` | AI init (commented out) |
| `fetchFAQs(limit)` | `lib/firebase.ts:1180` | `faq` | Every call |

### 3.2 Auto-Triggered Reads (Happen on Every Page Load)

These are reads that fire automatically when any page loads, regardless of content:

| File | Line | What It Reads | Why |
|------|------|---------------|-----|
| `lib/auth-context.tsx` | 47 | `users/{uid}` | Checks user role on auth state change |
| `lib/theme-context.tsx` | 38 | `userSettings/{uid}` | Loads user's theme preference |
| `app/components/Navigation.tsx` | 27 | `enrollments` (pending) | Shows pending badge count |
| `app/components/Navigation.tsx` | 28 | `contactSubmissions` (unread) | Shows unread badge count |
| `app/components/Navigation.tsx` | 29 | `schedulingRequests` (pending) | Shows pending badge count |
| `app/components/Navigation.tsx` | 30 | `rsvps` (pending) | Shows pending badge count |
| `app/components/Navigation.tsx` | 44 | `events` (5) | Dashboard sidebar recent items |
| `app/components/Navigation.tsx` | 45 | `programs` (5) | Dashboard sidebar recent items |

### 3.3 Server-Side API Route Reads (Layer 3 — Admin SDK)

| API Route | File | Collections Read |
|-----------|------|-----------------|
| `GET /api/about-stats` | `app/api/about-stats/route.ts:36-47` | `aboutStats`, `programs`, `events`, `users`, `donations`, `enrollments`, `rsvps`, `subscribers`, `contactSubmissions`, `pledges`, `volunteers`, `news` |
| `GET /api/donation-totals` | `app/api/donation-totals/route.ts:9-11` | `donations`, `events`, `users` |
| `GET /api/events` | `app/api/events/route.ts:12-13` | `events`, `rsvps` |
| `GET /api/events/[slug]` | `app/api/events/[slug]/route.ts:12` | `events/{slug}` |
| `GET /api/programs` | `app/api/programs/route.ts:12-13` | `programs`, `enrollments` |
| `GET /api/journal` | `app/api/journal/route.ts:12` | `journal` |
| `GET /api/enrollment-count` | `app/api/enrollment-count/route.ts:8` | `enrollments` |
| `POST /api/validate-invite` | `app/api/validate-invite/route.ts:11` | `inviteCodes` |
| `POST /api/subscribe` | `app/api/subscribe/route.ts:13` | `subscribers` |
| `POST /api/unsubscribe` | `app/api/unsubscribe/route.ts:11` | `subscribers` |

### 3.4 Total Read Count on Homepage Load

The homepage (`/` or `/page.tsx`) is visited by both members and non-members. Here is every read on a single load for a **logged-in board member**:

| Step | Read Source | Documents Read |
|------|-------------|---------------|
| 1 | Auth: `users/{uid}` | 1 doc |
| 2 | Theme: `userSettings/{uid}` | 1 doc |
| 3 | Navigation: enrollments (pending) | ~5 docs |
| 4 | Navigation: contactSubmissions (unread) | ~5 docs |
| 5 | Navigation: schedulingRequests (pending) | ~3 docs |
| 6 | Navigation: rsvps (pending) | ~5 docs |
| 7 | Navigation: events (5) | 5 docs |
| 8 | Navigation: programs (5) | 5 docs |
| 9 | `GET /api/about-stats` | ~500+ docs (12 collections) |
| 10 | `fetchEvents(3)` | 3 docs |
| 11 | `fetchPrograms(3)` | 3 docs |
| 12 | `fetchNews(3)` | 3 docs |
| 13 | `fetchMasjidUpdates(3)` | 3 docs |
| **Total** | | **~541+ document reads** |

**For a single homepage load.** This matches your 189 read count being low — you may not have much data in the collections yet.

---

## 4. Duplicate Read Analysis: Where We Waste Reads

### 4.1 Navigation vs Dashboard (Same Data, Two Reads)

Navigation reads the first 5 events for "recent items." Dashboard reads all 100 events. The `events` collection is queried twice on the same page load.

### 4.2 Dashboard Direct Reads vs API Route Reads

Dashboard calls `fetchDonations(100)` directly AND also fetches `GET /api/about-stats` which reads donations again.

### 4.3 Multiple Pages, Same API Endpoint

`/api/about-stats` is called from 4 different pages. Each call re-reads everything from Firestore with zero sharing.

### 4.4 The Navigation Component's 6 Collection Reads

Every single page on the site triggers 6 Firestore reads just to show badge counts. A public user visiting `/events` still triggers enrollment/RSVP/scheduling reads that they can't even see (the badge counts are for board members only).

### 4.5 Auth Context Reads on Every Page

`auth-context.tsx` reads user data on every auth state change (which triggers on every page load/refresh). `theme-context.tsx` reads user settings on every page load.

### 4.6 The "Who Am I" Problem

When a user asks the AI "who am I", the data already exists in `user` state (from auth context). But currently the KB entry for "who am I" is a generic answer. We already fixed this with the user-aware whoami in the latest update — but the solution is exactly the Frontend RAG model: **use what's already in the browser.**

---

## 5. Frontend RAG: The Solution

### 5.1 The Core Idea

**Frontend RAG = Retrieval-Augmented Generation, where the "knowledge" is already loaded in the browser.**

Instead of:

```
User asks "How many donations?" 
    → AI fetches from Firestore (duplicate read)
    → AI returns answer
```

Do this:

```
User asks "How many donations?"
    → AI reads from PageDataContext (already loaded on screen)
    → 0 additional Firestore reads
    → AI returns answer
```

### 5.2 The PageDataContext Already Exists

We created `lib/page-data-context.tsx` in the last update. Here's how it works:

```typescript
// lib/page-data-context.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface PageData {
  events?: any[];       // Already loaded events
  programs?: any[];     // Already loaded programs
  currentPath?: string; // What page is the user on
}

const PageDataContext = createContext<PageDataContextType>({
  data: {},
  setPageData: () => {},
});

export function PageDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PageData>({});
  return (
    <PageDataContext.Provider value={{ data, setPageData }}>
      {children}
    </PageDataContext.Provider>
  );
}
```

**Any page can populate it. The AI can read from it. Zero duplicate reads.**

### 5.3 How Pages Populate the Context

```typescript
// In events/page.tsx
import { usePageData } from "@/lib/page-data-context";

export default function EventsPage() {
  const { setPageData } = usePageData();
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    fetch(`/api/events`)
      .then(r => r.json())
      .then(data => {
        setSlides(data);
        setPageData({ events: data, currentPath: '/events' });
        //  ^^^^^^^^^^ Events data is now available to AI
      });
  }, []);
}
```

### 5.4 How the AI Reads from PageDataContext

```typescript
// In AiAssistant.tsx
import { usePageData } from "@/lib/page-data-context";

export default function AiAssistant() {
  const { data: pageData } = usePageData();
  // pageData.events = events already loaded by the Events page
  // pageData.programs = programs already loaded by the Programs page
  // pageData.currentPath = the current page URL

  const askQuestion = async (query: string) => {
    // If user asks about events, use pageData.events
    if (query.includes("how many events") && pageData.events) {
      return `There are ${pageData.events.length} upcoming events.`;
    }
    // If user asks about donations, use pageData.donations
    if (query.includes("donations") && pageData.donations) {
      const total = pageData.donations.reduce((s, d) => s + d.amount, 0);
      return `Total donations: $${total}.`;
    }
    // Otherwise fall back to knowledge base
  };
}
```

### 5.5 The Critical Rule

> **A page should push data into PageDataContext AFTER it fetches it — not fetch it separately for the AI.**

This ensures:
- 1 fetch = 1 Firestore read = shared by both page display AND AI
- No redundant Firestore reads
- Zero additional cost when the AI answers questions about live data

---

## 6. PageDataContext: The Shared Store

### 6.1 What Data Should Be Shared

| Data Source | Currently Read From | Pages That Load It | Should Be Shared? |
|------------|-------------------|-------------------|-------------------|
| Events | `lib/firebase.ts` + `/api/events` | Home, Events, Dashboard, Analytics, AI live data | **YES** |
| Programs | `lib/firebase.ts` + `/api/programs` | Home, Programs, Dashboard, Analytics, AI live data | **YES** |
| Enrollments | `lib/firebase.ts` | Dashboard, Analytics, Users, Notifications, AI live data | **YES** |
| RSVPs | `lib/firebase.ts` + `/api/events` | Dashboard, Analytics, Users, Notifications, AI live data | **YES** |
| Donations | `lib/firebase.ts` | Dashboard, Analytics, Users, Donate page, AI live data | **YES** |
| Pledges | `lib/firebase.ts` | Dashboard, Analytics, Users, AI live data | **YES** |
| Users | `lib/firebase.ts` + `/api/about-stats` | Dashboard, Analytics, AI live data | **YES** |
| About Stats | `/api/about-stats` | Home, About, Dashboard, Analytics | **YES** |
| Navigation counts | `lib/firebase.ts` (6 reads) | ALL pages | **YES** |
| Auth user data | `auth-context.tsx` | ALL pages (already in context) | **Already shared** |
| Theme settings | `theme-context.tsx` | ALL pages (already in context) | **Already shared** |

### 6.2 The One-Read Rule

For any piece of data:

```
Firestore ──► First Page That Needs It ──► PageDataContext ──► All Other Consumers
                   (1 read)                     (shared)          (0 additional reads)
```

- Homepage fetches events → stores in PageDataContext → AI reads from there
- Dashboard also needs events → reads from PageDataContext → 0 additional Firestore reads
- Events page also needs events → reads from PageDataContext → 0 additional Firestore reads

### 6.3 What If the PageDataContext Is Empty?

If the user jumps directly to a page that hasn't loaded data yet, the page fetches normally and populates the context. The AI can check:

```typescript
// In AiAssistant.tsx
const { data: pageData } = usePageData();

function getEvents() {
  if (pageData.events) {
    return pageData.events;           // Use shared data (0 reads)
  }
  return null;                        // Not loaded yet — AI says "I don't have that info"
  // OR: fetchEvents(10).then(...)    // Still 0 reads from the AI perspective
  //     if we want the AI to fetch its own data (not recommended)
}
```

### 6.4 Refreshing Stale Data

Shared data can become stale if it was loaded 10 minutes ago and a new RSVP came in. Solutions:

1. **Time-based refresh**: PageDataContext stores a timestamp with each dataset. If data is older than X seconds, the page can refetch.
2. **Event-driven refresh**: When a write happens (new RSVP, new donation), the component that did the write also updates PageDataContext.
3. **On-demand refresh**: The AI can tell the user "That data might be stale — refresh the page to see the latest."

---

## 7. Implementation Plan: What to Do and Why

### 7.1 Phase 1: Populate PageDataContext on Key Pages (1-2 hours)

| Page | Data to Push | Impact |
|------|-------------|--------|
| `app/events/page.tsx` | `events`, `currentPath` | ✅ Done in demo |
| `app/programs/page.tsx` | `programs`, `currentPath` | Enables AI to answer "how many programs" |
| `app/dashboard/page.tsx` | All 15 dashboard datasets | **Biggest win** — eliminates Navigation + Dashboard duplicate reads |
| `app/donate/page.tsx` | `donations`, `currentPath` | Enables "total donations" answers |
| `app/masjid-construction/page.tsx` | `masjidUpdates`, `currentPath` | Enables "construction progress" answers |
| `app/page.tsx` (home) | `events`, `programs`, `news`, `masjidUpdates`, `currentPath` | Most-visited page |

### 7.2 Phase 2: Make AI Read from PageDataContext (2-3 hours)

Expand `askQuestion` in `AiAssistant.tsx` to check `pageData` before falling through to the KB:

```typescript
// In AiAssistant.tsx
const askQuestion = async (query: string) => {
  // Check PageDataContext first (0 Firestore reads)
  if (pageData.events && query.toLowerCase().includes('how many event')) {
    return { answer: `There are ${pageData.events.length} upcoming events.` };
  }
  if (pageData.donations && query.toLowerCase().includes('total donation')) {
    const total = pageData.donations.reduce((s, d) => s + d.amount, 0);
    return { answer: `Total donations: $${total.toLocaleString()}.` };
  }
  // Fall back to knowledge base as before
};
```

### 7.3 Phase 3: Eliminate Redundant Fetches in Navigation (1 hour)

The Navigation component reads 6 collections on every single page load. This is the worst offender:

```typescript
// Current code in Navigation.tsx (LINES 27-30)
const pendingEnrollments = await getDocs(query(
  collection(db, "enrollments"), where("status", "==", "pending"), limit(100)
));
```

**Fix:** Read from PageDataContext instead:

```typescript
// Fixed code in Navigation.tsx
import { usePageData } from "@/lib/page-data-context";

function Navigation() {
  const { data: pageData } = usePageData();
  
  // Use shared data instead of direct Firestore reads
  const pendingEnrollments = pageData.enrollments
    ?.filter(e => e.status === 'pending') ?? [];
  const pendingRSVPs = pageData.rsvps
    ?.filter(r => r.status === 'pending') ?? [];
    
  // If no shared data available, skip badge counts (graceful degradation)
  // Don't read from Firestore directly
}
```

**Impact:** This single change eliminates 6 Firestore reads from every single page load.

### 7.4 Phase 4: Session-Level Caching with `sessionStorage` (2 hours)

Wrap every `fetch*` function in `lib/firebase.ts` with a sessionStorage cache:

```typescript
// In lib/firebase.ts
function cachedFetch<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttlMs: number = 30000  // 30 second cache
): Promise<T> {
  const cached = sessionStorage.getItem(key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < ttlMs) {
      return Promise.resolve(data as T);
    }
  }
  return fetcher().then(data => {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  });
}

// Usage:
const events = await cachedFetch('events', () => fetchEvents(100), 30000);
```

**Impact:** Stops repeated reads during the same browser session. Page refresh still triggers reads, but navigating between pages within the same session does not.

### 7.5 Phase 5: Harder Cache with `localStorage` + Cache-First Strategy (3 hours)

For data that changes infrequently (programs, news, masjid construction), use localStorage with a longer TTL:

```typescript
const PROGRAMS_CACHE_KEY = 'mhma_cache_programs';
const PROGRAMS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getProgramsCached() {
  const cached = localStorage.getItem(PROGRAMS_CACHE_KEY);
  if (cached) {
    const { data, ts } = JSON.parse(cached);
    if (Date.now() - ts < PROGRAMS_CACHE_TTL) {
      return data;
    }
  }
  const fresh = await fetchPrograms(100);
  localStorage.setItem(PROGRAMS_CACHE_KEY, JSON.stringify({ data: fresh, ts: Date.now() }));
  return fresh;
}
```

**Impact:** Reduces reads even across page refreshes within the cache window.

### 7.6 Phase 6: Make the AI Fully Frontend-RAG (4-5 hours)

The final state: **the AI never reads from Firestore directly.** All live data comes from:

1. **PageDataContext** — data already loaded by the current page (0 Firestore reads)
2. **Auth context** — user's role, name, email (already loaded)
3. **localStorage/sessionStorage** — cached data from previous page loads (0 reads if cache is warm)
4. **Knowledge base** — static `assistant-knowledge.ts` (file, not Firestore)

The only data the AI would read from Firestore is the static knowledge base, which is already in a `.ts` file — so **zero Firestore reads for the AI**.

---

## 8. Caching Strategies: Surviving Page Reloads

> *"If the user reloads the page, it'll keep calling Firestore repeatedly."*

**Yes.** And here's how to fix it.

### 8.1 Strategy 1: `sessionStorage` (Session-Level Cache)

| Property | Value |
|----------|-------|
| Storage location | Browser tab memory |
| Survives page refresh? | **Yes** (same tab) |
| Survives tab close? | No |
| Survives different tabs? | No |
| Data size limit | ~5MB |
| Best for | RSVPs, enrollments, scheduling — data that changes frequently |

```typescript
// lib/with-cache.ts
const cache = new Map<string, { data: any; ts: number }>();

export function withCache<T>(key: string, fetcher: () => Promise<T>, ttl = 30000): Promise<T> {
  // Check in-memory cache first (fastest)
  const inMem = cache.get(key);
  if (inMem && Date.now() - inMem.ts < ttl) return Promise.resolve(inMem.data);

  // Check sessionStorage (survives refresh)
  try {
    const ss = sessionStorage.getItem(`mhma_cache_${key}`);
    if (ss) {
      const parsed = JSON.parse(ss);
      if (Date.now() - parsed.ts < ttl) {
        cache.set(key, { data: parsed.data, ts: parsed.ts });
        return Promise.resolve(parsed.data);
      }
    }
  } catch {}

  // Fetch fresh data
  return fetcher().then(data => {
    cache.set(key, { data, ts: Date.now() });
    try { sessionStorage.setItem(`mhma_cache_${key}`, JSON.stringify({ data, ts: Date.now() })); } catch {}
    return data;
  });
}
```

### 8.2 Strategy 2: `localStorage` (Persistent Cache)

| Property | Value |
|----------|-------|
| Storage location | Browser disk |
| Survives page refresh? | **Yes** |
| Survives tab close? | **Yes** (persistent) |
| Survives browser restart? | **Yes** |
| Data size limit | ~5-10MB |
| Best for | Programs, news, About stats — data that changes rarely |

```typescript
// lib/with-persistent-cache.ts
export function withPersistentCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 5 * 60 * 1000  // 5 minutes
): Promise<T> {
  try {
    const stored = localStorage.getItem(`mhma_pcache_${key}`);
    if (stored) {
      const { data, ts } = JSON.parse(stored);
      if (Date.now() - ts < ttl) return Promise.resolve(data);
    }
  } catch {}

  return fetcher().then(data => {
    try {
      localStorage.setItem(`mhma_pcache_${key}`, JSON.stringify({ data, ts: Date.now() }));
    } catch {}
    return data;
  });
}
```

### 8.3 Strategy 3: React Query / TanStack Query (Smartest)

React Query is a library built specifically for this problem. It handles caching, refetching, stale detection, and deduplication automatically:

```typescript
import { useQuery } from '@tanstack/react-query';

function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => fetch('/api/events').then(r => r.json()),
    staleTime: 30_000,        // Consider data fresh for 30 seconds
    gcTime: 5 * 60_000,       // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when user tabs back
  });
}

// In any component:
function EventsPage() {
  const { data: events, isLoading } = useEvents();
  // If another component also calls useEvents() on the same page,
  // React Query returns the cached data — 0 additional fetches.
}
```

**React Query automatically deduplicates requests.** If 3 components all call `useEvents()` on the same page, only 1 fetch happens.

### 8.4 Strategy 4: SWR (Stale-While-Revalidate)

Similar to React Query but lighter:

```typescript
import useSWR from 'swr';

function useProfile() {
  return useSWR('/api/profile', fetcher, {
    dedupingInterval: 30_000, // Deduplicate within 30 seconds
    revalidateOnFocus: false,
  });
}
```

### 8.5 Recommended Approach

For this project (reducing 189 reads to ~5-10):

1. **Navigation component** → Read from PageDataContext instead of Firestore (saves 6 reads per page)
2. **Duplicate API calls** → Wrap `/api/about-stats` fetches with sessionStorage cache (saves 12 reads × 4 pages = 48 reads)
3. **Dashboard page** → Use PageDataContext populated by the first page that loaded data (saves 15+ reads)
4. **Full cache layer** → Add sessionStorage to all `fetch*` functions in `lib/firebase.ts` with 30-second TTL
5. **React Query** → Add for pages that load heavy data (dashboard, analytics)

---

## 9. User Capacity Estimation: How Many Users Can We Support?

### 9.1 Firestore Free Tier (Spark Plan)

| Resource | Limit |
|----------|-------|
| Reads per day | **50,000** |
| Writes per day | **20,000** |
| Deletes per day | **20,000** |
| Stored data | 1 GiB total |
| Simultaneous connections | 100 |

### 9.2 Reads Per User Per Session

Based on our catalog, an average board member session (visiting Home → Dashboard → Events → Dashboard → Analytics → Logout):

| Page | Reads |
|------|-------|
| Home (1 visit) | ~541 |
| Dashboard (2 visits) | ~300 each = 600 |
| Events (1 visit) | ~32 |
| Analytics (1 visit) | ~550 |
| **Total per session** | **~1,723 reads** |

### 9.3 User Capacity Calculation

```
Free tier: 50,000 reads/day
Per user: 1,723 reads/session
Sessions per user: 2/day (morning + evening)

Daily reads per user: 1,723 × 2 = 3,446
Max users: 50,000 / 3,446 ≈ 14 users/day
```

**With the current code, only ~14 board members can use the app per day on the free tier.**

### 9.4 After Frontend RAG + Caching

```
With session-level caching (30s TTL):
- Same-page navigation: 0 additional reads
- Same-session navigation: ~50 reads per page (cached API calls)
- Fresh page loads: still ~541 on home, ~300 on dashboard

Per-session reads (with caching): ~300-400
Per user per day (2 sessions): ~700 reads

Max users with caching: 50,000 / 700 ≈ 71 users/day
```

### 9.5 With Full Optimization (Zero Duplication)

If we eliminate all identical reads:

| Read Source | Current | Optimized |
|-------------|---------|-----------|
| Navigation (6 collections) | 6 per page | 0 (uses PageDataContext) |
| Dashboard (15 fetch calls) | 15 per load | 0 (uses PageDataContext) |
| `/api/about-stats` (4 pages) | 48 per session | 12 per session (cached) |
| Auth + Theme reads | 2 per page | 2 per page (Auth is unavoidable) |
| Each page's own data | ~10 per page | ~10 per page (unavoidable) |
| **Total per session** | **~1,723** | **~100** |

```
Max users fully optimized: 50,000 / (100 × 2) ≈ 250 users/day
```

**Still on the free tier.** For a community the size of MHMA (maybe 30-50 active board members), this is fine.

### 9.6 When to Switch to Blaze (Pay-as-you-go)

Firestore Blaze plan charges **$0.06 per 100,000 reads**. That's:

- 50,000 reads/day on free tier
- 100,000 reads = $0.06
- 1,000,000 reads = $0.60
- 10,000,000 reads = $6.00

**For MHMA with 50 active users, even at the current inefficient rate:**
- 50 users × 3,446 reads/day = 172,300 reads/day
- Blaze cost = $0.06 × (172,300 / 100,000) = **$0.10/day** ($3/month)

The free tier is enough for testing and initial launch. Blaze is cheap enough that even 10× traffic would cost ~$30/month.

---

## 10. Firebase Free Tier vs Blaze: When Reads Matter

### 10.1 The Spark (Free) Plan Limits

| Limit | Value | What Happens When Exceeded |
|-------|-------|---------------------------|
| Reads/day | 50,000 | API calls start failing with `RESOURCE_EXHAUSTED` |
| Writes/day | 20,000 | Same — forms break |
| Simultaneous connections | 100 | New users see "Failed to connect" |
| Total stored data | 1 GiB | New writes blocked |

### 10.2 Current Read Rate

At 189 reads for your single test session, each page reload costs 189 reads. In a 5-minute testing session:
- 10 page loads = 1,890 reads
- 100 page loads = 18,900 reads

**You can exhaust the free daily quota with about 260 page loads.** That's why 189 reads is concerning.

### 10.3 What a Read "Counts" As

Firestone counts reads as:
- **Each document returned by a query** = 1 read
- **Each document fetched by `getDoc`** = 1 read
- **A query with no results** = 1 read (the query itself)

So `fetchEvents(100)` that returns 100 documents = 100 reads + 1 query read = 101 reads.

### 10.4 Blaze Plan Cost Estimate

| Scenario | Reads/Day | Cost/Day | Cost/Month |
|----------|-----------|----------|------------|
| Current code, 10 users | 34,460 | Free (under 50k) | Free |
| Current code, 50 users | 172,300 | ~$0.10 | ~$3 |
| Optimized, 50 users | 10,000 | Free (under 50k) | Free |
| Optimized, 500 users | 100,000 | ~$0.06 | ~$1.80 |
| All users cached, heavy | 1,000,000 | ~$0.60 | ~$18 |

**Bottom line:** Even the current code on Blaze costs <$3/month for MHMA's expected user base. But we should optimize to stay on free tier as long as possible.

---

## Appendix: Quick Answers to Your Specific Questions

### Q: How does Vercel run backend code?

Vercel packages each `app/api/**/route.ts` file as an AWS Lambda function. When you visit the URL, Vercel spins up that function (takes ~50ms cold start), runs the code, returns the result, and shuts it down.

### Q: How does `/api/events` know to serve JSON?

The file `app/api/events/route.ts` exports a function called `GET`:

```typescript
export async function GET(request: NextRequest) {
  // This runs when someone visits /api/events
  const data = await firestore.collection('events').get();
  return Response.json(data);  // ← This creates the JSON response
}
```

Next.js convention: `export async function GET()` = handle HTTP GET requests. `POST()` = handle POST requests.

### Q: Where in the code is Firestore data read for the frontend?

Two places:
1. **Server-side**: `app/api/**/route.ts` files read from Firestore using Admin SDK and return JSON
2. **Client-side**: `lib/firebase.ts` functions like `fetchEvents()` call Firestore directly from the browser using Client SDK

### Q: How do we avoid duplicate reads?

**Frontend RAG** + **caching**:
1. Pages push fetched data into `PageDataContext`
2. AI reads from `PageDataContext`
3. Navigation reads from `PageDataContext`
4. Other pages on the same session read from `sessionStorage` cache
5. Same-user reloads within TTL window read from `localStorage` cache

### Q: Is 189 reads normal?

For a single dashboard load on this codebase? **Yes, regrettably.** 15+ direct Firestore calls + 1 API route (reading 12 collections) + 6 navigation calls + 2 auth/theme reads. The problem is the Navigation component and the Dashboard page both reading the same data independently.

### Q: Should we switch to Blaze?

Not yet. Fix the duplicate reads first. If you're under 50k/day with optimization (which we should be for MHMA's scale), the free tier is sufficient. Switch to Blaze when you hit 40k/day as a safety margin.
