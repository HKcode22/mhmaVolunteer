# Firestore Database Schema Design

## Overview
All data lives in **top-level collections** (no subcollections) for simplicity. Firestore is used in **Native Mode** (not Datastore Mode). Images are stored as **Base64 data URLs** directly in documents to avoid Firebase Storage costs (Blaze plan).

---

## Collections

### 1. `users`
Stores board member / admin profiles linked to Firebase Auth.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Firebase Auth UID |
| `email` | `string` | User email |
| `firstName` | `string?` | First name |
| `lastName` | `string?` | Last name |
| `displayName` | `string?` | Display name |
| `phone` | `string?` | Phone number |
| `role` | `string` | `"member"`, `"board_member"`, or `"administrator"` |
| `dashboardOrder` | `string[]?` | Custom dashboard layout order |
| `createdAt` | `Timestamp` | Account creation time |

**Indexes**: `role`

---

### 2. `events`
Community events with RSVP support.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `title` | `string` | Event title |
| `slug` | `string` | URL-friendly identifier |
| `poster` | `string?` | Poster image URL or Base64 |
| `date` | `string?` | Event date (e.g. `"2026-06-15"`) |
| `time` | `string?` | Event time (e.g. `"14:00"`) |
| `location` | `string?` | Venue address |
| `rsvpLink` | `string?` | External RSVP form URL |
| `description` | `string?` | Markdown content |
| `eventName` | `string?` | Alias for title |
| `createdBy` | `string?` | User UID of creator |
| `createdAt` | `Timestamp` | Creation time |

**Indexes**: `date`, `createdAt`

---

### 3. `programs`
Educational and community programs. Document ID = `slug`.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Program slug |
| `title` | `string` | Program name |
| `slug` | `string` | URL-friendly identifier |
| `description` | `string?` | HTML content |
| `image` | `string?` | Main image URL |
| `imagePoster` | `string?` | Poster image for layout |
| `additionalContent` | `string?` | Extra HTML content |
| `stats` | `{label:string,value:string}[]?` | Stat cards (e.g. `[{label:"Students",value:"150+"}]`) |
| `layout` | `string?` | `"text_first"` or `"poster_first"` |
| `quote` | `string?` | Inspirational quote |
| `quoteAuthor` | `string?` | Quote attribution |
| `useHardcodedVersion` | `boolean?` | Fallback to hardcoded data |
| `createdBy` | `string?` | User UID of creator |
| `createdAt` | `Timestamp` | Creation time |

---

### 4. `journal`
Journal / blog entries.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `title` | `string` | Entry title |
| `slug` | `string` | URL-friendly identifier |
| `content` | `string?` | Body content |
| `dateHeldOn` | `string?` | Event/journal date |
| `datePublished` | `string?` | Publication date |
| `attendees` | `string?` | Attendee count/notes |
| `createdBy` | `string?` | User UID |
| `createdAt` | `Timestamp` | Creation time |

---

### 5. `enrollments`
Program enrollment requests.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `fullName` | `string` | Enrollee name |
| `email` | `string` | Enrollee email |
| `phone` | `string` | Enrollee phone |
| `program` | `string` | Program slug/key |
| `status` | `string` | `"pending"`, `"approved"`, `"rejected"`, `"completed"` |
| `message` | `string?` | Optional message |
| `adminNotes` | `string?` | Internal notes |
| `createdAt` | `Timestamp` | Submission time |

**Indexes**: `program`, `status`

---

### 6. `masjidConstruction`
Masjid construction progress updates — source of truth for fundraising stats.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `image` | `string?` | Photo URL or Base64 |
| `video` | `string?` | Embed URL or Base64 |
| `caption` | `string` | Description text |
| `phase` | `string` | Phase label (e.g. `"Phase 1"`) |
| `raised` | `number` | Amount raised in dollars |
| `goal` | `number` | Fundraising goal in dollars |
| `progressDate` | `string` | Date in `"YYYY-MM-DD"` |
| `createdBy` | `string?` | User UID |
| `createdAt` | `Timestamp` | Creation time |

**Note**: The **latest** document (sorted by `createdAt` desc) provides the current `raised` and `goal` for the campaign thermometer.

---

