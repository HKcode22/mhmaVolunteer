export interface QAItem {
  q: string;
  a: string;
  keywords: string[];
  roles?: ('board_member' | 'member' | 'administrator')[];
  pages?: string[];
  denyRoles?: ('board_member' | 'member' | 'administrator')[];
}

export const knowledgeBase: QAItem[] = [
  // ─── Event Management ───
  {
    q: "How do I create a new event?",
    a: "Go to Dashboard → Events. You'll see an 'Add Event' button at the top. Click it and fill in the event title, date, time, location, description, and image. Click 'Create Event' to save. The event will appear on the public Events page and homepage automatically.",
    keywords: ["create event", "add event", "new event", "schedule event", "event form", "make event", "setup event", "host event", "organize event", "event creation"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],
    pages: ["/dashboard/events"],
  },
  {
    q: "Where do I find the list of events?",
    a: "Go to Dashboard → Events. All events are listed there with their date, time, and status. You can also click the event title to view it on the public page. From this list you can edit or delete events.",
    keywords: ["find events", "event list", "view events", "where are events", "events page", "show events", "event directory", "list of events"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],
    pages: ["/dashboard/events"],
  },
  {
    q: "How do I edit or delete an event?",
    a: "Go to Dashboard → Events. Find the event in the list and click the Edit (pencil) or Delete (trash) icon next to it. Editing lets you change the title, date, time, location, description, or image. Deleting removes it permanently.",
    keywords: ["edit event", "delete event", "modify event", "remove event", "update event", "change event", "cancel event"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],
    pages: ["/dashboard/events"],
  },
  {
    q: "How do I approve or reject RSVPs for an event?",
    a: "Go to Dashboard → Events. Scroll down to the RSVPs section. You'll see Approve (green check) and Reject (red X) buttons next to each pending RSVP. You can also use the 'Approve All' or 'Reject All' buttons to process all pending RSVPs at once.",
    keywords: ["approve rsvp", "reject rsvp", "confirm rsvp", "cancel rsvp", "rsvp pending", "rsvp approval", "manage rsvp", "rsvp list", "rsvp management"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],
    pages: ["/dashboard/events"],
  },

  // ─── Program Management ───
  {
    q: "How do I create a new program?",
    a: "Go to Dashboard → Programs. Click 'Add Program'. Fill in the title, slug (URL name), description, images, stats, and testimonial quote. Click 'Create Program' to save. The program will appear on the Programs page.",
    keywords: ["create program", "add program", "new program", "program form", "make program", "setup program", "program creation", "start program", "launch program"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/programs"],
  },
  {
    q: "Where do I find and edit programs?",
    a: "Go to Dashboard → Programs. All programs are shown in a list with Edit (pencil) and Delete (trash) buttons. Click Edit to change the title, description, images, or any other field. Changes save immediately.",
    keywords: ["find programs", "program list", "edit program", "modify program", "update program", "program page", "view programs", "change program"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/programs"],
  },
  {
    q: "How do I approve or reject program enrollments?",
    a: "Go to Dashboard → Programs. The Enrollments section shows all sign-ups with their status (pending, approved, rejected, completed). Use the Approve (green) or Reject (red) buttons next to pending enrollments, or use 'Approve All' / 'Reject All' to batch process them.",
    keywords: ["approve enrollment", "reject enrollment", "enrollment pending", "program enrollment", "manage enrollment", "enrollment approval", "student enrollment", "sign up approval"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/programs"],
  },
  {
    q: "How do I delete a program?",
    a: "Go to Dashboard → Programs. Find the program you want to remove and click the Delete (trash) icon. Confirm the deletion. This cannot be undone, so make sure the program is no longer needed.",
    keywords: ["delete program", "remove program", "destroy program", "erase program"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/programs"],
  },

  // ─── News Management ───
  {
    q: "How do I add news articles?",
    a: "Go to Dashboard → News. Click 'Add News'. Fill in the title, slug, excerpt (short summary), and content. You can also add an image. Set the published toggle to make it visible on the homepage. Click 'Save'.",
    keywords: ["create news", "add news", "new article", "news article", "publish news", "write news", "post news", "news post", "announcement"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/news"],
  },
  {
    q: "How do I edit or unpublish a news article?",
    a: "Go to Dashboard → News. Find the article and click Edit (pencil) to change its content. Toggle the 'Published' switch off to unpublish (hide from public). You can also delete the article with the Delete (trash) button.",
    keywords: ["edit news", "unpublish news", "delete news", "remove article", "hide news", "news edit", "modify news"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/news"],
  },

  // ─── Testimonial Management ───
  {
    q: "How do I manage testimonials?",
    a: "Go to Dashboard → Testimonials. You can add new testimonials with a person's name, their role, the testimonial text, and select which pages to display it on. Use the Activate/Deactivate buttons to toggle visibility. Use 'Activate All' / 'Deactivate All' for bulk changes.",
    keywords: ["testimonial", "review", "feedback", "activate testimonial", "deactivate testimonial", "add testimonial", "manage review", "community voice"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/testimonials"],
  },

  // ─── Masjid Construction ───
  {
    q: "How do I update masjid construction progress?",
    a: "Go to Dashboard → Construction. You can add updates with images, videos, captions, and phase information. Each update tracks the fundraising progress (raised amount vs goal). Updates appear on the Masjid Construction page.",
    keywords: ["construction update", "masjid progress", "building update", "fundraising progress", "add construction", "construction photo", "building phase", "masjid status"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/construction"],
  },
  {
    q: "How do I add construction photos?",
    a: "Go to Dashboard → Construction. Click 'Add Update'. Upload images showing the latest progress. Add a caption describing what's in the photo. These images appear in the gallery on the public Masjid Construction page.",
    keywords: ["construction photo", "upload image", "add photo", "building picture", "masjid image", "gallery photo"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/construction"],
  },

  // ─── Donations & Pledges ───
  {
    q: "How do I view and manage donations?",
    a: "Go to Dashboard → Donations. Here you can see all donations, add manual donations (cash/check), and export data as CSV. The Pledges section below shows pending pledges that you can mark as fulfilled or cancelled.",
    keywords: ["donation", "pledge", "manual donation", "cash donation", "check donation", "export donations", "donation list", "view donations", "donation management"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/donations"],
  },
  {
    q: "How do I record a cash or check donation?",
    a: "Go to Dashboard → Donations. Click 'Add Manual Donation' to record a cash or check donation. Enter the donor's name, email, amount, and designation (e.g., Masjid Construction, General Fund). This creates a record like any other donation.",
    keywords: ["cash donation", "check donation", "manual donation", "record donation", "offline donation", "add donation"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/donations"],
  },
  {
    q: "How do I manage pledges?",
    a: "Go to Dashboard → Pledges. All pledges are listed with their status (pending/fulfilled/cancelled). Use 'Fulfill' to mark a pledge as completed, or 'Cancel' to void it. Use 'Fulfill All' / 'Cancel All' for bulk actions.",
    keywords: ["pledge", "fulfill pledge", "cancel pledge", "pledge management", "pledge status", "pending pledge", "pledge list", "manage pledge"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/pledges"],
  },

  // ─── Contact & FAQ ───
  {
    q: "How do I handle contact form submissions?",
    a: "Go to Dashboard → Contact & FAQ. Contact submissions are listed with a 'Mark as Read' button. Use 'Mark All Read' to batch process unread submissions. You can also manage FAQs, view volunteer submissions, and reorder FAQ items.",
    keywords: ["contact submission", "contact form", "mark read", "faq", "volunteer submission", "contact inquiry", "message from public", "contact management"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/contact-submissions"],
  },
  {
    q: "How do I manage FAQ questions?",
    a: "Go to Dashboard → Contact & FAQ. Scroll to the FAQ section. You can add new FAQs, edit existing ones, reorder them using the up/down arrows, and toggle them active/inactive. FAQs with 'Active' checked appear on the public FAQ page.",
    keywords: ["faq", "add question", "edit faq", "faq answer", "faq order", "frequently asked", "manage faq", "faq list"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/contact-submissions"],
  },
  {
    q: "How do I view volunteer submissions?",
    a: "Go to Dashboard → Contact & FAQ. Scroll down to the Volunteer Submissions section. You'll see all volunteer sign-ups with their contact info, availability, and interests. You can delete entries that are no longer needed.",
    keywords: ["volunteer", "volunteer submission", "volunteer signup", "volunteer list", "volunteer interest"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/contact-submissions"],
  },

  // ─── User Management ───
  {
    q: "How do I manage users and members?",
    a: "Go to Dashboard → Members. You can see all registered users, their roles (board member or regular member), and their activity (enrollments, RSVPs, pledges, donations). You can delete users if needed.",
    keywords: ["user", "member", "board member", "delete user", "user list", "manage user", "member list", "registered user", "user role"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/users"],
  },

  // ─── Activity Log ───
  {
    q: "How do I view activity logs?",
    a: "Go to Dashboard → Activity Log. This shows all actions taken by board members (creating events, approving RSVPs, etc.). You can revert certain changes if needed using the 'Revert' button.",
    keywords: ["activity log", "audit trail", "history", "revert", "board activity", "action log", "change history", "who did what"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/activity"],
  },

  // ─── Analytics ───
  {
    q: "How do I see analytics and stats?",
    a: "Go to Dashboard → Analytics. This shows charts and cards with key metrics: events, programs, users, donations, enrollments, RSVPs, and more. You can also edit the About page stats (years serving, number of families) from this page.",
    keywords: ["analytics", "statistics", "stats", "metrics", "dashboard stats", "about stats", "data", "charts", "report", "performance"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/analytics"],
  },

  // ─── Scheduling Requests ───
  {
    q: "How do I manage scheduling requests?",
    a: "Go to Dashboard → Scheduling. Event scheduling requests from the public appear here with details about their event. Use Approve (green) or Reject (red) buttons per request, or use 'Approve All' / 'Reject All' for bulk processing.",
    keywords: ["scheduling request", "event request", "approve scheduling", "reject scheduling", "facility request", "room booking", "calendar request"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/scheduling"],
  },

  // ─── Invite Codes ───
  {
    q: "How do I create an invite code for new board members?",
    a: "Go to Dashboard. In the Quick Actions or sections, find 'Invite Codes'. Click 'Generate New Code'. A unique code will appear. Share this code with the new board member — they'll enter it during registration. Each code works only once.",
    keywords: ["invite code", "board registration", "new board member", "generate code", "invite link", "registration code", "board invite"],
    roles: ["administrator"],
    denyRoles: ["member"],
    pages: ["/dashboard"],
  },
  {
    q: "How do I copy or delete an invite code?",
    a: "Go to Dashboard → Invite Codes section. Each code has a Copy button (for sharing) and a Delete button. Copied codes go to your clipboard. Delete codes that have been used or are no longer needed.",
    keywords: ["copy code", "delete code", "share code", "invite code copy", "remove code"],
    roles: ["administrator"],
    denyRoles: ["member"],
    pages: ["/dashboard"],
  },

  // ─── Settings & Profile ───
  {
    q: "How do I change my password?",
    a: "Go to Settings (gear icon in the top nav bar). Under your profile, you can update your password. You'll need to enter your current password and then your new password.",
    keywords: ["change password", "update password", "reset password", "settings", "profile", "account", "security", "login"],
    roles: ["board_member", "administrator", "member"],
    pages: ["/dashboard/settings"],
  },
  {
    q: "How do I update my profile?",
    a: "Click on your name or the Profile link in the top navigation bar. From there you can update your display name, phone number, and other personal information. Changes save automatically.",
    keywords: ["update profile", "edit profile", "change name", "update phone", "profile settings", "my account"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I change the theme or appearance?",
    a: "Go to Settings (gear icon in the top nav bar). Look for the Theme section. You can switch between Light, Dark, and Night modes. Your preference is saved and will persist across sessions.",
    keywords: ["theme", "dark mode", "light mode", "night mode", "appearance", "color scheme", "change color", "settings theme"],
    roles: ["board_member", "administrator", "member"],
    pages: ["/settings"],
  },

  // ─── Newsletter ───
  {
    q: "How do I subscribe or unsubscribe from emails?",
    a: "Go to the Subscribe page from the navigation menu. You'll see two tabs: Subscribe and Unsubscribe. Enter your email and optionally your name, then click the button. Board members can also manage subscribers from Dashboard → Subscribers section.",
    keywords: ["subscribe", "unsubscribe", "email list", "newsletter", "mailing list", "email signup", "newsletter signup"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I manage newsletter subscribers?",
    a: "Go to Dashboard → Subscribers. You can see all newsletter subscribers and their status (active/unsubscribed). You can manually unsubscribe someone if they request it, or delete their record entirely.",
    keywords: ["subscriber", "subscriber list", "email subscriber", "newsletter list", "manage subscriber"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/subscribers"],
  },

  // ─── Public Pages ───
  {
    q: "Where can I find prayer times?",
    a: "Prayer times are displayed on the homepage and the dedicated Prayer Times page. The times are fetched live from an API. Jumu'ah prayer information is also shown. Click 'View Full Monthly Schedule' for the complete monthly timetable.",
    keywords: ["prayer time", "salah", "fajr", "dhuhr", "asr", "maghrib", "isha", "jumu'ah", "namaz", "salat", "prayer schedule"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I view the board of directors?",
    a: "Go to the Boards page from the navigation menu. You'll see all board members with their photos, titles, and contact information organized by Board of Directors and Board of Trustees sections.",
    keywords: ["board", "director", "trustee", "board member", "leadership", "board of directors", "board of trustees", "who runs mhma"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How can I see masjid construction progress?",
    a: "Go to the Masjid Construction page. You'll see the fundraising progress bar, campaign stats (total raised, donor count, square footage), recent updates with photos, giving tiers, donor wall, and information about other ways to give.",
    keywords: ["masjid construction", "building progress", "fundraising", "campaign", "donor wall", "construction status", "new masjid", "islamic center"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "Where do I find information about programs?",
    a: "Go to the Programs page from the navigation menu. All active programs are listed there. Click on any program to see more details including description, schedule, and how to enroll.",
    keywords: ["find programs", "program list", "program page", "view programs", "program directory", "classes", "courses"],
    roles: ["board_member", "administrator", "member"],
  },

  // ─── WordPress Transition Guide ───
  {
    q: "How do I transition from WordPress to this website?",
    a: "Welcome! This new website replaces the old WordPress site. Here's what you need to know: 1) All content (events, programs, news) is now managed through Dashboard. 2) The old WordPress login no longer works. 3) Your board member account was created for you. 4) Contact info@mhma.info if you need access. Use the Dashboard to manage everything — no more WordPress admin panel needed.",
    keywords: ["wordpress", "wp", "transition", "migration", "old site", "new website", "move from wordpress", "wordpress replacement"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How is this different from WordPress?",
    a: "This site is custom-built and much simpler than WordPress. Key differences: 1) No plugins to update. 2) Everything is in one Dashboard. 3) Changes are instant — no caching issues. 4) Mobile-friendly by default. 5) No separate login — use your email. 6) Add events, programs, and news directly without needing to create pages. 7) RSVPs and enrollments are handled automatically.",
    keywords: ["difference", "vs wordpress", "compared to wordpress", "new system", "custom website", "how is this different"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I log in for the first time?",
    a: "Click 'Member Login' in the top navigation bar. Enter your email address and click 'Login'. Check your email for a magic link — click it to log in. No password needed. If you have a password set, you can also use 'Continue with Email & Password'. First-time users: use an invite code from an existing board member.",
    keywords: ["login", "sign in", "first time login", "magic link", "how to login", "access account", "board login", "sign in first time"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I register as a new board member?",
    a: "You need an invite code from an existing administrator. Go to the Register page. Enter your name, email, phone, and the invite code. Your account will be created with board member access. If you don't have a code, contact info@mhma.info.",
    keywords: ["register", "sign up", "new account", "board registration", "create account", "invite code", "join as board"],
    roles: ["board_member", "administrator", "member"],
  },

  // ─── Dashboard Navigation Help ───
  {
    q: "How do I get to the dashboard?",
    a: "If you're a board member, click on 'Dashboard' in the top navigation bar (the word 'DASHBOARD' with a dropdown arrow). From there you can access all sections: Events, Programs, News, Testimonials, Construction, Donations, Pledges, Contact, Members, Analytics, and more.",
    keywords: ["go to dashboard", "dashboard link", "where is dashboard", "access dashboard", "open dashboard", "board dashboard", "admin panel"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard"],
  },
  {
    q: "What is the dashboard?",
    a: "The Dashboard is the control center for board members. It shows all pending items (enrollments, RSVPs, contacts), quick action buttons for common tasks, and individual sections for managing events, programs, news, donations, and more. You can customize which sections appear using the 'Customize' button.",
    keywords: ["what is dashboard", "dashboard overview", "dashboard explain", "what can i do in dashboard", "dashboard help"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard"],
  },

  // ─── Bulk Operations ───
  {
    q: "How do I approve or reject multiple items at once?",
    a: "Many sections have 'Approve All' and 'Reject All' buttons at the top. For example: Enrollments, Scheduling Requests, and RSVPs all support bulk processing. These buttons process all pending items with a single click. Use with care — there's no undo!",
    keywords: ["approve all", "reject all", "bulk approve", "bulk reject", "batch process", "approve multiple", "mass approve"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],  },
  {
    q: "How do I mark all contact submissions as read?",
    a: "Go to Dashboard → Contact & FAQ. At the top of the Contact Submissions section, there's a 'Mark All Read' button. This marks all unread submissions as read in one click.",
    keywords: ["mark all read", "mark read", "bulk read", "all read", "read all messages"],
    roles: ["board_member", "administrator"],
    denyRoles: ["member"],    pages: ["/dashboard/contact-submissions"],
  },

  // ─── Security & Role Help ───
  {
    q: "Can I create events as a regular member?",
    a: "No, only board members can create events. If you're a regular member, you can submit a scheduling request from the public 'Event Scheduling Request' page, which a board member can then approve.",
    keywords: ["create event member", "regular member event", "can i create", "member permissions", "not board member"],
    roles: ["member"],
    denyRoles: ["board_member", "administrator"],
  },
  {
    q: "Can you create an event for me?",
    a: "I can guide you, but I can't create events directly. As a non-board member, you can submit an event scheduling request on the Event Scheduling Request page. A board member will review and approve it.",
    keywords: ["create for me", "make event for me", "ai create event", "assistant create", "do it for me"],
    roles: ["member"],
    denyRoles: ["board_member", "administrator"],
  },
  {
    q: "What can board members do?",
    a: "Board members have full access: create/edit/delete events, programs, news, testimonials, and construction updates; approve/reject enrollments, RSVPs, and scheduling requests; manage donations, pledges, subscribers, users, and invite codes; view analytics and activity logs; and customize the dashboard layout.",
    keywords: ["board member powers", "board permissions", "what can board do", "admin abilities", "board access", "board privileges"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "What can regular members do?",
    a: "Regular members can: view public pages, subscribe to the newsletter, submit event scheduling requests, RSVP to events, enroll in programs, make pledges and donations, update their profile and password, and change their theme preferences.",
    keywords: ["member permissions", "regular member", "what can members do", "member access", "public features"],
    roles: ["board_member", "administrator", "member"],
  },

  // ─── Navigation Help ───
  {
    q: "How do I get to the Events page?",
    a: "Click 'Events' in the main navigation menu. On the Events page you'll see upcoming events and a calendar. Board members can also click 'Manage Events' to go to the Dashboard events section.",
    keywords: ["go to events", "events page", "find events", "events link", "navigate to events"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I get to the Programs page?",
    a: "Click 'Programs' in the main navigation menu. On the Programs page you'll see all active programs. Board members can also click 'Manage Programs' to go to the Dashboard programs section.",
    keywords: ["go to programs", "programs page", "find programs", "programs link", "navigate to programs"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I get to the News page?",
    a: "Click 'News' in the main navigation menu. All published news articles are shown there. Board members can click 'Manage News' to go to the Dashboard news section.",
    keywords: ["go to news", "news page", "find news", "news link", "navigate to news"],
    roles: ["board_member", "administrator", "member"],
  },

  // ─── General MHMA Info ───
  {
    q: "What is MHMA?",
    a: "Mountain House Muslim Association (MHMA) is a 501(c)(3) nonprofit organization serving the Muslim community in Mountain House, California. We provide religious services, educational programs, and community events. Our mission is to build an Islamic Center that serves as a hub for faith, education, and community gathering.",
    keywords: ["what is mhma", "about mhma", "mhma meaning", "mountain house muslim", "organization info"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "Where is MHMA located?",
    a: "MHMA is located at 250 E. Main St., Mountain House, CA 95391. You can find directions on the Contact page. Currently, we hold events at rented spaces including Mountain House Community Center and various school facilities while working toward building a permanent Islamic Center.",
    keywords: ["location", "address", "where is mhma", "directions", "find us", "contact address"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How can I contact MHMA?",
    a: "Email: info@mhma.info. You can also use the Contact form on the Contact page. For board members, internal communication is handled through the Dashboard and email.",
    keywords: ["contact", "email mhma", "reach mhma", "get in touch", "mhma email"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I donate to MHMA?",
    a: "Go to the Donate page. You can make a one-time donation, set up recurring donations, or make a pledge (promise to donate later). Donations can be designated for Masjid Construction, General Fund, Zakat, or specific programs. You can also donate through the pledge system and fulfill it later.",
    keywords: ["donate", "give money", "contribute", "donation", "support", "make donation", "how to donate", "zakat", "sadaqah"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I enroll in a program?",
    a: "Go to the Programs page and find the program you're interested in. Click on it to view details. There should be an enrollment form or link to sign up. If you're logged in, your information will be pre-filled.",
    keywords: ["enroll", "sign up", "register for program", "join class", "program enrollment", "how to enroll"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I submit a scheduling request for an event?",
    a: "Go to the 'Event Scheduling Request' page from the navigation menu (under Contact). Fill in your event details including title, date, time, estimated attendees, and description. A board member will review and approve your request.",
    keywords: ["scheduling request", "request event", "submit request", "event request", "book event", "reserve date"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I volunteer with MHMA?",
    a: "Go to the Volunteer page from the navigation menu (under Contact). Fill in your information, availability, and interests. A board member will review your submission and reach out to you.",
    keywords: ["volunteer", "help out", "volunteer signup", "community service", "get involved"],
    roles: ["board_member", "administrator", "member"],
  },
];
