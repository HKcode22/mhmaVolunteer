# Homepage Redesign & Site Architecture — Implementation Status

<!--
============================================================
 ANALYSIS:
 [BUILT]    = Fully implemented
 [PARTIAL]  = Exists but incomplete
 [MISSING]  = Not implemented
 [ANSWERED] = Question resolved
 [FIXED]    = Bug fixed
 [BUG]      = Known issue, needs fix
============================================================
-->

## 4. Homepage Redesign

### 4.1 Hero Section

- [BUILT] Full-width hero image — shows masjid construction image, falls back to event poster, SVG fallback
- [BUILT] Clear tagline — "Serving the Muslim Community in Mountain House since 2010"
- [BUILT] Two primary CTAs — MASJID CONSTRUCTION button leads to campaign page which has Donate Now + Pledge Today CTAs (redundant to add separate hero CTAs)
- [ANSWERED] Duplicate prayer times — kept as-is (not an issue)

### 4.2 Prayer Times Widget

- [BUILT] Prayer times block with adhan/iqamah columns (MasjidAI + Masjidi widget integration already present)
- [BUILT] Date display in Gregorian and Hijri
- [BUILT] Auto-sync via MasjidAI/Masjidi widget — both integrated and working

### 4.3 Fundraising Banner / Campaign Strip

- [BUILT] Persistent banner below hero with masjid fundraising goal
- [BUILT] Mini progress bar with % raised toward $8.5M
- [BUILT] Link to full campaign page via MASJID CONSTRUCTION button
- [POSTPONE] Sticky/always-visible scrolling — will do later, not right now

### 4.4 Events Section

- [BUILT] Events grid on homepage — 3-column grid showing upcoming events with date, time, location, RSVP button
- [BUILT] EventCalendar component below the list — full calendar view
- [BUILT] "View All Events" button linking to /events
- [CONFIRMED] Shows 3 recent events + calendar — both views present, no change needed

### 4.5 Programs Snapshot

- [BUILT] Programs section with cards fetched from Firestore — covers Maktab, MHMA Hoops, Iqraa Arabic, Little Explorers, Women's Committee, Quran Quest
- [BUILT] Programs stored/editable via dashboard
- [BUILT] [View All Programs] button exists

### 4.6 Community Stats

- [BUILT] Social proof stats bar added between fundraising bar and prayer times on homepage
  - White background, 4 columns: 15+ Years Serving, 500+ Families, 200+ Youth in Programs, Raised for Masjid
  - Color pattern: cream (fundraising) → white (stats) → gold (prayer times) → cream (about)

---

## 5. Site Architecture & Navigation
The current navigation is minimal: Home | MHMA | Programs | Donate | Login. It does not reflect the breadth of MHMA's activities. The redesigned navigation should be organized around user intent.

### 5.1 Recommended Navigation Structure