### 7. `donations`
Donation records — written by Stripe webhook or manually by board members.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `donorId` | `string?` | Firebase Auth UID |
| `donorName` | `string` | Donor display name |
| `donorEmail` | `string` | Donor email |
| `amount` | `number` | Amount in **cents** |
| `designation` | `string` | `"general"`, `"construction"`, `"zakat"`, `"programs"`, `"other"` |
| `method` | `string` | `"stripe"`, `"zelle"`, `"check"`, `"cash"`, `"paypal"` |
| `stripePaymentId` | `string` | Stripe payment intent ID |
| `stripeSessionId` | `string` | Stripe checkout session ID |
| `status` | `string` | `"completed"` |
| `showOnWall` | `boolean` | Whether to display on donor wall |
| `anonymous` | `boolean` | If true, hides name on wall |
| `createdAt` | `Timestamp` | Donation time |
| `notes` | `string?` | Internal notes |
| `recordedBy` | `string?` | Board member UID (manual entries) |

**Indexes**: `designation`, `status`, `createdAt`

---

### 8. `pledges`
Non-binding pledge commitments.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `name` | `string` | Pledger name |
| `email` | `string` | Pledger email |
| `phone` | `string?` | Pledger phone |
| `amount` | `number` | Amount in **dollars** |
| `message` | `string?` | Optional message |
| `status` | `string` | `"pending"`, `"fulfilled"`, `"cancelled"` |
| `userUid` | `string?` | Firebase Auth UID |
| `createdAt` | `Timestamp` | Pledge time |
| `fulfilledAt` | `Timestamp?` | When fulfilled |
| `cancelledAt` | `Timestamp?` | When cancelled |

**Indexes**: `status`

---

### 9. `subscribers`
Newsletter email subscribers.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `email` | `string` | Subscriber email |
| `name` | `string?` | Subscriber name |
| `source` | `string?` | Signup source (`"website"`) |
| `status` | `string` | `"active"` or `"unsubscribed"` |
| `createdAt` | `Timestamp` | Subscribe time |
| `unsubscribedAt` | `Timestamp?` | Unsubscribe time |

**Indexes**: `email`, `status`

---

### 10. `rsvps`
Event RSVPs submitted by community members.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `eventId` | `string?` | Event document ID |
| `eventTitle` | `string` | Event name |
| `fullName` | `string` | RSVP name |
| `email` | `string` | RSVP email |
| `phone` | `string` | RSVP phone |
| `attendees` | `number` | Number of attendees |
| `notes` | `string?` | Additional notes |
| `status` | `string` | `"pending"`, `"confirmed"`, `"cancelled"` |
| `createdAt` | `Timestamp` | RSVP time |

**Indexes**: `eventId`, `status`

---

### 11. `schedulingRequests`
Facility/event scheduling requests.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `organizer` | `{firstName,lastName,email,phone}` | Organizer info |
| `eventTitle` | `string` | Event name |
| `category` | `string` | Event category |
| `description` | `string?` | Event description |
| `start` | `string?` | Start date/time |
| `end` | `string?` | End date/time |
| `hasHostSpeaker` | `string?` | `"yes"` / `"no"` |
| `hasFood` | `string?` | `"yes"` / `"no"` |
| `foodService` | `string[]?` | `["catering", "potluck"]` |
| `location` | `string?` | Location |
| `facility` | `string?` | Facility requested |
| `roundTables` | `number?` | Round tables needed |
| `rectangularTables` | `number?` | Rectangular tables needed |
| `chairs` | `number?` | Chairs needed |
| `equipment` | `string[]?` | `["projector", "microphone"]` |
| `volunteers` | `number?` | Volunteers needed |
| `helpers` | `number?` | Helpers needed |
| `rsvpRequired` | `string?` | `"yes"` / `"no"` |
| `paymentRequired` | `string?` | `"yes"` / `"no"` |
| `comments` | `string?` | Additional comments |
| `status` | `string` | `"pending"`, `"approved"`, `"rejected"` |
| `createdAt` | `Timestamp` | Submission time |

**Indexes**: `status`

---

### 12. `contactSubmissions`
Contact form inquiries.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `name` | `string` | Sender name |
| `email` | `string` | Sender email |
| `phone` | `string?` | Sender phone |
| `subject` | `string` | Subject line |
| `message` | `string` | Message body |
| `read` | `boolean` | Read/unread flag |
| `createdAt` | `Timestamp` | Submission time |

**Indexes**: `read`

---

