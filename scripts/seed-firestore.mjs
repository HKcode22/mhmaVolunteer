import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const serviceAccountPath = resolve(os.homedir(), ".keys", "mhma-firebase.json");
if (!existsSync(serviceAccountPath)) {
  console.error("Service account file not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();
const Timestamp = admin.firestore.Timestamp;
const FieldValue = admin.firestore.FieldValue;

db.settings({ ignoreUndefinedProperties: true });

function docs(collection) {
  return db.collection(collection);
}

async function seed() {
  console.log("\n========== MHMA Firestore Seed ==========\n");

  // -----------------------------------------------------------------------
  // 1. SEED EVENTS
  // -----------------------------------------------------------------------
  console.log("[1/8] Seeding Events...");
  const events = [
    {
      title: "Community Iftar 2026",
      slug: "community-iftar-2026",
      date: "2026-03-15",
      time: "6:30 PM",
      location: "MHMA - Mountain House",
      rsvpLink: "https://forms.gle/example1",
      description: "Join us for a blessed community iftar during Ramadan. All are welcome!",
      poster: "",
      eventName: "Community Iftar",
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Eid ul-Fitr Prayer",
      slug: "eid-ul-fitr-2026",
      date: "2026-04-10",
      time: "8:00 AM",
      location: "Mountain House Unity Center",
      rsvpLink: "",
      description: "Eid prayer followed by community celebration and refreshments.",
      poster: "",
      eventName: "Eid Prayer",
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Youth Sports Tournament",
      slug: "youth-sports-tournament-2026",
      date: "2026-05-01",
      time: "10:00 AM",
      location: "Mountain House Community Park",
      rsvpLink: "https://forms.gle/example2",
      description: "Annual youth sports tournament. Register your team today!",
      poster: "",
      eventName: "Youth Sports",
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Board Meeting - June 2026",
      slug: "board-meeting-june-2026",
      date: "2026-06-05",
      time: "7:00 PM",
      location: "MHMA Conference Room",
      rsvpLink: "",
      description: "Monthly board meeting. All members welcome to attend.",
      poster: "",
      eventName: "Board Meeting",
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Those Promised Paradise",
      slug: "those-promised-paradise",
      date: "2026-05-05",
      time: "",
      location: "",
      rsvpLink: "",
      description: "",
      poster: "",
      eventName: "",
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Palestine in the Quran and Sunnah",
      slug: "palestine-quran-sunnah",
      date: "2026-05-05",
      time: "",
      location: "",
      rsvpLink: "",
      description: "",
      poster: "",
      eventName: "",
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Sex Ed in the Light of Islam",
      slug: "sex-ed-light-islam",
      date: "2026-05-05",
      time: "",
      location: "",
      rsvpLink: "",
      description: "",
      poster: "",
      eventName: "",
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Kids Hajj Event",
      slug: "kids-hajj-event",
      date: "2026-06-01",
      time: "",
      location: "",
      rsvpLink: "",
      description: "",
      poster: "",
      eventName: "",
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
  ];

  for (const event of events) {
    await docs("events").doc(event.slug).set(event);
  }
  console.log(`  Added ${events.length} events`);

  // -----------------------------------------------------------------------
  // 2. SEED PROGRAMS
  // -----------------------------------------------------------------------
  console.log("[2/8] Seeding Programs...");
  const programs = [
    {
      title: "Youth Sports League",
      slug: "youth-sports-league",
      description: "Healthy competition and team building through basketball, soccer, and other sports for youth ages 8-18.",
      image: "https://mhma.us/wp-content/uploads/2024/06/Youth-Sports-League.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Players", value: "80+" },
        { label: "Teams", value: "8" },
        { label: "Seasons/Year", value: "2" },
        { label: "Volunteers", value: "12" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Ladies Meetup",
      slug: "ladies-meetup",
      description: "A monthly gathering for sisters to connect, learn, and support each other in faith and community.",
      image: "https://mhma.us/wp-content/uploads/2024/06/Ladies-Meetup.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Members", value: "50+" },
        { label: "Events/Month", value: "2" },
        { label: "Since", value: "2018" },
        { label: "Coordinator", value: "Sisters" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Learn 3D Printing",
      slug: "learn-3d-printing",
      description: "Hands-on workshops teaching 3D design and printing skills to youth and adults.",
      image: "https://mhma.us/wp-content/uploads/2024/06/Learn-3D-Printing.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Students", value: "30+" },
        { label: "Workshops", value: "4" },
        { label: "Duration", value: "8 weeks" },
        { label: "Instructors", value: "2" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Urdu Academy",
      slug: "urdu-academy",
      description: "Urdu language classes for all ages focusing on reading, writing, and conversational skills.",
      image: "https://mhma.us/wp-content/uploads/2024/06/Urdu-Academy.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Students", value: "40+" },
        { label: "Levels", value: "3" },
        { label: "Duration", value: "10 weeks" },
        { label: "Teachers", value: "3" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Maktab Program",
      slug: "maktab-program",
      description: "Foundational Quran recitation for children with Tajweed instruction. Students learn proper pronunciation and recitation rules.",
      image: "https://mhma.us/wp-content/uploads/2024/06/Maktab-Program.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Students", value: "40+" },
        { label: "Days/Week", value: "5" },
        { label: "Age Group", value: "5-12" },
        { label: "Teachers", value: "4" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Family Night",
      slug: "family-night",
      description: "Monthly family-friendly events with games, dinner, and activities for all ages.",
      image: "https://mhma.us/wp-content/uploads/2024/06/Family-Night.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Attendees", value: "100+" },
        { label: "Events/Month", value: "1" },
        { label: "Since", value: "2019" },
        { label: "Volunteers", value: "15" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Jummah And Salah",
      slug: "jummah-and-salah",
      description: "Weekly Jummah prayers and daily salah services for the Mountain House community.",
      image: "https://mhma.us/wp-content/uploads/2024/06/Jummah-And-Salah.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Attendees", value: "200+" },
        { label: "Jummah", value: "Weekly" },
        { label: "Prayers/Day", value: "5" },
        { label: "Imams", value: "3" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Islamic Center of Mountain House",
      slug: "islamic-center-of-mountain-house",
      description: "The Islamic Center serving the Mountain House community with educational and religious programs.",
      image: "https://mhma.us/wp-content/uploads/2024/06/Islamic-Center-of-Mountain-House.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Members", value: "500+" },
        { label: "Programs", value: "12" },
        { label: "Since", value: "2015" },
        { label: "Staff", value: "8" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "WISH",
      slug: "wish",
      description: "Women in Sisterhood and Hope - a support network for women in the community.",
      image: "https://mhma.us/wp-content/uploads/2024/06/WISH.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Members", value: "60+" },
        { label: "Events/Month", value: "2" },
        { label: "Since", value: "2020" },
        { label: "Coordinator", value: "Sisters" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Quran Hifz Program",
      slug: "quran-hifz-program",
      description: "Structured memorization of the Holy Quran guided by qualified teachers. Students progress at their own pace with regular assessments.",
      image: "https://mhma.us/wp-content/uploads/2024/06/Quran-Hifz-Program.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Students", value: "20+" },
        { label: "Days/Week", value: "6" },
        { label: "Memorized", value: "5 Juz" },
        { label: "Teachers", value: "3" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Boy Scouts",
      slug: "boy-scouts",
      description: "Scouting program for boys teaching leadership, outdoor skills, and community service.",
      image: "https://mhma.us/wp-content/uploads/2024/06/Boy-Scouts.webp",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Scouts", value: "25+" },
        { label: "Den Leaders", value: "5" },
        { label: "Meetings/Month", value: "4" },
        { label: "Since", value: "2021" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
    {
      title: "Arabic Academy",
      slug: "arabic-academy",
      description: "Learn Arabic from beginner to advanced levels. Focus on conversational Arabic, grammar, and classical Quranic Arabic.",
      image: "https://mhma.us/wp-content/uploads/2016/08/Arabic.png",
      imagePoster: "",
      additionalContent: "",
      stats: [
        { label: "Students", value: "60+" },
        { label: "Levels", value: "4" },
        { label: "Duration", value: "12 weeks" },
        { label: "Teachers", value: "5" },
      ],
      useHardcodedVersion: true,
      createdBy: "seed",
      createdAt: Timestamp.now(),
    },
  ];

  for (const program of programs) {
    await docs("programs").doc(program.slug).set(program);
  }
  console.log(`  Added ${programs.length} programs`);

  // -----------------------------------------------------------------------
  // 3. SEED JOURNAL
  // -----------------------------------------------------------------------
  console.log("[3/8] Seeding Journal...");
  const journalMeta = JSON.parse(readFileSync(resolve(__dirname, "journal-meta.json"), "utf8"));
  const journalEntries = Object.entries(journalMeta).map(([slug, data]) => ({
    title: data.title,
    slug,
    content: `<p>${data.title}</p>`,
    dateHeldOn: data.date,
    datePublished: data.date,
    attendees: data.attendees || "",
    createdBy: "seed",
    createdAt: Timestamp.now(),
  }));

  for (const entry of journalEntries) {
    await docs("journal").doc(entry.slug).set(entry);
  }
  console.log(`  Added ${journalEntries.length} journal entries`);

  // -----------------------------------------------------------------------
  // 4. SEED SITE CONTENT - Contact Page
  // -----------------------------------------------------------------------
  console.log("[4/8] Seeding Site Content (Contact)...");
  await docs("siteContent").doc("contact").set({
    address: "Mountain House Unity Center\n1170 Stonebridge Drive\nMountain House, CA 95391",
    phone: "(209) 555-0123",
    email: "info@mhma.us",
    hours: "Office Hours:\nMon-Fri: 10:00 AM - 5:00 PM\nWeekend: By Appointment",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0977704984784!2d-121.5405094!3d37.7786645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80900c02b5b8f353%3A0xa8e69c4f6e63c44a!2sMountain%20House%20Unity%20Center!5e0!3m2!1sen!2sus!4v1699400000000!5m2!1sen!2sus",
    social: {
      facebook: "https://www.facebook.com/mhma95391",
      instagram: "https://www.instagram.com/mhma.ig/",
      twitter: "https://x.com/mhmatweets",
      youtube: "https://www.youtube.com/@MHMAYouTube",
      linkedin: "https://www.linkedin.com/company/mountain-house-muslim-association/",
    },
    heroTitle: "Contact Us",
    heroSubtitle: "We're here to help. Reach out with any question, request, or feedback.",
  });
  console.log("  Added siteContent/contact");

  // -----------------------------------------------------------------------
  // 5. SEED PRAYER TIMES CONFIG
  // -----------------------------------------------------------------------
  console.log("[5/8] Seeding Prayer Times Config...");
  await docs("siteContent").doc("prayerTimes").set({
    fajr: "4:48 AM",
    dhuhr: "1:00 PM",
    asr: "5:56 PM",
    maghrib: "7:58 PM",
    isha: "9:19 PM",
    jummahBayan: "1:45 PM",
    jummahIqamah: "2:10 PM",
  });
  console.log("  Added siteContent/prayerTimes");

  // -----------------------------------------------------------------------
  // 6. SEED ANNOUNCEMENTS
  // -----------------------------------------------------------------------
  console.log("[6/8] Seeding Announcements...");
  await docs("siteContent").doc("announcements").set({
    items: [
      { text: "Ramadan Mubarak! Join us for daily Taraweeh prayers at 8:30 PM", active: true },
      { text: "New Quran Maktab enrollment now open for ages 5-12", active: true },
      { text: "Community Iftar this Saturday - RSVP required", active: true },
    ],
  });
  console.log("  Added siteContent/announcements");

  // -----------------------------------------------------------------------
  // 7. CREATE FIREBASE AUTH USERS
  // -----------------------------------------------------------------------
  console.log("[7/8] Creating Firebase Auth users...");

  const users = [
    {
      email: "board@mhma.us",
      password: "Board@2026!Secure",
      displayName: "MHMA Board Admin",
      role: "administrator",
    },
    {
      email: "hk84164@gmail.com",
      password: "Admin@2026!Secure",
      displayName: "HK Admin",
      role: "administrator",
    },
  ];

  for (const userData of users) {
    try {
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
      });
      await auth.setCustomUserClaims(userRecord.uid, { role: userData.role });
      await docs("users").doc(userRecord.uid).set({
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log(`  Created user: ${userData.email} (${userRecord.uid})`);
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        console.log(`  User already exists: ${userData.email}`);
        const userRecord = await auth.getUserByEmail(userData.email);
        await auth.setCustomUserClaims(userRecord.uid, { role: userData.role });
      } else {
        console.log(`  Error creating ${userData.email}: ${err.message}`);
      }
    }
  }

  // -----------------------------------------------------------------------
  // 8. INDEXES NOTE
  // -----------------------------------------------------------------------
  console.log("[8/8] Setting up collection indexes note...");
  console.log("  Note: Composite indexes may be needed in Firebase Console for:\n" +
    "  - events: createdAt DESC\n" +
    "  - programs: createdAt DESC\n" +
    "  - journal: createdAt DESC\n" +
    "  - enrollments: createdAt DESC, status ASC\n" +
    "  - schedulingRequests: createdAt DESC, status ASC");

  // -----------------------------------------------------------------------
  // DONE
  // -----------------------------------------------------------------------
  console.log("\n========== Seed Complete ==========");
  console.log("\nFirestore Collections Created:");
  console.log(`  - events (${events.length} docs)`);
  console.log(`  - programs (${programs.length} docs)`);
  console.log(`  - journal (${journalEntries.length} docs)`);
  console.log("  - siteContent/contact");
  console.log("  - siteContent/prayerTimes");
  console.log("  - siteContent/announcements");
  console.log("  - users (2 users)");
  console.log("\nAuth Users Created:");
  console.log("  - board@mhma.us / Board@2026!Secure (role: administrator)");
  console.log("  - hk84164@gmail.com / Admin@2026!Secure (role: administrator)");
  console.log("\n⚠  IMPORTANT: Change passwords after first login!");
  console.log("   Go to: https://console.firebase.google.com/project/mhma-backend/authentication/users");
  console.log("");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
