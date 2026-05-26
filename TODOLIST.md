# MHMA Website — TODOLIST

## Priority Legend
- 🔴 Critical — must do for fundraising campaign
- 🟡 Important — should do soon
- 🟢 Nice-to-Have — when time permits

---

## 🔴 Critical Features

### 3. Pledge System
**Board member said**: "yes we do need pledge system form database tracking"
- [ ] Pledge form (name, email, phone, amount, message)
- [ ] Firestore collection `pledges` with status (`pending` / `fulfilled` / `cancelled`)
- [ ] Pledge-to-payment pipeline — convert pledge to actual donation
- [ ] Dashboard to view/manage pledges
- [ ] Email notification when a pledge is made
- [ ] Replace "Pledge Today" button with real pledge flow

### 4. Newsletter / Email Capture
**Board member said**: "yes we do need newsletter email capture signup form anywhere"
- [ ] Signup form on homepage hero section
- [ ] Signup form in footer
- [ ] Firestore `subscribers` collection
- [ ] Integration with email provider (Resend is already wired for RSVP)
- [ ] Welcome email on subscribe

### 5. Unified Fundraising Data
**Board member said**: "unified fundraising data"
- [ ] `masjidConstruction` Firestore collection should drive BOTH homepage progress bar AND `/masjid-construction` page
- [ ] Remove hardcoded stats from `/masjid-construction` and `/donate` pages
- [ ] Create a shared data fetching hook/function for campaign stats

### 6. Dedicated Masjid Construction Progress Page
**Board member said**: "we do not have stripe button contact info or social links what you are talking about is the donation page. what the board member needs is a legit masjid construction page. the golden button on the homepage should lead to the masjid progress page. when board members update data in dashboard, that info should be relayed to this new page."
- [ ] Create `/masjid-construction` as a real campaign page with:
  - [ ] Progress bar (driven by Firestore, same as homepage)
  - [ ] Construction photo gallery / timeline
  - [ ] Video walkthroughs
  - [ ] Phase breakdown (foundation, framing, etc.)
  - [ ] FAQ section
  - [ ] Stats cards (not hardcoded — from Firestore)
  - [ ] Pledge CTA
  - [ ] Link to donate page for actual payment
- [ ] Dashboard construction editor should push updates to this page
- [ ] Add "Donate" button in addition to "Pledge" button
- [ ] Clarify wording: construction page = progress/updates page, donate page = payment page

### 7. Multiple Donation Methods
**Board member said**: "multiple donation methods"
- [ ] Zelle info/QR code
- [ ] Check mailing address
- [ ] Cash drop-off info
- [ ] PayPal option (if applicable)
- [ ] Keep existing Stripe buy button as primary online option

### 8. Donation Designations
**Board member said**: "donation designations"
- [ ] Allow donor to choose where their money goes:
  - General Fund
  - Construction Fund
  - Zakat
  - Programs
  - Other (custom)
- [ ] Different Stripe products/links per designation

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
- [ ] Monthly calendar grid view
- [ ] Events displayed on correct dates
- [ ] Click event to see details
- [ ] Week/day toggle options
- [ ] Fix ordering — sort by event date, not createdAt

### 12. Construction Page Ignoring Firestore
**Board member said**: "yes we need to fix the construction page that ignores firestore"
- [ ] Covered under #5 and #6 above — connect to Firestore data

### 13. Recurring Donation Toggle
**Board member said**: "yes i agree with you on no recurring donation toggle"
- [ ] Monthly vs one-time toggle on donate page
- [ ] Stripe recurring price/subscription setup
- [ ] Clear UI for recurring vs single gift

---

## 🟢 Nice-to-Have

### 14. Construction Photo Gallery / Timeline
**Board member said**: "those are good too"
- [ ] Photo gallery component with lightbox
- [ ] Timeline view of construction milestones
- [ ] Admin can upload photos from dashboard

### 15. Donor Wall / Social Proof
**Board member said**: "those are good too"
- [ ] Display donor names (with permission)
- [ ] Anonymous option for donors
- [ ] Fundraising thermometer / goal visualization

### 16. iCal / Google Calendar Export
**Board member said**: "those are good too"
- [ ] Add to Calendar button on events
- [ ] iCal download / Google Calendar link

### 17. Program Enrollment Tied to Specific Programs
**Board member said**: "those are good too"
- [ ] Enroll button per program
- [ ] Enrollment data includes which program
- [ ] Dashboard shows enrollments by program

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

### Planned Collections
- `pledges` — { id, name, email, phone, amount, message, status, createdAt, fulfilledAt }
- `subscribers` — { id, email, name, subscribedAt, source }
- `donations` — { id, donorId, amount, designation, stripePaymentId, pledgeRef, createdAt }
- `masjidConstruction` — already exists, will be the source of truth for campaign data

### Notes - will do these later  
- Use subcollections or top-level collections for scalability
- Index queries that need filtering (e.g., donations by user, pledges by status)
- Keep donor PII minimal — use Firebase Auth UID as reference where possible
- i would also want u to analyze the current data abse we have and check and see if everything is organzied 
-Setup Needed
To make Stripe webhook work:
1. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Vercel dashboard
2. In Stripe Dashboard → Webhooks, add endpoint https://mhma.us/api/stripe-webhook
3. Add designation to each buy button's metadata in Stripe Dashboard (optional — defaults to "general")
- i dont know or think we should have analytical snapshot because we need to think about if this is right or wrong in the sense of computations
- - i was thinking about if the progress of money fundraising was tracked through whwenever a trasnaction would be done using the strip or thing from the website and then the numbers are udpated automatcily? i dont know will need to dig in more
- also am thinking about integrating more data science or more realistically more data analytical or data related configruitation or things in it like data sets or things of data used or solved in the real world creating something that is good for my skills and
- I was also thinking about big o of n time space concepts about the analytical computations and resources meaning where the analytical parts of code would be at firebase or in codebase github vercel, if its on my computer or on vercels servers, and where is better so resrouces are used correctly and moderatley
- is it possible if every regular memeber can have their own dashbaord where they can see how many events theyve rvsped too, and their own data tracking thing?
