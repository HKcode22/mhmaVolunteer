# MHMA AI Assistant — RAG Architecture Plan

**Status:** SmolLM2-135M is running locally via WebGPU/Transformers.js (confirmed working).
**Problem:** The model is blind — it has no knowledge of the MHMA website, routes, or data.
**Solution:** Browser-side RAG (Retrieval-Augmented Generation) with Firestore as the knowledge store.

---

## 1. Knowledge Base Ingestion (Static Site Context)

### 1.1 Route Map & Dashboard Structure
Serialize the app's route tree into structured text:

```json
{
  "route": "/dashboard/events",
  "title": "Events Management",
  "actions": ["create_event", "edit_event", "delete_event", "approve_rsvp"],
  "description": "Create and manage events, view RSVPs",
  "roles": ["board_member", "administrator", "member"]
}
```

This lives in a file `app/lib/assistant-knowledge.ts` (already exists — expand it).



### 1.2 Form Schemas & Workflows
For each dashboard page, document the form fields and workflows:

```
Workflow: Create Event
  Page: /dashboard/events
  Steps:
    1. Click "Add Event" button
    2. Fill form: title, date, time, location, description, image URL
    3. Click "Create Event"
    4. Event appears on public /events page
  Permissions: board_member only
```

### 1.3 UI Component Tree
Document key UI elements for navigation assistance:

- Navigation bar (top): links to Dashboard, Events, Programs, Contact, Profile
- Sidebar (dashboard): nested links to sub-pages
- Bottom suggestion chips: quick actions

---

## 2. Firestore Data Pipeline (Dynamic Context)

### 2.1 Capture Real-Time Data
Use Firestore `onSnapshot` listeners or Cloud Functions to ingest:

| Collection | Fields to capture | Refresh |
|------------|------------------|---------|
| `events` | id, title, date, time, location, status, rsvpCount | On change |
| `programs` | id, title, schedule, capacity, enrolled, instructor | On change |
| `donations` | id, amount, donor, designation, date, status | On change |
| `pledges` | id, amount, pledger, status, date | On change |
| `enrollments` | id, programId, memberId, status, date | On change |
| `rsvps` | id, eventId, memberId, status, date | On change |
| `users` | id, displayName, role, email | On change |

### 2.2 Document Template
Convert raw Firestore docs to human-readable text:

```
Event: "Eid Festival"
  Date: June 15, 2026
  Time: 10:00 AM - 2:00 PM
  Location: Mountain House Community Center
  Status: published
  RSVPs: 34 confirmed, 5 pending
  Created: June 1, 2026
```

---

## 3. RAG Knowledge Store (Firestore Collection)

**Purpose:** This is NOT for saving chat history. It stores the knowledge documents that the RAG retriever searches against. Currently this data lives in `assistant-knowledge.ts` (a TypeScript file). Moving it to Firestore means board members can add/update knowledge without a code deploy.

### 3.1 Collection Schema: `ai_knowledge`

```json
{
  "id": "auto-generated",
  "type": "static|dynamic",        // static = code context, dynamic = live data
  "category": "event|program|donation|pledge|route|workflow|faq",
  "content": "Human-readable text (see §2.2)",
  "tokens": ["event", "create", "schedule", "date"],  // keyword index
  "embedding": [0.012, ...],       // future: vector embeddings
  "source": "events/Eid-Festival", // Firestore document path
  "updatedAt": Timestamp,
  "roleAccess": ["board_member", "administrator"]
}
```

**Why Firestore instead of a TS file?**
- Dynamic updates: board members can add knowledge via dashboard
- Live data sync: real-time RSVP counts, enrollment numbers
- No code deploy needed for content changes
- Can store per-event/per-program stats that change daily

---

## 4. Retrieval Pipeline (Browser-Side)

### 4.1 Hybrid Search Strategy

```
User Query
    │
    ├─→ Step 1: Keyword Pre-filter
    │     Tokenize query, match against `tokens` field
    │     Filter: role-based access, category
    │
    ├─→ Step 2: Score & Rank
    │     Score = keywordMatch(query, doc) * 0.6 + recency(doc) * 0.2 + roleBonus * 0.2
    │     Return top 3-5 results
    │
    └─→ Step 3: Context Assembly
          Inject matched docs into system prompt as:
          
          [CONTEXT]
          Event: "Eid Festival"
            Date: June 15, 2026
            Status: published
          [END CONTEXT]
          
          Question: How many RSVPs do we have for Eid Festival?
```

### 4.2 Browser Firestore Caching
Fetch `ai_knowledge` collection into a local cache (IndexedDB or Map) on page load.
Re-fetch on `updatedAt` change via lightweight polling or Firestore snapshot listener.

### 4.3 Worker Message Protocol

```typescript
// Main thread → Worker
{ type: 'query', data: { query: string, context: string, id: string } }

// Worker → Main thread  
{ type: 'result', id: string, answer: string | null }
```

---

## 5. System Prompt Engineering

```markdown
You are the MHMA (Mountain House Muslim Association) website assistant.
You run locally in the user's browser via WebGPU.

## Rules
- Answer ONLY using the provided [CONTEXT]. If the context has no answer, say "I don't have that information."
- NEVER answer anything unrelated to the MHMA website (math, general knowledge, personal advice).
- Keep replies under 2 sentences.
- Do not make up facts. If unsure, say so.

## Role
- Board members can create/manage events, programs, donations, pledges, members.
- Regular members can view events, enroll in programs, submit contact forms.
- Administrators have full access.

## Context
{injected_context_here}

## Question
{user_query}
```

---

## 6. Implementation Roadmap

| Phase | Task | Effort |
|-------|------|--------|
| **1** | Expand `assistant-knowledge.ts` with all routes, workflows, form schemas | 1 day |
| **2** | Add Firestore snapshot listener to sync live data into `ai_knowledge` | 2 days |
| **3** | Implement keyword pre-filter on browser side (§4.1 Step 1) | 1 day |
| **4** | Wire scoring + context injection into `askQuestion` | 1 day |
| **5** | Implement strict system prompt + domain guard | 0.5 day |
| **6** | Add role-based access filtering | 0.5 day |
| **7** | (Future) Client-side embeddings via `feature-extraction` pipeline | 2 days |
| **8** | (Future) Hybrid search (keyword + vector) | 2 days |

---

## 7. Industry Best Practices Incorporated

- **Hybrid retrieval** — keyword (BM25-style) + future vector embeddings
- **Role-based access** — documents tagged with permitted roles
- **Structured context injection** — clear `[CONTEXT]` delimiters for the model
- **Hallucination guard** — strict system prompt instructing "answer only from context"
- **Client-side caching** — avoid re-fetching on every query
- **Progressive enhancement** — start with keyword search, add vectors later
- **Web Worker isolation** — model runs off main thread, no UI blocking
