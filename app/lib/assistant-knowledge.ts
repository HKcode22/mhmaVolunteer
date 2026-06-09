export interface QAItem {
  q: string;
  a: string;
  keywords: string[];
    roles?: ('board_member' | 'member' | 'administrator')[];
  pages?: string[];
}

export const knowledgeBase: QAItem[] = [
  {
    q: "How do I create a new event?",
    a: "Go to Dashboard → Events. You'll see an 'Add Event' button at the top. Click it and fill in the event title, date, time, location, description, and image. Click 'Create Event' to save. The event will appear on the public Events page and homepage automatically.",
    keywords: ["create event", "add event", "new event", "schedule event", "event form"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/events"],
  },
  {
    q: "How do I approve or reject RSVPs for an event?",
    a: "Go to Dashboard → Events. Scroll down to the RSVPs section. You'll see Approve (green check) and Reject (red X) buttons next to each pending RSVP. You can also use the 'Approve All' or 'Reject All' buttons to process all pending RSVPs at once.",
    keywords: ["approve rsvp", "reject rsvp", "confirm rsvp", "cancel rsvp", "rsvp pending"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/events"],
  },
  {
    q: "How do I create a new program?",
    a: "Go to Dashboard → Programs. Click 'Add Program'. Fill in the title, slug (URL name), description, images, stats, and testimonial quote. Click 'Create Program' to save. The program will appear on the Programs page.",
    keywords: ["create program", "add program", "new program", "program form"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/programs"],
  },
  {
    q: "How do I approve or reject program enrollments?",
    a: "Go to Dashboard → Programs. The Enrollments section shows all sign-ups with their status (pending, approved, rejected, completed). Use the Approve (green) or Reject (red) buttons next to pending enrollments, or use 'Approve All' / 'Reject All' to batch process them.",
    keywords: ["approve enrollment", "reject enrollment", "enrollment pending", "program enrollment"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/programs"],
  },
  {
    q: "How do I add news articles?",
    a: "Go to Dashboard → News. Click 'Add News'. Fill in the title, slug, excerpt (short summary), and content. You can also add an image. Set the published toggle to make it visible on the homepage. Click 'Save'.",
    keywords: ["create news", "add news", "new article", "news article", "publish news"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/news"],
  },
  {
    q: "How do I manage testimonials?",
    a: "Go to Dashboard → Testimonials. You can add new testimonials with a person's name, their role, the testimonial text, and select which pages to display it on. Use the Activate/Deactivate buttons to toggle visibility. Use 'Activate All' / 'Deactivate All' for bulk changes.",
    keywords: ["testimonial", "review", "feedback", "activate testimonial"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/testimonials"],
  },
  {
    q: "How do I update masjid construction progress?",
    a: "Go to Dashboard → Construction. You can add updates with images, videos, captions, and phase information. Each update tracks the fundraising progress (raised amount vs goal). Updates appear on the Masjid Construction page.",
    keywords: ["construction update", "masjid progress", "building update", "fundraising progress"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/construction"],
  },
  {
    q: "How do I view and manage donations?",
    a: "Go to Dashboard → Donations. Here you can see all donations, add manual donations (cash/check), and export data as CSV. The Pledges section below shows pending pledges that you can mark as fulfilled or cancelled.",
    keywords: ["donation", "pledge", "manual donation", "cash donation", "check donation", "export donations"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/donations"],
  },
  {
    q: "How do I manage pledges?",
    a: "Go to Dashboard → Pledges. All pledges are listed with their status (pending/fulfilled/cancelled). Use 'Fulfill' to mark a pledge as completed, or 'Cancel' to void it. Use 'Fulfill All' / 'Cancel All' for bulk actions.",
    keywords: ["pledge", "fulfill pledge", "cancel pledge", "pledge management"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/pledges"],
  },
  {
    q: "How do I handle contact form submissions?",
    a: "Go to Dashboard → Contact & FAQ. Contact submissions are listed with a 'Mark as Read' button. Use 'Mark All Read' to batch process unread submissions. You can also manage FAQs, view volunteer submissions, and reorder FAQ items.",
    keywords: ["contact submission", "contact form", "mark read", "faq", "volunteer submission"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/contact-submissions"],
  },
  {
    q: "How do I manage users and members?",
    a: "Go to Dashboard → Members. You can see all registered users, their roles (board member or regular member), and their activity (enrollments, RSVPs, pledges, donations). You can delete users if needed.",
    keywords: ["user", "member", "board member", "delete user", "user list"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/members"],
  },
  {
    q: "How do I view activity logs?",
    a: "Go to Dashboard → Activity Log. This shows all actions taken by board members (creating events, approving RSVPs, etc.). You can revert certain changes if needed using the 'Revert' button.",
    keywords: ["activity log", "audit trail", "history", "revert", "board activity"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/activity"],
  },
  {
    q: "How do I see analytics and stats?",
    a: "Go to Dashboard → Analytics. This shows charts and cards with key metrics: events, programs, users, donations, enrollments, RSVPs, and more. You can also edit the About page stats (years serving, number of families) from this page.",
    keywords: ["analytics", "statistics", "stats", "metrics", "dashboard stats", "about stats"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/analytics"],
  },
  {
    q: "How do I manage scheduling requests?",
    a: "Go to Dashboard → Scheduling. Event scheduling requests from the public appear here with details about their event. Use Approve (green) or Reject (red) buttons per request, or use 'Approve All' / 'Reject All' for bulk processing.",
    keywords: ["scheduling request", "event request", "approve scheduling", "reject scheduling"],
    roles: ["board_member", "administrator"],
    pages: ["/dashboard/scheduling"],
  },
  {
    q: "How do I change my password?",
    a: "Go to Settings (gear icon in the top nav bar). Under your profile, you can update your password. You'll need to enter your current password and then your new password.",
    keywords: ["change password", "update password", "reset password", "settings"],
    roles: ["board_member", "administrator", "member"],
    pages: ["/dashboard/settings"],
  },
  {
    q: "How do I subscribe or unsubscribe from emails?",
    a: "Go to the Subscribe page from the navigation menu. You'll see two tabs: Subscribe and Unsubscribe. Enter your email and optionally your name, then click the button. Board members can also manage subscribers from Dashboard → News → Subscribers section.",
    keywords: ["subscribe", "unsubscribe", "email list", "newsletter", "mailing list"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "Where can I find prayer times?",
    a: "Prayer times are displayed on the homepage and the dedicated Prayer Times page. The times are fetched live from an API. Jumu'ah prayer information is also shown. Click 'View Full Monthly Schedule' for the complete monthly timetable.",
    keywords: ["prayer time", "salah", "fajr", "dhuhr", "asr", "maghrib", "isha", "jumu'ah"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I view the board of directors?",
    a: "Go to the Board page from the navigation menu. You'll see all board members with their photos, titles, and contact information organized by Board of Directors and Board of Trustees sections.",
    keywords: ["board", "director", "trustee", "board member", "leadership"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How can I see masjid construction progress?",
    a: "Go to the Masjid Construction page. You'll see the fundraising progress bar, campaign stats (total raised, donor count, square footage), recent updates with photos, giving tiers, donor wall, and information about other ways to give.",
    keywords: ["masjid construction", "building progress", "fundraising", "campaign", "donor wall"],
    roles: ["board_member", "administrator", "member"],
  },
  {
    q: "How do I create an invite code for new board members?",
    a: "Go to Dashboard. In the Invite Codes section at the bottom, you can generate a new invite code. New board members use this code when registering. Each code is one-time use only.",
    keywords: ["invite code", "board registration", "new board member", "generate code"],
    roles: ["administrator"],
    pages: ["/dashboard"],
  },
];
