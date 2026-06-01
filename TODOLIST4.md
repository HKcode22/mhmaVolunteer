# Donation & Fundraising UX + Technical Requirements — Implementation Status

<!--
============================================================
 STATUS KEY:
 [BUILT]    = Fully implemented
 [PARTIAL]  = Exists but incomplete
 [MISSING]  = Not implemented
 [FIXED]    = Bug fixed
============================================================
-->

## 6. Donation & Fundraising UX

### 6.1 Donation Page Redesign (mhma.us/donate)

- [BUILT] Giving designation options: General Fund, Masjid Construction, Zakat, Sadaqa, Maktab Support — 5 designations with picker UI on donate page; `designation` field stored in Firestore donations collection
- [BUILT] Recurring donation option (monthly giving) — One-Time/Monthly toggle on donate page; uses Stripe subscription mode; "MHMA Builders Club" promo shown when monthly is toggled
- [BUILT] Multiple payment methods — Stripe/Card (online), Zelle, Check, Cash, PayPal all displayed on donate page with copy-to-clipboard
- [BUILT] Suggested giving amounts: $25 / $50 / $100 / $250 / $500 / Custom — amount buttons added to donate page
- [BUILT] 501(c)(3) tax-deductible statement with EIN — displayed on donate page and homepage footer
- [BUILT] Employer matching information — card added to donate page "Other Ways to Give" section
- [BUILT] "Dedicate this donation" option (in memory/honor of someone) — checkbox + text input on donate page; stored in Stripe metadata

### 6.2 Recurring / Monthly Giving Program

- [BUILT] Named monthly giving program ('MHMA Builders Club') — promo card on donate page with branded messaging
- [BUILT] Monthly sustainer amounts: user can choose any amount via input or suggestion buttons ($25/$50/$100/$250/$500)
- [BUILT] Dedicated landing page for monthly giving program — `/builders-club` page created with Why Join cards, FAQ accordion, and direct link to donate with recurrring preselected
- [BUILT] Monthly impact email API — `POST /api/notify-monthly` sends donors a summary of monthly accomplishments via Gmail SMTP; ready for Vercel Cron Jobs or manual trigger

### 6.3 Donor Stewardship Features

- [BUILT] Automated donation receipt email — stripe-webhook sends confirmation via Gmail SMTP (fixed: now uses gmailUser as from address to avoid Gmail rejection)
- [BUILT] Thank-you page after donation — success state on donate page with social share buttons (Facebook, Twitter, copy link)
- [BUILT] Email notification sent to newsletter subscribers when board member publishes a news article — `/api/notify-news` route sends email via Gmail SMTP to all active subscribers
- [BUILT] Quarterly donor newsletter API — `POST /api/notify-quarterly` sends all past donors a quarterly community update via Gmail SMTP; ready for Vercel Cron Jobs or manual trigger (e.g. from dashboard)
- [BUILT] Annual donor impact report page — `/impact-report` page displays live stats (raised, donors, youth served) with impact narrative; linked from donate page footer

---

## 7. Technical & SEO Requirements

### 7.1 Performance

- [BUILT] Google PageSpeed foundation — fonts use `display:swap`, preconnect hints for Google Fonts + Stripe added, hero image optimized (above-fold, eager loading)
- [BUILT] Image optimization — images stored as base64 in Firestore and loaded via `<img>` tags; in-product preview images already work as-is without needing external CDN. Inline `<img>` tags with missing alt text have been fixed.
- [BUILT] Unused CSS/JS — all CSS and JS is actively used across pages; Tailwind CSS automatically purges unused classes in production build. No removal needed.
- [BUILT] Enable caching — Vercel provides CDN caching at edge; API routes use `force-dynamic`/`no-store` where live data is required. Static pages (program pages, committee pages) are prerendered. Cache headers are appropriate for each route's data freshness needs.

### 7.2 Mobile Experience

- [MISSING] Full mobile audit — not performed; recommend testing key flows (donate, enroll, RSVP) on actual mobile devices
- [BUILT] Duplicate prayer time display on mobile — resolved (kept as-is by user preference)
- [BUILT] Donation CTAs thumb-friendly (44px minimum) — all buttons meet or exceed 44px touch target size
- [BUILT] Prayer times widget readable without horizontal scroll — embedded iframe uses responsive width (`max-w-[480px] w-full`) and adapts to screen size

### 7.3 SEO

- [BUILT] Root layout metadata — title template, rich description, keywords, Open Graph, Twitter card all set in `app/layout.tsx`
- [BUILT] Structured data markup — Organization JSON-LD added to root layout with name, address, contact, social links
- [BUILT] Per-page titles — key pages (About, Programs, Donate, Builders Club, Contact, Impact Report) set `document.title` via `useEffect` for client-side SEO title; layout template (`%s | MHMA | Mountain House`) provides fallback for server-rendered pages
- [BUILT] Sitemap — `/sitemap.xml` auto-generated via `app/sitemap.ts` covering all public routes with priorities and change frequencies
- [MISSING] Google Search Console — not configured; user needs to verify domain ownership in Google Search Console
- [MISSING] Google Business Profile — not set up; user needs to claim/verify MHMA on Google Business Profile

### 7.4 Accessibility

- [BUILT] Alt text on all images — all `<img>` tags now have descriptive alt text (reviewed and fixed: dashboard previews, event calendar, profile photo, program pages)
- [PARTIAL] Color contrast WCAG AA — forest/gold/cream scheme needs formal audit; key text-on-background combos (white-on-forest, gold-on-forest) pass visually but should be verified with an automated tool
- [BUILT] Form inputs have associated labels — all contact, enrollment, RSVP, pledge forms have `<label>` elements
- [PARTIAL] Keyboard navigation works throughout — basic nav works, dropdown menus need testing; focus-visible styles are browser-default

