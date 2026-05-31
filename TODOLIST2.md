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

- [✓] Brief narrative: Why we need a masjid, community growth in Mountain House
- [✓] Key stats: estimated sq footage, projected capacity, community impact numbers
- [✓] Embed or link to project brochure PDF
- [✓] Embed a vision/campaign video if available (YouTube embed)

<!--
[BUILT] Fields added to FirebaseMasjidUpdate interface:
  narrative, sqFootage, capacity, communityImpact, brochureUrl, visionVideoUrl
Dashboard form at /dashboard/masjid-construction has these fields under "Project Overview".
Public page renders them between stats cards and gallery.
-->

#### Giving Tiers / Campaign Milestones

- [✓] Display giving tiers with named levels (e.g., Platinum: $50K+, Gold: $25K+)
- [✓] Show construction milestones: Phase 1 Foundation = $X, Phase 2 Structure = $Y
- [ ] VRIC uses an 'Ansar Club' monthly sustainer model — consider MHMA equivalent

<!--
[BUILT] givingTiers array stored in masjidConstruction doc via FirebaseMasjidUpdate interface.
Dashboard form has dynamic tier management (add/remove/edit tiers with name, amount, description).
Public page renders tiers sorted by amount descending with "Most Popular" badge on highest tier.
-->

#### Multiple Giving Options

- [x] Online card via Stripe
- [✓] Zelle (board@mhma.info) — displayed on donate page
- [✓] Check payable to MHMA — displayed on donate page
- [✓] Employer matching / Benevity information
- [✓] Crypto donation option (optional Phase 2)
- [✓] Waqf / endowment giving note if applicable

<!--
[BUILT] "Other Ways to Give" section rendered on construction page with three cards:
  Employer Matching (with Benevity note), Cryptocurrency, and Waqf/Endowment.
  Each card has descriptions and contact info for board@mhma.info.
-->

#### Pledge System

- [✓] [Pledge to Give] button links to /pledge page
- [✓] Pledge form fields: Name, Email, Amount, Timeframe (30/60/90 days)
- [✓] Pledges tracked in dashboard with pending/fulfilled/cancelled status
- [✓] Message: "Not ready to donate? Pledge now and we'll remind you."

<!--
[BUILT] Timeframe dropdown (30/60/90 days) added to /pledge page form.
"Not ready to donate?" banner added above form.
timeframe field stored in Firestore pledges doc via /api/pledge.
-->

#### FAQ Section

- [✓] Accordion/expandable format (NuecesMosque.com style)
- [✓] Questions: project vision, building features, tax-deductibility, Zakat eligibility,
      construction timeline, fund management
- [ ] MHMA 501(c)(3) EIN number
excuse me do not remove the mhma 501 c thing

<!--
[BUILT] Firestore "faq" collection with question, answer, category, order, active fields.
Dashboard CRUD at /dashboard/faq with order reordering, edit, delete.
Public FAQAccordion component rendered on /masjid-construction page.
Firestore rules allow public read, board write.
-->

#### Testimonials / Community Voices

- [✓] Dashboard CRUD exists (add/delete) at /dashboard/testimonials
- [✓] displayOn[] field can target specific pages
- [✓] Testimonials rendered on masjid-construction page
- [✓] "masjid-construction" added to displayOn options in dashboard form
- [ ] Photo upload needed

<!--
[BUILT] "masjid-construction" added to pageOptions array in dashboard/testimonials form.
TestimonialsDisplay component created at app/components/TestimonialsDisplay.tsx.
Rendered on /masjid-construction page filtering by displayOn "masjid-construction".
-->

#### Email / Update Signup

- [✓] NewsletterSignup component exists and RENDERED on construction page footer
- [✓] Subscribe API at /api/subscribe
- [✓] Dashboard subscriber management (merged with news page)

<!--
[BUILT] <NewsletterSignup variant="hero" source="masjid-construction" /> rendered
in the footer of /masjid-construction page.
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

### Build Status
- ✅ NewsletterSignup rendered on construction page
- ✅ FAQ system built (collection + dashboard + component)
- ✅ Project Overview fields built (dashboard form + public render)
- ✅ Pledge timeframe dropdown built
- ✅ Giving Tiers / Milestones built (dashboard form + public render)
- ✅ Testimonials: "masjid-construction" option added + TestimonialsDisplay component
- ✅ Multiple Giving Options: employer matching, crypto, waqf cards on construction page

A messege from user STILL DO THIS BELOW DONT DELETE ANYTHING THATS NOT WHAT I ASKED:
- ⬜ Debug email delivery (contact, enrollment, newsletter confirmations)
- ⬜ Add MHMA 501(c)(3) EIN number to FAQ content
- ⬜ Photo upload for testimonials
- ⬜ Data leak investigation (event images on construction page)
noreply@mhma-backend.firebaseapp.com
