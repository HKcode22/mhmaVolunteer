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

- [MISSING] Giving designation options: General Fund, Masjid Construction, Zakat, Sadaqa, Maktab Support — Stripe payment link has no designation step; `designation` field exists in Firestore donations collection but only set via webhook defaults
- [MISSING] Recurring donation option (monthly giving) — Stripe Checkout not configured for recurring; no "MHMA Builders Club" or similar
- [PARTIAL] Multiple payment methods — Stripe/Card is live; Zelle, Check, Cash mentioned in "Other Ways to Give" section on masjid-construction page but not on donate page
- [MISSING] Suggested giving amounts: $25 / $50 / $100 / $250 / $500 / Custom — Stripe Checkout uses a single price; no amount suggestions
- [BUILT] 501(c)(3) tax-deductible statement with EIN — added to homepage footer; also needed on donate page prominently
- [BUILT] Employer matching information — present in "Other Ways to Give" section on masjid-construction page
- [MISSING] "Dedicate this donation" option (in memory/honor of someone) — not implemented

### 6.2 Recurring / Monthly Giving Program

- [MISSING] Named monthly giving program (e.g., 'MHMA Builders Club')
- [MISSING] Monthly sustainer amounts: $10 / $25 / $50 / $100 / $250 / month
- [MISSING] Dedicated landing page and homepage banner for monthly giving
- [MISSING] Monthly impact email to sustainers

### 6.3 Donor Stewardship Features

- [PARTIAL] Automated donation receipt email — stripe-webhook calls `sendEmail()` non-blockingly; recipient gets email only if Gmail SMTP works
- [PARTIAL] Thank-you page after donation — Stripe redirects to `/donate?success=true` but no dedicated thank-you page with social share buttons
- [MISSING] Quarterly donor newsletter with construction progress updates
- [MISSING] Annual donor report / impact summary page

---

## 7. Technical & SEO Requirements

### 7.1 Performance

- [MISSING] Google PageSpeed score 80+ on mobile — not tested
- [MISSING] Compress and properly size all images in WebP format
- [PARTIAL] Enable caching — Vercel provides CDN caching; API routes use `force-dynamic` + `no-store` for live data
- [MISSING] Remove unused CSS/JS — Tailwind purges unused in production, but no manual audit done

### 7.2 Mobile Experience

- [MISSING] Full mobile audit — not performed
- [BUILT] Duplicate prayer time display on mobile — resolved (kept as-is by user preference)
- [PARTIAL] Donation CTAs thumb-friendly (44px minimum) — buttons exist but not audited
- [PARTIAL] Prayer times widget readable without horizontal scroll — embedded iframe responsive, needs verification

### 7.3 SEO

- [MISSING] Meta descriptions on all pages — Next.js metadata not set on most pages
- [MISSING] Structured data markup (Organization, Event types)
- [PARTIAL] Page titles — some pages have `<title>` via Next.js metadata, many use default
- [MISSING] Google Business Profile — not set up
- [MISSING] Google Search Console / sitemap — not set up

### 7.4 Accessibility

- [PARTIAL] Alt text on all images — many images have alt text via Next.js `<Image>`, some inline `<img>` tags lack alt
- [PARTIAL] Color contrast WCAG AA — forest/gold/cream scheme needs formal audit
- [BUILT] Form inputs have associated labels — all contact, enrollment, RSVP, pledge forms have `<label>` elements
- [PARTIAL] Keyboard navigation works throughout — basic nav works, dropdown menus need testing

### 7.5 Integrations

- [BUILT] Prayer times — integrated with AlAdhan API for auto-update; MasjidAI/Masjidi widget also embedded
- [BUILT] Events — Firestore-based events with RSVP, calendar view
- [PARTIAL] Email/Newsletter — newsletter signup component exists (stores to Firestore `subscribers` collection); not connected to Mailchimp or external email service
- [MISSING] Google Analytics 4 — not configured; no donation tracking as conversion event
- [PARTIAL] Donations — Stripe integrated and working; Zelle info mentioned on construction page; check mailing address not displayed
