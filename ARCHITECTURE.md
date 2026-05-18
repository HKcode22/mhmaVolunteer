# MHMA Architecture Guide

> Everything you asked about: browser vs server, Firebase SDKs, lib files, authentication flow, and how data moves through the system.

---

## Table of Contents

1. [The Three Players](#1-the-three-players)
2. [The Two Firebase SDKs](#2-the-two-firebase-sdks)
3. [What Each lib/ File Does](#3-what-each-lib-file-does)
4. [Client-side vs Server-side](#4-client-side-vs-server-side)
5. [The Four Communication Paths](#5-the-four-communication-paths)
6. [Firestore CRUD Functions](#6-firestore-crud-functions)
7. [Authentication End-to-End](#7-authentication-end-to-end)
8. [How auth-context.tsx Works](#8-how-auth-contexttsx-works)
9. [Firestore Security Rules vs Admin SDK](#9-firestore-security-rules-vs-admin-sdk)
10. [Route.ts Files](#10-routets-files)
11. [The `\n` Bug Explained](#11-the-n-bug-explained)
12. [Access Control: Where Board Members Are Restricted](#12-access-control-where-board-members-are-restricted)
13. [Glossary](#13-glossary)

---

## 1. The Three Players

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. BROWSER (Chrome on your phone/laptop)                       │
│     Runs: React code, "use client" pages                        │
│     Has: firebase-client.ts (public API key only)               │
│     Can see: Everything in DevTools                             │
│     Files: app/*.tsx, components/*.tsx, lib/firebase-client.ts   │
│                                                                  │
│  2. VERCEL (Next.js hosting server)                             │
│     Runs: API routes, server components                         │
│     Has: firebase-admin.ts (secret private key)                 │
│     Can see: Your environment variables, service account        │
│     Files: app/api/*.ts, scripts/*.mjs                          │
│                                                                  │
│  3. GOOGLE FIREBASE (Google's cloud)                            │
│     Runs: Auth system + Firestore database                      │
│     Has: Your data (events, users, programs)                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Analogy

| Player | Analogy |
|--------|---------|
| **Browser** | A guest in a hotel. Has a room key card (API key). Can enter their room and use the gym. |
| **Vercel** | The front desk. Holds the master key (service account private key). Opens rooms for guests when needed. |
| **Firebase** | The hotel building itself. Rooms (collections), locks (security rules), and guests (user accounts). |

---

## 2. The Two Firebase SDKs

There are TWO completely different npm packages for talking to Firebase:

| | `firebase` (Client SDK) | `firebase-admin` (Admin SDK) |
|---|---|---|
| npm package | `firebase` | `firebase-admin` |
| Where it runs | Browser only | Node.js only (server/CLI) |
| Auth method | Public API key (`AIzaSyCglZ...`) | Private service account key |
| Can read/write data | ✅ Yes | ✅ Yes |
| Can set user roles | ❌ No | ✅ Yes |
| Can list all users | ❌ No | ✅ Yes |
| Bypasses security rules | ❌ No | ✅ Yes |
| Import in our code | `lib/firebase-client.ts` | `lib/firebase-admin.ts` |

### Why two different SDKs?

Google designed it this way for **security**:

- The **client SDK** is public. Anyone can see your API key (it's in the HTML source). So its powers are limited — it can't set roles, it can't bypass rules, it can't list all users.
- The **admin SDK** uses a private key that must be kept secret. 

**If the admin SDK could run in the browser, any visitor could open DevTools and give themselves admin access.**

---

## 3. What Each lib/ File Does

| File | Runs Where | What It Does | Why Needed |
|---|---|---|---|
| `firebase-client.ts` | **Browser** | Creates `db` (Firestore connection) and `auth` (Auth connection) using the public API key | Lets the browser login and read/write data directly to Firebase |
| `firebase-admin.ts` | **Vercel server** | Creates admin `firestore` and `auth` connections using the private service account key | Lets Vercel do privileged operations (set roles, list all users, bypass rules) |
| `auth-context.tsx` | **Browser** | Listens to Firebase Auth state changes, determines user role, provides `isBoardMember` to all pages | Tells every page "who is logged in and what they can do" |
| `firebase.ts` | **Browser** | All CRUD functions: `addEvent`, `fetchEvents`, `deleteEvent`, etc. | One place for all database operations instead of repeating code |
| `upload.ts` | **Browser** | Compresses images to Base64 strings using Canvas | Stores images in Firestore without paying for Firebase Storage |

### lib/firebase-client.ts

```typescript
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Trim env vars to prevent embedded newlines/spaces from corrupting Firebase URLs
const trim = (s: string | undefined) => (s || "").trim();

const firebaseConfig = {
  apiKey: trim(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),     // public key
  authDomain: trim(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: trim(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID), // was "mhma-backend\n"
  storageBucket: trim(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: trim(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: trim(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);    // browser's connection to Firebase Auth
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,  // use HTTP instead of WebSocket
});
```

**What it does step by step:**
1. Reads 6 environment variables (the Firebase project config)
2. Trims them to remove hidden newlines
3. Creates one Firebase app (prevents double initialization)
4. Exports `auth` — used by login, register, sign-out pages
5. Exports `db` — used by all data read/write functions

### lib/firebase-admin.ts

```typescript
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, "base64").toString("utf8")
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),  // private key
  });
}

export const firestore = admin.firestore();  // server's admin connection to Firestore
export const auth = admin.auth();            // server's admin connection to Firebase Auth
```

**Important:** This CANNOT run in the browser because:
- `process.env` doesn't exist in browsers
- `Buffer` doesn't exist in browsers
- The service account private key would be exposed to every visitor

### lib/auth-context.tsx

```typescript
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase-client";
import { doc, getDoc } from "firebase/firestore";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;  // "member", "board_member", or "administrator"
}

// This wraps the entire app and provides user info to every page
export function AuthProvider({ children }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for login/logout/session restore events
  useEffect(() => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Source 1: Token claims (fast, works offline)
        const tokenResult = await firebaseUser.getIdTokenResult();
        const claimRole = tokenResult?.claims?.role;

        // Source 2: Firestore users/{uid} (richer data)
        const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        const firestoreData = docSnap.data();

        // Merge: claims take priority, fall back to Firestore
        const role = claimRole || firestoreData?.role || "member";
        const displayName = firebaseUser.displayName ||
          firestoreData?.displayName || null;

        setUser({ uid: firebaseUser.uid, email: firebaseUser.email,
                  displayName, role });
      } else {
        setUser(null);  // not logged in
      }
      setLoading(false);
    });
  }, []);

  const isBoardMember = user?.role === "board_member" ||
                        user?.role === "administrator";

  return (
    <AuthContext.Provider value={{ user, loading, isBoardMember }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**It is NOT security rules.** It's a React state management pattern that reads who the user is. The actual security enforcement must come from Firestore Security Rules (a separate configuration file).

### lib/firebase.ts

This is the **CRUD library** (481 lines). It provides every function that reads or writes data:

| Collection | Create | Read (list) | Read (single) | Update | Delete |
|---|---|---|---|---|---|
| events | `addEvent` | `fetchEvents` | `fetchEventById` | `updateEvent` | `deleteEvent` |
| programs | `addProgram` | `fetchPrograms` | `fetchProgramBySlug` | `updateProgram` | `deleteProgram` |
| journal | `addJournalEntry` | `fetchJournalEntries` | `fetchJournalEntryBySlug` | `updateJournalEntry` | `deleteJournalEntry` |
| enrollments | `addEnrollment` | `fetchEnrollments` | — | `updateEnrollment` | `deleteEnrollment` |
| schedulingRequests | `addSchedulingRequest` | `fetchSchedulingRequests` | — | `updateSchedulingRequest` | `deleteSchedulingRequest` |
| contactSubmissions | `addContactSubmission` | `fetchContactSubmissions` | — | `markContactSubmissionRead` | `deleteContactSubmission` |
| notifications | — | `fetchNotifications` | — | — | — |
| inviteCodes | `generateInviteCode` | `fetchInviteCodes` | — | — | `deleteInviteCode` |
| | `validateInviteCode` | | | | |
| | `markInviteCodeUsed` | | | | |

Every write function follows the same pattern:

```typescript
export async function addEvent(data) {
  try {
    const ref = await withTimeout(
      addDoc(collection(db, "events"), { ...data, createdAt: serverTimestamp() }),
      "addEvent"
    );
    console.log("Firestore: addEvent success, id:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("Firestore: addEvent FAILED:", err);
    throw err;
  }
}
```

**Why a separate file?** Instead of every page writing `addDoc(collection(db, "events"), data)`, they just call `addEvent(data)`. Keeps code consistent and reusable.

### lib/upload.ts

```typescript
const MAX_WIDTH = 800;
const QUALITY = 0.6;  // JPEG 60%

export async function uploadImage(file: File): Promise<string> {
  const dataUrl = await readFile(file);          // Step 1: File → data URL
  const compressed = await compressImage(dataUrl); // Step 2: Draw on Canvas, export as JPEG
  if (compressed.length > 800 * 1024) throw new Error("Too large");
  return compressed;  // returns "data:image/jpeg;base64,/9j/4AAQ..."
}

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(800, img.width);
      canvas.height = img.height * (canvas.width / img.width);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.src = dataUrl;
  });
}
```

**Why Base64 instead of Firebase Storage?** Firebase Storage requires upgrading to the Blaze plan (credit card). Base64 strings fit in Firestore's 1MB per-document limit and cost nothing extra.

---

## 4. Client-side vs Server-side

### Client-side = "In the user's browser"

- Code that runs in Chrome, Safari, Firefox on the user's device
- The user can see this code in DevTools
- The user can modify it, block it, or inspect it
- Includes: `useState`, `useEffect`, `onClick`, `signInWithEmailAndPassword`, `getDoc`, `addDoc`
- Files marked `"use client"` at the top

### Server-side = "On Vercel's infrastructure"

- Code that runs on Vercel's computers in their data center
- The user CANNOT see or modify this code
- Has access to secrets (private keys, database passwords)
- Includes: API routes (`app/api/*`), the seed script (`scripts/*`), server components
- Files that import Node.js-only modules like `firebase-admin`

| | Client-side (`"use client"`) | Server-side (API routes) |
|---|---|---|
| Where it runs | User's browser | Vercel's computer |
| Can use `process.env` | ❌ No | ✅ Yes |
| Can use `Buffer` | ❌ No | ✅ Yes |
| Can use `firebase-admin` | ❌ No | ✅ Yes |
| Can keep secrets | ❌ No | ✅ Yes |
| Visible to user | ✅ Yes (DevTools) | ❌ No |

---

## 5. The Four Communication Paths

```
                    ┌──────────────────────────────────────┐
                    │          VERCEL SERVER                │
                    │                                      │
                    │  ┌────────────────────────────┐      │
                    │  │  app/api/debug/route.ts     │      │
                    │  │  scripts/seed-firestore.mjs │      │
                    │  │  lib/firebase-admin.ts      │      │
                    │  └────────────────────────────┘      │
                    └──────────┬───────────────────────────┘
                               │ PATH 3: admin SDK (HTTPS)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    GOOGLE FIREBASE                            │
│                                                              │
│  ┌──────────────────────────────────────┐                    │
│  │  Firestore Database                  │                    │
│  │  - events collection                 │◄─── PATH 1 + 3    │
│  │  - programs collection               │                    │
│  │  - users collection                  │                    │
│  │  - etc.                              │                    │
│  └──────────────────────────────────────┘                    │
│                                                              │
│  ┌──────────────────────────────────────┐                    │
│  │  Firebase Auth                       │◄─── PATH 1 + 3    │
│  │  - user accounts                     │                    │
│  │  - custom claims (roles)             │                    │
│  └──────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
                               ▲
                          PATH 1: client SDK (HTTPS)
                               │
                    ┌──────────┴───────────────────────────┐
                    │          YOUR BROWSER                  │
                    │                                       │
                    │  ┌─────────────────────────────┐      │
                    │  │  firebase-client.ts          │      │
                    │  │  auth-context.tsx            │      │
                    │  │  firebase.ts                 │      │
                    │  │  upload.ts                   │      │
                    │  │                              │      │
                    │  │  Pages:                      │      │
                    │  │  login page                  │      │
                    │  │  dashboard                   │      │
                    │  │  enroll page                 │      │
                    │  └─────────────────────────────┘      │
                    └──────────────────────────────────────┘
                               │
                          PATH 2: GET pages (HTTPS)
                               │
                    ┌──────────┴───────────────────────────┐
                    │          VERCEL SERVER                 │
                    │  serves HTML/JS/CSS                   │
                    └──────────────────────────────────────┘
```

### PATH 1: Browser → Firebase (Direct, most common)

```
You visit dashboard → Events load

Browser:  GET https://firestore.googleapis.com/v1/projects/mhma-backend/databases/(default)/documents/events
Firebase: [event1, event2, ...]
```

**No Vercel involved.** The browser talks directly to Google's servers using the client SDK.

**When this path is used:**
- Login (`signInWithEmailAndPassword`)
- Register (`createUserWithEmailAndPassword`)
- Reading events, programs, journal for the homepage
- Adding/editing/deleting events from the dashboard
- Submitting contact forms
- Enrolling in programs
- Changing password

### PATH 2: Browser → Vercel (Page loads)

```
You type mhma-update.vercel.app

Browser:  GET / (ask for homepage)
Vercel:   HTML page with React JavaScript
```

Vercel hosts your Next.js code. It sends the compiled JavaScript to the browser. After that, most communication is browser-to-Firebase directly.

### PATH 3: Vercel → Firebase (Admin operations)

```
You visit /api/debug

Browser:  GET /api/debug
Vercel:   Runs app/api/debug/route.ts
          calls admin.firestore().listCollections()
Firebase: [events, programs, users, ...]
Vercel:   Formats as JSON
Browser:  Shows the debug info
```

**When this path is used:**
- `/api/debug` — reading database status
- Seed script — populating initial data
- Setting custom user claims (roles)
- Any future operation that needs the private key

### PATH 4: Browser → Vercel → Firebase (Future use)

```
Future: A board member clicks "Email all members"

Browser:  POST /api/send-emails
Vercel:   Uses admin SDK to list all user emails
          Calls SendGrid API to send emails
Browser:  "Emails sent!"
```

This path exists for operations that need secrets (API keys) or admin-level Firebase access.

---

## 6. Firestore CRUD Functions

These are functions from the `firebase/firestore` npm package. They are the only way your code talks to Firestore.

### getDoc — Read ONE document

```typescript
import { getDoc, doc } from "firebase/firestore";

const snap = await getDoc(doc(db, "events", "abc123"));
//                                     │       │
//                                     │       └── document ID
//                                     └── collection name

if (snap.exists()) {
  const data = snap.data();  // { title: "Eid Festival", date: "2026-06-15", ... }
}
```

**HTTP equivalent:** `GET https://firestore.googleapis.com/v1/.../documents/events/abc123`

### getDocs — Read MANY documents

```typescript
import { getDocs, collection, query, orderBy, limit } from "firebase/firestore";

const q = query(
  collection(db, "events"),
  orderBy("createdAt", "desc"),
  limit(10)
);
const snap = await getDocs(q);
const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
```

**HTTP equivalent:** `GET https://firestore.googleapis.com/v1/.../documents/events?orderBy=createdAt%20desc&pageSize=10`

### addDoc — CREATE a document (auto-generated ID)

```typescript
import { addDoc, collection } from "firebase/firestore";

const ref = await addDoc(collection(db, "events"), {
  title: "Eid Festival",
  date: "2026-06-15",
  createdAt: serverTimestamp(),  // Firestore fills this in with server clock
});
console.log(ref.id);  // Firestore generated this: "abc123"
```

**HTTP equivalent:** `POST https://firestore.googleapis.com/v1/.../documents/events`

### setDoc — CREATE or OVERWRITE at a specific ID

```typescript
import { setDoc, doc } from "firebase/firestore";

// Used during registration — the document ID is the Firebase Auth UID
await setDoc(doc(db, "users", cred.user.uid), {
  email: "user@example.com",
  displayName: "John Doe",
  role: "member",
});
```

**Difference from addDoc:** `setDoc` lets you choose the ID. `addDoc` auto-generates one.

### updateDoc — UPDATE specific fields only

```typescript
import { updateDoc, doc } from "firebase/firestore";

// Changes ONLY the title. Other fields (date, location) are preserved.
await updateDoc(doc(db, "events", "abc123"), {
  title: "New Title",
  updatedAt: serverTimestamp(),
});
```

### deleteDoc — DELETE a document

```typescript
import { deleteDoc, doc } from "firebase/firestore";

await deleteDoc(doc(db, "events", "abc123"));
```

### Quick Reference

| Function | What it does | HTTP Method | URL |
|---|---|---|---|
| `getDoc(ref)` | Read one doc | GET | `/documents/{collection}/{id}` |
| `getDocs(query)` | Read many docs | GET (with params) | `/documents/{collection}?orderBy=...` |
| `addDoc(col, data)` | Create with auto ID | POST | `/documents/{collection}` |
| `setDoc(ref, data)` | Create/overwrite at known ID | PATCH | `/documents/{collection}/{id}` |
| `updateDoc(ref, data)` | Update specific fields | PATCH | `/documents/{collection}/{id}` |
| `deleteDoc(ref)` | Delete a doc | DELETE | `/documents/{collection}/{id}` |

### What about SQL?

In SQL you'd write:
```sql
CREATE TABLE events (id INT AUTO_INCREMENT, title VARCHAR(255), date DATE);
INSERT INTO events (title, date) VALUES ('Eid Festival', '2026-06-15');
SELECT * FROM events WHERE id = 1;
DELETE FROM events WHERE id = 1;
```

In NoSQL (Firestore) you'd write:
```typescript
// No "CREATE TABLE" needed — collections auto-create
await addDoc(collection(db, "events"), { title: "Eid Festival", date: "2026-06-15" });
const snap = await getDoc(doc(db, "events", "abc123"));
await deleteDoc(doc(db, "events", "abc123"));
```

**Firestore is schemaless** — no need to define columns or data types upfront. Each document is a JSON object. Different documents in the same collection can have different fields.

---

## 7. Authentication End-to-End

### Registration Flow

```
1. User fills form on /register page
   Enter: email, password, first name, last name (board: + invite code)

2. createUserWithEmailAndPassword(auth, email, password)
   Browser ─── HTTPS ──→ Firebase Auth
   Firebase ←── user object { uid, email } ── Browser

3. setDoc(doc(db, "users", cred.user.uid), {
     displayName: "John Doe",
     email: "john@example.com",
     role: "member"  // or "board_member"
   })
   Browser ─── HTTPS ──→ Firestore
   (Creates document at users/{uid})

4. For board members:
   markInviteCodeUsed(code, uid) → marks code as used in Firestore
   addDoc(notifications, {...}) → creates notification

5. User redirected to /login to sign in
```

### Login Flow

```
1. User enters email + password on /login page

2. signInWithEmailAndPassword(auth, email, password)
   Browser ─── HTTPS ──→ Firebase Auth
   Firebase ←── idToken ── Browser

3. getIdTokenResult() — reads the JWT token from Firebase Auth
   This token contains custom claims (if admin set them):
   { role: "administrator", ... }

4. Tab validation:
   - "Board Member" tab + non-board user → Error
   - "Member" tab + board user → Error

5. refreshUser() — reads Firestore users/{uid} for displayName

6. Redirect:
   - Board member → /dashboard
   - Regular member → /
```

### Session Persistence (Page Refresh)

```
1. Browser loads page → AuthProvider mounts

2. onAuthStateChanged fires automatically
   Firebase SDK checks IndexedDB for cached session

3. If session found:
   - getIdTokenResult() reads cached token claims (instant, no network)
   - fetchUserData(uid) reads Firestore users/{uid} (network call)
   - setUser({ uid, email, displayName, role })
   - setLoading(false)

4. Any page using useAuth() now knows the user

5. If no session:
   - setUser(null)
   - setLoading(false)
```

---

## 8. How auth-context.tsx Works

### "Is it alive? How does it update?"

It is NOT a server or a running process. It's a React component that uses:

```typescript
const [user, setUser] = useState(null);     // step 1: declare state
const [loading, setLoading] = useState(true);

useEffect(() => {                           // step 2: set up listener
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      // read role from claims + Firestore
      setUser({ uid, email, displayName, role });  // step 3: update state
    } else {
      setUser(null);
    }
    setLoading(false);                      // step 4: done loading
  });
}, []);
```

**How it feels "alive":**
- `onAuthStateChanged` is an **event listener** provided by Firebase
- When a user logs in, Firebase fires the callback → `setUser()` runs → React re-renders
- When a user logs out, Firebase fires the callback → `setUser(null)` → React re-renders
- When the page refreshes, Firebase checks IndexedDB → fires callback with cached user

**It is NOT security rules.** Security rules are a separate file on Firebase's servers. auth-context.tsx runs in the browser and provides UI hints (hide/show buttons, redirect to login). The actual database security must come from firestore.rules.

### The Two Sources for Role

```
                  ┌──────────────────────┐
                  │  getIdTokenResult()   │  Source 1: Token Claims
                  │  (cached JWT in      │  Fast, works offline
                  │   browser memory)     │  Set by admin SDK
                  └──────┬───────────────┘
                         │
                         ▼ claim found?
                    ┌────┴────┐
                    │  YES   NO │
                    └────┬────┘
                         │
              ┌──────────┘
              ▼
  ┌──────────────────────┐
  │  fetchUserData(uid)  │  Source 2: Firestore Document
  │  users/{uid}.role    │  Slower, needs network
  │  users/{uid}.display │  Set during registration
  └──────┬───────────────┘
         │
         ▼ role found?
    ┌────┴────┐
    │  YES   NO │
    └────┬────┘
         │
  ┌──────┘
  ▼
  ┌──────────────────────┐
  │  Default: "member"   │
  └──────────────────────┘
```

---

## 9. Firestore Security Rules vs Admin SDK

| | Admin SDK | Security Rules |
|---|---|---|
| What it is | A Node.js library with a private key | A text configuration file on Firebase |
| Where it lives | `lib/firebase-admin.ts` | `firestore.rules` (doesn't exist yet) |
| Who runs it | Server/CLI only | Google's servers enforce it automatically |
| Controls | "Who can call setCustomUserClaims" | "Who can read/write each collection" |
| Can a board member bypass it? | No — they don't have the private key | No — Google enforces it |

### Analogy

- **Security Rules** = The locks on each door (members can't enter dashboard, public can't write events)
- **Admin SDK** = The master key that opens every lock, held by the building manager (you)

### Current Status

There is NO `firestore.rules` file in this project. Firebase's default behavior:
- **First 30 days**: `allow read, write: if true;` (anyone can read/write anything)
- **After 30 days**: `allow read, write: if false;` (everyone denied)

This is a security gap. We need to create rules like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Programs: anyone can read, only board can write
    match /programs/{doc} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.token.role in ['board_member', 'administrator'];
    }
    // Users: only the user themselves
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    // Events: anyone can read, only board can write
    match /events/{doc} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.token.role in ['board_member', 'administrator'];
    }
    // Enrollments: authenticated users can create
    match /enrollments/{doc} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null &&
        request.auth.token.role in ['board_member', 'administrator'];
    }
  }
}
```

`request.auth` in a rule = the user's Firebase Auth token. `request.auth.token.role` = the custom claim we set with the admin SDK.

---

## 10. Route.ts Files

### What they are

Route files (`app/api/*/route.ts`) are how you create **custom server endpoints** in Next.js.

```typescript
// app/api/debug/route.ts
import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {  // handles GET /api/debug
  const collections = await firestore.listCollections();
  return NextResponse.json({ collections });
}
```

When deployed, this creates the URL: `https://mhma-update.vercel.app/api/debug`

### Why they exist

**To give the browser a way to request server-only operations.**

The browser cannot:
- Use the admin SDK (no private key)
- Keep API secrets (email service keys, payment keys)
- Access `process.env` or `Buffer`

route.ts files bridge this gap:

```
Browser asks Vercel: "Please do this server-only thing for me"
Vercel does it (using the private key or other secrets)
Vercel sends back the result
```

### In this project

There is only **one** route.ts file: `app/api/debug/route.ts`

There are NO route.ts files for events, programs, journal, enrollments, etc. Those operations go **directly from browser to Firebase** using `firebase-client.ts`.

### When Vercel talks to Firebase — complete list

| Scenario | Where code runs | Why browser can't do it | File |
|---|---|---|---|
| Seed the database | Your MacBook (dev env) | Needs private key | `scripts/seed-firestore.mjs` |
| Set user as admin | Your MacBook (dev env) | `setCustomUserClaims` is admin-only | `scripts/seed-firestore.mjs` |
| Debug endpoint | Vercel server | `listCollections()` is admin-only | `app/api/debug/route.ts` |
| Future: send emails | Vercel server | Email API key must be secret | Would be a new route.ts |
| Future: delete user | Vercel server | `admin.auth().deleteUser()` is admin-only | Would be a new route.ts |

---

## 11. The `\n` Bug Explained

### Root Cause

The Vercel environment variable `NEXT_PUBLIC_FIREBASE_PROJECT_ID` contained a trailing newline character.

The debug endpoint (`app/api/debug/route.ts:12-13`) showed:

```json
{
  "projectId": "mhma-backend",
  "projectIdRaw": "\"mhma-backend\\n\""
}
```

The `\n` embedded in `projectId` corrupted the URL Firestore uses:

```
Without \n:  /v1/projects/mhma-backend/databases/...
With \n:     /v1/projects/mhma-backend%0A/databases/...
                                     ^^^^ URL-encoded newline
```

### Why reads worked but writes didn't

Firestore's read and write operations use different code paths in the Firebase SDK:

- **Reads** (`getDoc`, `getDocs`): The server tolerates the malformed URL path, probably by stripping the `%0A` or truncating at it. The request succeeds.
- **Writes** (`addDoc`, `setDoc`, `updateDoc`, `deleteDoc`): Uses a stricter REST endpoint. The `%0A` causes a `400 Bad Request` or `404` error. But the error wasn't being caught or logged — writes silently failed.

### The Fix

```typescript
// lib/firebase-client.ts:6-15
const trim = (s: string | undefined) => (s || "").trim();

const firebaseConfig = {
  apiKey: trim(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  projectId: trim(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),  // "mhma-backend\n" → "mhma-backend"
  // ...
};
```

Also:
- All write operations now have 30-second timeouts (via `Promise.race`)
- All writes log success/failure with `console.log`/`console.error`
- Firestore forced to use long-polling (HTTP instead of WebSocket)

---

## 12. Access Control: Where Board Members Are Restricted

### Router-level guards (UI only — NOT security)

**Dashboard page** (`app/dashboard/page.tsx:44-48`):
```typescript
useEffect(() => {
  if (!authLoading && !isBoardMember) {
    router.push("/login");  // redirect non-board members to login
    return;
  }
}, [authLoading, isBoardMember]);
```

**All dashboard sub-pages** (events/new, events/edit, programs/new, programs/edit, journal/new, journal/edit, notifications):
```typescript
if (!authLoading && !isBoardMember) router.push("/login");
```

**Enroll page** (`app/enroll/page.tsx:29-31`):
```typescript
} else if (isBoardMember) {
  router.push("/dashboard");  // board members can't enroll
}
```

**Login page** (`app/login/page.tsx:56-63`):
```typescript
if (tab === "board" && !isBoard) {
  throw new Error("This account does not have board access.");
}
```

### What `isBoardMember` means (`lib/auth-context.tsx:134`):
```typescript
const isBoardMember = user?.role === "board_member" || user?.role === "administrator";
```

### Security Gap

These are **UI redirects only**. A clever attacker could:
1. Open Chrome DevTools
2. Type `window.location.href = "/dashboard"` in the console
3. See the dashboard because there are NO Firestore security rules

**Firestore Security Rules** would prevent step 3 by blocking Firestore read/write access from unauthorized users. The router guards prevent accidental access by honest users, but only security rules prevent malicious access.

---

## 13. Glossary

| Term | Definition | Example in this project |
|---|---|---|
| **API Key** | A public identifier for your Firebase project. Visible in the browser. | `AIzaSyCglZfMJFO-RgvuSzctVQnz1UQaMp6Qv_U` (in `firebase-client.ts`) |
| **Service Account** | A private JSON key used by the admin SDK. Kept secret. | `FIREBASE_SERVICE_ACCOUNT_BASE64` in Vercel env vars |
| **SDK** | Software Development Kit — a library that wraps HTTP requests in nice functions | `firebase` (client SDK), `firebase-admin` (admin SDK) |
| **Client SDK** | The Firebase library for browsers | `firebase-client.ts` uses it |
| **Admin SDK** | The Firebase library for servers with god privileges | `firebase-admin.ts` uses it |
| **Firebase App** | A configuration object pointing to your Firebase project | `initializeApp({ apiKey, projectId, ... })` |
| **Database Instance (db)** | A live connection to your Firestore database | `initializeFirestore(app, ...)` exported as `db` |
| **WebSocket** | A persistent two-way connection between browser and server | Firebase's default transport for real-time updates |
| **Long-polling** | A fallback transport using regular HTTP instead of WebSocket | `experimentalForceLongPolling: true` in `firebase-client.ts` |
| **Collection** | A group of documents in Firestore (like a folder) | `events`, `programs`, `users`, `journal` |
| **Document** | A single JSON object in Firestore | `{ title: "Eid", date: "2026-06-15" }` |
| **CRUD** | Create, Read, Update, Delete — the four basic data operations | `addDoc`, `getDoc`, `updateDoc`, `deleteDoc` |
| **Custom Claims** | Key-value pairs stored in a user's auth token | `{ role: "administrator" }` set by admin SDK |
| **Security Rules** | A configuration file that controls who can read/write Firestore data | `firestore.rules` (not created yet) |
| **JWT Token** | A signed JSON token proving the user's identity | Created by Firebase Auth, read by `getIdTokenResult()` |
| **route.ts** | A Next.js file that creates a server API endpoint | `app/api/debug/route.ts` |
| **`"use client"`** | A directive telling Next.js this code runs in the browser | At the top of all page files |
| **ServerTimestamp** | A Firebase marker that fills in the server's clock time | `createdAt: serverTimestamp()` |
| **Base64** | A way to encode binary data (images) as text strings | `data:image/jpeg;base64,/9j/4AAQ...` |
