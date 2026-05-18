# Code Mapping: Dashboard Page (app/dashboard/page.tsx)

> A complete trace of every import, function, constant, state variable, and how they all connect to each other and to other files in the project.

---

## Table of Contents

1. [The File at a Glance](#1-the-file-at-a-glance)
2. [Imports: Where Everything Comes From](#2-imports-where-everything-comes-from)
3. [State Variables: The Data Containers](#3-state-variables-the-data-containers)
4. [The useEffect: How Data Loads](#4-the-useeffect-how-data-loads)
5. [Event Handlers: What Happens When You Click](#5-event-handlers-what-happens-when-you-click)
6. [The Render: JSX to HTML](#6-the-render-jsx-to-html)
7. [The Section Component](#7-the-section-component)
8. [Data Flow Diagram: Full Lifecycle](#8-data-flow-diagram-full-lifecycle)
9. [How the Code Is "Alive" (Event-Driven Architecture)](#9-how-the-code-is-alive-event-driven-architecture)
10. [Glossary of Terms](#10-glossary-of-terms)

---

## 1. The File at a Glance

```
File: app/dashboard/page.tsx
Path: /Users/hk/Downloads/mhmaV4/app/dashboard/page.tsx
Size: 420 lines
Type: "use client" (runs in browser)
Purpose: Main board member dashboard showing all data in one place
```

### What this file does

When a board member visits `/dashboard`:
1. Checks if they are a board member → if not, redirects to `/login`
2. Loads ALL data from Firestore: programs, events, journal entries, scheduling requests, enrollments, contact submissions, invite codes
3. Shows them in a grid of scrollable list sections
4. Lets board members: add new items, edit existing items, delete items, approve/reject enrollments and requests, mark contacts as read, generate/copy/delete invite codes

---

## 2. Imports: Where Everything Comes From

### Line 1: `"use client";`

**What it does**: Tells Next.js that this component must run in the browser, not on the server. It has access to `window`, `document`, `localStorage`, and all browser APIs.

**Why needed**: Because this page uses `useState`, `useEffect`, `useRouter`, `confirm()`, and `navigator.clipboard` — all browser-only features.

### Line 3: `import { useState, useEffect } from "react";`

**What it is**: Two React hooks.

| Hook | What it does | Used at |
|---|---|---|
| `useState` | Creates a piece of state that survives re-renders. When you call `setPrograms(newData)`, React re-renders the component with the new data. | Lines 24-42 |
| `useEffect` | Runs code after the component renders. Used for side effects like data fetching. | Lines 44-78 |

**Where it comes from**: The `react` npm package (`node_modules/react/`).

### Line 4: `import Link from "next/link";`

**What it is**: Next.js's built-in navigation component. Creates `<a>` tags that do client-side navigation (no full page reload).

**Where it's used**: Lines 195-206 (quick action buttons), lines 222, 238, 254 (edit links), lines 333-337 (Add New links in section headers).

**Where it comes from**: The `next` npm package.

### Line 5: `import Image from "next/image";`

**What it is**: Next.js's optimized image component. Handle lazy loading and responsive images.

**Where it's used**: Not directly in the dashboard code currently (was imported but may not be used in the rendered output).

### Line 6: `import { Facebook, Instagram, ... } from "lucide-react";`

**What it is**: SVG icon components from the Lucide icon library. Each is a small SVG that renders as an inline icon.

**Where it comes from**: The `lucide-react` npm package.

**Used at**: Lines 196-210 (action buttons), lines 222-223 (edit/delete), etc.

### Line 7: `import { useAuth } from "@/lib/auth-context";`

**What it is**: A custom React hook that returns the current user's auth state.

**What it returns**:
```typescript
{
  user: { uid, email, displayName, role } | null,
  loading: boolean,
  isBoardMember: boolean,
  isLoggedIn: boolean,
  signOut: () => Promise<void>,
  refreshUser: () => Promise<void>,
}
```

**Where it comes from**: `lib/auth-context.tsx:143` — the AuthProvider wraps the entire app in `layout.tsx`.

**Used at**: Line 23 — destructures `user`, `isBoardMember`, `loading: authLoading`, `signOut`.

### Line 8: `import { useRouter } from "next/navigation";`

**What it is**: Next.js hook for programmatic navigation (redirecting users).

**Used at**: Line 22 (`const router = useRouter()`), Line 46 (`router.push("/login")`).

### Lines 9-18: Imports from `@/lib/firebase`

This is the **CRUD library** — all functions that read/write Firestore data.

| Imported Name | Type | What It Does | Defined in `lib/firebase.ts` at |
|---|---|---|---|
| `fetchEvents` | function | Reads events from Firestore | Line 134 |
| `deleteEvent` | function | Deletes an event from Firestore | Line 173 |
| `fetchPrograms` | function | Reads programs from Firestore | Line 183 |
| `deleteProgram` | function | Deletes a program from Firestore | Line 224 |
| `fetchJournalEntries` | function | Reads journal entries from Firestore | Line 234 |
| `deleteJournalEntry` | function | Deletes a journal entry from Firestore | Line 275 |
| `fetchEnrollments` | function | Reads enrollments from Firestore | Line 285 |
| `deleteEnrollment` | function | Deletes an enrollment from Firestore | Line 318 |
| `updateEnrollment` | function | Updates enrollment status (approve/reject) | Line 305 |
| `fetchSchedulingRequests` | function | Reads scheduling requests from Firestore | Line 328 |
| `deleteSchedulingRequest` | function | Deletes a scheduling request from Firestore | Line 361 |
| `updateSchedulingRequest` | function | Updates request status (approve/reject) | Line 348 |
| `fetchContactSubmissions` | function | Reads contact form submissions | Line 371 |
| `deleteContactSubmission` | function | Deletes contact submission | Line 389 |
| `markContactSubmissionRead` | function | Marks contact as read | Line 377 |
| `generateInviteCode` | function | Creates a new invite code in Firestore | Line 433 |
| `fetchInviteCodes` | function | Reads all invite codes from Firestore | Line 467 |
| `deleteInviteCode` | function | Deletes an invite code from Firestore | Line 473 |
| `FirebaseEvent` | **TypeScript interface** | Defines shape of an event object | Line 30 |
| `FirebaseProgram` | **TypeScript interface** | Defines shape of a program object | Line 45 |
| `FirebaseJournalEntry` | **TypeScript interface** | Defines shape of a journal entry | Line 59 |
| `FirebaseEnrollment` | **TypeScript interface** | Defines shape of an enrollment | Line 71 |
| `FirebaseSchedulingRequest` | **TypeScript interface** | Defines shape of a scheduling request | Line 84 |
| `FirebaseContactSubmission` | **TypeScript interface** | Defines shape of a contact submission | Line 110 |
| `InviteCode` | **TypeScript interface** | Defines shape of an invite code | Line 421 |

**Where they come from**: All defined in `lib/firebase.ts`. Each function internally calls the Firebase client SDK functions (`getDocs`, `addDoc`, `updateDoc`, `deleteDoc`) from `firebase/firestore`.

### Line 19: `import Navigation from "@/components/Navigation";`

**What it is**: The site navigation bar component (menu with links to pages).

**Used at**: Lines 168, 184.

---

## 3. State Variables: The Data Containers

Every `useState` creates:
1. A variable that holds the current value
2. A setter function that updates it and triggers a re-render

```
const [variableName, setVariableName] = useState<Type>(initialValue);
```

### Data state (holds Firestore data)

| State Variable | Type | Initial Value | What It Holds | Updated By | Used In Render At |
|---|---|---|---|---|---|
| `programs` | `FirebaseProgram[]` | `[]` | Program list from Firestore | `setPrograms()` at line 68 | Line 174, 214-228 |
| `events` | `FirebaseEvent[]` | `[]` | Event list from Firestore | `setEvents()` at line 69 | Line 175, 230-244 |
| `journals` | `FirebaseJournalEntry[]` | `[]` | Journal list from Firestore | `setJournals()` at line 70 | Line 176, 246-260 |
| `eventRequests` | `FirebaseSchedulingRequest[]` | `[]` | Scheduling requests from Firestore | `setEventRequests()` at lines 71, 123 | Line 177, 262-288 |
| `enrollments` | `FirebaseEnrollment[]` | `[]` | Enrollment list from Firestore | `setEnrollments()` at lines 72, 120 | Line 178, 291-322 |
| `contactSubmissions` | `FirebaseContactSubmission[]` | `[]` | Contact form submissions | `setContactSubmissions()` at lines 73, 133 | Line 179, 325-341 |
| `inviteCodes` | `InviteCode[]` | `[]` | Invite codes from Firestore | `setInviteCodes()` at lines 74, 88, 106 | Line 180, 343-382 |

### UI state (controls what the user sees)

| State Variable | Type | Initial Value | What It Controls | Updated By |
|---|---|---|---|---|
| `loading` | `boolean` | `true` | Whether the initial data load is complete | `setLoading(false)` at line 75 |
| `deletingId` | `string \| null` | `null` | Which item is currently being deleted (prevents double-click) | `setDeletingId(id)` at line 148, `setDeletingId(null)` at line 161 |
| `showAllPrograms` | `boolean` | `false` | Whether to show all programs or just first 5 | `setShowAllPrograms(!showAllPrograms)` at line 185 |
| `showAllEvents` | `boolean` | `false` | Same for events | Same pattern |
| `showAllJournals` | `boolean` | `false` | Same for journal | Same pattern |
| `showAllRequests` | `boolean` | `false` | Same for scheduling requests | Same pattern |
| `showAllEnrollments` | `boolean` | `false` | Same for enrollments | Same pattern |
| `showAllSubmissions` | `boolean` | `false` | Same for contact submissions | Same pattern |
| `showAllCodes` | `boolean` | `false` | Same for invite codes | Same pattern |
| `generatingCode` | `boolean` | `false` | Whether a new invite code is being generated | `setGeneratingCode(true/false)` at lines 82, 92 |
| `copiedCode` | `string` | `""` | Which invite code was just copied to clipboard (for checkmark animation) | `setCopiedCode(code)` at line 98, reset after 2s at line 99 |
| `codeMsg` | `string` | `""` | Message shown after generating/copying a code | `setCodeMsg()` at lines 83, 86, 90 |

### Why All These States?

Think of each state variable as a bucket:

```
                         ┌──────────────────┐
                         │   Firestore DB    │
                         └────────┬─────────┘
                                  │ fetchPrograms(), fetchEvents(), etc.
                                  ▼
                    ┌─────────────────────────┐
                    │   useEffect (line 44)   │
                    │   calls loadAll()       │
                    └────────┬────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        setPrograms()   setEvents()   setJournals()  ...
              │              │              │
              ▼              ▼              ▼
        programs[]      events[]       journals[]
        (line 24)       (line 25)      (line 26)
              │              │              │
              └──────┬───────┴──────┬──────┘
                     ▼              ▼
              programs.map()    events.map()
              (line 214)        (line 230)
                     │              │
                     ▼              ▼
              <div>Program 1</div>  <div>Event 1</div>
```

---

## 4. The useEffect: How Data Loads

```typescript
// Lines 44-78
useEffect(() => {
  // Step 1: Guard — only board members can see dashboard
  if (!authLoading && !isBoardMember) {
    router.push("/login");  // Redirect non-board members away
    return;
  }
  if (authLoading) return;  // Wait for auth to finish loading

  // Step 2: Create a timeout wrapper function
  const timeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
    ]);

  // Step 3: Load all data
  const loadAll = async () => {
    const results = await Promise.allSettled([
      timeout(fetchPrograms(100), 15000),
      timeout(fetchEvents(100), 15000),
      timeout(fetchJournalEntries(100), 15000),
      timeout(fetchSchedulingRequests(100), 15000),
      timeout(fetchEnrollments(100), 15000),
      timeout(fetchContactSubmissions(100), 15000),
      timeout(fetchInviteCodes(), 15000),
    ]);
    // Step 4: Extract results and set state
    const [p, e, j, er, en, cs, codes] = results.map(
      r => (r as any).value || (r as any).reason || []
    );
    setPrograms(p || []);
    // ... etc for each
    setLoading(false);
  };
  loadAll();
}, [authLoading, isBoardMember, router]);  // Dependencies — re-runs if these change
```

### Step-by-step walkthrough

**Step 1 — Auth guard (lines 45-49)**:
```
User visits /dashboard
  │
  ├── If auth is still loading → wait (return early)
  │
  ├── If NOT a board member → redirect to /login
  │
  └── If IS a board member → continue to load data
```

**Step 2 — Timeout wrapper (lines 51-55)**:
```typescript
const timeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([p, new Promise<T>(... reject after ms ...)]);
```
This is a generic function. `T` is a placeholder for any type. When you call `timeout(fetchPrograms(100), 15000)`:
- If `fetchPrograms` completes within 15 seconds → returns the data
- If it takes longer → rejects with "timeout" error

**Step 3 — Promise.allSettled (lines 58-66)**:
`Promise.allSettled` runs ALL promises in parallel. Unlike `Promise.all`, it doesn't stop if one fails. Each promise either:
- `{ status: "fulfilled", value: [...] }` — succeeded
- `{ status: "rejected", reason: Error }` — failed

**But wait** — each timeout has its own `.catch(() => [] as FirebaseProgram[])`. So if a fetch times out, it returns an empty array `[]` instead of throwing. This means `Promise.allSettled` will have `status: "fulfilled"` with value `[]`.

**Step 4 — Extract and set (lines 67-75)**:
```typescript
const [p, e, j, er, en, cs, codes] = results.map(
  r => (r as any).value || (r as any).reason || []
);
setPrograms(p || []);
```
This destructures the results array into individual variables, matching the order of the calls:
- `p` → programs
- `e` → events
- `j` → journals
- `er` → event requests
- `en` → enrollments
- `cs` → contact submissions
- `codes` → invite codes

**Step 5 — Dependencies array (line 78)**:
```typescript
}, [authLoading, isBoardMember, router]);
```
This `useEffect` runs:
1. When the component first mounts
2. When `authLoading` changes (from `true` to `false`)
3. When `isBoardMember` changes
4. When `router` changes (never, since it's stable)

### The "Waterfall" visual

```
Timeline:
├── Component mounts
├── authLoading = true → useEffect runs, hits "if (authLoading) return;"
├── Auth finishes loading → authLoading = false
├── isBoardMember = true → useEffect runs again
│   ├── fetchPrograms() ────────→ Firestore ──→ 12 programs
│   ├── fetchEvents() ──────────→ Firestore ──→ 8 events
│   ├── fetchJournalEntries() ──→ Firestore ──→ 39 entries
│   ├── fetchSchedulingRequests() → Firestore → []
│   ├── fetchEnrollments() ─────→ Firestore ──→ []
│   ├── fetchContactSubmissions() → Firestore → []
│   └── fetchInviteCodes() ─────→ Firestore ──→ []
│
├── All settled → setPrograms, setEvents, etc.
├── setLoading(false)
├── Component re-renders with data
```

---

## 5. Event Handlers: What Happens When You Click

### handleGenerateCode (lines 80-94)

**Triggered by**: Clicking the "Invite Code" quick action button (line 207) or "Generate New Code" button (line 355).

```typescript
const handleGenerateCode = async () => {
  if (!user?.uid) return;
  setGeneratingCode(true);  // Show spinner, disable button
  setCodeMsg("");           // Clear any previous message
  try {
    const code = await generateInviteCode(user.uid);
    //                ↑ calls lib/firebase.ts:433
    //                  which calls addDoc(collection(db, "inviteCodes"), {...})
    setCodeMsg(`Generated: ${code}`);
    const codes = await fetchInviteCodes();  // Reload all codes to show the new one
    setInviteCodes(codes);
  } catch (err: any) {
    setCodeMsg("Failed to generate code: " + err.message);
  } finally {
    setGeneratingCode(false);  // Re-enable button
  }
};
```

**Data flow**:
```
Button click → handleGenerateCode()
                │
                ├── setGeneratingCode(true) → button shows spinner
                │
                ├── generateInviteCode(user.uid)
                │   │
                │   ├── calls addDoc(collection(db, "inviteCodes"), { code, used: false, ... })
                │   │   │
                │   │   └── HTTPS POST to Firestore → new document created
                │   │
                │   └── returns the generated code string
                │
                ├── setCodeMsg("Generated: ABCDEF12") → shows purple message box
                │
                ├── fetchInviteCodes() → re-reads all codes from Firestore
                │
                ├── setInviteCodes(codes) → updates the list
                │
                └── setGeneratingCode(false) → re-enables button, hides spinner
```

### handleCopyCode (lines 96-100)

**Triggered by**: Clicking the copy icon next to an invite code.

```typescript
const handleCopyCode = (code: string) => {
  navigator.clipboard.writeText(code);  // Browser API — writes to clipboard
  setCopiedCode(code);                   // Shows checkmark icon
  setTimeout(() => setCopiedCode(""), 2000);  // After 2 seconds, revert to copy icon
};
```

### handleDeleteCode (lines 102-110)

**Triggered by**: Clicking the trash icon next to an invite code.

```typescript
const handleDeleteCode = async (id: string) => {
  if (!confirm("Delete this invite code?")) return;  // Browser confirm dialog
  try {
    await deleteInviteCode(id);
    //       ↑ calls lib/firebase.ts:473
    //         which calls deleteDoc(doc(db, "inviteCodes", id))
    //         → HTTPS DELETE to Firestore
    setInviteCodes(codes => codes.filter(c => c.id !== id));
    //         ↑ Removes from local state instantly (optimistic update)
  } catch (err) {
    console.error("Failed to delete code:", err);
    // Note: UI is NOT reverted on error. The item disappears from the list
    // even if Firestore delete failed. This is a minor UX bug.
  }
};
```

### handleUpdateStatus (lines 112-128)

**Triggered by**: Clicking approve/reject buttons on enrollments or scheduling requests.

```typescript
const handleUpdateStatus = async (id: string, type: "enrollment" | "request", newStatus: string) => {
  try {
    if (type === "enrollment") {
      await updateEnrollment(id, { status: newStatus });
      //   ↑ calls lib/firebase.ts:305
      //     which calls updateDoc(doc(db, "enrollments", id), { status, updatedAt })
      //     → HTTPS PATCH to Firestore
      setEnrollments(p => p.map(e => e.id === id ? { ...e, status: newStatus } : e));
    } else {
      await updateSchedulingRequest(id, { status: newStatus });
      setEventRequests(p => p.map(e => e.id === id ? { ...e, status: newStatus } : e));
    }
  } catch (err) {
    console.error(`Failed to update ${type}:`, err);
  }
};
```

**The status badge changes colors** based on value:
- `"pending"` → amber background
- `"approved"` → green background
- `"rejected"` → red background
- `"completed"` → blue background (enrollments only)

### handleMarkRead (lines 130-137)

**Triggered by**: Clicking the envelope icon on unread contact submissions.

```typescript
const handleMarkRead = async (id: string) => {
  try {
    await markContactSubmissionRead(id);
    //   ↑ calls lib/firebase.ts:377
    //     which calls updateDoc(doc(db, "contactSubmissions", id), { read: true })
    setContactSubmissions(p => p.map(s => s.id === id ? { ...s, read: true } : s));
  } catch (err) {
    console.error("Failed to mark read:", err);
  }
};
```

### handleDelete (lines 141-163)

**Triggered by**: Clicking any trash icon in programs, events, journal, requests, enrollments, or submissions sections.

```typescript
const handleDelete = async (id, title, type) => {
  if (deletingId === id) return;  // Prevent double-click
  if (!confirm(`Delete "${title}"?`)) return;

  setDeletingId(id);  // Mark this item as being deleted

  try {
    switch (type) {
      case "program":
        await deleteProgram(id);
        setPrograms(p => p.filter(x => x.id !== id));
        break;
      case "event":
        await deleteEvent(id);
        setEvents(p => p.filter(x => x.id !== id));
        break;
      // ... same pattern for journal, request, enrollment, submission
    }
  } catch (err) {
    console.error(`Failed to delete ${type}:`, err);
  } finally {
    setDeletingId(null);  // Allow deletes again
  }
};
```

The `switch` statement maps a string `type` to the correct Firestore function:
```
"program"     → deleteProgram()     → deleteDoc(doc(db, "programs", id))
"event"       → deleteEvent()       → deleteDoc(doc(db, "events", id))
"journal"     → deleteJournalEntry()-> deleteDoc(doc(db, "journal", id))
"request"     → deleteSchedulingRequest() → deleteDoc(doc(db, "schedulingRequests", id))
"enrollment"  → deleteEnrollment()  → deleteDoc(doc(db, "enrollments", id))
"submission"  → deleteContactSubmission() → deleteDoc(doc(db, "contactSubmissions", id))
```

---

## 6. The Render: JSX to HTML

### Loading state (lines 165-172)

```typescript
if (authLoading || loading) {
  return (
    <div>
      <Navigation />
      <p>Loading dashboard...</p>
    </div>
  );
}
```

If either auth is loading OR data is loading, show a simple loading page with the navigation bar. Once both are done, continue to the main render.

### Visible data slices (lines 174-180)

```typescript
const visiblePrograms = showAllPrograms ? programs : programs.slice(0, 5);
const visibleEvents = showAllEvents ? events : events.slice(0, 5);
// ... same for all sections
```

Each section shows only the first 5 items unless the user clicks "Show All". This prevents the dashboard from becoming a mile-long scroll.

### Quick action buttons (lines 194-211)

```html
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
  <Link href="/dashboard/programs/new">Add Program</Link>
  <Link href="/dashboard/events/new">Add Event</Link>
  <Link href="/dashboard/journal/new">Journal</Link>
  <Link href="/dashboard/notifications">Notifications</Link>
  <button onClick={handleGenerateCode}>Invite Code</button>
</div>
```

These are 5 buttons/links at the top. Each `Link` navigates to a sub-page. The button directly calls `handleGenerateCode`.

### Section grid (lines 213-384)

The data sections are rendered in a 3-column grid (on large screens):

```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Section title="Programs" count={programs.length} ...>
    {programs.map(program => <div>program item</div>)}
  </Section>
  <Section title="Events" ...>
    {events.map(event => <div>event item</div>)}
  </Section>
  <!-- 5 more sections -->
</div>
```

Each `<Section>` component:
1. Shows a title with item count
2. Has an "Add New" link (for programs, events, journal) or nothing (for others)
3. Has a "Show All" / "Show Less" button if count > 5
4. Is scrollable (max 420px height, overflow-y: auto)

### Inside each section item

Each item shows:
- **Title** (bold, truncated)
- **Subtitle** (small, gray — shows ID, date, email, or status)
- **Action buttons** (edit, delete, approve/reject, mark read, copy)

Example for programs:
```html
<div key={p.id}>
  <p>{p.title}</p>
  <p>{p.id}</p>
  <Link href={`/dashboard/programs/edit?id=${p.id}`}>
    <Edit />
  </Link>
  <button onClick={() => handleDelete(p.id, p.title, "program")}>
    <Trash2 />
  </button>
</div>
```

---

## 7. The Section Component

```typescript
// Lines 397-420
function Section({ title, count, href, children, allShown, onToggle, scrollable }) {
  return (
    <div className={`bg-gray-50 rounded-xl p-6 border border-gray-200
      ${scrollable ? "max-h-[420px] flex flex-col" : ""}`}>
      
      <div className="flex items-center justify-between mb-4 shrink-0">
        {/* Title + count */}
        <h2>{title} <span>({count})</span></h2>
        
        <div className="flex gap-3">
          {/* "Add New" link — only shown if href is not "#" */}
          {href !== "#" && (
            <Link href={href}>
              <Plus /> Add New
            </Link>
          )}
          
          {/* "Show All" / "Show Less" — only shown if count > 5 */}
          {count > 5 && (
            <button onClick={onToggle}>
              {allShown ? "Show Less" : "Show All"}
            </button>
          )}
        </div>
      </div>
      
      {/* Children (the actual list items) — scrollable if needed */}
      <div className={`space-y-2 ${scrollable ? "overflow-y-auto flex-1 pr-1" : ""}`}>
        {children}
      </div>
    </div>
  );
}
```

This is a **presentational component** — it only handles layout, no logic. The parent (`DashboardPage`) passes all the data and callbacks via props.

**Props explained**:

| Prop | Type | Purpose |
|---|---|---|
| `title` | `string` | Section heading text (e.g. "Programs") |
| `count` | `number` | Total item count shown in parentheses |
| `href` | `string` | Link for "Add New" button. `"#"` means no link |
| `children` | `ReactNode` | The actual list items (JSX from parent) |
| `allShown` | `boolean` | Whether "Show All" is active |
| `onToggle` | `() => void` | Called when user clicks "Show All" / "Show Less" |
| `scrollable` | `boolean` | Whether the section should have max height + scroll |

---

## 8. Data Flow Diagram: Full Lifecycle

### When a Board Member Deletes a Program

```
                         BROWSER
        ┌─────────────────────────────────────────────┐
        │                                             │
        │  1. User clicks trash icon on a program     │
        │     │                                       │
        │     ▼                                       │
        │  2. handleDelete(id, title, "program")      │
        │     │                                       │
        │     ▼                                       │
        │  3. confirm("Delete this program?")         │
        │     │                                       │
        │     ▼ (if user clicks OK)                   │
        │  4. setDeletingId(id)  (disable button)     │
        │     │                                       │
        │     ▼                                       │
        │  5. deleteProgram(id)                       │
        │     │                                       │
        │     │   lib/firebase.ts:224                 │
        │     │   deleteDoc(doc(db, "programs", id))  │
        │     │                                       │
        │     ▼                                       │
        │  6. HTTPS DELETE ──────────────────────┐    │
        └─────────────────────────────────────────┤    │
                                                  │    │
                                                  ▼    ▼
                                      ┌──────────────────────┐
                                      │   GOOGLE FIREBASE     │
                                      │   (Firestore Server)  │
                                      │                      │
                                      │  7. /documents/      │
                                      │     programs/{id}    │
                                      │     is deleted       │
                                      │                      │
                                      │  8. Returns success   │
                                      └──────────────────────┘
                                                  │
                                                  ▼
        ┌─────────────────────────────────────────┤    │
        │                                         │    │
        │  9. setPrograms(p => p.filter(...))     │    │
        │     (remove from local state —           │    │
        │      instantly reflected in UI)          │    │
        │                                         │    │
        │ 10. Component re-renders                │    │
        │     Program is gone from list            │    │
        │                                         │    │
        │ 11. setDeletingId(null)                 │    │
        │     (re-enable all delete buttons)       │    │
        │                                         │    │
        └─────────────────────────────────────────┘
```

### When a Board Member Approves an Enrollment

```
  1. User clicks green checkmark on enrollment
     │
     ▼
  2. handleUpdateStatus(id, "enrollment", "approved")
     │
     ▼
  3. updateEnrollment(id, { status: "approved" })
     │   lib/firebase.ts:305
     │   updateDoc(doc(db, "enrollments", id), { status: "approved" })
     │
     ├── 4a. HTTPS PATCH to Firestore → status changes in database
     │
     └── 4b. setEnrollments(p => p.map(e => ...))
              Local state updates instantly
     
  5. Component re-renders
     - Status badge changes from amber "pending" to green "approved"
     - Approve/reject buttons disappear
     - "Mark Completed" blue button appears
```

---

## 9. How the Code Is "Alive" (Event-Driven Architecture)

### It's NOT Polling

The dashboard does NOT:
- Refresh the page every few seconds
- Send repeated HTTP requests to check for changes
- Run a timer to re-fetch data

### It IS Event-Driven

The dashboard reacts to three types of events:

**Event Type 1: Component Mount (initial load)**
```
User navigates to /dashboard
  → React renders DashboardPage
  → useEffect runs once
  → All data is fetched from Firestore
  → setLoading(false)
  → UI appears
```

**Event Type 2: User Clicks (interaction)**
```
User clicks "Delete" on an event
  → handleDelete() is called
  → deleteEvent(id) is called (HTTPS DELETE to Firestore)
  → setEvents() is called (remove from local state)
  → React re-renders (event disappears from list)
```

**Event Type 3: React State Changes (re-render)**
```
setPrograms(newData)
  → React sees programs[] changed
  → React re-runs the component function
  → JSX is re-evaluated with new data
  → Only the changed parts of the DOM are updated (React "diffing")
```

### The Difference Between "Static" and "Alive"

**Static HTML page** (no JavaScript):
```
Server sends HTML ──→ Browser shows it ──→ User clicks link ──→ New page loads
```

**This React app** (with JavaScript):
```
Server sends JS ──→ Browser runs React ──→ React renders HTML
                    │                         │
                    │ useEffect runs           │ User clicks button
                    │ ── HTTPS ──→ Firebase    │
                    │ ←── data ──────────────  │ handleDelete() runs
                    │ setPrograms(data)         │ ── HTTPS ──→ Firebase
                    │ React re-renders         │ ←── success ──
                    │                          │ setPrograms(filtered)
                    │                          │ React re-renders
```

### Why It Feels "Alive"

1. **Immediate feedback**: When you click delete, the item disappears immediately (before Firestore even responds). This is called **optimistic update** — update the UI first, confirm with the server second.

2. **No page reloads**: Every interaction (add, edit, delete, approve) updates only the affected parts of the page. The rest of the data stays in memory.

3. **State persistence**: The 7 data arrays (`programs`, `events`, etc.) exist in JavaScript memory. They don't need to be re-fetched unless you refresh the page.

4. **Reactive re-rendering**: When `setPrograms(newArray)` is called, React automatically figures out what changed and updates only those DOM elements.

### What Is NOT "Alive" in This Dashboard

- **Real-time updates**: If another board member adds an event while you're looking at the dashboard, you WON'T see it appear. You'd need to refresh the page.
- **Push notifications**: Firebase has a feature called `onSnapshot` that can push live updates, but this dashboard uses `getDocs` (one-time fetch) instead.

### How to Make It Truly Real-Time

Replace `getDocs` with `onSnapshot` in `lib/firebase.ts`:

```typescript
// Instead of:
const snap = await getDocs(q);

// Use:
onSnapshot(q, (snap) => {
  // Called automatically whenever data changes
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  setPrograms(data);
});
```

This opens a long-polling connection (or WebSocket) that Firebase pushes updates to. Currently not implemented — the dashboard uses **fetch-on-load** instead of **subscribe-to-changes**.

---

## 10. Glossary of Terms

| Term | Definition | Example in this file |
|---|---|---|
| **State** | Data that survives re-renders. When state changes, React re-renders. | `const [programs, setPrograms] = useState([])` |
| **Hook** | A React function that lets you "hook into" React features | `useState`, `useEffect`, `useAuth`, `useRouter` |
| **useEffect** | Runs code after render. Used for side effects. | Lines 44-78 — data loading |
| **Promise** | An object representing a future value | `fetchPrograms()` returns a Promise |
| **Promise.allSettled** | Runs multiple promises in parallel, waits for all to finish | Line 58 — loads all 7 data sources at once |
| **Destructuring** | Unpacking values from arrays/objects into variables | `const [p, e, j, ...] = results` |
| **Render** | The process of converting JSX to HTML | `return (<div>...</div>)` at line 182 |
| **Re-render** | React re-running the component with new state | Triggered by `setPrograms(newData)` |
| **Event handler** | A function that runs in response to a user action | `handleDelete`, `handleGenerateCode` |
| **Optimistic update** | Updating UI before server confirms | `setPrograms(p => p.filter(...))` before `deleteProgram` resolves |
| **TypeScript interface** | A definition of the shape of an object | `FirebaseEvent` defines what fields an event has |
| **JSX** | JavaScript XML — HTML-like syntax in JavaScript | `<div className="...">{children}</div>` |
| **`"use client"`** | Tells Next.js this code runs in the browser | Line 1 |
| **import** | Brings code from another file into this one | Lines 3-19 |
| **export** | Makes code available for other files to import | Line 21 (`export default function DashboardPage`) |
| **Type assertion** | Telling TypeScript "I know the type better than you" | `(r as any).value` at line 67 |
| **Generic** | A type parameter that works with multiple types | `<T,>` in `const timeout = <T,>(...)` |
| **Functional update** | Updating state based on previous state | `setPrograms(p => p.filter(x => x.id !== id))` |

### What Is `export interface`?

```typescript
// lib/firebase.ts:30-43
export interface FirebaseEvent {
  id?: string;
  title: string;
  slug: string;
  poster?: string;
  date?: string;
  // ...
}
```

`export interface` is TypeScript's way of defining the **shape** of an object. It:
- Is **not code** — it disappears when compiled to JavaScript
- Exists only during development for **type checking**
- Tells your editor and compiler: "A FirebaseEvent must have at least `title` and `slug`, and optionally has `date`, `poster`, etc."
- The `?` means the field is optional (can be `undefined`)

**Without interfaces**: You could accidentally do `event.titel` (typo) and TypeScript wouldn't catch it.
**With interfaces**: TypeScript says `"titel" does not exist on type FirebaseEvent` — saves you from bugs.

### What Is `as` (Type Assertion)?

```typescript
const snap = await getDocs(q);
return collectionData<FirebaseEvent>(snap);
//                                     ^^^^^^^^^
// This tells TypeScript: "Trust me, the data in this array matches FirebaseEvent shape"
```

It's a way to override TypeScript's type inference when you know more than the compiler does.

---

## Quick Reference: Where Every Dashboard Function Is Defined

| Function | Defined In | Line | What It Does |
|---|---|---|---|
| `fetchPrograms` | `lib/firebase.ts` | 183 | Reads programs from Firestore |
| `fetchEvents` | `lib/firebase.ts` | 134 | Reads events from Firestore |
| `fetchJournalEntries` | `lib/firebase.ts` | 234 | Reads journal entries from Firestore |
| `fetchEnrollments` | `lib/firebase.ts` | 285 | Reads enrollments from Firestore |
| `fetchSchedulingRequests` | `lib/firebase.ts` | 328 | Reads scheduling requests from Firestore |
| `fetchContactSubmissions` | `lib/firebase.ts` | 371 | Reads contact submissions from Firestore |
| `fetchInviteCodes` | `lib/firebase.ts` | 467 | Reads invite codes from Firestore |
| `addEvent` | `lib/firebase.ts` | 146 | Creates a new event in Firestore |
| `updateEvent` | `lib/firebase.ts` | 160 | Updates an event in Firestore |
| `deleteEvent` | `lib/firebase.ts` | 173 | Deletes an event from Firestore |
| `deleteProgram` | `lib/firebase.ts` | 224 | Deletes a program from Firestore |
| `deleteJournalEntry` | `lib/firebase.ts` | 275 | Deletes a journal entry |
| `updateEnrollment` | `lib/firebase.ts` | 305 | Updates enrollment status |
| `deleteEnrollment` | `lib/firebase.ts` | 318 | Deletes an enrollment |
| `updateSchedulingRequest` | `lib/firebase.ts` | 348 | Updates request status |
| `deleteSchedulingRequest` | `lib/firebase.ts` | 361 | Deletes a scheduling request |
| `markContactSubmissionRead` | `lib/firebase.ts` | 377 | Marks contact as read |
| `deleteContactSubmission` | `lib/firebase.ts` | 389 | Deletes contact submission |
| `generateInviteCode` | `lib/firebase.ts` | 433 | Creates a new invite code |
| `deleteInviteCode` | `lib/firebase.ts` | 473 | Deletes an invite code |
| `useAuth` | `lib/auth-context.tsx` | 143 | Returns current user + role |
| `useRouter` | `next/navigation` | (Next.js) | Navigates to other pages |
| `Link` | `next/link` | (Next.js) | Client-side navigation component |
