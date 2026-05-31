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
- [MISSING] Dedicated landing page for monthly giving program — currently just a section on donate page
- [MISSING] Monthly impact email to sustainers — not yet implemented (requires email automation)

### 6.3 Donor Stewardship Features

- [BUILT] Automated donation receipt email — stripe-webhook sends confirmation via Gmail SMTP (fixed: now uses gmailUser as from address to avoid Gmail rejection)
- [BUILT] Thank-you page after donation — success state on donate page with social share buttons (Facebook, Twitter, copy link)
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
- [PARTIAL] Donations — Stripe integrated and working; Zelle info displayed; check mailing address displayed; PayPal option added
