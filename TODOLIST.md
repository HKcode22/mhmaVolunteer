# MHMA Website — TODOLIST

## Priority Legend
- 🔴 Critical — must do for fundraising campaign
- 🟡 Important — should do soon
- 🟢 Nice-to-Have — when time permits

---

## 🔴 Critical Features

### 3. Pledge System
**Board member said**: "yes we do need pledge system form database tracking"
- [x] Pledge form (name, email, phone, amount, message)
- [x] Firestore collection `pledges` with status (`pending` / `fulfilled` / `cancelled`)
- [ ] Pledge-to-payment pipeline — convert pledge to actual donation
- [x] Dashboard to view/manage pledges
- [ ] Email notification when a pledge is made
- [x] Replace "Pledge Today" button with real pledge flow

### 4. Newsletter / Email Capture
**Board member said**: "yes we do need newsletter email capture signup form anywhere"
- [x] Signup form on homepage hero section
- [x] Signup form in footer
- [x] Firestore `subscribers` collection
- [ ] Integration with email provider (Resend is already wired for RSVP)
- [ ] Welcome email on subscribe

### 5. Unified Fundraising Data
**Board member said**: "unified fundraising data"
- [x] `masjidConstruction` Firestore collection should drive BOTH homepage progress bar AND `/masjid-construction` page
- [x] Remove hardcoded stats from `/masjid-construction` and `/donate` pages
- [x] Create a shared data fetching hook/function for campaign stats

### 6. Dedicated Masjid Construction Progress Page
**Board member said**: "we do not have stripe button contact info or social links what you are talking about is the donation page. what the board member needs is a legit masjid construction page. the golden button on the homepage should lead to the masjid progress page. when board members update data in dashboard, that info should be relayed to this new page."
- [x] Create `/masjid-construction` as a real campaign page with:
  - [x] Progress bar (driven by Firestore, same as homepage)
  - [x] Construction photo gallery / timeline
  - [x] Video walkthroughs
  - [x] Phase breakdown (foundation, framing, etc.)
  - [x] FAQ section
  - [x] Stats cards (not hardcoded — from Firestore)
  - [x] Pledge CTA
  - [x] Link to donate page for actual payment
- [x] Dashboard construction editor should push updates to this page
- [x] Add "Donate" button in addition to "Pledge" button
- [x] Clarify wording: construction page = progress/updates page, donate page = payment page

### 7. Multiple Donation Methods
**Board member said**: "multiple donation methods"
- [x] Zelle info/QR code
- [x] Check mailing address
- [x] Cash drop-off info
- [x] PayPal option (if applicable)
- [x] Keep existing Stripe buy button as primary online option

### 8. Donation Designations
**Board member said**: "donation designations"
- [x] Allow donor to choose where their money goes:
  - General Fund
  - Construction Fund
  - Zakat
  - Programs
  - Other (custom)
- [x] Different Stripe products/links per designation

### 9. Payment Records in Firestore
**Board member said**: "payment records in firestore is a good idea but we need to first think about doing this correctly since its nosql to make sure its not a messy database"
- [x] Design Firestore schema for donations (consider: donor info, amount, designation, date, pledge reference)
- [x] Stripe webhook endpoint to capture successful payments
- [x] Store donation records in `donations` collection
- [x] Dashboard to view donation history (with manual entry for offline donations)
- [x] Donor can view their own donation history in profile

### 10. SMS Phone Verification (Identity Platform Upgrade)
**Removed from current scope — revisit later. User wants phone mandatory on register (done) but SMS verification for email/phone changes requires Identity Platform upgrade.**
- [x] Phone field mandatory on registration — DONE
- [ ] Firebase Phone Auth requires upgrading to Identity Platform (still free Spark plan)
- [ ] Upgrade impact: 3,000 DAU limit (currently unlimited). With ~641 members, this is not a concern.
- [ ] After upgrade: Phone Auth OTP sent to current Firestore phone for email changes / phone changes
- [ ] Without upgrade: falls back gracefully to password-only verification
- [ ] Action: Click "Upgrade" in Firebase Console Authentication page → enable Phone provider → SMS works immediately

---

## 🟡 Important Features

### 11. Calendar View for Events
**Board member agreed this is needed**
- [x] Monthly calendar grid view
- [x] Events displayed on correct dates
- [x] Click event to see details
- [x] Week/day toggle options
- [x] Fix ordering — sort by event date, not createdAt

### 12. Construction Page Ignoring Firestore
**Board member said**: "yes we need to fix the construction page that ignores firestore"
- [x] Covered under #5 and #6 above — connect to Firestore data

