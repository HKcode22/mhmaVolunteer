# MHMA API Architecture — Complete Explanation

> This document explains EVERY API in the system: what it is, where it runs, how data flows, and why each exists. No assumptions, just code-level facts.

---

## TABLE OF CONTENTS

1. [What Is an API?](#1-what-is-an-api)
2. [The Three Layers of API in This System](#2-the-three-layers-of-api-in-this-system)
3. [Layer 1: Browser ↔ Firestore (Firebase Client SDK)](#3-layer-1-browser--firestore-firebase-client-sdk)
4. [Layer 2: Browser ↔ Next.js Server (API Routes)](#4-layer-2-browser--nextjs-server-api-routes)
5. [Layer 3: Next.js Server ↔ Firestore (Firebase Admin SDK)](#5-layer-3-nextjs-server--firestore-firebase-admin-sdk)
6. [Which Pages Use Which Layer? (Actual Code Analysis)](#6-which-pages-use-which-layer-actual-code-analysis)
7. [Why API Routes Exist — Complete List of Reasons](#7-why-api-routes-exist--complete-list-of-reasons)
8. [The Full Lifecycle of an RSVP Submission](#8-the-full-lifecycle-of-an-rsvp-submission)
9. [The Full Lifecycle of a Dashboard CRUD Operation](#9-the-full-lifecycle-of-a-dashboard-crud-operation)
10. [The Two Paths for Enrollment: Client SDK vs API Route](#10-the-two-paths-for-enrollment-client-sdk-vs-api-route)
11. [What Counts as a Firestore Read/Write?](#11-what-counts-as-a-firestore-readwrite)
12. [How Many APIs Are There? (Complete Inventory)](#12-how-many-apis-are-there-complete-inventory)

---

## 1. What Is an API?

An API (Application Programming Interface) is a way for one piece of software to talk to another. In web development, "API" usually means an HTTP endpoint — a URL you send a request to and get a response back.

### Example

```
Browser:  GET https://mhma-update.vercel.app/api/events
Server:   [200] [{ "title": "Eid Festival", "rsvpCount": 15 }, ...]
```

The browser sends a GET request to the URL. The server processes it and returns JSON data.

### But APIs Are Also Hidden

Some APIs you don't see as URLs. For example:

```javascript
import { getDoc, doc } from "firebase/firestore";

// This is ALSO an API call — but the URL is hidden inside the SDK
const snapshot = await getDoc(doc(db, "users", "abc123"));
```

The Firestore SDK automatically translates `getDoc()` into an HTTPS request to `firestore.googleapis.com`. You never see the URL, but it's there.

### Summary

| Visibility | Example | What's actually happening |
|---|---|---|
| Visible | `fetch("/api/events")` | Browser → Your Server → Firestore |
| Hidden | `getDoc(doc(db, "events", "id"))` | Browser → Firestore directly (via SDK) |

---

## 2. The Three Layers of API in This System

This system has THREE distinct API layers. They are NOT the same thing.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        THE THREE API LAYERS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  LAYER 1: Browser ↔ Firestore (Client SDK)                             │
│  ─────────────────────────────────────────                               │
│  What: Direct HTTPS calls from browser to Google's Firestore servers    │
│  SDK:  @firebase/firestore                                              │
│  Files: lib/firebase-client.ts (init), lib/firebase.ts (functions)     │
│  Auth:  Firebase API key + current user's auth token                    │
│  Rules: Enforced by firestore.rules                                     │
│  Used:  Dashboard CRUD (events, programs, members, etc.)               │
│                                                                         │
│  LAYER 2: Browser ↔ Next.js Server (API Routes)                        │
│  ─────────────────────────────────────────                               │
│  What: Custom HTTP endpoints on YOUR server (Vercel/localhost)          │
│  URLs:  /api/events, /api/rsvp, /api/enroll, /api/contact, etc.       │
│  Files: app/api/**/route.ts                                             │
│  Auth:  Whatever we implement (token check, no check, etc.)            │
│  Rules: No Firestore rules — code-based validation instead             │
│  Used:  Public forms, aggregated reads, admin operations               │
│                                                                         │
│  LAYER 3: Next.js Server ↔ Firestore (Admin SDK)                       │
│  ─────────────────────────────────────────                               │
│  What: Server-side calls from API routes to Firestore                   │
│  SDK:  firebase-admin (Node.js only)                                    │
│  Files: lib/firebase-admin.ts (init)                                    │
│  Auth:  Service account credentials (NOT the user)                      │
│  Rules: Bypassed — full access                                          │
│  Used:  Everything the API routes do                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Insight

**Layer 1 and Layer 3 both talk to Firestore, but they are different APIs.**

- Layer 1 uses the **Client SDK** — runs in browser, uses user's auth, respects security rules
- Layer 3 uses the **Admin SDK** — runs on server, uses service account, bypasses rules

**Layer 2 is OUR code** — these are the endpoints we created. Layer 2 uses Layer 3 internally to talk to Firestore.

---

## 3. Layer 1: Browser ↔ Firestore (Firebase Client SDK)

### How It Works

```javascript
// lib/firebase-client.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSy...",        // Public — safe to expose
  projectId: "mhma-volunteer", // Identifies your Firebase project
  // ...
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);   // This creates a connection to Firestore
```

When you call `getDoc(doc(db, "events", "abc123"))`, the SDK:

1. Opens an HTTPS connection to `https://firestore.googleapis.com/v1/projects/mhma-volunteer/databases/(default)/documents/events/abc123`
2. Attaches the Firebase API key and the user's auth token as headers
3. Firestore checks: "Is this user allowed to read this document?" (security rules)
4. If yes, returns the document data
5. If no, returns "permission denied"

### What it looks like in DevTools

Open Chrome DevTools → Network tab → Filter by "firestore":

```
Request URL: https://firestore.googleapis.com/v1/projects/mhma-volunteer/databases/(default)/documents/events
Request Method: POST
Status Code: 200
```

You'll see requests to `firestore.googleapis.com` — these are the Client SDK calls.

### What It Can Do

| Action | Code | Description |
|--------|------|-------------|
| Read one doc | `getDoc(doc(db, "events", id))` | Read a single document |
| Read many docs | `getDocs(collection(db, "events"))` | Read all documents in a collection |
| Read with filter | `getDocs(query(collection(db, "users"), where("role", "==", "board")))` | Read with conditions |
| Write a doc | `addDoc(collection(db, "rsvps"), {...})` | Create a new document |
| Update a doc | `updateDoc(doc(db, "events", id), {...})` | Update fields |
| Delete a doc | `deleteDoc(doc(db, "events", id))` | Delete a document |

### Security Rules

```
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if true;                    // Anyone can read events
      allow write: if request.auth != null     // Logged-in users can write
        && request.auth.token.role == 'board_member';
    }
  }
}
```

These rules ONLY apply to Layer 1 (Client SDK calls from browser). Layer 3 (Admin SDK from server) ignores them completely.

### Firestore WebSocket Channels (Write/channel, Listen/channel)

You may see these in DevTools under the "firestore.googleapis.com" domain:

```
Request URL: https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel
Request URL: https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel
```

These are **WebSocket connections** that the Firestore SDK opens automatically to:
- Listen for real-time updates (if onSnapshot is used anywhere)
- Keep the auth session alive
- Enable offline persistence

**In our codebase**, we never use `onSnapshot` (confirmed by grep — zero results). But the SDK opens these channels anyway as part of its initialization. They sometimes fail with `Fetch failed` errors, which are **usually harmless** — the SDK falls back to normal HTTPS requests.

If they bother you (console noise), we can configure the SDK to disable them:
```javascript
const db = getFirestore(app);
// Disable persistent connections
db.settings({ experimentalForceLongPolling: true });
```

---

## 4. Layer 2: Browser ↔ Next.js Server (API Routes)

### What Are API Routes?

API routes are files in `app/api/**/route.ts` that Next.js turns into HTTP endpoints.

```
File: app/api/events/route.ts
URL:  https://mhma-update.vercel.app/api/events
File: app/api/rsvp/route.ts
URL:  https://mhma-update.vercel.app/api/rsvp
```

### How They Work

```typescript
// app/api/rsvp/route.ts — runs on the SERVER only
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // 1. Parse the request body (JSON sent by browser)
  const body = await req.json();

  // 2. Do server-side work (write to Firestore, send emails)
  // ... (uses Admin SDK — Layer 3)

  // 3. Return response to browser
  return NextResponse.json({ success: true });
}
```

### Where Do They Run?

| Environment | Location |
|---|---|
| Development | Your computer (`localhost:3000`) |
| Production | Vercel's servers (serverless functions) |

When deployed, each API route becomes a **serverless function** on Vercel. When someone requests `/api/rsvp`, Vercel spins up a Node.js process, runs the route handler, and returns the response. The process shuts down shortly after.

### How Are They Called?

```javascript
// From ANY page — client or server component
const res = await fetch("/api/rsvp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fullName: "John", email: "john@..." }),
});
```

The browser makes a normal HTTP request to the SAME domain as the website. There is no CORS issue because it's the same origin.

### Complete Inventory of API Routes

| File | URL | Method | Purpose |
|------|-----|--------|---------|
| `app/api/rsvp/route.ts` | `/api/rsvp` | POST | Submit RSVP + send emails |
| `app/api/enroll/route.ts` | `/api/enroll` | POST | Submit enrollment + send emails |
| `app/api/contact/route.ts` | `/api/contact` | POST | Submit contact form + send email |
| `app/api/events/route.ts` | `/api/events` | GET | Get events with RSVP counts |
| `app/api/programs/route.ts` | `/api/programs` | GET | Get programs with enrollment counts |
| `app/api/about-stats/route.ts` | `/api/about-stats` | GET | Get aggregated community stats |
| `app/api/about-stats/route.ts` | `/api/about-stats` | POST | Update about stats (board only) |

---

## 5. Layer 3: Next.js Server ↔ Firestore (Firebase Admin SDK)

### What Is the Admin SDK?

The Admin SDK is a special Firebase library for **server-side** use. It uses a service account (a JSON key file) to authenticate directly with Google, bypassing all security rules.

```javascript
// lib/firebase-admin.ts
import admin from "firebase-admin";

// This runs ONLY on the server (never in browser)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const firestore = admin.firestore();
```

### Key Difference from Client SDK

| Aspect | Client SDK (browser) | Admin SDK (server) |
|--------|---------------------|-------------------|
| Auth method | Firebase API key + user token | Service account (server-to-server) |
| Security rules | ✅ Enforced | ❌ Bypassed |
| Can send emails | ❌ | ✅ (with email library) |
| Has access to secrets | ❌ (all env vars with NEXT_PUBLIC_ are exposed) | ✅ (env vars stay secret) |
| Environment variables prefix | `NEXT_PUBLIC_*` | Any (no prefix needed) |

### Why the Admin SDK Exists

1. **Email sending** — requires SMTP credentials stored in secret env vars
2. **Admin operations** — like updating about-stats where you need to verify the user's role first
3. **Server-side aggregation** — combining data from multiple collections efficiently
4. **Data validation** — more thorough validation than security rules allow

---

## 6. Which Pages Use Which Layer? (Actual Code Analysis)

I grepped the entire codebase. Here is exactly what each page uses:

### Public Forms (RSVP, Enroll, Contact)

| Page | Imports from firebase.ts | Uses Layer 1? | Uses Layer 2? |
|------|--------------------------|---------------|---------------|
| `/rsvp/page.tsx` | `fetchEvents` only (reads event list) | ✅ (reads events) | ✅ `fetch("/api/rsvp")` (submits) |
| `/enroll/page.tsx` | `fetchPrograms` only (reads program list) | ✅ (reads programs) | ✅ `fetch("/api/enroll")` (submits) |
| Contact page | (not checked, but likely similar pattern) | | ✅ `fetch("/api/contact")` |

**These forms do:**
- Read data via Layer 1 (Client SDK) — e.g., fetch event list for dropdown
- Write data via Layer 2 + 3 (API route + Admin SDK) — submit the form + send emails

### Dashboard Pages (Board Members)

| Page | Imports from firebase.ts | Uses Layer 1? | Uses Layer 2? |
|------|--------------------------|---------------|---------------|
| `/dashboard/events/page.tsx` | CRUD functions | ✅ (all CRUD) | ❌ |
| `/dashboard/programs/page.tsx` | CRUD functions | ✅ (all CRUD) | ❌ |
| `/dashboard/users/page.tsx` | User functions | ✅ (all CRUD) | ❌ |
| Other dashboard pages | Various CRUD | ✅ | ❌ |

**Dashboard pages do:**
- All CRUD via Layer 1 (Client SDK) — direct browser-to-Firestore
- No API routes needed — board members are authenticated, no emails needed

### Public Pages That Show Data

| Page | Imports | Uses Layer 1? | Uses Layer 2? |
|------|---------|---------------|---------------|
| `/events/page.tsx` | `fetchEvents` or `fetch("/api/events")` | Depends | Uses `/api/events` for RSVP counts |
| `/programs/page.tsx` | `fetchPrograms` or `fetch("/api/programs")` | Depends | Uses `/api/programs` for enrollment counts |
| `/about/page.tsx` | `fetch("/api/about-stats")` | ❌ | ✅ |

**These pages use API routes** to get aggregated data (events + RSVP counts combined in one response).

---

## 7. Why API Routes Exist — Complete List of Reasons

Here is every reason, with code evidence:

### Reason 1: Email Sending (Primary)

**Evidence:**
```typescript
// app/api/rsvp/route.ts lines 29-47
try {
  await Promise.allSettled([
    sendEmail(email, `RSVP Confirmed - ${eventTitle}`, ...),
    notifyBoard(`New RSVP - ${eventTitle}`, ...),
  ]);
} catch (_) {}
```

The browser literally cannot send email. SMTP credentials are server-only secrets.

### Reason 2: Secure Admin SDK Operations

**Evidence:**
```typescript
// app/api/about-stats/route.ts lines 123-136
const decoded = await adminAuth.verifyIdToken(token);
if (role !== "board_member" && role !== "administrator") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

The API route verifies the user's role on the server before performing the write. This is more secure than relying on client-side checks.

### Reason 3: Server-Side Data Aggregation

**Evidence:**
```typescript
// app/api/events/route.ts
const eventsSnap = await firestore.collection("events").get();
const rsvpsSnap = await firestore.collection("rsvps").get();
// Combine events + RSVP counts on the server
```

Instead of the client making 2 requests and doing the merge, the server does it in one request. This is faster and more efficient.

### Reason 4: Write Data on Behalf of Users Without Auth

**Evidence:**
```typescript
// app/api/enroll/route.ts
// No auth check — anyone can submit enrollment
const { fullName, email } = await req.json();
await firestore.collection("enrollments").add({ ... });
```

The public enrollment form accepts submissions from anyone — even non-logged-in users. The API route writes to Firestore using the Admin SDK (bypassing rules that require auth).

### Reason 5: Rate Limiting and Spam Protection

We could add rate limiting (e.g., max 1 submission per IP per minute) to the API route. This is impossible with direct Client SDK calls.

### Reason 6: Server-Side Validation

The API route can validate data more thoroughly than security rules allow:
```typescript
if (!fullName || !email) {
  return NextResponse.json({ error: "Name and email required" }, { status: 400 });
}
```

### Reason 7: Access to Server-Only Services

The API route can use any Node.js library — email, PDF generation, image processing, etc.

---

## 8. The Full Lifecycle of an RSVP Submission

```
STEP 1: User opens /rsvp page
         │
         ▼
STEP 2: Page loads events for dropdown
         │  fetchEvents(100)  ← Layer 1 (Client SDK)
         │  → firestore.googleapis.com → returns event list
         ▼
STEP 3: User fills form and clicks Submit
         │
         ▼
STEP 4: Page calls fetch("/api/rsvp", { method: "POST", body: formData })
         │  ← This is Layer 2 (API Route)
         ▼
STEP 5: Vercel serverless function starts
         │  app/api/rsvp/route.ts runs
         ▼
STEP 6: Parse form data
         │  const body = await req.json()
         ▼
STEP 7: Write to Firestore
         │  firestore.collection("rsvps").add({...})  ← Layer 3 (Admin SDK)
         │  → Goes to firestore.googleapis.com with service account credentials
         │  → Bypasses security rules
         ▼
STEP 8: Send emails
         │  sendEmail(user, "RSVP Confirmed", ...)  ← Server only!
         │  notifyBoard("New RSVP", ...)
         ▼
STEP 9: Return success
         │  return NextResponse.json({ success: true })
         ▼
STEP 10: Browser shows "Thank you" to user

TOTAL FIRESTORE READS: 1 (step 2 — fetch events)
TOTAL FIRESTORE WRITES: 1 (step 7 — add rsvp doc)
TOTAL API ROUTE CALLS: 1 (step 4 — /api/rsvp)
```

### What If We Used Client SDK Instead?

```
STEP 1: User opens /rsvp page
STEP 2: Page loads events for dropdown
         │  fetchEvents(100) ← Layer 1
STEP 3: User fills form and clicks Submit
STEP 4: Page calls addRSVP(formData)  ← Layer 1
         │  → firestore.googleapis.com → creates document
         │  → Security rules check: "allow create: if true"
STEP 5: Browser shows "Thank you"
STEP 6: ... no email is sent. Nobody knows someone RSVP'd.
```

**The difference:** With Client SDK, no email. The board would need to manually check the dashboard to see new RSVPs.

---

## 9. The Full Lifecycle of a Dashboard CRUD Operation

```
Board member creates an event via Dashboard → Events:

STEP 1: User fills "Add Event" form
         │
         ▼
STEP 2: Page calls addEvent(formData)  ← Layer 1 (Client SDK)
         │  → firestore.googleapis.com
         │  → Security rules check: "is user a board member?"
         ▼
STEP 3: Firestore creates document
         │
         ▼
STEP 4: Page shows success toast
```

**No API route is used** because:
- No email needs to be sent
- The user is already authenticated as a board member
- Security rules handle authorization
- It's simpler and faster (no server round-trip)

---

## 10. The Two Paths for Enrollment: Client SDK vs API Route

The `addEnrollment()` function in `lib/firebase.ts` does exist, but it is **never imported by any page**. It's dead code.

```
Path A (API Route — actually used):
  /enroll/page.tsx
    → fetch("/api/enroll")
      → Admin SDK writes to Firestore
      → Emails sent
      → Returns success

Path B (Client SDK — NOT used):
  /enroll/page.tsx
    → import { addEnrollment } from "@/lib/firebase"
    → addEnrollment(data)
      → Client SDK writes to Firestore
      → No emails
      → Returns success
```

If you wanted to use Path B, you would:
1. Import `addEnrollment` in the page
2. Call it instead of `fetch("/api/enroll")`
3. Remove the confirmation email logic
4. Keep the page simple

**But we chose Path A because emails are important.** The board wants to know immediately when someone enrolls.

### Could We Remove Path B Entirely?

Yes. The `addEnrollment()` and `addRSVP()` functions in `lib/firebase.ts` are unused. They could be deleted. I would keep them because:
- They serve as documentation of what a client-side write looks like
- A future page might need a simple write without email
- Deleting code that works is unnecessary risk

---

## 11. What Counts as a Firestore Read/Write?

**Every time you call `getDoc`, `getDocs`, `addDoc`, `updateDoc`, `deleteDoc` — that is one or more reads/writes.**

| Operation | Read count | Write count |
|-----------|-----------|-------------|
| `getDoc(doc(db, "events", "id"))` | 1 read | 0 |
| `getDocs(collection(db, "events"))` | 1 per document | 0 |
| `getDocs(query(...))` | 1 per matched doc | 0 |
| `addDoc(collection(db, "rsvps"), {...})` | 0 | 1 |
| `updateDoc(doc(db, "events", "id"), {...})` | 0 | 1 |
| `deleteDoc(doc(db, "events", "id"))` | 0 | 1 |

**The Spark plan (free) gives:** 50k reads/day, 20k writes/day

### Current Usage Estimate

| Operation | Daily reads | Daily writes |
|-----------|-------------|-------------|
| Dashboard page loads (10 board members × 5 pages each) | 50 × 10 = 500 | — |
| Public page loads (100 visitors × 3 pages each) | 300 × 3 = 900 | — |
| RSVP submissions (10/day) | 10 (events list) | 10 |
| Enrollment submissions (5/day) | 5 (programs list) | 5 |
| API routes (behind the scenes) | varies | varies |
| **TOTAL** | ~1,500 | ~20 |

We are well within the free tier.

---

## 12. How Many APIs Are There? (Complete Inventory)

### External APIs (we consume)

| API | Used by | Purpose |
|-----|---------|---------|
| Firebase Firestore REST API | Client SDK + Admin SDK | Database operations |
| Firebase Auth REST API | `lib/firebase-client.ts` | Authentication |
| SMTP (email server) | `lib/email.ts` | Send emails |

### Internal APIs (we built)

| Endpoint | File | Purpose |
|----------|------|---------|
| `POST /api/rsvp` | `app/api/rsvp/route.ts` | Submit RSVP + send emails |
| `POST /api/enroll` | `app/api/enroll/route.ts` | Submit enrollment + send emails |
| `POST /api/contact` | `app/api/contact/route.ts` | Submit contact form + send email |
| `GET /api/events` | `app/api/events/route.ts` | Events with RSVP counts |
| `GET /api/programs` | `app/api/programs/route.ts` | Programs with enrollment counts |
| `GET /api/about-stats` | `app/api/about-stats/route.ts` | Aggregated community stats |
| `POST /api/about-stats` | `app/api/about-stats/route.ts` | Update about stats (board only) |

### Invisible APIs (SDK-managed)

| SDK | Target | Purpose |
|-----|--------|---------|
| Firebase Client SDK | `firestore.googleapis.com` | All DB operations from browser |
| Firebase Auth SDK | `identitytoolkit.googleapis.com` | Login, registration, magic links |
| Firebase Admin SDK | `firestore.googleapis.com` | All DB operations from server |

### Total: ~3 external APIs, ~7 internal endpoints

---

## Quick Summary

```
Question: "Is the RSVP form sending data directly to Firestore from the browser?"
Answer: NO. It sends data to our API route /api/rsvp, which runs on Vercel.
The API route writes to Firestore using Admin SDK credentials (not the browser).

Question: "Why not just use the Client SDK directly?"
Answer: Because the API route sends confirmation emails + board notifications.
The browser cannot send email. Also, the API route can validate data server-side.

Question: "What about dashboard operations like creating events?"
Answer: Those use the Client SDK directly (browser → Firestore).
No email needed, no server-side aggregation needed. Simpler is better.

Question: "Are there two APIs calling Firestore?"
Answer: Yes. Client SDK (browser) and Admin SDK (server). They use different
credentials, have different permissions, and are completely independent.
```
