import { db } from "./firebase-client";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
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
  notifications: "notifications",
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
  const ref = await addDoc(collection(db, collections.events), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEvent(id: string, data: Partial<FirebaseEvent>): Promise<void> {
  await updateDoc(doc(db, collections.events, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, collections.events, id));
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

export async function addProgram(data: Omit<FirebaseProgram, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, collections.programs), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProgram(id: string, data: Partial<FirebaseProgram>): Promise<void> {
  await updateDoc(doc(db, collections.programs, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProgram(id: string): Promise<void> {
  await deleteDoc(doc(db, collections.programs, id));
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
  const ref = await addDoc(collection(db, collections.journal), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateJournalEntry(id: string, data: Partial<FirebaseJournalEntry>): Promise<void> {
  await updateDoc(doc(db, collections.journal, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, collections.journal, id));
}

export async function fetchEnrollments(limitCount = 50): Promise<FirebaseEnrollment[]> {
  const q = query(collection(db, collections.enrollments), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseEnrollment>(snap);
}

export async function addEnrollment(data: Omit<FirebaseEnrollment, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, collections.enrollments), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEnrollment(id: string, data: Partial<FirebaseEnrollment>): Promise<void> {
  await updateDoc(doc(db, collections.enrollments, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteEnrollment(id: string): Promise<void> {
  await deleteDoc(doc(db, collections.enrollments, id));
}

export async function fetchSchedulingRequests(limitCount = 50): Promise<FirebaseSchedulingRequest[]> {
  const q = query(collection(db, collections.schedulingRequests), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseSchedulingRequest>(snap);
}

export async function addSchedulingRequest(data: Omit<FirebaseSchedulingRequest, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, collections.schedulingRequests), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSchedulingRequest(id: string, data: Partial<FirebaseSchedulingRequest>): Promise<void> {
  await updateDoc(doc(db, collections.schedulingRequests, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSchedulingRequest(id: string): Promise<void> {
  await deleteDoc(doc(db, collections.schedulingRequests, id));
}

export async function fetchContactSubmissions(limitCount = 50): Promise<FirebaseContactSubmission[]> {
  const q = query(collection(db, collections.contactSubmissions), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<FirebaseContactSubmission>(snap);
}

export async function markContactSubmissionRead(id: string): Promise<void> {
  await updateDoc(doc(db, collections.contactSubmissions, id), { read: true });
}

export async function deleteContactSubmission(id: string): Promise<void> {
  await deleteDoc(doc(db, collections.contactSubmissions, id));
}

export async function addContactSubmission(data: Omit<FirebaseContactSubmission, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, collections.contactSubmissions), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchNotifications(limitCount = 50): Promise<any[]> {
  const q = query(collection(db, collections.notifications), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return collectionData<any>(snap);
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
  await addDoc(collection(db, INVITE_CODES), {
    code,
    used: false,
    generatedBy,
    createdAt: serverTimestamp(),
    usedBy: null,
    usedAt: null,
  });
  return code;
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
  await deleteDoc(doc(db, INVITE_CODES, id));
}