### 13. Recurring Donation Toggle
**Board member said**: "yes i agree with you on no recurring donation toggle"
- [x] Monthly vs one-time toggle on donate page
- [ ] Stripe recurring price/subscription setup (needs separate buy buttons in Stripe Dashboard)
- [x] Clear UI for recurring vs single gift

---

## 🟢 Nice-to-Have

### 14. Construction Photo Gallery / Timeline
**Board member said**: "those are good too"
- [x] Photo gallery component with lightbox
- [x] Timeline view of construction milestones
- [x] Admin can upload photos from dashboard

### 15. Donor Wall / Social Proof
**Board member said**: "those are good too"
- [x] Display donor names (with permission)
- [x] Anonymous option for donors
- [x] Fundraising thermometer / goal visualization

### 16. iCal / Google Calendar Export
**Board member said**: "those are good too"
- [x] Add to Calendar button on events
- [x] iCal download / Google Calendar link

### 17. Program Enrollment Tied to Specific Programs
**Board member said**: "those are good too"
- [x] Enroll button per program (pre-fills program selection)
- [x] Enrollment data includes which program
- [x] Dashboard shows enrollments by program

### 18. Hero Video Background
**Board member said**: "those are good too"
- [ ] Optional video background for hero
- [ ] Fallback to image if video not available

### 19. Testimonials / Impact Stories
**Board member said**: "those are good too"
- [ ] Testimonial carousel/section
- [ ] Board members can add via dashboard

---

## Database Organization (Schema Design)

### Implemented Collections (16 total)
- `users` — board member/admin profiles linked to Firebase Auth
- `events` — community events with date/time/location/RSVP
- `programs` — educational and community programs (doc ID = slug)
- `journal` — blog/journal entries
- `enrollments` — program enrollment requests with program reference
- `masjidConstruction` — construction progress updates (source of truth for fundraising stats)
- `donations` — donation records (written by Stripe webhook + manual board entry)
- `pledges` — non-binding pledge commitments
- `subscribers` — newsletter email subscribers
- `rsvps` — event RSVPs
- `schedulingRequests` — facility/event scheduling
- `contactSubmissions` — contact form inquiries
- `inviteCodes` — board member invitation codes
- `activityLog` — audit trail for sensitive actions
- `versions` — version snapshots for reverting program/event changes
- `analyticsSnapshots` — daily aggregated analytics (see decision below)

Full schema documented in `docs/DATABASE_SCHEMA.md`

### Notes
- Top-level collections only (no subcollections) — keeps queries simple
- Images stored as Base64 in documents (avoids Firebase Storage Blaze plan cost)
- Donor PII minimized — Firebase Auth UID used where possible

---

## Analytics Architecture Decision

### Current Approach (Finalized)
**Client-side computation on dashboard load** — not saved to Firestore.

**Why:**
- ~4,500 document reads per dashboard load × ~30 views/month = ~1.6M reads/year ≈ $0.96/year — trivial cost
- Computation takes <50ms on any modern device for this data volume
- Always shows live data (no stale snapshots)
- Simpler architecture — no cron jobs or serverless functions needed

**What happens:**
1. Dashboard loads → fetches 11 collections (enrollments, requests, submissions, events, programs, journals, inviteCodes, rsvps, users, donations, pledges)
2. Client browser computes: summary cards, status breakdowns, monthly activity, per-program charts, per-designation donations
3. All displayed in real-time — no cached/stale data

**Future scaling:** If the site grows to 50,000+ records, move to a Vercel cron job that pre-computes snapshots daily and stores them in `analyticsSnapshots`. The dashboard would then load the snapshot first (instant), then refresh with live data.

**Big O:**
- Time: O(5n) ≈ 5 × 4,500 = 22,500 iterations — negligible
- Space: O(n) ≈ 4-8 MB in browser memory — negligible
- Network: ~5 MB per dashboard load — acceptable for internal dashboard

Donation and pledge stats are now included in the dashboard analytics (Total Donations, Total Donated by Designation/Method, Pledge tracking).

---

## Stripe Setup Remaining
To make Stripe webhook work:
1. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel dashboard
2. In Stripe Dashboard → Webhooks, add endpoint `https://mhma.us/api/stripe-webhook`
3. For correct fund names in Stripe checkout: create separate buy buttons per designation in Stripe Dashboard, update `monthlyStripeId` for recurring
4. For subscription/recurring: create subscription products in Stripe Dashboard and update `monthlyStripeId` values