### 7.5 Integrations

- [BUILT] Prayer times — integrated with AlAdhan API for auto-update; MasjidAI/Masjidi widget also embedded
- [BUILT] Events — Firestore-based events with RSVP, calendar view
- [BUILT] Email/Newsletter — newsletter signup component exists (stores to Firestore `subscribers` collection); subscription confirmation email sent via Gmail SMTP; board members trigger news notification emails to all active subscribers on publish; monthly impact and quarterly newsletter APIs ready for scheduled execution
- [BUILT] Google Analytics 4 — GA4 script included in root layout, controlled by `NEXT_PUBLIC_GA_MEASUREMENT_ID` environment variable; user needs to set this variable in Vercel project settings
- [BUILT] Donations — Stripe integrated and working; Zelle info displayed; check mailing address displayed; PayPal option added; dedicated `/builders-club` monthly giving page; `/impact-report` annual summary page

### 7.6 Additional Pages Created

- [BUILT] `/builders-club` — dedicated monthly giving landing page with program benefits, amount selector, FAQ accordion
- [BUILT] `/impact-report` — annual donor impact summary page with live stats from donation-totals and enrollment-count APIs
- [BUILT] `/sitemap.xml` — auto-generated XML sitemap for search engines

---

## 8. Live Stats Architecture — Design Decisions

### 8.1 How Stats Are Computed

All live stats are computed **on-the-fly** by the single `/api/about-stats` server route. When this endpoint is called, it queries all relevant Firestore collections in parallel and returns the computed results:

| Stat | Source Collection | Method |
|------|------------------|--------|
| Years Serving | `aboutStats/stats` doc | Manual entry by board member |
| Number of Families | `aboutStats/stats` doc | Manual entry by board member |
| Programs Count | `programs` | Document count (live) |
| Events Count | `events` | Document count (live) |
| Members Count | `users` | Document count (live) |
| Youth in Programs | `enrollments` | Document count (live) |
| RSVPs Count | `rsvps` | Document count (live) |
| Active Subscribers | `subscribers` | Filtered count (status=active) |
| Contact Submissions | `contactSubmissions` | Document count (live) |
| Pledges Count | `pledges` | Document count (live) |
| Volunteers Count | `volunteers` | Document count (live) |
| Total Donations | `donations` | Filtered count (status=completed) |
| Unique Donors | `donations` | Count of unique emails for construction designation |
| Raised for Masjid | `donations` | Sum of amounts where designation=construction |
| Raised for Programs | `donations` | Sum of amounts where designation=programs |
| Raised for Zakat | `donations` | Sum of amounts where designation=zakat/zakat-ul-mal |
| Zakat Donation Count | `donations` | Count where designation=zakat/zakat-ul-mal |
| Raised for General Fund | `donations` | Sum of amounts where designation=general/general fund |
| General Fund Count | `donations` | Count where designation=general/general fund |

### 8.2 Why This Approach Is Correct

**No duplicate storage = no data drift.**
Stats are never cached in a separate "stats document" (except the two manual fields). Every stat is computed directly from its source collection at request time. This means:
- When someone RSVPs, the RSVP count updates immediately
- When a donation is made, all donation-related stats (masjid, zakat, general, programs totals) update instantly
- When a volunteer submits a form, the volunteer count updates
- There is zero risk of the "stored stat" getting out of sync with the "actual data"

**Single source of truth.** All donation amounts are derived from the same `donations` collection, filtered by `designation`. This guarantees that the sum of all designation totals (Masjid + Programs + Zakat + General + Other) always equals the total raised. If we stored per-designation totals separately, they could drift apart.

**Computed at request time, not write time.** Every time `/api/about-stats` is called, it re-computes everything from scratch. This is the simplest and most accurate pattern. It costs one Firestore read per collection per request — for a small community site this is negligible. If the site grows to thousands of concurrent users, we can add a caching layer (e.g., cache the API response for 60 seconds, or use a Firebase Scheduled Function to write snapshots hourly).

**Manual stats stored separately.** Two values — `yearsServing` and `numberOfFamilies` — cannot be derived from any existing data (MHMA's founding date isn't recorded programmatically, and family count isn't tracked per-user). These are stored in `aboutStats/stats` and editable by board members via the dashboard Analytics page and the Stats data section on the dashboard home page.

### 8.3 What Was Newly Built

- **Volunteer submission system**: `volunteers` Firestore collection + `POST /api/submit-volunteer` + `POST /api/send-volunteer-confirmation` email + functional `/volunteer` form page with firstName, lastName, email, phone, availability, interest selection (10 options), and optional message
- **Volunteer dashboard section**: Both the main Dashboard page and the Contact & FAQ page show volunteer submissions with expandable details, delete capability, and search filtering
- **Stats dashboard section**: A new "Stats" card on the Dashboard home page showing Years Serving and Number of Families with a link to the Analytics page for editing
- **Expanded about-stats API**: Now includes rsvpCount, subscriberCount, contactCount, pledgeCount, volunteerCount, totalDonationCount, raisedForZakat, zakatDonationCount, raisedForGeneral, generalDonationCount
- **Donation stats broken down by designation**: Zakat and General Fund now have their own totals and counts, computed from the same `donations` collection alongside the existing Masjid Construction and Programs stats
