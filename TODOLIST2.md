# Masjid Construction Campaign Page — Implementation Status & Notes

<!--
============================================================
 ANALYSIS:
 [BUILT]    = Fully implemented
 [PARTIAL]  = Exists but incomplete
 [MISSING]  = Not implemented
 [ANSWERED] = Question resolved
============================================================
-->

## 3. Masjid Construction Campaign Page

[BUILT] Standalone page at /masjid-construction with hero, progress bar, stats, gallery, videos, donate CTA.
Dashboard CRUD at /dashboard/masjid-construction for managing updates.

### 3.1 Page URL

[ANSWERED] Keep as-is (/masjid-construction). No change needed.

Recommended: mhma.us/build — or mhma.us/islamic-center (update/expand existing page)

### 3.2 Required Components

#### Hero Section

- [✓] Full-width architectural rendering — the `image` field in masjidConstruction doc IS the architectural rendering (3D blueprint image from board member)
- [✓] Bold headline "Islamic Center Campaign"
- [✓] Campaign tagline "Whoever builds a masjid..." hadith added
- [✓] Two CTAs: [Donate Now] and [Pledge to Give] — keep as-is below progress bar

<!--
[ANSWERED] No need for a separate hero image upload field — the existing `image` field
in the masjidConstruction doc already holds the architectural rendering/3D blueprint image
that the board member uploaded.
-->

#### Live Fundraising Progress Bar

- [✓] Amount Raised / Total Goal ($8.5M)
- [✓] Animated progress bar (updated via Stripe API)
- [✓] Donor count / families contributed — ADDED. Shows "X donors contributed" below the progress bar. Counts unique emails from completed construction donations via /api/donation-totals
- [✓] Reference: NuecesMosque.com

<!--
[ANSWERED] Donor count added. Only shows the NUMBER of unique donors (by email),
not WHO donated. No privacy concern. Firestore rules should allow reading donations
collection for the API route (admin SDK handles this).
-->

#### Project Overview Section

- [ ] Brief narrative: Why we need a masjid, community growth in Mountain House
- [ ] Key stats: estimated sq footage, projected capacity, community impact numbers
- [ ] Embed or link to project brochure PDF
- [ ] Embed a vision/campaign video if available (YouTube embed)

<!--
[ANSWERED] These need to be BUILT:
  1. Make the narrative, stats, brochure URL, and video URL editable via the dashboard
     (add fields to the masjidConstruction doc in Firestore)
  2. Add these fields to the dashboard/construction form so board members can manage them
  3. Add a checkbox for auto-calculated stats (sq ft, capacity, impact) — to be determined
     what auto-calculation formula to use
  4. The form currently has: image, video, caption, phase, raised, goal, progressDate
     Need to ADD: narrative, sqFootage, capacity, communityImpact, brochureUrl, visionVideoUrl

UPDATE: The dashboard/construction form at /dashboard/masjid-construction is where
board members manage updates. The "Add Update" button creates entries in the
masjidConstruction collection. The MOST RECENT update (by createdAt desc) is what
shows on the public page at /masjid-construction.

NOTE: The user said "the most recent update they make is what should show up" — this
IS already how it works. The public page uses `updates[0]` which is the most recent
by createdAt desc (from the Firestore query). The goal is taken from this latest update.
-->

#### Giving Tiers / Campaign Milestones

- [ ] Display giving tiers with named levels (e.g., Platinum: $50K+, Gold: $25K+)
- [ ] Show construction milestones: Phase 1 Foundation = $X, Phase 2 Structure = $Y
- [ ] VRIC uses an 'Ansar Club' monthly sustainer model — consider MHMA equivalent

<!--
[MISSING] Still needs to be built. Options:
  - Store tiers/milestones as array in masjidConstruction doc
  - Or create new Firestore collection
-->

#### Multiple Giving Options

