# MHMA AI Assistant — RAG Architecture Plan (v2)

> This document explains EVERYTHING: the code flow, the database, the API routes, the worker, and why each piece exists. If something is unclear, it goes here.

---

## TABLE OF CONTENTS

1. [How the Firestore Database Works](#1-how-the-firestore-database-works)
2. [How API Routes Work (server-side)](#2-how-api-routes-work-server-side)
3. [How the Firebase Lib Functions Work (client-side)](#3-how-the-firebase-lib-functions-work-client-side)
4. [End-to-End Flow: Someone RSVPs on the Website](#4-end-to-end-flow-someone-rsvps-on-the-website)
5. [End-to-End Flow: Someone Asks the AI a Question](#5-end-to-end-flow-someone-asks-the-ai-a-question)
6. [Why the qid + pendingMapRef Pattern?](#6-why-the-qid--pendingmapref-pattern)
7. [The pendingMapRef Lifecycle — What Happens on Refresh?](#7-the-pendingmapref-lifecycle--what-happens-on-refresh)
8. [How the ai_knowledge Collection Works (DEPRECATED)](#8-how-the-ai_knowledge-collection-works-deprecated)
9. [The Live Data Pipeline — Now Commented Out](#9-the-live-data-pipeline--now-commented-out)
10. [System Prompt — Why It's Sent Every Time](#10-system-prompt--why-its-sent-every-time)
11. [Files to Read to Verify the Flow](#11-files-to-read-to-verify-the-flow)

---

## 1. How the Firestore Database Works

Firestore is a cloud database from Firebase. Think of it as a big JSON object stored on Google's servers.

### Collections and Documents

```
Firestore
  └── events/              ← collection (like a folder)
        ├── abc123/        ← document (like a file)
        │     ├── title: "Eid Festival"
        │     ├── date: "2026-06-15"
        │     └── createdAt: Timestamp
        └── def456/
              └── ...
  └── users/               ← another collection
        └── ...
```

### Two Ways to Access Firestore

**Client SDK** (`lib/firebase.ts` + `lib/firebase-client.ts`):

- Runs in the user's BROWSER
- Limited by security rules (`firestore.rules`)
- Counts toward Spark plan reads/writes

**Admin SDK** (`lib/firebase-admin.ts`):

- Runs on the SERVER (in API routes like `app/api/.../route.ts`)
- Bypasses security rules (has full access)
- Does NOT count toward Spark plan limits (uses a separate service account quota: 50k/day for Spark)

**Key files:**


| File                     | What it does                                                                     |
| ------------------------ | -------------------------------------------------------------------------------- |
| `lib/firebase-client.ts` | Initializes the Firebase app + connects to Firestore (for browser)               |
| `lib/firebase.ts`        | Contains ALL the CRUD functions used by pages (fetchEvents, addEnrollment, etc.) |
| `lib/firebase-admin.ts`  | Initializes Firebase Admin SDK (for server API routes only)                      |
| `firestore.rules`        | Security rules — who can read/write what from the browser                        |


### getDocs vs onSnapshot

```javascript
// getDocs — ONE-TIME FETCH (like reading a book once)
const snapshot = await getDocs(collection(db, "events"));
// snapshot.docs contains all events at this moment
// If someone adds an event 1 second later, you won't see it
// Cost: 1 read per document

// onSnapshot — REAL-TIME LISTENER (like subscribing to a feed)
const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
  // This callback runs EVERY TIME something changes
  // You get live updates automatically
});
// Cost: 1 read per document initially + 1 read per change
```

We use `getDocs` everywhere because:

- It's simpler (no cleanup needed)
- It's cheaper (no persistent connection, no read-per-change)
- We don't need millisecond-level freshness

---

## 2. How API Routes Work (server-side)

API routes are special files in `app/api/.../route.ts`. They run on the Next.js SERVER, not in the browser.

### What Server Do They Run On?

The "server" is the **Next.js Node.js server** — NOT Firestore's server. Here's the distinction:

```
Browser (your computer)
  │  You visit /events → Next.js renders the page and sends HTML/JS
  │
  ▼
Next.js Server (Vercel cloud, or localhost:3000 during development)
  │  Runs API routes (app/api/.../route.ts)
  │  Can also render pages on the server (server components)
  │
  ▼
Firestore (Google Cloud)
  │  Stores all the data
  │  Accepts requests from both Browser (Client SDK) and Server (Admin SDK)
```

**During development:** `localhost:3000` (your computer acts as the server)
**In production:** Vercel's servers (or wherever the site is deployed)

### Why Use API Routes If We Already Have Client-Side Firebase Functions?

This is the most common point of confusion. Let me explain:

**Client-side functions** (`addRSVP`, `addEnrollment` in `lib/firebase.ts`) call Firestore DIRECTLY from the BROWSER. The user's browser talks to Google's Firestore servers using the Client SDK.

**API routes** are a MIDDLEMAN. The browser talks to the API route first, and the API route talks to Firestore using the Admin SDK.

```
Client SDK path (no API route):
  Browser → Firestore (Google Cloud)

API route path:
  Browser → Next.js Server (API route) → Firestore (Google Cloud)
```

**Why use a middleman? Three reasons:**

1. **Sending emails** — You can't send email from the browser (no SMTP access). The API route uses `lib/email.ts` to send confirmation emails and board notifications after form submission.
2. **Admin SDK access** — The Admin SDK bypasses Firestore security rules. For admin-only operations (like editing about-stats), the API route first verifies the user's auth token, then performs the operation.
3. **Server-side aggregation** — The `/api/events` route fetches ALL events and ALL RSVPs, then combines them into one response. This is safer and more efficient than having the client fetch both collections separately.

### Which Operations Use API Routes vs Client SDK?

Looking at the actual codebase:


| Operation | Method | Why |
| --- | --- | --- |
| Public RSVP form (`/rsvp`) | **API Route** (`/api/rsvp`) | Writes to Firestore + sends confirmation email + board notification |
| Public Enroll form (`/enroll`) | **API Route** (`/api/enroll`) | Writes to Firestore + sends confirmation email + board notification |
| Dashboard CRUD (events, programs, etc.) | **Client SDK** | Board members logged in, no emails needed |
| `/api/events` (GET) | **API Route** | Aggregates events + RSVP counts server-side |
| `/api/programs` (GET) | **API Route** | Aggregates programs + enrollment counts server-side |
| `/api/about-stats` (GET) | **API Route** | Aggregates 12+ collections server-side |
| `/api/contact` (POST) | **API Route** | Writes to Firestore + sends email notification |
| `/api/about-stats` (POST) | **API Route** | Verifies auth token, checks role, then updates stats |
| `addRSVP()` / `addEnrollment()` in `lib/firebase.ts` | **Defined but UNUSED** | Exist as helpers but no page imports them |

**Key insight:** The public forms (/rsvp, /enroll, /contact) all use API routes because they need to send emails. Dashboard operations (board members managing events, programs) use Client SDK directly because no email is needed. The `addRSVP()` / `addEnrollment()` functions in `lib/firebase.ts` are defined as utilities but are never actually imported by any page.

### Example: The `/api/enroll` Route

**File:** `app/api/enroll/route.ts`

```typescript
// This runs on the Next.js SERVER when someone POSTs to /api/enroll
export async function POST(req: NextRequest) {
  // 1. Parse the form data from the request body
  const { fullName, email, phone, program, message } = await req.json();

  // 2. Write to Firestore using Admin SDK (server-side, bypasses rules)
  await firestore.collection("enrollments").add({
    fullName, email, phone, program, message,
    status: "pending",
    createdAt: Timestamp.now(),  // Server timestamp
  });

  // 3. Send emails (this is why we need a SERVER — browsers can't send email)
  await Promise.allSettled([
    sendEmail(email, "Enrollment Received", confirmationEmail(fullName, ...)),
    notifyBoard("New Enrollment", `New enrollment from ${fullName}...`),
  ]);

  // 4. Return success response to the browser
  return NextResponse.json({ success: true });
}
```

**How it's called from the browser:**

```javascript
// In the enrollment form page (app/enroll/page.tsx):
const response = await fetch("/api/enroll", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fullName: "John", email: "john@...", program: "Quran" }),
});
```

### Example: The `/api/rsvp` Route

Same pattern as `/api/enroll`. It writes to Firestore and sends emails. The browser calls `fetch("/api/rsvp", ...)` instead of calling `addRSVP()` directly.

### Example: The `/api/events` Route

**File:** `app/api/events/route.ts`

```typescript
// This runs on the SERVER when someone GETs /api/events
export async function GET(req: NextRequest) {
  // 1. Fetch ALL events from Firestore
  const eventsSnap = await firestore.collection("events").get();

  // 2. Fetch ALL RSVPs from Firestore
  const rsvpsSnap = await firestore.collection("rsvps").get();

  // 3. On the SERVER, count how many RSVPs each event has
  const rsvpCounts: Record<string, number> = {};
  rsvpsSnap.forEach(doc => {
    const eventTitle = doc.data().eventTitle;
    rsvpCounts[eventTitle] = (rsvpCounts[eventTitle] || 0) + 1;
  });

  // 4. Attach RSVP counts to each event
  const events = eventsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    rsvpCount: rsvpCounts[doc.data().title] || 0,
  }));

  // 5. Return the combined data as JSON
  return NextResponse.json(events);
}
```

**Why do this on the server instead of the client?**

- The server reads all events and all RSVPs — that's just 2 reads
- If the client did this, each browser tab would do 2 reads
- The server response is cached by CDN (if we add cache headers)
- The aggregation logic is hidden from the browser (not that it's secret, but cleaner)

### Example: The `/api/about-stats` Route

This is the most complex API route. It fetches from **12 collections** simultaneously using `Promise.all`:

```typescript
const [
  statsSnap, programsSnap, eventsSnap, usersSnap, donationSnap,
  enrollmentSnap, rsvpSnap, subscriberSnap, contactSnap,
  pledgeSnap, volunteerSnap, newsSnap,
] = await Promise.all([
  firestore.collection("aboutStats").doc("stats").get(),
  firestore.collection("programs").get(),
  firestore.collection("events").get(),
  // ... etc
]);
```

It then calculates totals, filters by date range (30 days or all time), and returns a single JSON response. The About page and Homepage use this API to show community stats.

### Client SDK vs Admin SDK — Summary


|                 | Client SDK (`lib/firebase.ts`)                       | Admin SDK (`lib/firebase-admin.ts`)                            |
| --------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| Runs where      | Browser                                              | Server (API routes)                                            |
| Security        | Enforced by `firestore.rules`                        | No rules (full access)                                         |
| Firestore quota | Counts toward Spark plan                             | Also counts toward Spark plan (separate quota: 50k/day)        |
| Can send email? | No                                                   | Yes (via `lib/email.ts`)                                       |
| When to use     | User-facing CRUD (form submissions, dashboard lists) | Server-side aggregation, email notifications, admin operations |


### How `addRSVP()` Actually Connects to Firestore

You asked: "How does `addRSVP` in lib/firebase.ts actually connect to Firestore? I can't see the connection."

Here's the full chain:

```javascript
// lib/firebase-client.ts — initializes the Firebase app
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... etc (all NEXT_PUBLIC_ so they're sent to the browser)
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);  // This is the Firestore database instance
```

```javascript
// lib/firebase.ts — uses the database instance
import { db } from "./firebase-client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function addRSVP(data) {
  // addDoc + collection + db → this tells the Firestore SDK to:
  // 1. Make an HTTPS request to Google's Firestore REST API
  // 2. Using the project credentials from firebaseConfig
  // 3. Add a document to the "rsvps" collection
  const ref = await addDoc(collection(db, "rsvps"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
```

**The "connection" is implicit.** The Firestore SDK (`firebase/firestore`) knows:

- The project ID (from `firebaseConfig`)
- Your Firebase API key
- Your Firestore database URL (automatically derived from the project ID)

When you call `addDoc(collection(db, "rsvps"), {...})`, the SDK:

1. Opens an HTTPS connection to `firestore.googleapis.com`
2. Sends the data as a JSON body
3. Uses the API key for authentication
4. The Firestore server creates the document

**No visible URL or fetch call** — the SDK hides all that. It's like calling `console.log()` — you know it's doing something with the console, but you don't see the actual system calls.

### What About `/api/enroll` and `/api/rsvp` Being the Same as Client-Side Functions?

You're right to be confused! There IS overlap:

- `lib/firebase.ts` has `addEnrollment()` and `addRSVP()` that write directly to Firestore
- `app/api/enroll/route.ts` and `app/api/rsvp/route.ts` ALSO write to Firestore

**They do the same thing (write to Firestore), but the API route ALSO sends emails.**

In some pages, the form might call the client function (simpler, no email). In others, it calls the API route (adds email notifications). If neither sends the form to an API route, you can check which import the page uses.

### Bottom Line

| If you see...                              | It means...                                                                                  |
| `fetch("/api/rsvp", ...)`                  | This page sends data to the Next.js server first, which writes to Firestore AND sends emails |
| `fetch("/api/events")`                     | This page reads aggregated data from the server (events + RSVP counts combined)              |


---

## 3. How the Firebase Lib Functions Work (client-side)

The file `lib/firebase.ts` contains functions that pages use to read/write Firestore from the browser.

### Example: Enrollment Form (Real Code)

Here is the ACTUAL code from `/enroll/page.tsx`:

```typescript
// app/enroll/page.tsx — the enrollment form
// NOTE: This page calls the API route, NOT addEnrollment() directly

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        program: formData.program,
        message: formData.message,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setSuccess(true);
  } catch (error) {
    setError("Enrollment failed. Please try again.");
  }
};
```

And the `/api/enroll` route handles the actual Firestore write:

```typescript
// app/api/enroll/route.ts — runs on the Next.js SERVER
export async function POST(req: NextRequest) {
  const { fullName, email, phone, program, message } = await req.json();

  // 1. Write to Firestore using Admin SDK
  await firestore.collection("enrollments").add({
    fullName, email, phone, program, message,
    status: "pending", createdAt: Timestamp.now(),
  });

  // 2. Send emails (browser can't do this!)
  await Promise.allSettled([
    sendEmail(email, "Enrollment Received", ...),
    notifyBoard("New Enrollment", ...),
  ]);

  return NextResponse.json({ success: true });
}
```

### What About the Client-Side `addRSVP` / `addEnrollment` Functions?

These functions **do exist** in `lib/firebase.ts` but they are **never imported or called by any page**. They are dead code — defined but unused.

Here is the actual evidence:
- `/rsvp/page.tsx` imports `{ fetchEvents }` from firebase (to load the event dropdown), then calls `fetch("/api/rsvp")` to submit
- `/enroll/page.tsx` imports `{ fetchPrograms }` from firebase (to load the program dropdown), then calls `fetch("/api/enroll")` to submit

The client functions were written as reusable utilities but the decision was made to go through API routes instead (for email notifications). The functions sit unused but could be activated if a page needed a simpler path without emails.

### Directory of all CRUD functions


| Function                                                           | Collection    | What it does       |
| ------------------------------------------------------------------ | ------------- | ------------------ |
| `fetchEvents` / `addEvent` / `updateEvent` / `deleteEvent`         | `events`      | Manage events      |
| `fetchPrograms` / `addProgram` / `updateProgram` / `deleteProgram` | `programs`    | Manage programs    |
| `fetchEnrollments` / `addEnrollment` / `updateEnrollment`          | `enrollments` | Manage enrollments |
| `fetchRSVPs` / `addRSVP` / `updateRSVP` / `deleteRSVP`             | `rsvps`       | Manage RSVPs       |
| `fetchDonations` / `addDonation` / `deleteDonation`                | `donations`   | Manage donations   |
| ...same pattern for all other collections...                       |               |                    |


---

## 4. End-to-End Flow: Someone RSVPs on the Website

Here is EXACTLY what happens when someone fills out the RSVP form and clicks Submit:

```
1. User fills form on /rsvp page
   Fields: fullName, email, phone, eventId, attendees, notes
      │
      ▼
2. Form calls: fetch("/api/rsvp", { method: "POST", body: formData })
   (This sends the data to the Next.js server)
      │
      ▼
3. Next.js SERVER (Vercel or localhost:3000) receives the request
   The POST handler in app/api/rsvp/route.ts runs:
      │
      ├── 3a. Parses the form data from the request body
      │       (fullName, email, phone, eventTitle, attendees, notes)
      │
      ├── 3b. Writes to Firestore using Admin SDK:
      │       firestore.collection("rsvps").add({
      │         ...formData,
      │         status: "pending",
      │         createdAt: new Date().toISOString(),
      │       })
      │       │
      │       ▼
      │       Firestore (Google Cloud) receives the Admin SDK write
      │       No security rules check (Admin SDK bypasses them)
      │       Creates document in rsvps collection
      │
      ├── 3c. Sends confirmation email to the user:
      │       sendEmail(email, "RSVP Confirmed - EventTitle", ...)
      │       │
      │       ▼
      │       User receives "Your RSVP has been received" email
      │
      └── 3d. Sends notification email to board members:
              notifyBoard("New RSVP - EventTitle", ...)
              │
              ▼
              Board receives "New RSVP from John" notification
      │
      ▼
4. Server responds: { success: true, id: "abc123" }
   Form shows "Thank you" message to user
```

### Alternative path: If a page used the Client SDK directly

**In this codebase, this path is NOT actually used for public forms.** The `addRSVP()` and `addEnrollment()` functions exist in `lib/firebase.ts` but no page imports them. However, if a page DID use them, the flow would be:

```
1. User fills form
      │
      ▼
2. Page calls: await addRSVP(formData)
   (This function is from lib/firebase.ts)
      │
      ▼
3. addRSVP() runs in the BROWSER (Client SDK):
   addDoc(collection(db, "rsvps"), {
     ...formData,
     status: "pending",
     createdAt: serverTimestamp(),
   })
      │
      ▼
4. Firestore (Google Cloud) receives the request
   Checks security rules: "allow create: if true" ✓
   Creates a new document in the rsvps collection
      │
      ▼
5. Page shows success message
   No email is sent (browsers can't send email)
```

### Why this codebase uses API routes for public forms

| Reason | Client SDK | API Route |
|--------|-----------|-----------|
| Sends confirmation email | ❌ No | ✅ Yes |
| Sends board notification | ❌ No | ✅ Yes |
| Data validation | ❌ Basic (rules only) | ✅ Server-side |
| Simpler code | ✅ Yes | ❌ Extra server code |

The API route gives us **email notifications** — the main reason. Without it, no one knows someone submitted an RSVP or enrollment until they manually check the dashboard.

---

## 5. End-to-End Flow: Someone Asks the AI a Question

Here is EXACTLY what happens when a user types "How do I create an event?" and clicks Send:

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: User types question → AiAssistant.tsx sends the query     │
└─────────────────────────────────────────────────────────────────────┘

1. User types "How do I create an event?" in the chat textarea
2. User presses Enter or clicks Send
3. handleSend() is called:
   a. Sets loading = true (shows "Thinking..." spinner)
   b. Calls askQuestion("How do I create an event?")
   c. askQuestion() receives the query string


┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Retrieval — search for matching knowledge                 │
└─────────────────────────────────────────────────────────────────────┘

4. askQuestion() runs retrieve() with:
   - Query: "How do I create an event?"
   - Docs: the static knowledgeBase array from `assistant-knowledge.ts`
   - Role: the user's role (member / board_member)

5. retrieveFromDocs() does:
   a. Tokenizes the query: ["how", "do", "i", "create", "event"]
      (lowercase, remove special characters, remove 1-letter words)
   b. For EACH knowledge entry (250+), checks if any query word matches:
      - Entry: "How do I create an event?" + keywords: ["create event", ...]
        → "create" matches "create" ✓
        → "event" matches "event" ✓
        → matched = 2 out of 5 words = score 0.4
      - Entry: "How do I manage donations?"
        → no words match → skipped
   c. If user is board_member, adds 0.15 bonus to entries with board_member role
   d. Sorts by score, takes top 2 matches

6. Result: context string with 2 matched Q&A pairs (from static knowledge base only):
   "How do I create an event?
    Go to Dashboard → Events → click Add Event...
    ---
    Where do I find the list of events?
    Go to Dashboard → Events..."

   Note: The knowledge base is purely static (TypeScript file). No Firestore reads occur during retrieval. The live data pipeline and Firestore ai_knowledge collection are both disabled.


┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Send to the AI model (Web Worker)                         │
└─────────────────────────────────────────────────────────────────────┘

7. askQuestion() creates a qid (unique ID):
   qid = Math.random().toString(36).slice(2, 8)  // e.g., "a3x7p9"

8. Stores a Promise in pendingMapRef:
   pendingMapRef.set("a3x7p9", resolveFunction)
   // This is like writing down "when food is ready for order #a3x7p9,
   // call this phone number"

9. Sends message to the Web Worker:
   worker.postMessage({
     type: 'query',
     data: {
       query: "How do I create an event?",
       context: "How do I create an event?\nGo to Dashboard → Events...",
       id: "a3x7p9"
     }
   })

10. The worker receives the message and starts inference:
    a. Builds the full prompt:
       System: "You are the MHMA assistant. Answer ONLY from context..."
       Context: "How do I create an event?\nGo to Dashboard → Events..."
       Question: "How do I create an event?"
    b. Runs SmolLM2-135M model (takes 300-1500ms)
    c. Gets the generated text
    d. Sends result back:
       worker.postMessage({
         type: 'result',
         id: 'a3x7p9',
         answer: 'Go to Dashboard → Events and click Add Event...'
       })


┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Display the answer                                        │
└─────────────────────────────────────────────────────────────────────┘

11. AiAssistant.tsx receives the result message

12. Looks up "a3x7p9" in pendingMapRef:
    pendingMapRef.get("a3x7p9") → resolveFunction

13. Calls resolveFunction("Go to Dashboard → Events...")
    This resolves the Promise from step 8

14. The Promise resolves in askQuestion():
    const aiAnswer = await aiPromise;  // "Go to Dashboard → Events..."

15. Returns { answer: "Go to Dashboard → Events..." } to handleSend()

16. handleSend() adds the answer as a new message:
    setMessages(prev => [...prev, { role: 'assistant', text: answer }])

17. loading = false, textarea refocuses for next question


┌─────────────────────────────────────────────────────────────────────┐
│ VISUAL TIMELINE (simplified)                                       │
└─────────────────────────────────────────────────────────────────────┘

Time 0ms:    User clicks Send
Time 0ms:    retrieve() runs on static knowledgeBase (0-5ms, no Firestore reads)
Time 5ms:    Worker receives query
Time 5-500ms: Model generates answer (depends on hardware)
Time 500ms:  Worker sends result
Time 500ms:  AiAssistant receives result, displays it
```

---

## 6. Why the qid + pendingMapRef Pattern?

This is the most confusing part, so let me explain it with a real-world analogy.

### The Problem

The AI model runs in a **Web Worker** — a separate thread that can run JavaScript in the background without blocking the UI. The main thread (React component) and the worker communicate using `postMessage`:

```
Main Thread:  postMessage({ type: 'query', data: { query, context, id } })
Worker:       onmessage → process → postMessage({ type: 'result', id, answer })
Main Thread:  onmessage → display answer
```

This is asynchronous — like sending a letter and waiting for a reply.

### What if the user asks 2 questions quickly?

```
Time 0ms:  User asks "How do I create an event?"
           Main thread sends query to worker
           Main thread waits for response...

Time 100ms: User asks "How do I approve enrollments?"
            Main thread sends ANOTHER query to worker
            Main thread waits for response...

Time 500ms: Worker finishes first query
            Sends back: { type: 'result', answer: "Go to Dashboard..." }
            Main thread receives it
            BUT WHICH QUESTION DOES THIS ANSWER BELONG TO?
```

**Without qid:** The main thread has 2 pending questions. When the worker responds, it doesn't know which answer corresponds to which question. Both Promises might resolve with the same answer, or the second question gets the first answer.

**With qid:** Each question gets a unique ID.

```
Question 1: id = "a3x7p9", stored in pendingMapRef as: "a3x7p9" → resolve1
Question 2: id = "b8k2m1", stored in pendingMapRef as: "b8k2m1" → resolve2

Worker sends back: { id: "a3x7p9", answer: "Go to Dashboard..." }
  → Look up "a3x7p9" in pendingMapRef → found resolve1
  → Call resolve1(answer) → Question 1 gets answered

Worker sends back: { id: "b8k2m1", answer: "From Dashboard → Programs..." }
  → Look up "b8k2m1" → found resolve2
  → Call resolve2(answer) → Question 2 gets answered
```

### Why not just use a single variable?

```javascript
// WRONG approach — single variable
let pendingResolve = null;

worker.onmessage = (event) => {
  pendingResolve(event.data.answer);  // Which question does this answer?
  pendingResolve = null;
};

// If user sends 2 questions before first is answered:
pendingResolve = resolve1;  // ← overwritten!
pendingResolve = resolve2;  // ← resolve1 is lost forever!
worker sends back answer → resolve2 gets called twice, resolve1 never called
```

**The Map approach** handles any number of concurrent questions correctly.

---

## 7. The pendingMapRef Lifecycle — What Happens on Refresh?

You asked: "Does the pendingMapRef persist across refreshes?"

**Short answer: No. It resets to empty on every page refresh.**

### Why?

`pendingMapRef` is declared with `useRef`:

```javascript
const pendingMapRef = useRef<Map<string, (value: string | null) => void>>(new Map());
```

`useRef` is a React hook that persists a value for the **lifetime of the component**. The component's lifetime is the lifetime of the page tab.

### The Full Lifecycle

```
1. User opens /dashboard
   → AiAssistant component mounts
   → pendingMapRef.current = new Map()  ← EMPTY MAP

2. User asks first question "How do I create an event?"
   → pendingMapRef.set("a3x7p9", resolveFn)  ← Map has 1 entry

3. User asks second question "How do I approve enrollments?"
   → pendingMapRef.set("b8k2m1", resolveFn)  ← Map has 2 entries

4. Worker answers first question
   → pendingMapRef.get("a3x7p9") → found! → resolve → delete
   → Map has 1 entry ("b8k2m1")

5. Worker answers second question
   → pendingMapRef.get("b8k2m1") → found! → resolve → delete
   → Map is empty again

6. User refreshes the page
   → React unmounts the component
   → All refs are garbage collected (including pendingMapRef)
   → React mounts a new instance
   → pendingMapRef.current = new Map()  ← FRESH EMPTY MAP
   → Any pending worker queries are abandoned (the worker is also terminated on unmount)
```

### What About Orphaned Queries?

If a user asks a question, then refreshes before the worker answers:

1. Question is sent to worker, resolveFn stored in `pendingMapRef`
2. User refreshes → component unmounts → all refs destroyed
3. Worker finishes processing... but has nowhere to send the result
4. The `onmessage` handler finds `pendingMapRef.get(id)` returns `undefined`
5. The log shows `ORPHANED result id=a3x7p9`
6. The answer is silently discarded

### This is actually fine

- The worker terminates on component unmount (cleanup in the `useEffect` return)
- Any results from orphaned queries are just dropped
- The user sees a fresh chat on the new page
- There's no memory leak because both the map and the worker are cleaned up

---

## 8. How the ai_knowledge Collection Works (DEPRECATED — Not Currently Used)

### What Was It?

The `ai_knowledge` Firestore collection was designed to store Q&A entries that the AI uses to answer questions. It was the same data as `assistant-knowledge.ts`, but stored in the database so board members could edit it through Dashboard → AI Knowledge without code changes.

### Why It's Deprecated

**As of June 2026, the AI assistant uses ONLY the static `assistant-knowledge.ts` file.** The Firestore fetch (`fetchKnowledgeDocs`) has been removed from the active code and replaced with the static file approach for these reasons:

1. **Simplicity** — One source of truth (the TypeScript file), no sync needed
2. **Fewer Firestore reads** — The static file costs 0 reads
3. **No sync script** — No need to run `sync-knowledge.ts` every time knowledge changes
4. **Predictable** — Code changes are version-controlled and deployed deliberately

### The Original Sync Process (For Reference)

```
assistant-knowledge.ts (TypeScript file, 250+ entries)
        │
        ▼
scripts/sync-knowledge.ts (run with: npx tsx scripts/sync-knowledge.ts)
        │
        ▼
Firestore collection: ai_knowledge
  └── document (auto-generated ID)
        ├── question: "How do I create an event?"
        ├── answer: "Go to Dashboard → Events..."
        ├── keywords: ["create event", "add event", ...]
        ├── category: "event"
        ├── roleAccess: ["board_member", "administrator"]
        ├── source: "assistant-knowledge.ts"
        └── updatedAt: Timestamp (when synced)
```

### How It Originally Worked

1. **On page load** (when AiAssistant component mounts):
  ```javascript
   useEffect(() => {
     fetchKnowledgeDocs(200).then(docs => {
       // docs is an array of 200+ KnowledgeDoc objects
       firestoreDocsRef.current = docs;  // Store in memory
     });
   }, []);
  ```
2. **This was a ONE-TIME Firestore read.** The 200+ docs were stored in a JavaScript variable (`firestoreDocsRef.current`).
3. **On every query**, the retriever searched `firestoreDocsRef.current` — in-memory, NO additional Firestore reads.
4. **If Firestore docs weren't available** (offline, error), it fell back to the static `assistant-knowledge.ts` file.

### The Read Cost (Before Deprecation)

- **1 read per page load** (fetch all 200 docs once)
- **0 additional reads per query** (all searched in memory)
- If 50 page loads/day: 200 × 50 = 10,000 reads/day

### Current State

The Firestore `ai_knowledge` collection still exists in the database (data was not deleted), but the AI assistant no longer reads from it. If you want to re-enable it in the future, uncomment the `useEffect` in `AiAssistant.tsx` that calls `fetchKnowledgeDocs()`.

---

## 9. The Live Data Pipeline — Now Commented Out

### What It Was

`live-knowledge.ts` was a module that fetched counts from 10 Firestore collections EVERY TIME the AI was asked a question (with a 30-second cache).

### Current Status: **Commented Out**

As of June 2026, the live data pipeline integration in `AiAssistant.tsx` has been commented out. The code for `live-knowledge.ts` still exists in the repo but is not imported or used. It's preserved so it can be re-enabled if needed.

### Why It Was Removed

1. **RSVP counts are now displayed on the Events page** — users can see them directly
2. **Enrollment counts are now displayed on the Programs page** — users can see them directly
3. **The AI was duplicating** the same Firestore reads that the pages already do
4. **Reducing Firestore reads** was a key goal (as you requested)
5. **The knowledge base now guides users** to the right pages for count questions

### What Was Removed vs. What Stayed


| Item                                          | Status                        | File                        |
| --------------------------------------------- | ----------------------------- | --------------------------- |
| `fetchLiveData()` import                      | Removed                       | `AiAssistant.tsx`           |
| `formatLiveContext()` call                    | Removed                       | `AiAssistant.tsx`           |
| `clearLiveCache` import                       | Removed                       | `AiAssistant.tsx`           |
| `live-knowledge.ts` source                    | **Preserved (commented out)** | `app/lib/live-knowledge.ts` |
| Knowledge base "where to find counts" entries | Added                         | `assistant-knowledge.ts`    |


### How the AI Answers Count Questions Now

The knowledge base now has entries like these:

```
Q: "How many people RSVP'd to an event?"
A: "Each event on the Events page shows its RSVP count directly. Visit the Events page..."

Q: "How many people are enrolled in programs?"
A: "Each program on the Programs page shows its enrollment count..."
```

The AI directs users to the same pages that already display the data, rather than fetching its own copy.

---

## 10. System Prompt — Why It's Sent Every Time

You asked: "the rules of who and what the LLM model is and what it should do should be given one time or something, cuz i feel like this is duplicate and repetitive and not efficient"

### The reality

Every LLM (including ChatGPT, Claude, Gemini) works the same way: **the system prompt is sent with every request.** This is not a limitation of our implementation — it's how all LLMs work. There is no "set it once" mode.

### Why?

LLMs are **stateless** — they don't remember anything between generations. Each generation is a completely fresh start. The system prompt tells the model HOW to behave for THIS generation. Without it, the model has no instructions.

### The cost is negligible

- System prompt: ~200 tokens
- Context from knowledge base: ~200-400 tokens  
- Total input: ~600 tokens (out of 2048 context window)
- This is tiny compared to the model's context window
- Even for ChatGPT, the system prompt is sent with every API call

### Analogy

Think of the model as a new employee who forgets everything at the end of each shift. Every time they start, you have to tell them:

1. "You are the MHMA assistant" (hiring letter)
2. "Answer only from this context" (instructions)
3. "Here is the context" (reference material)
4. "Here is the question" (the actual work)

---

## 11. Files to Read to Verify the Flow

If you want to follow the code yourself and verify everything works as described, read these files IN ORDER:


| Order | File                             | What it shows                                                                 | Lines to focus on                                                                           |
| ----- | -------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1     | `app/components/AiAssistant.tsx` | Main AI component — user input, retrieval (static only), worker communication | `askQuestion()` (line ~188), `handleSend()` (line ~241), `useEffect` for worker (line ~278) |
| 2     | `public/ai-worker.js`            | The Web Worker — loads model, receives query, runs inference                  | `onmessage` handler, `generate()` call                                                      |
| 3     | `app/lib/assistant-knowledge.ts` | Static knowledge Q&A (the ONLY knowledge source now)                          | The full array of 260+ entries                                                              |
| 4     | `app/api/events/route.ts`        | Example API route with server-side aggregation                                | The GET handler                                                                             |
| 5     | `app/api/enroll/route.ts`        | API route that writes to Firestore + sends emails                             | The POST handler                                                                            |
| 6     | `app/api/rsvp/route.ts`          | Same pattern as enroll — writes + emails                                      | The POST handler                                                                            |
| 7     | `app/api/about-stats/route.ts`   | Example of complex server-side aggregation (12 collections)                   | The GET handler                                                                             |
| 8     | `lib/firebase.ts`                | All Firestore CRUD functions used client-side                                 | `addRSVP`, `addEnrollment`, etc.                                                            |
| 9     | `firestore.rules`                | Security rules — what each collection allows                                  | The full rule file                                                                          |


### Summary of the complete architecture

```
Browser (Client)                              Server (Next.js)           Google Cloud
─────────────────                             ───────────────────        ────────────
AiAssistant.tsx ←→ ai-worker.js (SmolLM2)     app/api/.../route.ts       Firestore DB
    ↕                    ↕                           ↕                      ↕
retrieve()            model inference           Admin SDK reads         Collections:
    ↕                                           + writes                 events
knowledgeBase (TS)                             + email sending          programs
(static, 260+ entries)                                                  enrollments
                                                                         rsvps
                                                                         donations
                                                                         users
                                                                         ai_knowledge (unused)
                                                                         subscribers
                                                                         pledges
                                                                         volunteers
                                                                         contactSubmissions
                                                                         news
                                                                         aboutStats
```

---

## Design Decisions Made (June 2026)


| Decision                          | Outcome                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Live data pipeline                | **Commented out** — counts are on public pages; AI guides users there           |
| Firestore ai_knowledge collection | **Not used** — static `assistant-knowledge.ts` only                             |
| API routes vs Client SDK          | **Both used** — Client SDK for simple CRUD, API routes for aggregation + emails |
| AI data source                    | **Static TypeScript file** — 0 Firestore reads, version-controlled, predictable |
| Spam protection (contact form)    | **reCAPTCHA v3 added** — works invisibly, no user interaction needed            |


