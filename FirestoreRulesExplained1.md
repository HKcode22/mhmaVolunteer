# Firestore Security Rules — Complete Guide

> Everything you need to know about Firestore security rules: how they work, why we need them, how they fit into the architecture, and how to explain them in an interview.

---

## Table of Contents

1. [The Problem: Why We Need Security Rules](#1-the-problem-why-we-need-security-rules)
2. [The Three Players: Browser, Vercel, Firebase](#2-the-three-players-browser-vercel-firebase)
3. [What Are Firestore Security Rules?](#3-what-are-firestore-security-rules)
4. [How Security Rules Work Under the Hood](#4-how-security-rules-work-under-the-hood)
5. [The Rules We Created — Line by Line](#5-the-rules-we-created--line-by-line)
6. [The Deployment Process](#6-the-deployment-process)
7. [Security Rules vs Admin SDK vs Router Guards](#7-security-rules-vs-admin-sdk-vs-router-guards)
8. [How to Explain This in an Interview](#8-how-to-explain-this-in-an-interview)
9. [Common Interview Questions and Answers](#9-common-interview-questions-and-answers)
10. [Diagrams](#10-diagrams)

---

## 1. The Problem: Why We Need Security Rules

### Before Rules: Anyone Can Do Anything

When you create a new Firestore database, Google gives you a default rule:

```
match /{document=**} {
  allow read, write: if request.time < timestamp.date(2026, 6, 11);
}
```

This means: **anyone in the world** can read and write every piece of data in your database until June 11, 2026. After that date, **nobody** can read or write anything.

### What Could Go Wrong Without Rules?

```javascript
// Any visitor to your website can open Chrome DevTools and run:

// Read ALL user data (emails, phone numbers, addresses)
const users = await getDocs(collection(db, "users"));
users.forEach(doc => console.log(doc.data()));

// Delete ALL events
const events = await getDocs(collection(db, "events"));
events.forEach(doc => deleteDoc(doc.ref));

// Give themselves board member access by editing their role
await updateDoc(doc(db, "users", theirUid), { role: "administrator" });

// Delete the entire database
// (Firestore doesn't have a "delete all" but they can delete every document)
```

### The Solution: Security Rules

Security rules are a **configuration file** that lives on **Google's servers**. Every time someone tries to read or write data from the browser, Google checks the rules first. If the rules say "no", the request is rejected — even if the person has the API key.

---

## 2. The Three Players: Browser, Vercel, Firebase

```
┌─────────────────────────────────────────────────────────────────┐
│  1. BROWSER (Chrome on user's phone/laptop)                     │
│     - Runs React code, "use client" pages                       │
│     - Has the PUBLIC Firebase API key                           │
│     - Can see everything in DevTools                            │
│     - UNTRUSTED environment — anyone can modify the code        │
│     - Files: app/*.tsx, components/*.tsx, lib/firebase-client.ts│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS requests
                              │ (getDocs, addDoc, updateDoc, deleteDoc)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. GOOGLE FIREBASE (Google's cloud servers)                    │
│     - Runs: Auth system + Firestore database                    │
│     - Has: Your data (events, users, programs)                  │
│     - Has: SECURITY RULES (enforced here, on Google's servers)  │
│                                                                  │
│     When a request comes in from the browser:                   │
│     1. Google checks: who is making this request?               │
│     2. Google checks: what operation are they trying?           │
│     3. Google checks: does the rules file allow this?           │
│     4. If YES → perform the operation                           │
│     5. If NO → return "permission denied" error                 │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS requests (admin SDK)
                              │ (listCollections, setCustomUserClaims)
┌─────────────────────────────────────────────────────────────────┐
│  2. VERCEL (Next.js hosting server)                             │
│     - Runs: API routes, server components                       │
│     - Has: firebase-admin.ts (secret private key)               │
│     - Has: Your environment variables                           │
│     - TRUSTED environment — users can't see this code           │
│     - Files: app/api/*.ts, scripts/*.mjs                        │
│                                                                  │
│     The admin SDK BYPASSES security rules entirely.             │
│     It has god-like access because it uses a private key.       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Insight

**Security rules ONLY apply to browser requests.** The admin SDK (running on Vercel or your local machine) bypasses them completely because it authenticates with a private key, proving it's the project owner.

---

## 3. What Are Firestore Security Rules?

### Definition

Firestore security rules are a **text configuration file** written in a special rules language. They define **who can do what** to each collection in your Firestore database.

### Where They Live

The rules file (`firestore.rules`) is **deployed to Google's servers**. It's NOT part of your website code. It lives in Firebase's infrastructure and is enforced by Google's servers on every single database request.

### The Rules Language

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{event} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.role == "administrator";
    }
  }
}
```

### Key Concepts in the Rules Language

| Concept | What It Means | Example |
|---|---|---|
| `match` | Defines which documents this rule applies to | `match /events/{event}` matches all documents in the events collection |
| `allow` | Grants permission for an operation | `allow read: if true` means anyone can read |
| `request.auth` | Information about the logged-in user | `request.auth.uid` is the user's unique ID |
| `request.auth.token` | Custom claims set by the admin SDK | `request.auth.token.role` is the role we set |
| `request.resource.data` | Data being written (for create/update) | `request.resource.data.title` is the title field being saved |
| `resource.data` | Existing data in the document | `resource.data.status` is the current status |
| `get()` | Read another document to check a condition | `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role` |
| `exists()` | Check if a document exists | `exists(/databases/$(database)/documents/users/$(request.auth.uid))` |

---

## 4. How Security Rules Work Under the Hood

### The Request Lifecycle

```
Step 1: User clicks "Delete Event" in the browser
        │
        ▼
Step 2: Browser sends HTTPS DELETE to Firestore
        DELETE https://firestore.googleapis.com/v1/projects/mhma-backend/.../events/abc123
        Headers: Authorization: Bearer <user's JWT token>
        │
        ▼
Step 3: Google receives the request
        │
        ├── Extracts the JWT token → identifies the user
        │   (uid: "xyz123", email: "user@example.com")
        │
        ├── Looks up the security rules for this project
        │   Finds: match /events/{event} { allow delete: if isBoardMember(); }
        │
        ├── Evaluates the condition:
        │   isBoardMember() = request.auth != null &&
        │     get(/databases/.../users/xyz123).data.role in ['board_member', 'administrator']
        │
        ├── Makes a sub-request to read users/xyz123 document
        │   Result: { role: "member", ... }
        │
        └── Evaluates: "member" in ['board_member', 'administrator'] → FALSE
        │
        ▼
Step 4: Google returns "permission denied" error to the browser
        The event is NOT deleted.
```

### What Happens When Rules Allow the Request

```
Step 1-3: Same as above, but the user IS a board member
        │
        └── Evaluates: "board_member" in ['board_member', 'administrator'] → TRUE
        │
        ▼
Step 4: Google performs the DELETE operation
        The event document is removed from Firestore
        Google returns success to the browser
```

### Important: Rules Are Evaluated on Google's Servers

The rules file is NOT downloaded to the browser. It stays on Google's servers. Every request is checked against the rules before any data is read or written. This means:

- **A hacker cannot bypass rules** by modifying the browser code
- **A hacker cannot bypass rules** by using curl or Postman
- **A hacker cannot bypass rules** by writing their own app with your API key

The only way to bypass rules is to have the **admin SDK private key**, which is kept secret on Vercel's servers.

---

## 5. The Rules We Created — Line by Line

### The Complete File

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
```

**Line 1**: `rules_version = '2'` — Uses version 2 of the rules language (required for `get()` and `exists()` functions).

**Line 2**: `service cloud.firestore` — These rules apply to the Firestore service.

**Line 3**: `match /databases/{database}/documents` — Matches all databases in this project. `{database}` is a wildcard that matches any database name (usually `(default)`).

### Helper Functions

```
    function isBoardMember() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in
          ['board_member', 'administrator'];
    }

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
```

**`isBoardMember()`**: Checks if the requesting user has a `role` field in their `users/{uid}` document that is either `"board_member"` or `"administrator"`. This works for web-registered users who don't have custom claims set.

**`isAuthenticated()`**: Checks if the user is logged in (has a valid auth token).

**`isOwner(userId)`**: Checks if the requesting user is trying to access their own document.

### Events Rules

```
    match /events/{event} {
      allow read: if true;
      allow create, update, delete: if isBoardMember();
    }
```

**What this means**:
- **Anyone** (even not logged in) can read events → homepage shows events
- **Only board members** can create, update, or delete events → dashboard can manage events

### Programs Rules

```
    match /programs/{program} {
      allow read: if true;
      allow create, update, delete: if isBoardMember();
    }
```

Same as events — public read, board-only write.

### Journal Rules

```
    match /journal/{entry} {
      allow read: if true;
      allow create, update, delete: if isBoardMember();
    }
```

Same pattern — public read, board-only write.

### Users Rules

```
    match /users/{userId} {
      allow read: if isOwner(userId) || isBoardMember();
      allow create, update: if isOwner(userId);
      allow delete: if false;
    }
```

**What this means**:
- Users can read their own document OR board members can read any user document
- Users can create and update their own document
- **Nobody** can delete users via the client SDK (prevents accidental or malicious deletion)

### Site Content Rules

```
    match /siteContent/{doc} {
      allow read: if true;
      allow create, update, delete: if isBoardMember();
    }
```

Public read (contact info, announcements shown on homepage), board-only write.

### Enrollments Rules

```
    match /enrollments/{enrollment} {
      allow create: if isAuthenticated();
      allow read, update, delete: if isBoardMember();
    }
```

- Any logged-in user can enroll (create an enrollment)
- Only board members can read, update (approve/reject), or delete enrollments

### Scheduling Requests Rules

```
    match /schedulingRequests/{request} {
      allow create: if isAuthenticated();
      allow read, update, delete: if isBoardMember();
    }
```

Same as enrollments.

### Contact Submissions Rules

```
    match /contactSubmissions/{submission} {
      allow create: if true;
      allow read, update, delete: if isBoardMember();
    }
```

- **Anyone** (even not logged in) can submit a contact form
- Only board members can read, mark as read, or delete submissions

### Notifications Rules

```
    match /notifications/{notification} {
      allow read: if isBoardMember();
      allow create: if true;
      allow update, delete: if isBoardMember();
    }
```

- Board members can read notifications
- Anyone can create notifications (used during registration)
- Only board members can update or delete

### Invite Codes Rules

```
    match /inviteCodes/{code} {
      allow read: if isBoardMember();
      allow create: if isBoardMember();
      allow update: if isBoardMember();
      allow delete: if isBoardMember();
    }
```

All operations on invite codes are board-member only.

---

## 6. The Deployment Process

### Step 1: Create the Rules File

We created `firestore.rules` in the project root with all the rules defined above.

### Step 2: Create a Ruleset in Firebase

We used the Firebase Rules API to upload the rules file to Google's servers:

```bash
curl -X POST \
  "https://firebaserules.googleapis.com/v1/projects/mhma-backend/rulesets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "source": { "files": [{ "name": "firestore.rules", "content": "..." }] } }'
```

This created a **ruleset** (a versioned copy of the rules) with ID `366caa1e-2a24-4052-bf9a-2b9f7e2a1eab`.

### Step 3: Activate the Ruleset (Release)

A ruleset is just a stored version. To make it **active**, you need to create a **release** that links the ruleset to the `cloud.firestore` service.

The service account we used could create rulesets but lacked permission to create releases. So you activated it manually through the Firebase Console:

1. Go to https://console.firebase.google.com/project/mhma-backend/firestore/rules
2. Paste the rules content
3. Click **Publish**

### How to Verify Rules Are Active

```bash
curl -s \
  "https://firebaserules.googleapis.com/v1/projects/mhma-backend/releases/cloud.firestore" \
  -H "Authorization: Bearer $TOKEN"
```

This returns the currently active ruleset. If the ruleset ID matches the one we created, the rules are active.

---

## 7. Security Rules vs Admin SDK vs Router Guards

These are **three different layers** of security in our app:

| Layer | What It Does | Where It Lives | Can Be Bypassed? |
|---|---|---|---|
| **Router Guards** | Redirects users away from pages they shouldn't see | Browser code (`useEffect` in pages) | ✅ Yes — user can type URL directly |
| **Security Rules** | Blocks unauthorized database operations | Google's servers (Firestore) | ❌ No — enforced by Google |
| **Admin SDK** | Bypasses all rules for server operations | Vercel server (private key) | N/A — it's the bypass itself |

### How They Work Together

```
User visits /dashboard

Router Guard (browser):
  if (!isBoardMember) router.push("/login")
  → Stops honest users from seeing the wrong page

User tries to delete an event (via DevTools, bypassing router guard):

Security Rules (Google's servers):
  allow delete: if isBoardMember()
  → Blocks the actual database operation

Admin SDK (Vercel server):
  Uses private key → bypasses all rules
  → Used for setting user roles, seeding data, etc.
```

### Why We Need All Three

- **Router guards** provide a good user experience (don't show pages you can't access)
- **Security rules** provide actual security (prevent data tampering)
- **Admin SDK** provides privileged operations (things only the server should do)

Without router guards: Users see error pages instead of being redirected.
Without security rules: Anyone can tamper with data via DevTools.
Without admin SDK: You can't set user roles or run seed scripts.

---

## 8. How to Explain This in an Interview

### The 30-Second Answer

> "Firestore security rules are a server-side configuration that controls who can read and write data in your Firestore database. They're enforced on Google's servers, not in the browser, so they can't be bypassed by modifying client code. In our app, we have three layers: router guards for UX, security rules for actual data protection, and the admin SDK for server-only operations. The rules check the user's role from their Firestore document and allow or deny operations accordingly."

### The 2-Minute Answer

> "When building a web app with Firebase, the browser has access to your API key, which means anyone can potentially read or write your database. Firestore security rules solve this by acting as a gatekeeper on Google's servers. Every database request is checked against the rules before it's executed.
>
> In our MHMA app, we have three user types: guests (not logged in), members (logged in), and board members (logged in with elevated permissions). The rules enforce that:
> - Anyone can read public data (events, programs, journal)
> - Only logged-in users can enroll in programs or submit scheduling requests
> - Only board members can create, update, or delete content
> - Users can only modify their own profile data
>
> We also use the Firebase Admin SDK on our Vercel server for privileged operations like setting user roles and seeding initial data. The admin SDK bypasses security rules because it authenticates with a private key, proving it's the project owner.
>
> The rules are deployed as a configuration file to Firebase and are evaluated on every single request. This means even if someone tries to bypass our frontend guards by directly calling the Firestore API, the rules will still block unauthorized operations."

---

## 9. Common Interview Questions and Answers

### Q: What happens if security rules are misconfigured?

**A**: If rules are too permissive (`allow read, write: if true`), anyone can read and write all your data. If rules are too restrictive (`allow read, write: if false`), even legitimate users can't access data. The default Firebase rules start permissive for 30 days then lock down, which is why you need to configure them before deployment.

### Q: Can security rules be bypassed?

**A**: No, as long as they're properly configured. Rules are enforced on Google's servers, not in the browser. The only way to bypass them is with the admin SDK private key, which should be kept secret.

### Q: What's the difference between the client SDK and admin SDK?

**A**: The client SDK runs in the browser with a public API key and is subject to security rules. The admin SDK runs on a server with a private key and bypasses all rules. The client SDK is for end-user operations; the admin SDK is for backend operations.

### Q: How do you test security rules?

**A**: Firebase provides a Rules Playground in the console where you can simulate requests as different users. You can also use the Firebase Emulator Suite to test rules locally before deploying.

### Q: What is a "ruleset" vs a "release"?

**A**: A ruleset is a versioned copy of your rules stored in Firebase. A release links a ruleset to a specific service (like `cloud.firestore`). You can have multiple rulesets but only one active release per service.

### Q: Can security rules read other documents?

**A**: Yes, using the `get()` function. For example, our `isBoardMember()` function reads the user's document from the `users` collection to check their role. However, each `get()` counts as a read operation and has performance implications.

### Q: What happens when a rule denies a request?

**A**: Firebase returns a "permission denied" error to the client. The operation is not performed, and no data is read or written. The client receives an error that can be caught and handled in the application code.

---

## 10. Diagrams

### Request Flow with Security Rules

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER                                                     │
│                                                              │
│  User clicks "Delete Event"                                  │
│     │                                                        │
│     ▼                                                        │
│  deleteDoc(doc(db, "events", "abc123"))                      │
│     │                                                        │
│     ▼                                                        │
│  Firebase SDK constructs HTTPS request:                      │
│  DELETE /v1/projects/mhma-backend/databases/.../events/abc123│
│  Authorization: Bearer <JWT token>                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  GOOGLE FIREBASE SERVER                                      │
│                                                              │
│  1. Parse the JWT token → identify user                     │
│     uid: "xyz123", email: "user@example.com"                │
│                                                              │
│  2. Look up security rules for this project                  │
│     match /events/{event} {                                  │
│       allow delete: if isBoardMember();                      │
│     }                                                        │
│                                                              │
│  3. Evaluate isBoardMember():                                │
│     a. Check request.auth != null → YES (user is logged in)  │
│     b. get(/databases/.../users/xyz123)                      │
│        → { role: "member", ... }                             │
│     c. "member" in ['board_member', 'administrator'] → FALSE │
│                                                              │
│  4. DENY the request                                         │
│     Return: "permission denied"                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  BROWSER                                                     │
│                                                              │
│  Firebase SDK receives error                                 │
│  console.error("Firestore: deleteEvent FAILED:", err)        │
│  UI shows error message to user                              │
└─────────────────────────────────────────────────────────────┘
```

### Three Layers of Security

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Router Guards (Browser)                           │
│  ────────────────────────────────────────────────────────   │
│  File: app/dashboard/page.tsx                               │
│  Code: if (!isBoardMember) router.push("/login")            │
│  Purpose: Good UX — redirect users from pages they can't    │
│           see                                                │
│  Bypassable: YES — user can type URL directly               │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼ (if bypassed)
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Security Rules (Google's Servers)                 │
│  ────────────────────────────────────────────────────────   │
│  File: firestore.rules (deployed to Firebase)               │
│  Code: allow delete: if isBoardMember();                    │
│  Purpose: ACTUAL SECURITY — block unauthorized operations   │
│  Bypassable: NO — enforced by Google                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼ (if rules allow)
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Admin SDK (Vercel Server)                         │
│  ────────────────────────────────────────────────────────   │
│  File: lib/firebase-admin.ts                                │
│  Code: admin.firestore().collection("events").doc(id).delete()│
│  Purpose: Server-only operations that bypass all rules      │
│  Bypassable: N/A — it IS the bypass (requires private key)  │
└─────────────────────────────────────────────────────────────┘
```

### How `isBoardMember()` Works

```
User makes a request to delete an event
        │
        ▼
Security Rules evaluate: isBoardMember()
        │
        ├── Step 1: Check request.auth != null
        │   → Is the user logged in? YES
        │
        ├── Step 2: Read users/{uid} document
        │   get(/databases/$(database)/documents/users/$(request.auth.uid))
        │   → Returns: { role: "board_member", email: "board@mhma.us", ... }
        │
        ├── Step 3: Check .data.role in ['board_member', 'administrator']
        │   → "board_member" in ['board_member', 'administrator'] → TRUE
        │
        └── Result: ALLOW the delete operation
```

### The Complete Data Flow

```
┌──────────────┐     HTTPS      ┌──────────────┐     HTTPS      ┌──────────────┐
│   BROWSER    │ ──────────────► │   FIREBASE   │ ◄───────────── │    VERCEL    │
│              │  (client SDK)   │   SERVER     │  (admin SDK)   │   SERVER     │
│ - React app  │                 │              │                │ - API routes │
│ - Login      │ ◄────────────── │ - Auth       │ ──────────────►│ - Seed script│
│ - Dashboard  │  (rules apply)  │ - Firestore  │  (rules bypass)│ - Set claims │
│ - Profile    │                 │ - Rules      │                │              │
└──────────────┘                 └──────────────┘                └──────────────┘
      │                                │                                │
      │                                │                                │
      ▼                                ▼                                ▼
 User sees UI                    Data is stored                   Server operations
 based on role                  and protected                    that need trust
                                by rules
```

---

> **Key Takeaway**: Security rules are the last line of defense. Router guards make the UX good, but rules make the app secure. The admin SDK is for server operations that need to bypass rules. All three work together to create a secure, user-friendly application.