- [x] Online card via Stripe
- [✓] Zelle (board@mhma.info) — displayed on donate page
- [✓] Check payable to MHMA — displayed on donate page
- [ ] Employer matching / Benevity information
- [ ] Crypto donation option (optional Phase 2)
- [ ] Waqf / endowment giving note if applicable

#### Pledge System

- [✓] [Pledge to Give] button links to /pledge page
- [ ] Pledge form fields: Name, Email, Amount, Timeframe (30/60/90 days)
- [✓] Pledges tracked in dashboard with pending/fulfilled/cancelled status
- [ ] Message: "Not ready to donate? Pledge now and we'll remind you."

<!--
[ANSWERED] Keep the existing /pledge form but add a Timeframe dropdown.
-->

#### FAQ Section

- [ ] Accordion/expandable format (NuecesMosque.com style)
- [ ] Questions: project vision, building features, tax-deductibility, Zakat eligibility,
      construction timeline, fund management
- [ ] MHMA 501(c)(3) EIN number

<!--
[MISSING] Needs full build from scratch: Firestore collection + dashboard management + component.
-->

#### Testimonials / Community Voices

- [✓] Dashboard CRUD exists (add/delete) at /dashboard/testimonials
- [✓] displayOn[] field can target specific pages
- [ ] Testimonials NOT YET rendered on any public page
- [ ] "masjid-construction" needs to be added to displayOn options
- [ ] Photo upload needed

<!--
[ANSWERED] Only board members can add testimonials (dashboard is board-only). The
dashboard CRUD already works. Need to:
  1. Add "masjid-construction" to the displayOn options in the form
  2. Create a public display component that renders testimonials on the target pages
  3. Add photo upload capability
-->

#### Email / Update Signup

- [✓] NewsletterSignup component exists (imported but not rendered on construction page)
- [✓] Subscribe API at /api/subscribe
- [✓] Dashboard subscriber management (merged with news page)

<!--
[ANSWERED] Simply render <NewsletterSignup /> on the /masjid-construction page. Should be
a quick fix. Keep using Firestore-based subscriber system.
-->

---

## IMPLEMENTATION NOTES (from board discussion)

### Dashboard Quick Actions Order (Content → Financial → Administration)
- [FIXED] defaultQuickOrder now: events, programs, news, testimonials, scheduling, construction,
  donations, pledges, activity, analytics, contact, members
- [FIXED] Saved preferences no longer override the default order sequence — defaults always
  come first, saved items only append NEW items at the end
- User may need to click "Reset to Default" in Customize panel if their Firestore doc still
  has old saved order

### Data Sections Order
- [FIXED] defaultOrder: news, programs, events, enrollments, rsvps, submissions, requests,
  pledges, donations, codes, users, subscribers
- Same fix applied as quick actions — defaults always take precedence

### Donate Page Goal Glitch
- [FIXED] Stats section now waits for BOTH donation totals AND masjidConstruction data to
  load before rendering, preventing the 1.5M → 8.5M flash

### Programs Page — Dark Green Cards
- [FIXED] First 3 programs now use bg-mhma-forest with white text and gold accents,
  matching the hero section look

### Data Leak (Event Images on Construction Page)
- [INVESTIGATING] The public construction page queries only the `masjidConstruction`
  collection, so cross-collection leak shouldn't occur. Possible causes:
  1. Board member uploaded an event image URL into a construction update
  2. Stale/cached data in the masjidConstruction collection
  Recommend checking the masjidConstruction documents in Firestore console.

### Grid View Image Display
- [FIXED] Changed grid view from object-cover to object-contain so full image is visible
  (matching the timeline view behavior)

### Next Build Priorities
1. Render NewsletterSignup on construction page (5-min fix)
2. Render testimonials on public pages (need display component)
3. Build FAQ system (collection + dashboard + component)
4. Build Project Overview editable fields on dashboard
5. Add giving tiers / milestones section
6. Add timeframe to pledge form