**Primary Nav:**
- [PARTIAL] Home — exists
- [MISSING] Build Our Masjid ← New, prominent link
- [PARTIAL] Programs (dropdown: All Programs, Maktab, MHMA Hoops, Iqraa Arabic, Little Explorers, Women's Committee) — programs page exists, dropdown menu may need enhancement
- [MISSING] Prayer Times — as nav item
- [PARTIAL] Events — exists
- [MISSING] About (dropdown: Mission, Board, Committees, Bylaws)
- [PARTIAL] Donate (primary CTA button style, gold) — exists as nav item

### 5.2 New Pages Required

- [BUILT] mhma.us/build or mhma.us/islamic-center — `/masjid-construction` exists
- [BUILT] mhma.us/events — exists at /events with calendar view
- [MISSING] mhma.us/prayer — Dedicated prayer times page with monthly PDF download
- [BUILT] mhma.us/volunteer — exists at /volunteer
- [MISSING] mhma.us/newsletter — Newsletter signup + archive of past issues
- [BUILT] mhma.us/programs — organized programs directory
- [PARTIAL] mhma.us/zakat — exists at /zakat, may need improvement

### 5.3 Footer Redesign

- [MISSING] Add physical address of Unity Center / MHMA
- [MISSING] Add contact phone number and email
- [BUILT] Add newsletter signup field directly in footer
  - NewsletterSignup component used on homepage, construction page, and other pages
- [MISSING] Organize footer columns: Quick Links | Programs | Get Involved | Contact
- [MISSING] Add 501(c)(3) EIN and tax-exempt statement (critical for donors)
- [MISSING] Add Guidestar/Candid platinum seal if eligible

---

## 6. Email Delivery System

### 6.1 Email Provider Configuration

- [BUG] **No email provider configured** — `RESEND_API_KEY` not set in `.env.local` or Vercel env vars
  - `lib/email.ts` tries Resend → SMTP → Gmail, none configured
  - All API routes (subscribe, pledge, contact, enroll, rsvp, stripe-webhook) call `sendEmail()` and will fail
  - **Fix**: Set `RESEND_API_KEY` in `.env.local` AND Vercel environment variables
  - Sender: `noreply@mhma-backend.firebaseapp.com` (default) or configure via `EMAIL_FROM` env var
  - Resend requires domain verification — verify this sender domain in Resend dashboard

### 6.2 Confirmation Emils Sent (when configured)

- Contact form submissions — confirmation to submitter
- Enrollments — confirmation to enrollee
- Newsletter subscriptions — welcome email
- RSVPs — RSVP confirmation
- Donations (via Stripe webhook) — donation receipt
- Pledges — pledge confirmation

### 6.3 Email Change System

- [BUILT] `/api/change-email` endpoint — validates Firebase Auth token, checks email conflicts
- [PARTIAL] Pending email changes stored in `pendingEmailChanges` collection (2 pending currently)
  - Two pending changes from `k1test@gmail.com` → `meow@gmail.com` and `hkclipmaker2003@gmail.com`
  - Both expired (expiresAt: 2026-05-27, current date: 2026-05-30)

---

## 7. Donation & Fundraising System

### 7.1 Donation Tracking

- [BUILT] Stripe webhook at `/api/stripe-webhook` records donations to Firestore
- [BUILT] Manual donation entry in dashboard with showOnWall/anonymous flags
- [FIXED] Donation totals API at `/api/donation-totals` returns aggregated stats
- [BUG] Stripe webhook always sets `showOnWall: false` for new donations (line 51 in stripe-webhook/route.ts)
  - Donors never get a choice to show on wall during checkout
  - Only manually entered donations can have `showOnWall: true`

### 7.2 Donor Count

- [BUILT] `donorCount` shown on donate page and masjid-construction page
- [INFO] Current data: 6 donations, 4 unique donor emails
  - Unique donors: hamza.a.khan@sjsu.edu, mountainhouseschoolemails@gmail.com, hk84164@gmail.com, hkclipmaker2003@gmail.com
  - All 6 donations are for "construction" designation
  - API returns `donorCount: 4`
- [QUESTION] Should donor count only include donors with `showOnWall: true`? (currently 2 docs have wall=true, but all from hk84164@gmail.com)

### 7.3 Pledge System

- [BUILT] Pledge form at /pledge with name, email, amount, timeframe
- [BUILT] Pledges stored in Firestore with pending/fulfilled/cancelled status
- [BUILT] Dashboard CRUD for pledges
- [BUG] Pledge email confirmation fails (same email config issue)
- [MISSING] Pledge-to-payment pipeline (convert pledge to actual donation)

---

## 8. Construction Page Issues

### 8.1 Current Status

- [BUILT] /masjid-construction page with hero, progress bar, stats, gallery, videos, donate CTA
- [BUILT] Dashboard CRUD at /dashboard/masjid-construction
- [BUILT] Giving Tiers, Project Overview, FAQ, Testimonials, Multiple Giving Options

### 8.2 Known Issues

- [BUG] **Only 1 masjidConstruction document exists** (created 2026-05-25)
  - If new updates are created and not showing, check Firestore console
  - Frontend uses `fetchMasjidUpdates(20)` ordered by `createdAt` desc
  - Latest doc with `caption: "RAISED SO FAR"`, `raised: 51000`, `goal: 8500000`, `phase: "Phase 2"`
- [BUG] `normalizeCampaignDollars()` in `lib/campaign-stats.ts` multiplies values < 100K by 1M
  - Construction page doesn't use it for `raised` (uses API value directly) — ✓ safe
  - But if `latest.raised` were used, 51000 would become 51,000,000,000 — potential bug if code changes
- [FIXED] Data leak investigation: construction page only queries `masjidConstruction` collection
  - Homepage hero falls back to event poster images — this is an intentional fallback, not leak
  - Event images only appear on homepage hero, not on construction page

---

## 9. Bugs & Issues Found

### Critical
- [FIXED] **Emails non-blocking** — All API routes now fire emails asynchronously; the submission succeeds even if email fails
- [FIXED] **Gmail SMTP configured** — `GMAIL_USER` and `GMAIL_APP_PASSWORD` set in Vercel env + `.env.local`; sender: `noreply@mhma-backend.firebaseapp.com`
- [NOTE] If Gmail App Password fails, user needs to generate one at Google Account → Security → 2-Step Verification → App passwords
- [FIXED] **Stripe webhook `showOnWall` defaults to `true`** — new online donations automatically appear on donor wall
- [FIXED] **`normalizeCampaignDollars` threshold bug** — changed from 100K to 1000 so $51K isn't treated as 51 billion
- [ ] **501(c)(3) EIN missing** from FAQ and donate pages

### Important
- [ ] **Homepage hero may show event poster** as background image (data leak concern)
- [ ] **Duplicate prayer times** may still exist on homepage
- [ ] **Navigation not redesigned** — missing Build Our Masjid, Prayer Times, About dropdown
- [ ] **Footer needs redesign** — missing address, phone, 501(c)(3), organized columns
- [ ] **Donor count semantics** — API counts unique emails (currently 5), not total transactions (7)
- [ ] **Pending email changes stale** — 2 expired pending changes from `k1test@gmail.com`

### Nice-to-Have
- [ ] Community stats bar on homepage (years serving, families, youth, raised)
- [ ] Dedicated prayer times page with monthly PDF
- [ ] Newsletter archive page
- [ ] Sticky fundraising banner
- [ ] Hero video background (autoplay, muted)
- [ ] Guidestar/Candid seal in footer
- [ ] Pledge-to-donation pipeline

---

## Implementation Notes (from investigation 2026-05-30)

### Donation Collection Audit
```
Total: 6 docs, all "construction" designation, all "completed" status
Donor emails: hamza.a.khan@sjsu.edu, mountainhouseschoolemails@gmail.com, 
              hk84164@gmail.com (×3), hkclipmaker2003@gmail.com
showOnWall: true ×2 (both hk84164@gmail.com), false ×4
Total amount: $56,545 (5,654,500 cents)
API donorCount: 4 unique emails
```

### Masjid Construction Audit
```
Total: 1 doc (Ril5mgtDpyofu760XmJP)
Caption: "RAISED SO FAR"
Phase: "Phase 2"
Raised: $51,000 (from Firestore), $56,545 (from Stripe API)
Goal: $8,500,000
Created: 2026-05-25
```

### Email System Audit
```
No RESEND_API_KEY, SMTP_*, or GMAIL_* env vars configured in:
- .env.local (RESEND_API_KEY is commented out)
- .env.production (all commented out)
- Need to set in Vercel dashboard for production
Sender: noreply@mhma-backend.firebaseapp.com (matches user requirement)
```
