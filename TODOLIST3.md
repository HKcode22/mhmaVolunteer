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
The current hero is text-only with no compelling imagery. Every peer site uses a high-quality full-width photo or video background. MHMA should use either a photo of the current Unity Center community gathered, or the architectural rendering of the future Islamic Center during the fundraising campaign.

- [BUILT] Full-width hero image or video (autoplay, muted)
  - Homepage hero shows masjid construction image or falls back to event poster (SVG placeholder as fallback)
  - **Potential issue**: Event poster could leak as hero image if no masjid construction image exists (line 416-419 in page.tsx)
- [BUILT] Clear tagline (current tagline is good — keep 'Strengthening the Bond of Brotherhood')
  - Tagline: "Serving the Muslim Community in Mountain House since 2010"
- [MISSING] Two primary CTAs: [Build Our Masjid] and [Make a Donation] — prominently placed
  - Current CTAs: Explore Events, Explore Programs, MASJID CONSTRUCTION, Newsletter
  - Missing prominent "Build Our Masjid" and "Make a Donation" as hero CTAs
- [MISSING] Remove duplicate prayer time blocks (shows prayer times twice on homepage)
  - Need to verify if duplicate prayer times still exist

### 4.2 Prayer Times Widget

- [BUILT] Single, clean prayer times block — adhan and iqamah columns
- [BUILT] Show today's date in both Gregorian and Hijri calendar
- [MISSING] Integrate with MasjidAl, IslamicFinder, or similar auto-sync API for automatic updates
  - Current implementation uses a static fallback; prayer times fetched from external source
- [PARTIAL] Jumma khateeb name and time displayed clearly
  - Need to verify current implementation

### 4.3 Fundraising Banner / Campaign Strip

- [BUILT] Persistent banner above or below the hero with the masjid fundraising goal
  - Progress bar is below hero on homepage
  - Donate page and masjid-construction page also have progress bars
- [BUILT] Mini progress bar showing % raised toward $8.5M goal
  - Animated progress bar, shows raised amount and percentage
- [BUILT] Link to the full campaign page
  - "MASJID CONSTRUCTION" CTA links to /masjid-construction
- [MISSING] Should remain visible even after scrolling (sticky option or early placement)

### 4.4 Events Section

- [BUILT] Events section shown on homepage
- [MISSING] Replace the current 'Activities and Events' carousel with a full events grid or list
- [PARTIAL] Show upcoming 4–6 events with date, time, title, brief description, and [Learn More] link
  - Currently shows limited events
- [MISSING] [View Full Calendar] button linking to a dedicated events page
  - Events page exists at /events but no explicit "View Full Calendar" button on homepage

### 4.5 Programs Snapshot

- [BUILT] 'Our Programs' section on homepage
- [MISSING] Cards for: Maktab, MHMA Hoops, Iqraa Arabic Academy, Little Explorers, Women's Committee, Quran Quest
  - Current programs section uses fetched programs from Firestore, may not have all specific ones
- [PARTIAL] [View All Programs] button

### 4.6 Community Stats

- [MISSING] Social proof stats bar (numbers speak to donors and new members)
- [MISSING] Example: Years Serving Community | Families | Youth in Programs | Raised for Masjid

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
- [ ] **Set RESEND_API_KEY** — no emails are sent (subscribe, pledge, contact, enroll, rsvp, donation receipt)
- [ ] **Stripe webhook sets `showOnWall: false` always** — donors can never appear on donor wall from Stripe
- [ ] **501(c)(3) EIN missing** from FAQ and donate pages

### Important
- [ ] **Homepage hero may show event poster** as background image (data leak concern)
- [ ] **Duplicate prayer times** may still exist on homepage
- [ ] **Navigation not redesigned** — missing Build Our Masjid, Prayer Times, About dropdown
- [ ] **Footer needs redesign** — missing address, phone, 501(c)(3), organized columns
- [ ] **Donor count semantics unclear** — should count `showOnWall` donors or all donors?
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
