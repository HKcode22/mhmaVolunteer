# MHMA API Architecture — Complete Explanation with Real Code

> This document answers every question you asked about APIs, Layer 2, HTTP endpoints, Vercel as a backend, and why we do things this way. Every explanation includes **real code from this project** with comments.

---

## TABLE OF CONTENTS

1. [What Is an API / HTTP Endpoint? (Beginner)](#1-what-is-an-api--http-endpoint-beginner)
2. [The Three Servers in This System](#2-the-three-servers-in-this-system)
3. [What Is Vercel Actually Doing? (Frontend + Backend)](#3-what-is-vercel-actually-doing-frontend--backend)
4. [Layer 2 Explained: Our API Routes](#4-layer-2-explained-our-api-routes)
5. [Why You Can't Visit /api/rsvp in a Browser](#5-why-you-cant-visit-apirsvp-in-a-browser)
6. [Real Code: The Complete RSVP Submission (step by step)](#6-real-code-the-complete-rsvp-submission-step-by-step)
7. [Real Code: The Complete Enrollment Submission](#7-real-code-the-complete-enrollment-submission)
8. [Real Code: Server-Side Data Aggregation (/api/events)](#8-real-code-server-side-data-aggregation-apievents)
9. [The 7 Reasons for API Routes — Explained with Code](#9-the-7-reasons-for-api-routes--explained-with-code)
10. [What Would It Look Like Without API Routes?](#10-what-would-it-look-like-without-api-routes)
11. [Your Questions Answered Directly](#11-your-questions-answered-directly)

---

## 1. What Is an API / HTTP Endpoint? (Beginner)

### Analogy: Restaurant Ordering

```
You (Browser)                Waiter (API)                Kitchen (Firestore)
    │                            │                            │
    ├── "I want a burger" ──────►│                            │
    │                            ├── "Cook one burger" ──────►│
    │                            │◄── "Here's your burger" ───┤
    │◄── "Here's your burger" ───┤                            │
```

An **API** (Application Programming Interface) is a **waiter**. You tell it what you want, it talks to the kitchen, and brings back your food.

An **HTTP endpoint** is a **URL** that acts like a waiter:
- `https://mhma-update.vercel.app/api/rsvp` — this URL is a waiter
- `https://mhma-update.vercel.app/api/events` — this URL is also a waiter

### In Code

```javascript
// This is YOU (the browser) talking to a waiter (API):
const response = await fetch("https://mhma-update.vercel.app/api/events");
const data = await response.json();
// data = [{ title: "Eid Festival", rsvpCount: 15 }, ...]
```

```javascript
// This is YOU talking to the kitchen directly (no waiter):
import { fetchEvents } from "@/lib/firebase";
const data = await fetchEvents(100);
// Same result, but different path
```

### The Two Ways to Get Data

```
Path A (waiter):  Browser → OUR SERVER (Vercel) → Firestore
Path B (direct):  Browser → Firestore (no waiter)
```

In this project, **we use both paths** depending on what we need.

---

## 2. The Three Servers in This System

There are THREE computers involved when you use this website:

```
┌─ YOUR COMPUTER (Browser) ─────────────────────────────┐
│                                                        │
│  Runs: React code, your Firebase API key               │
│  Can: Display pages, call APIs, talk to Firestore      │
│  Cannot: Send emails, keep secrets, access Admin SDK   │
│                                                        │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌─ VERCEL (Next.js Server) ──────────────────────────────┐
│                                                        │
│  Runs: API routes (/api/rsvp, /api/enroll, etc.)       │
│  Has: SMTP email credentials, Admin SDK, secret keys   │
│  Can: Send emails, read/write Firestore with full power │
│  Cannot: Run in your browser (it's a cloud computer)    │
│                                                        │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌─ GOOGLE CLOUD (Firestore) ─────────────────────────────┐
│                                                        │
│  Runs: Database that stores all MHMA data              │
│  Has: Security rules, document storage                 │
│  Can: Store/retrieve data, enforce permissions         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### What People Usually Think

Most people think Vercel only serves the **frontend** (HTML, CSS, JS files) — like a waiter that only brings the menu. But Vercel can also run **backend** code — like a waiter who can also cook.

In Next.js, BOTH frontend and backend live in the same project:

```
Project root/
  ├── app/page.tsx          ← Frontend (page users see)
  ├── app/api/rsvp/route.ts ← Backend (API endpoint)
  ├── lib/firebase.ts       ← Frontend code (runs in browser)
  └── lib/firebase-admin.ts ← Backend code (runs on Vercel)
```

When you deploy to Vercel:
- `page.tsx` files become web pages
- `api/**/route.ts` files become serverless functions (API endpoints)
- Both run on Vercel's infrastructure, but pages run in the user's browser while API routes run on Vercel's servers

---

## 3. What Is Vercel Actually Doing? (Frontend + Backend)

### Vercel as Frontend Host

When someone visits `https://mhma-update.vercel.app/events`, Vercel:

1. Receives the HTTP request
2. Runs the Next.js code to render the page
3. Sends the HTML/JS/CSS to the browser
4. The browser displays the page

**This part you already know. Vercel hosts your website.**

### Vercel as Backend (Serverless Functions)

When someone submits the RSVP form, the browser sends a request to:

```
POST https://mhma-update.vercel.app/api/rsvp
```

Vercel:

1. Receives the HTTP request
2. **Spins up a temporary Node.js server** (takes ~50-200ms)
3. Runs the code in `app/api/rsvp/route.ts`
4. The code writes to Firestore, sends emails
5. Returns the response
6. **The temporary server shuts down**

This "spin up, run, shut down" pattern is called a **serverless function**. It only exists when someone calls it. You don't pay for idle time.

### The Key Insight You're Missing

**Vercel is not JUST a file host.** It's a cloud computing platform that runs Node.js code. When you write `app/api/rsvp/route.ts`, you're writing a backend server that runs in the cloud. It's equivalent to running:

```bash
node server.js  # but Vercel manages this for you
```

You never see the server, but it's there. Every time someone calls `/api/rsvp`, a new Node.js process starts, runs your route handler, and exits.

---

## 4. Layer 2 Explained: Our API Routes

### What Is an API Route?

An API route is a **file** in `app/api/**/route.ts` that becomes a **URL endpoint**.

```
File: app/api/rsvp/route.ts
URL:  https://mhma-update.vercel.app/api/rsvp

File: app/api/enroll/route.ts
URL:  https://mhma-update.vercel.app/api/enroll

File: app/api/events/route.ts
URL:  https://mhma-update.vercel.app/api/events
```

### What Does an API Route File Look Like?

Here is the ACTUAL file `app/api/enroll/route.ts` with comments explaining every line:

```typescript
// app/api/enroll/route.ts
// THIS RUNS ON VERCEl'S SERVER, NOT IN THE BROWSER

import { NextRequest, NextResponse } from "next/server";
// NextRequest = the incoming HTTP request from the browser
// NextResponse = what we send back

import { firestore, Timestamp } from "@/lib/firebase-admin";
// This uses the ADMIN SDK — runs on server with full database access
// NEVER exposed to the browser

import { sendEmail, confirmationEmail, notifyBoard } from "@/lib/email";
// Email library — only works on server (SMTP credentials are secret)

export async function POST(req: NextRequest) {
  // "POST" means this function runs when someone sends a POST request
  // to https://mhma-update.vercel.app/api/enroll

  try {
    // Step 1: Read the form data sent by the browser
    // The browser called: fetch("/api/enroll", { body: JSON.stringify({...}) })
    const { fullName, email, phone, program, message } = await req.json();

    // Step 2: Validate the data on the server
    // (Security rules in Firestore can't do this level of validation)
    if (!fullName || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    // Step 3: Write to Firestore using Admin SDK
    // The Admin SDK runs with FULL ACCESS — no security rules apply
    await firestore.collection("enrollments").add({
      fullName,
      email,
      phone: phone || "",
      program: program || "",
      message: message || "",
      status: "pending",
      createdAt: Timestamp.now(),
    });

    // Step 4: Send emails (THIS IS WHY WE NEED THE SERVER)
    // A browser CANNOT send email. SMTP credentials must stay secret.
    try {
      await Promise.allSettled([
        // Email to the person who enrolled — confirmation
        sendEmail(email, "Enrollment Received - MHMA", confirmationEmail(fullName,
          `Your enrollment for <strong>${program || "our program"}</strong> has been received.`
        )),
        // Email to board members — notification
        notifyBoard("New Enrollment - MHMA",
          `New enrollment from <strong>${fullName}</strong> (${email}) for <strong>${program || "N/A"}</strong>.`
        ),
      ]);
    } catch (_) { /* ignore email errors — don't fail the request */ }

    // Step 5: Tell the browser it worked
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Enroll error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

### What Happens When You Call This API Route

```
BROWSER:                                       VERCEl SERVER:
                                              (temporary Node.js process)
fetch("/api/enroll", {                          │
  method: "POST",                               │
  body: JSON.stringify({                        │
    fullName: "John",                           │
    email: "john@test.com",                     │
    program: "Quran Hifz"                       │
  })                                            │
})                                              │
      │                                         │
      └────────── HTTPS request ──────────────► │
                                                │
                                                ├── Parse request body
                                                ├── Validate fields
                                                ├── Write to Firestore (Admin SDK)
                                                ├── Send email to John
                                                ├── Send email to board
                                                │
      ◄────────── { success: true } ────────────┤
      │                                         │
console.log("Success!");                        │ (process shuts down)
```

---

## 5. Why You Can't Visit /api/rsvp in a Browser

You tried: `https://mhma-update.vercel.app/api/rsvp` and got "page not working".

**This is normal and expected.** Here's why:

### GET vs POST

When you type a URL into a browser and press Enter, the browser sends a **GET request**:

```
GET https://mhma-update.vercel.app/api/rsvp
```

But our API route only handles **POST requests**:

```typescript
// app/api/rsvp/route.ts
export async function POST(req: NextRequest) {  // <-- only POST
  // ...
}
```

There is no `GET` handler, so the server returns an error (usually 405 Method Not Allowed).

### How to Actually Test an API Route

You need to send a POST request. You can do this from:

**Method 1: From a web page (the normal way)**
```javascript
const res = await fetch("/api/rsvp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fullName: "John",
    email: "john@test.com",
    eventTitle: "Eid Festival",
    attendees: 2,
  }),
});
const data = await res.json();
console.log(data); // { success: true, id: "abc123" }
```

**Method 2: From curl (terminal)**
```bash
curl -X POST https://mhma-update.vercel.app/api/rsvp \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John","email":"john@test.com","eventTitle":"Eid Festival","attendees":2}'
```

**Method 3: From Postman or Insomnia (GUI tool)**

Open Postman, create a POST request to the URL, set body to JSON, and send.

### But GET Endpoints DO Work in Browser

API routes that handle GET requests work in the browser:

```typescript
// app/api/events/route.ts
export async function GET() {  // <-- handles GET
  // ...
}
```

If you visit `https://mhma-update.vercel.app/api/events` in your browser, you'll see raw JSON:

```json
[
  {
    "id": "abc123",
    "title": "Eid Festival",
    "date": "2026-06-15",
    "rsvpCount": 15
  },
  {
    "id": "def456",
    "title": "Quran Class",
    "date": "2026-07-01",
    "rsvpCount": 8
  }
]
```

That's the JSON data the page uses to display events. The browser just displays it as text because there's no HTML formatting.

---

## 6. Real Code: The Complete RSVP Submission (step by step)

Here is EVERY file involved, with line numbers and comments:

### Step 1: The RSVP Form Page (`/rsvp/page.tsx`)

```typescript
// LINE 66-74 — this is what runs when user clicks "Submit RSVP"
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    // 👇 LAYER 2: Sends data to OUR SERVER (Vercel)
    // NOT directly to Firestore
    const res = await fetch("/api/rsvp", {
      method: "POST",                          // Tell server: "I'm creating data"
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({                   // The form data the user filled in
        eventId: selectedEvent,                // e.g., "abc123"
        eventTitle: event?.title,              // e.g., "Eid Festival"
        fullName: formData.fullName,           // e.g., "John Doe"
        email: formData.email,                 // e.g., "john@test.com"
        phone: formData.phone,
        attendees: formData.attendees,          // e.g., 2
        notes: formData.notes,
      }),
    });

    const data = await res.json();  // Wait for server response

    if (!res.ok) {
      throw new Error(data.error || "Failed to submit RSVP");
    }

    // If we get here, the server wrote to Firestore AND sent emails
    setSubmitted(true);  // Show "Thank you" message
  } catch (err: any) {
    setError(err.message);
  }
};
```

### Step 2: The API Route (`/api/rsvp/route.ts`)

```typescript
// This runs on VERCEl's SERVER, not in the browser
export async function POST(req: NextRequest) {
  const body = await req.json();
  // body = { fullName: "John Doe", email: "john@test.com", ... }

  // 👇 LAYER 3: Write to Firestore using Admin SDK
  const rsvpRef = await firestore.collection("rsvps").add({
    eventId: body.eventId || null,
    eventTitle: body.eventTitle,
    fullName: body.fullName,
    email: body.email,
    phone: body.phone || "",
    attendees: parseInt(body.attendees) || 1,
    notes: body.notes || "",
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  // 👇 SERVER-ONLY: Send confirmation email
  await sendEmail(email, `RSVP Confirmed - ${body.eventTitle}`, ...);

  // 👇 SERVER-ONLY: Notify board members
  await notifyBoard(`New RSVP - ${body.eventTitle}`, ...);

  return NextResponse.json({ success: true, id: rsvpRef.id });
}
```

### Step 3: The Data Flow Diagram

```
Your Laptop (Browser)         Vercel's Server (Cloud)         Google Cloud
─────────────────────         ──────────────────────          ────────────

1. User fills out
   RSVP form
      │
      ▼
2. fetch("/api/rsvp", {  ────► 3. Server receives POST
   method: "POST",                    │
   body: {...}                        ├── 4. Parses form data
   })                                  │
                                      ├── 5. Calls firestore
                                      │    .collection("rsvps")
                                      │    .add({...})       ────► 6. Creates document
                                      │                              in rsvps collection
                                      │
                                      ├── 7. Calls sendEmail()  ──► Sends confirmation
                                      │                              to user's email
                                      ├── 8. Calls notifyBoard() ──► Sends notification
                                      │                              to board's email
                                      │
      ◄──── 9. { success: true } ─────┤
      │
10. Shows
    "Thank you"
    message
```

### Why Not Just Call addRSVP() Directly?

The function `addRSVP()` exists in `lib/firebase.ts`:

```typescript
// lib/firebase.ts — this function exists but IS NOT USED by the RSVP page
export async function addRSVP(data) {
  const ref = await addDoc(collection(db, "rsvps"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
```

If the RSVP page called this instead of `/api/rsvp`:

```javascript
// What the page COULD do (but doesn't):
await addRSVP({
  fullName: "John",
  email: "john@test.com",
  eventTitle: "Eid Festival",
});
```

The data would still reach Firestore. But **no email would be sent**. Nobody would know someone RSVP'd. The board would have to manually check the dashboard.

---

## 7. Real Code: The Complete Enrollment Submission

Same pattern as RSVP. Here's the actual code from `/enroll/page.tsx`:

```typescript
// /enroll/page.tsx, LINE 86-93
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 👇 LAYER 2: Send to OUR SERVER
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
    setSuccess(true);  // Show "Enrollment Submitted" message
  } catch (error) {
    setError("Enrollment failed. Please try again.");
  }
};
```

And the server route (`/api/enroll/route.ts`):

```typescript
// THIS IS THE COMPLETE FILE — every line
export async function POST(req: NextRequest) {
  try {
    // 1. Read form data
    const { fullName, email, phone, program, message } = await req.json();

    // 2. Validate
    if (!fullName || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    // 3. Write to Firestore (Admin SDK)
    await firestore.collection("enrollments").add({
      fullName, email, phone: phone || "",
      program: program || "", message: message || "",
      status: "pending", createdAt: Timestamp.now(),
    });

    // 4. Send emails (browser can't do this)
    await Promise.allSettled([
      sendEmail(email, "Enrollment Received", confirmationEmail(fullName, ...)),
      notifyBoard("New Enrollment",
        `New enrollment from ${fullName} (${email}) for ${program || "N/A"}.`),
    ]);

    // 5. Return success
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 8. Real Code: Server-Side Data Aggregation (/api/events)

**Server-side data aggregation** means: fetching data from multiple collections ON THE SERVER, combining it, and sending the result to the browser as ONE response.

### Without Aggregation (Browser does the work)

```javascript
// The browser would need to make TWO requests:
const events = await fetchEvents(100);           // Request 1: get events
const rsvps = await fetchRSVPs(200);             // Request 2: get RSVPs

// Then manually combine them in the browser:
const eventsWithCounts = events.map(event => ({
  ...event,
  rsvpCount: rsvps.filter(r => r.eventTitle === event.title).length,
}));
```

### With Aggregation (Server does the work)

```typescript
// app/api/events/route.ts — runs on VERCEl's SERVER

// Step 1: Fetch ALL events
const eventsSnap = await firestore.collection("events").get();

// Step 2: Fetch ALL RSVPs
const rsvpsSnap = await firestore.collection("rsvps").get();

// Step 3: Count RSVPs per event (runs on server)
const rsvpCounts: Record<string, number> = {};
rsvpsSnap.forEach(doc => {
  const title = doc.data().eventTitle;
  rsvpCounts[title] = (rsvpCounts[title] || 0) + 1;
});

// Step 4: Attach counts to events
const events = eventsSnap.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
  rsvpCount: rsvpCounts[doc.data().title] || 0,
}));

// Step 5: Send ONE combined response
return NextResponse.json(events);
```

### Why Aggregation Is Better on the Server

| Aspect | Browser does it | Server does it |
|--------|----------------|----------------|
| Requests | 2 separate requests | 1 request |
| Data over network | Events + RSVPs = more bytes | Just the combined result |
| Logic visibility | Everyone can see the code | Hidden from browser |
| Speed | Depends on browser JS | Server is typically faster |
| Firestore reads | Same reads | Same reads (both read events + RSVPs) |

### The /api/about-stats Route — Aggregation Heavyweight

This route fetches from **12 collections** in parallel:

```typescript
// app/api/about-stats/route.ts
const [
  statsSnap, programsSnap, eventsSnap, usersSnap, donationSnap,
  enrollmentSnap, rsvpSnap, subscriberSnap, contactSnap,
  pledgeSnap, volunteerSnap, newsSnap,
] = await Promise.all([
  firestore.collection("aboutStats").doc("stats").get(),
  firestore.collection("programs").get(),
  firestore.collection("events").get(),
  // ... 9 more collections
]);

// Calculate totals, filter by date range, return as single JSON
return NextResponse.json({
  programsCount: programsSnap.size,
  eventsCount: eventsSnap.size,
  rsvpCount: rsvpSnap.size,
  // ... 15+ calculated stats
});
```

Without this API route, the About page would need to make **12 separate Firestore calls** from the browser. With it, it makes **1 call to /api/about-stats**.

---

## 9. The 7 Reasons for API Routes — Explained with Code

### Reason 1: Sending Emails

**The browser literally cannot send email.** Email requires SMTP credentials (username + password for the email server). If we put those in the browser code, anyone could steal them.

```typescript
// This only works on the server:
import { sendEmail } from "@/lib/email";  // Uses SMTP credentials from env vars

// In API route:
await sendEmail(userEmail, "Confirmation", htmlContent);
// ↑ The SMTP password is in process.env.SMTP_PASSWORD
//   which only exists on Vercel's server, NOT in the browser
```

**Without API routes:** No confirmation emails. Nobody knows someone RSVP'd until they check the dashboard manually.

### Reason 2: Admin SDK Operations

The Admin SDK has FULL access to Firestore — no security rules apply. This is useful for:

```typescript
// app/api/about-stats/route.ts (POST handler)
// Board member wants to update the "years serving" stat

// Step 1: Verify the user is legit (server-side check)
const decoded = await adminAuth.verifyIdToken(token);
if (role !== "board_member" && role !== "administrator") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Step 2: Write using Admin SDK (bypasses security rules)
await firestore.collection("aboutStats").doc("stats").set(
  { yearsServing: 10 },
  { merge: true }
);
```

This is more secure than relying solely on Firestore security rules.

### Reason 3: Server-Side Data Aggregation

Already explained above. Combining data from multiple collections on the server reduces network requests and hides logic.

### Reason 4: Writing Data for Unauthenticated Users

The public RSVP and Enrollment forms accept submissions from **anyone** — even people who aren't logged in. Firestore security rules would need to allow `allow create: if true` on the rsvps collection, which is less secure.

```typescript
// In the API route, we can validate server-side instead:
if (!fullName || !email) {
  return NextResponse.json({ error: "Name and email required" }, { status: 400 });
}
// We can also add rate limiting, spam checks, etc.
```

### Reason 5: Rate Limiting, Spam Protection

We can add reCAPTCHA or rate limiting in the API route:

```typescript
// Future enhancement — not in code yet, but possible:
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for");
  
  // Check: has this IP submitted more than 5 times in the last minute?
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Check reCAPTCHA token
  const { recaptchaToken, ...formData } = await req.json();
  if (!await verifyRecaptcha(recaptchaToken)) {
    return NextResponse.json({ error: "reCAPTCHA failed" }, { status: 400 });
  }

  // ... process normally
}
```

You cannot do this with direct Client SDK calls.

### Reason 6: Server-Side Validation

Firestore security rules are limited. You can check "is the user logged in?" and "is this field a string?" but not much else. API routes can do complex validation:

```typescript
// In API route — can validate ANYTHING:
if (!isValidEmail(email)) {
  return NextResponse.json({ error: "Invalid email" }, { status: 400 });
}
if (attendees < 1 || attendees > 100) {
  return NextResponse.json({ error: "Attendees must be 1-100" }, { status: 400 });
}
if (containsProfanity(fullName)) {
  return NextResponse.json({ error: "Please use a real name" }, { status: 400 });
}
```

### Reason 7: Access to Server-Only Services

The server can use ANY Node.js library. Examples:

```typescript
// Generate PDF certificates (future feature)
import PDFDocument from "pdfkit";
const doc = new PDFDocument();
doc.text("Certificate of Completion");
doc.pipe(fs.createWriteStream("certificate.pdf"));

// Process images
import sharp from "sharp";
const resized = await sharp(image).resize(800, 600).toBuffer();

// Call external APIs (with secret keys)
const stripePayment = await stripe.charges.create({ amount: 1000 });
```

None of these work in the browser because they need access to the file system, secret API keys, or Node.js specific APIs.

---

## 10. What Would It Look Like Without API Routes?

If we removed ALL API routes and did everything client-side:

```javascript
// /rsvp/page.tsx — RSVP form WITHOUT the API route
import { addRSVP } from "@/lib/firebase";

const handleSubmit = async (e) => {
  e.preventDefault();
  // Direct browser-to-Firestore write:
  const id = await addRSVP({
    fullName: "John",
    email: "john@test.com",
    eventTitle: "Eid Festival",
    attendees: 2,
  });
  // Data is saved, but NO email is sent
  // Board members must manually check the dashboard
  // No rate limiting, no server validation
  // The form works for anyone (logged in or not)
};
```

**What we'd lose:**
1. ✅ Confirmation email to the user — GONE
2. ✅ Board notification email — GONE
3. ✅ Server-side validation — GONE
4. ✅ Rate limiting / spam protection — GONE
5. ✅ reCAPTCHA — GONE
6. ✅ RSVP counts on Events page (need /api/events) — GONE

**What we'd gain:**
1. ✅ Simpler code (no server round-trip)
2. ✅ Faster response (no server spin-up time)
3. ✅ Fewer Vercel function invocations

### The Tradeoff

Every API route tradeoff:

| Use API Route when... | Use Client SDK when... |
|-----------------------|----------------------|
| Need to send email | No email needed |
| Need server validation | Security rules are enough |
| Need Admin SDK access | Client SDK access is sufficient |
| Need to aggregate data | Simple single-collection read |
| Need rate limiting | No spam concerns |
| Form is public (non-logged-in users) | User is already authenticated |

---

## 11. Your Questions Answered Directly

### "What are HTTP endpoints and what do those URLs lead to?"

An HTTP endpoint is a URL that, when requested, runs code on a server and returns data. `https://mhma-update.vercel.app/api/rsvp` leads to the file `app/api/rsvp/route.ts` on Vercel's servers. When you send a POST request to it, Vercel runs that code and sends back JSON.

### "Why is /api/rsvp broken when I visit it in browser?"

Because your browser sends a GET request, but the route only handles POST. Think of it like a restaurant: you walked in expecting a waiter to take your order, but the restaurant only accepts phone orders. The API route IS working — it's just waiting for the right type of request.

### "Why not save directly to Firestore from the browser?"

You CAN. The `addRSVP()` function in `lib/firebase.ts` would work fine. But the board wanted **email notifications** — and browsers can't send email. The API route is the solution.

### "Wait, is Vercel handling backend stuff?"

Yes. Vercel is a **cloud computing platform** that runs both:
- **Frontend**: Serving pages to browsers
- **Backend**: Running serverless functions (your API routes)

Think of Vercel as a computer in the cloud that runs your Next.js app. The `page.tsx` files render in the browser, but the `api/**/route.ts` files run ON VERCEL'S SERVERS.

### "So Vercel sends the data to Firestore for the RSVP form?"

Exactly. The flow is:

```
Browser (user's laptop)
  → fetch("/api/rsvp", { body: formData })  ← Layer 2
    → Vercel server runs app/api/rsvp/route.ts
      → firestore.collection("rsvps").add({...})  ← Layer 3 (Admin SDK)
        → Firestore (Google Cloud) stores the data
      → sendEmail() → user gets confirmation
      → notifyBoard() → board gets notification
    → Returns { success: true }
  → Browser shows "Thank you"
```

Vercel is the middleman that takes the data from the browser, forwards it to Firestore, AND sends emails.

### "Why do we need Layer 3? If browser sends to Vercel, isn't that enough?"

Layer 2 (browser → Vercel) gets the data to your server. But the data still needs to reach Firestore somehow. Layer 3 (Vercel → Firestore via Admin SDK) is how the server saves it.

```
Layer 2: Browser ──► Vercel (your code runs here)
Layer 3: Vercel ──► Firestore (data gets saved)
```

Without Layer 3, the data would arrive at Vercel and stop. Nothing would be saved.

### "What is server-side data aggregation?"

It means: instead of the browser making 5 separate requests and combining the data, the server does all the work in ONE request.

```
Without aggregation:
  Browser: GET /api/events → get events
  Browser: GET /api/rsvps → get RSVPs  
  Browser: manually count RSVPs per event
  Browser: combine into one list

With aggregation:
  Browser: GET /api/events → get events with RSVP counts already attached
  Server did the counting and combining before responding
```

### "So there are multiple APIs?"

Yes! Three different APIs working together:

1. **Your API Routes** (7 of them): `/api/rsvp`, `/api/enroll`, `/api/events`, etc.
2. **Firebase Client SDK** (browser → Firestore): `getDocs()`, `addDoc()`, etc.
3. **Firebase Admin SDK** (server → Firestore): `admin.firestore().collection()`, etc.

And one more:
4. **External dependency**: The email server (SMTP) — Vercel's server talks to it to send emails.