### 13. `inviteCodes`
Board member invitation codes.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `code` | `string` | 8-char alphanumeric code |
| `used` | `boolean` | Whether consumed |
| `usedBy` | `string?` | User UID who used it |
| `generatedBy` | `string` | Admin UID who created it |
| `createdAt` | `Timestamp` | Creation time |
| `usedAt` | `Timestamp?` | When used |

**Indexes**: `code`

---

### 14. `activityLog`
Audit trail for sensitive actions (restores, etc.).

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `userId` | `string` | Acting user UID |
| `userEmail` | `string` | Acting user email |
| `userName` | `string` | Acting user name |
| `action` | `string` | Action type (e.g. `"restore"`) |
| `details` | `string` | Description of action |
| `targetType` | `string?` | `"program"` or `"event"` |
| `targetId` | `string?` | Document ID affected |
| `createdAt` | `Timestamp` | Action time |

**Indexes**: `createdAt`

---

### 15. `versions`
Version snapshots for reverting program/event changes.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `targetType` | `string` | `"program"` or `"event"` |
| `targetId` | `string` | Original doc ID |
| `data` | `object` | Full document snapshot |
| `createdAt` | `Timestamp` | Snapshot time |
| `restoredAt` | `Timestamp?` | When restored |
| `restoredBy` | `string?` | User UID who restored |

**Indexes**: `targetType`, `targetId`

---

### 16. `analyticsSnapshots`
Daily aggregated analytics for dashboard.

| Field | Type | Description |
|---|---|---|
| `id` (doc ID) | `string` | Auto-generated |
| `date` | `string` | Snapshot date `"YYYY-MM-DD"` |
| `totalUsers` | `number` | Total registered users |
| `newUsers30d` | `number` | New users in last 30 days |
| `totalEnrollments` | `number` | Total enrollments |
| `totalRSVPs` | `number` | Total RSVPs |
| `totalSubmissions` | `number` | Total contact submissions |
| `totalEvents` | `number` | Total events |
| `totalPrograms` | `number` | Total programs |
| `totalJournals` | `number` | Total journal entries |
| `totalInviteCodes` | `number` | Total invite codes |
| `enrollmentByStatus` | `object` | `{pending, approved, rejected, completed}` |
| `rsvpByStatus` | `object` | `{pending, confirmed, cancelled}` |
| `requestsByStatus` | `object` | `{pending, approved, rejected}` |
| `userRoleBreakdown` | `object` | `{administrator, board_member, member, guest}` |
| `engagementScore` | `number` | Computed engagement metric |
| `createdAt` | `Timestamp` | Creation time |

---

## Key Query Patterns

| Purpose | Collection | Query |
|---|---|---|
| Upcoming events | `events` | `.orderBy("date").limit(10)` |
| Programs sorted by title | `programs` | `.orderBy("title")` |
| Donations by designation | `donations` | `.where("designation","==","construction")` |
| Donor wall entries | `donations` | `.where("showOnWall","==",true).orderBy("createdAt","desc").limit(50)` |
| Enrollments for a program | `enrollments` | `.where("program","==",programSlug).orderBy("createdAt","desc")` |
| Latest construction stats | `masjidConstruction` | `.orderBy("createdAt","desc").limit(1)` |
| Pending scheduling requests | `schedulingRequests` | `.where("status","==","pending")` |
| Active subscriber check | `subscribers` | `.where("email","==",email).where("status","==","active")` |

---

## Design Decisions

1. **Top-level collections only** — No subcollections. This avoids deep nesting and keeps queries simple. All relationships use document ID references (e.g., `enrollments.program` references `programs` by slug).

2. **No Firebase Storage** — Images stored as Base64 data URLs in documents to avoid the Blaze plan cost. Trade-off: larger document sizes, but manageable for a small community site.

3. **Latest-document pattern for campaign stats** — Each `masjidConstruction` update includes `raised` and `goal`. The frontend picks the most recent document (by `createdAt`) as the "current" fundraising state.

4. **Donations as source of truth** — `donations` collection is the single source for all financial giving. Stripe webhooks write automatically; board members can manually add offline donations.

5. **Analytics snapshots are write-once** — Generated daily, never overwritten. Historical snapshots allow trend analysis over time.

6. **Minimal PII in Firestore** — Where possible, user references use Firebase Auth UIDs rather than duplicating personal data.
