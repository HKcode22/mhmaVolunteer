import { db } from "./firebase-client";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";

const WRITE_TIMEOUT = 30000; // 30 seconds

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT: ${label} exceeded ${WRITE_TIMEOUT}ms`)), WRITE_TIMEOUT)
    ),
  ]);
}

export interface FirebaseEvent {
  id?: string;
  title: string;
  slug: string;
  poster?: string;
  date?: string;
  time?: string;
  location?: string;
  rsvpLink?: string;
  description?: string;
  eventName?: string;
  createdBy?: string;
  createdAt?: any;
}

export interface FirebaseProgram {
  id?: string;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  imagePoster?: string;
  additionalContent?: string;
  stats?: { label: string; value: string }[];
  layout?: "text_first" | "poster_first";
  quote?: string;
  quoteAuthor?: string;
  useHardcodedVersion?: boolean;
  createdBy?: string;
  createdAt?: any;
}

export interface FirebaseJournalEntry {
  id?: string;
  title: string;
  slug: string;
  content?: string;
  dateHeldOn?: string;
  datePublished?: string;
  attendees?: string;
  createdBy?: string;
  createdAt?: any;
}

export interface FirebaseEnrollment {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  program: string;
  status: "pending" | "approved" | "rejected" | "completed";
  message?: string;
  date?: string;
  adminNotes?: string;
  createdAt?: any;
}

export interface FirebaseSchedulingRequest {
  id?: string;
  organizer: { firstName: string; lastName: string; email: string; phone: string };
  eventTitle: string;
  category: string;
  description?: string;
  start?: string;
  end?: string;
  hasHostSpeaker?: string;
  hasFood?: string;
  foodService?: string[];
  location?: string;
  facility?: string;
  roundTables?: number;
  rectangularTables?: number;
  chairs?: number;
  equipment?: string[];
  volunteers?: number;
  helpers?: number;
  rsvpRequired?: string;
  paymentRequired?: string;
  comments?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
}

export interface FirebaseContactSubmission {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt?: any;
}

function collectionData<T>(snapshot: any): T[] {
  return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }) as T);
}

export const collections = {
  events: "events",
  programs: "programs",
  journal: "journal",
  enrollments: "enrollments",
  schedulingRequests: "schedulingRequests",
  contactSubmissions: "contactSubmissions",
  versions: "versions",
};

export async function fetchEvents(limitCount = 10): Promise<FirebaseEvent[]> {
  const q = query(collection(db, collections.events), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseEvent>(snap);
}

export async function fetchEventById(id: string): Promise<FirebaseEvent | null> {
  const snap = await getDoc(doc(db, collections.events, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FirebaseEvent;
}

export async function addEvent(data: Omit<FirebaseEvent, "id" | "createdAt">): Promise<string> {
  try {
    const ref = await withTimeout(
      addDoc(collection(db, collections.events), { ...data, createdAt: serverTimestamp() }),
      "addEvent"
    );
    console.log("Firestore: addEvent success, id:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("Firestore: addEvent FAILED:", err);
    throw err;
  }
}

export async function updateEvent(id: string, data: Partial<FirebaseEvent>): Promise<void> {
  try {
    // Save current state as a version before updating
    const currentSnap = await getDoc(doc(db, collections.events, id));
    if (currentSnap.exists()) {
      await saveVersion("event", id, currentSnap.data());
    }
    await withTimeout(
      updateDoc(doc(db, collections.events, id), { ...data, updatedAt: serverTimestamp() }),
      "updateEvent"
    );
    console.log("Firestore: updateEvent success, id:", id);
  } catch (err) {
    console.error("Firestore: updateEvent FAILED:", err);
    throw err;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, collections.events, id)), "deleteEvent");
    console.log("Firestore: deleteEvent success, id:", id);
  } catch (err) {
    console.error("Firestore: deleteEvent FAILED:", err);
    throw err;
  }
}

export async function fetchPrograms(limitCount = 10): Promise<FirebaseProgram[]> {
  const q = query(collection(db, collections.programs), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseProgram>(snap);
}

export async function fetchProgramBySlug(slug: string): Promise<FirebaseProgram | null> {
  const q = query(collection(db, collections.programs), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as FirebaseProgram;
}

export async function fetchProgramById(id: string): Promise<FirebaseProgram | null> {
  const snap = await getDoc(doc(db, collections.programs, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FirebaseProgram;
}

export async function addProgram(data: Omit<FirebaseProgram, "id" | "createdAt">): Promise<string> {
  try {
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const ref = doc(db, collections.programs, slug);
    await withTimeout(
      setDoc(ref, { ...data, slug, createdAt: serverTimestamp() }),
      "addProgram"
    );
    console.log("Firestore: addProgram success, id:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("Firestore: addProgram FAILED:", err);
    throw err;
  }
}

export async function updateProgram(id: string, data: Partial<FirebaseProgram>): Promise<void> {
  try {
    const currentSnap = await getDoc(doc(db, collections.programs, id));
    if (currentSnap.exists()) {
      await saveVersion("program", id, currentSnap.data());
    }
    const newSlug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (newSlug && newSlug !== id) {
      const newData = { ...data, slug: newSlug, updatedAt: serverTimestamp() };
      await setDoc(doc(db, collections.programs, newSlug), { ...currentSnap.data(), ...newData });
      await deleteDoc(doc(db, collections.programs, id));
      console.log("Firestore: updateProgram migrated from", id, "to", newSlug);
    } else {
      await withTimeout(
        updateDoc(doc(db, collections.programs, id), { ...data, updatedAt: serverTimestamp() }),
        "updateProgram"
      );
      console.log("Firestore: updateProgram success, id:", id);
    }
  } catch (err) {
    console.error("Firestore: updateProgram FAILED:", err);
    throw err;
  }
}

export async function deleteProgram(id: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, collections.programs, id)), "deleteProgram");
    console.log("Firestore: deleteProgram success, id:", id);
  } catch (err) {
    console.error("Firestore: deleteProgram FAILED:", err);
    throw err;
  }
}

export async function fetchJournalEntries(limitCount = 10): Promise<FirebaseJournalEntry[]> {
  const q = query(collection(db, collections.journal), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseJournalEntry>(snap);
}

export async function fetchJournalEntryBySlug(slug: string): Promise<FirebaseJournalEntry | null> {
  const q = query(collection(db, collections.journal), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as FirebaseJournalEntry;
}

export async function addJournalEntry(data: Omit<FirebaseJournalEntry, "id" | "createdAt">): Promise<string> {
  try {
    const ref = await withTimeout(
      addDoc(collection(db, collections.journal), { ...data, createdAt: serverTimestamp() }),
      "addJournalEntry"
    );
    console.log("Firestore: addJournalEntry success, id:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("Firestore: addJournalEntry FAILED:", err);
    throw err;
  }
}

export async function updateJournalEntry(id: string, data: Partial<FirebaseJournalEntry>): Promise<void> {
  try {
    await withTimeout(
      updateDoc(doc(db, collections.journal, id), { ...data, updatedAt: serverTimestamp() }),
      "updateJournalEntry"
    );
    console.log("Firestore: updateJournalEntry success, id:", id);
  } catch (err) {
    console.error("Firestore: updateJournalEntry FAILED:", err);
    throw err;
  }
}

export async function deleteJournalEntry(id: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, collections.journal, id)), "deleteJournalEntry");
    console.log("Firestore: deleteJournalEntry success, id:", id);
  } catch (err) {
    console.error("Firestore: deleteJournalEntry FAILED:", err);
    throw err;
  }
}

export async function fetchEnrollments(limitCount = 50): Promise<FirebaseEnrollment[]> {
  const q = query(collection(db, collections.enrollments), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseEnrollment>(snap);
}

export async function addEnrollment(data: Omit<FirebaseEnrollment, "id" | "createdAt">): Promise<string> {
  try {
    const ref = await withTimeout(
      addDoc(collection(db, collections.enrollments), { ...data, createdAt: serverTimestamp() }),
      "addEnrollment"
    );
    console.log("Firestore: addEnrollment success, id:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("Firestore: addEnrollment FAILED:", err);
    throw err;
  }
}

export async function updateEnrollment(id: string, data: Partial<FirebaseEnrollment>): Promise<void> {
  try {
    await withTimeout(
      updateDoc(doc(db, collections.enrollments, id), { ...data, updatedAt: serverTimestamp() }),
      "updateEnrollment"
    );
    console.log("Firestore: updateEnrollment success, id:", id);
  } catch (err) {
    console.error("Firestore: updateEnrollment FAILED:", err);
    throw err;
  }
}

export async function deleteEnrollment(id: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, collections.enrollments, id)), "deleteEnrollment");
    console.log("Firestore: deleteEnrollment success, id:", id);
  } catch (err) {
    console.error("Firestore: deleteEnrollment FAILED:", err);
    throw err;
  }
}

export async function fetchSchedulingRequests(limitCount = 50): Promise<FirebaseSchedulingRequest[]> {
  const q = query(collection(db, collections.schedulingRequests), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseSchedulingRequest>(snap);
}

export async function addSchedulingRequest(data: Omit<FirebaseSchedulingRequest, "id" | "createdAt">): Promise<string> {
  try {
    const ref = await withTimeout(
      addDoc(collection(db, collections.schedulingRequests), { ...data, createdAt: serverTimestamp() }),
      "addSchedulingRequest"
    );
    console.log("Firestore: addSchedulingRequest success, id:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("Firestore: addSchedulingRequest FAILED:", err);
    throw err;
  }
}

export async function updateSchedulingRequest(id: string, data: Partial<FirebaseSchedulingRequest>): Promise<void> {
  try {
    await withTimeout(
      updateDoc(doc(db, collections.schedulingRequests, id), { ...data, updatedAt: serverTimestamp() }),
      "updateSchedulingRequest"
    );
    console.log("Firestore: updateSchedulingRequest success, id:", id);
  } catch (err) {
    console.error("Firestore: updateSchedulingRequest FAILED:", err);
    throw err;
  }
}

export async function deleteSchedulingRequest(id: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, collections.schedulingRequests, id)), "deleteSchedulingRequest");
    console.log("Firestore: deleteSchedulingRequest success, id:", id);
  } catch (err) {
    console.error("Firestore: deleteSchedulingRequest FAILED:", err);
    throw err;
  }
}

export async function fetchContactSubmissions(limitCount = 50): Promise<FirebaseContactSubmission[]> {
  const q = query(collection(db, collections.contactSubmissions), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseContactSubmission>(snap);
}

export async function markContactSubmissionRead(id: string): Promise<void> {
  try {
    await withTimeout(
      updateDoc(doc(db, collections.contactSubmissions, id), { read: true }),
      "markContactSubmissionRead"
    );
  } catch (err) {
    console.error("Firestore: markContactSubmissionRead FAILED:", err);
    throw err;
  }
}

export async function deleteContactSubmission(id: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, collections.contactSubmissions, id)), "deleteContactSubmission");
    console.log("Firestore: deleteContactSubmission success, id:", id);
  } catch (err) {
    console.error("Firestore: deleteContactSubmission FAILED:", err);
    throw err;
  }
}

export async function addContactSubmission(data: Omit<FirebaseContactSubmission, "id" | "createdAt">): Promise<string> {
  try {
    const ref = await withTimeout(
      addDoc(collection(db, collections.contactSubmissions), { ...data, read: false, createdAt: serverTimestamp() }),
      "addContactSubmission"
    );
    console.log("Firestore: addContactSubmission success");
    return ref.id;
  } catch (err) {
    console.error("Firestore: addContactSubmission FAILED:", err);
    throw err;
  }
}

// ─── Invite Code Functions ───

export interface InviteCode {
  id?: string;
  code: string;
  used: boolean;
  usedBy?: string;
  generatedBy: string;
  createdAt: any;
  usedAt?: any;
}

const INVITE_CODES = "inviteCodes";

export async function generateInviteCode(generatedBy: string): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  try {
    await withTimeout(
      addDoc(collection(db, INVITE_CODES), { code, used: false, generatedBy, createdAt: serverTimestamp(), usedBy: null, usedAt: null }),
      "generateInviteCode"
    );
    console.log("Firestore: generateInviteCode success");
    return code;
  } catch (err) {
    console.error("Firestore: generateInviteCode FAILED:", err);
    throw err;
  }
}

export async function validateInviteCode(code: string): Promise<boolean> {
  const q = query(collection(db, INVITE_CODES), where("code", "==", code), where("used", "==", false), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function markInviteCodeUsed(code: string, usedBy: string): Promise<void> {
  const q = query(collection(db, INVITE_CODES), where("code", "==", code), where("used", "==", false), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docRef = doc(db, INVITE_CODES, snap.docs[0].id);
    await updateDoc(docRef, { used: true, usedBy, usedAt: serverTimestamp() });
  }
}

export async function fetchInviteCodes(): Promise<InviteCode[]> {
  const q = query(collection(db, INVITE_CODES), orderBy("createdAt", "desc"), limit(100));
  const snap = await getDocs(q);
  return collectionData<InviteCode>(snap);
}

export async function deleteInviteCode(id: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, INVITE_CODES, id)), "deleteInviteCode");
    console.log("Firestore: deleteInviteCode success");
  } catch (err) {
    console.error("Firestore: deleteInviteCode FAILED:", err);
    throw err;
  }
}

// ─── Users ───

export interface FirebaseUser {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  role: string;
  createdAt?: any;
}

const USERS_COLLECTION = "users";

export async function fetchUsers(limitCount = 500): Promise<FirebaseUser[]> {
  const q = query(collection(db, USERS_COLLECTION), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseUser>(snap);
}

// ─── Testimonials ───

export interface Testimonial {
  id?: string;
  name: string;
  role?: string;
  content: string;
  displayOn: string[]; // e.g., ["homepage", "about", "programs"]
  active: boolean;
  createdAt?: any;
}

const TESTIMONIALS = "testimonials";

export async function fetchTestimonials(limitCount = 50): Promise<Testimonial[]> {
  const q = query(collection(db, TESTIMONIALS), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<Testimonial>(snap);
}

export async function addTestimonial(data: Omit<Testimonial, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, TESTIMONIALS), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateTestimonial(id: string, data: Partial<Testimonial>): Promise<void> {
  await updateDoc(doc(db, TESTIMONIALS, id), data);
}

export async function deleteTestimonial(id: string): Promise<void> {
  await deleteDoc(doc(db, TESTIMONIALS, id));
}

// ─── Activity Log ───

export interface ActivityLogEntry {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  targetType?: string;
  targetId?: string;
  createdAt?: any;
}

const ACTIVITY_LOG_COLLECTION = "activityLog";

export async function logActivity(entry: Omit<ActivityLogEntry, "id" | "createdAt">): Promise<string> {
  try {
    const ref = await withTimeout(
      addDoc(collection(db, ACTIVITY_LOG_COLLECTION), { ...entry, createdAt: serverTimestamp() }),
      "logActivity"
    );
    return ref.id;
  } catch (err) {
    console.error("Firestore: logActivity FAILED:", err);
    return "";
  }
}

export async function fetchActivityLog(limitCount = 100): Promise<ActivityLogEntry[]> {
  const q = query(collection(db, ACTIVITY_LOG_COLLECTION), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<ActivityLogEntry>(snap);
}

// ─── Versioning / Revert Functions ───

export async function saveVersion(targetType: string, targetId: string, data: any): Promise<string> {
  try {
    if (!targetId || !data) return "";
    const ref = await withTimeout(
      addDoc(collection(db, collections.versions), {
        targetType,
        targetId,
        data,
        createdAt: serverTimestamp(),
        restoredAt: null,
      }),
      "saveVersion"
    );
    return ref.id;
  } catch (err) {
    return "";
  }
}

export async function fetchVersions(targetType: string, targetId: string): Promise<any[]> {
  if (!targetId) return [];
  const q = query(
    collection(db, collections.versions),
    where("targetType", "==", targetType),
    where("targetId", "==", targetId),
    limit(10)
  );
  const snap = await getDocs(q);
  const data = collectionData(snap);
  data.sort((a: any, b: any) => ((b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
  return data;
}

const TARGET_TYPE_COLLECTION: Record<string, string> = {
  program: "programs",
  event: "events",
};

export async function restoreVersion(versionId: string, userId: string, userEmail: string, userName: string): Promise<boolean> {
  try {
    const versionSnap = await getDoc(doc(db, collections.versions, versionId));
    if (!versionSnap.exists()) return false;
    const version = versionSnap.data() as any;
    const { targetType, targetId, data } = version;
    if (!targetType || !targetId || !data) return false;

    const collectionName = TARGET_TYPE_COLLECTION[targetType] || targetType;
    if (!collectionName) return false;

    // Restore data to the original document
    await updateDoc(doc(db, collectionName, targetId), { ...data, restoredFromVersion: versionId, updatedAt: serverTimestamp() });
    // Mark version as restored
    await updateDoc(doc(db, collections.versions, versionId), { restoredAt: serverTimestamp(), restoredBy: userId });
    // Log the restore action
    await logActivity({
      userId, userEmail, userName,
      action: "restore",
      details: `Restored ${targetType}: ${data.title || data.name || targetId}`,
      targetType,
      targetId,
    });
    return true;
  } catch (err) {
    console.error("Failed to restore version:", err);
    return false;
  }
}

// ─── RSVP Functions ───

export interface FirebaseRSVP {
  id?: string;
  eventId?: string;
  eventTitle: string;
  fullName: string;
  email: string;
  phone: string;
  attendees: number;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt?: any;
}

const RSVP_COLLECTION = "rsvps";

export async function fetchRSVPs(limitCount = 100): Promise<FirebaseRSVP[]> {
  const q = query(collection(db, RSVP_COLLECTION), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseRSVP>(snap);
}

export async function fetchRSVPsByEvent(eventId: string): Promise<FirebaseRSVP[]> {
  const q = query(collection(db, RSVP_COLLECTION), where("eventId", "==", eventId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return collectionData<FirebaseRSVP>(snap);
}

export async function addRSVP(data: Omit<FirebaseRSVP, "id" | "createdAt" | "status">): Promise<string> {
  try {
    const ref = await withTimeout(
      addDoc(collection(db, RSVP_COLLECTION), { ...data, status: "pending", createdAt: serverTimestamp() }),
      "addRSVP"
    );
    console.log("Firestore: addRSVP success, id:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("Firestore: addRSVP FAILED:", err);
    throw err;
  }
}

export async function updateRSVP(id: string, data: Partial<FirebaseRSVP>): Promise<void> {
  try {
    await withTimeout(
      updateDoc(doc(db, RSVP_COLLECTION, id), { ...data, updatedAt: serverTimestamp() }),
      "updateRSVP"
    );
    console.log("Firestore: updateRSVP success, id:", id);
  } catch (err) {
    console.error("Firestore: updateRSVP FAILED:", err);
    throw err;
  }
}

export async function deleteRSVP(id: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, RSVP_COLLECTION, id)), "deleteRSVP");
    console.log("Firestore: deleteRSVP success, id:", id);
  } catch (err) {
    console.error("Firestore: deleteRSVP FAILED:", err);
    throw err;
  }
}

// ─── Analytics Snapshots ───
// Commented out — client-side compute is used instead (standard practice for this scale).
// Uncomment and wire into a Vercel cron job if the site grows to 50,000+ records.

// const ANALYTICS_COLLECTION = "analyticsSnapshots";

// export interface AnalyticsSnapshot {
//   id?: string;
//   date: string;
//   totalUsers: number;
//   newUsers30d: number;
//   totalEnrollments: number;
//   totalRSVPs: number;
//   totalSubmissions: number;
//   totalEvents: number;
//   totalPrograms: number;
//   totalJournals: number;
//   totalInviteCodes: number;
//   enrollmentByStatus: { pending: number; approved: number; rejected: number; completed: number };
//   rsvpByStatus: { pending: number; confirmed: number; cancelled: number };
//   requestsByStatus: { pending: number; approved: number; rejected: number };
//   userRoleBreakdown: Record<string, number>;
//   engagementScore: number;
//   createdAt?: any;
// }

// export async function saveAnalyticsSnapshot(data: Omit<AnalyticsSnapshot, "id" | "createdAt" | "date">): Promise<void> {
//   const today = new Date().toISOString().split("T")[0];
//   const existing = await getDocs(
//     query(collection(db, ANALYTICS_COLLECTION), where("date", "==", today), limit(1))
//   );
//   if (!existing.empty) {
//     await updateDoc(doc(db, ANALYTICS_COLLECTION, existing.docs[0].id), { ...data, updatedAt: serverTimestamp() });
//     console.log("Firestore: analytics snapshot updated for", today);
//     return;
//   }
//   await addDoc(collection(db, ANALYTICS_COLLECTION), { ...data, date: today, createdAt: serverTimestamp() });
//   console.log("Firestore: analytics snapshot saved for", today);
// }

// export async function fetchAnalyticsSnapshots(limitCount = 30): Promise<AnalyticsSnapshot[]> {
//   const q = query(collection(db, ANALYTICS_COLLECTION), orderBy("date", "desc"), limit(limitCount));
//   const snap = await getDocs(q);
//   return collectionData<AnalyticsSnapshot>(snap);
// }

// ─── Masjid Construction Updates ───

const MASJID_CONSTRUCTION = "masjidConstruction";

export interface FirebaseMasjidUpdate {
  id?: string;
  image: string;
  video?: string;
  caption: string;
  phase: string;
  raised: number;
  goal: number;
  progressDate: string;
  createdBy?: string;
  createdAt?: any;
}

export async function fetchMasjidUpdates(limitCount = 10): Promise<FirebaseMasjidUpdate[]> {
  const q = query(collection(db, MASJID_CONSTRUCTION), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseMasjidUpdate>(snap);
}

export async function addMasjidUpdate(data: Omit<FirebaseMasjidUpdate, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, MASJID_CONSTRUCTION), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateMasjidUpdate(id: string, data: Partial<FirebaseMasjidUpdate>): Promise<void> {
  await updateDoc(doc(db, MASJID_CONSTRUCTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteMasjidUpdate(id: string): Promise<void> {
  await deleteDoc(doc(db, MASJID_CONSTRUCTION, id));
}

// ─── Pledges ───

export interface Pledge {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  amount: number;
  message?: string;
  status: "pending" | "fulfilled" | "cancelled";
  userUid?: string;
  createdAt?: any;
  fulfilledAt?: any;
  cancelledAt?: any;
}

const PLEDGES = "pledges";

export async function createPledge(data: Omit<Pledge, "id" | "createdAt" | "status">): Promise<string> {
  const ref = await addDoc(collection(db, PLEDGES), { ...data, status: "pending", createdAt: serverTimestamp() });
  return ref.id;
}

export async function fetchPledgesByUser(userId: string, email?: string): Promise<Pledge[]> {
  const results: Pledge[] = [];
  if (userId) {
    try {
      const q = query(collection(db, PLEDGES), where("userUid", "==", userId), limit(50));
      const snap = await getDocs(q);
      results.push(...collectionData<Pledge>(snap));
    } catch (e) {
      console.error("pledge userUid query failed:", e);
    }
  }
  if (email && results.length === 0) {
    try {
      const q2 = query(collection(db, PLEDGES), where("email", "==", email), limit(50));
      const snap2 = await getDocs(q2);
      results.push(...collectionData<Pledge>(snap2));
    } catch (e) {
      console.error("pledge email query failed:", e);
    }
  }
  results.sort((a, b) => {
    const ta = a.createdAt?.toDate?.()?.getTime() || (typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0);
    const tb = b.createdAt?.toDate?.()?.getTime() || (typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0);
    return tb - ta;
  });
  return results;
}

export async function fetchPledges(limitCount = 100): Promise<Pledge[]> {
  const q = query(collection(db, PLEDGES), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<Pledge>(snap);
}

export async function updatePledgeStatus(id: string, status: "fulfilled" | "cancelled"): Promise<void> {
  const update: Record<string, any> = { status };
  if (status === "fulfilled") update.fulfilledAt = serverTimestamp();
  if (status === "cancelled") update.cancelledAt = serverTimestamp();
  await updateDoc(doc(db, PLEDGES, id), update);
}

export async function deletePledge(id: string): Promise<void> {
  await deleteDoc(doc(db, PLEDGES, id));
}

// ─── Subscribers / Newsletter ───

export interface Subscriber {
  id?: string;
  email: string;
  name?: string;
  source?: string;
  status: "active" | "unsubscribed";
  createdAt?: any;
  unsubscribedAt?: any;
}

const SUBSCRIBERS = "subscribers";

export async function addSubscriber(data: Omit<Subscriber, "id" | "createdAt" | "status">): Promise<string> {
  const ref = await addDoc(collection(db, SUBSCRIBERS), { ...data, status: "active", createdAt: serverTimestamp() });
  return ref.id;
}

export async function fetchSubscribers(limitCount = 200): Promise<Subscriber[]> {
  const q = query(collection(db, SUBSCRIBERS), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<Subscriber>(snap);
}

export async function unsubscribeSubscriber(id: string): Promise<void> {
  await updateDoc(doc(db, SUBSCRIBERS, id), { status: "unsubscribed", unsubscribedAt: serverTimestamp() });
}

export async function deleteSubscriber(id: string): Promise<void> {
  await deleteDoc(doc(db, SUBSCRIBERS, id));
}

// ─── Donations ───

export interface Donation {
  id?: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  designation: string;
  method: string;
  stripePaymentId: string;
  stripeSessionId: string;
  status: string;
  showOnWall?: boolean;
  anonymous?: boolean;
  createdAt?: any;
  notes?: string;
  recordedBy?: string;
}

const DONATIONS_COLLECTION = "donations";

export async function fetchDonations(limitCount = 200): Promise<Donation[]> {
  try {
    const q = query(collection(db, DONATIONS_COLLECTION), orderBy("createdAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return collectionData<Donation>(snap);
  } catch (e) {
    console.error("fetchDonations (with orderBy) failed, falling back:", e);
    // Fallback: query without orderBy, sort client-side
    const q = query(collection(db, DONATIONS_COLLECTION), limit(limitCount));
    const snap = await getDocs(q);
    const results = collectionData<Donation>(snap);
    results.sort((a, b) => {
      const ta = a.createdAt?.toDate?.()?.getTime() || (typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0);
      const tb = b.createdAt?.toDate?.()?.getTime() || (typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0);
      return tb - ta;
    });
    return results;
  }
}

export async function fetchDonationsByUser(userId: string, email?: string): Promise<Donation[]> {
  const results: Donation[] = [];
  // Try donorId first (avoids composite index — no orderBy needed)
  if (userId) {
    try {
      const q = query(collection(db, DONATIONS_COLLECTION), where("donorId", "==", userId), limit(50));
      const snap = await getDocs(q);
      results.push(...collectionData<Donation>(snap));
    } catch (e) {
      console.error("donorId query failed:", e);
    }
  }
  // Fallback by email
  if (email && results.length === 0) {
    try {
      const q2 = query(collection(db, DONATIONS_COLLECTION), where("donorEmail", "==", email), limit(50));
      const snap2 = await getDocs(q2);
      results.push(...collectionData<Donation>(snap2));
    } catch (e) {
      console.error("donorEmail query failed:", e);
    }
  }
  // Sort by createdAt descending client-side
  results.sort((a, b) => {
    const ta = a.createdAt?.toDate?.()?.getTime() || (typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0);
    const tb = b.createdAt?.toDate?.()?.getTime() || (typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0);
    return tb - ta;
  });
  return results;
}

export async function addManualDonation(data: Omit<Donation, "id" | "createdAt" | "stripePaymentId" | "stripeSessionId"> & { showOnWall?: boolean; anonymous?: boolean }): Promise<string> {
  const ref = await addDoc(collection(db, DONATIONS_COLLECTION), { ...data, stripePaymentId: "", stripeSessionId: "", createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteDonation(id: string): Promise<void> {
  await deleteDoc(doc(db, DONATIONS_COLLECTION, id));
}

const FALLBACK_QUOTES = [
  { text: "Understanding the language of the Quran gives the reader a better understanding of the message from Allah (SWT)", author: "Oussama Saafien • Board Trustee" },
  { text: "The best of you are those who learn the Quran and teach it.", author: "Prophet Muhammad (ﷺ)" },
  { text: "Seeking knowledge is an obligation upon every Muslim.", author: "Prophet Muhammad (ﷺ)" },
  { text: "Indeed, with hardship comes ease.", author: "Quran 94:6" },
  { text: "Whoever travels a path in search of knowledge, Allah will make easy for them a path to Paradise.", author: "Prophet Muhammad (ﷺ)" },
];
