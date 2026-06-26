import { NextRequest, NextResponse } from "next/server";
import { firestore, auth as adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const STATS_DOC = "stats";
const STATS_COLLECTION = "aboutStats";
const COMPUTED_DOC = "computed";

const RANGES = [30, 365, "all"] as const;
type Range = (typeof RANGES)[number];

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function isInRange(doc: FirebaseFirestore.DocumentSnapshot, since: Date | null): boolean {
  if (!since) return true;
  const ts = doc.data()?.createdAt?.toDate?.();
  return !!ts && ts >= since;
}

function computeRangeStats(
  programsSnap: FirebaseFirestore.QuerySnapshot,
  eventsSnap: FirebaseFirestore.QuerySnapshot,
  usersSnap: FirebaseFirestore.QuerySnapshot,
  donationSnap: FirebaseFirestore.QuerySnapshot,
  enrollmentSnap: FirebaseFirestore.QuerySnapshot,
  rsvpSnap: FirebaseFirestore.QuerySnapshot,
  subscriberSnap: FirebaseFirestore.QuerySnapshot,
  contactSnap: FirebaseFirestore.QuerySnapshot,
  pledgeSnap: FirebaseFirestore.QuerySnapshot,
  volunteerSnap: FirebaseFirestore.QuerySnapshot,
  newsSnap: FirebaseFirestore.QuerySnapshot,
  since: Date | null,
) {
  let constructionTotal = 0;
  let zakatTotal = 0;
  let generalTotal = 0;
  let programsTotal = 0;
  let otherTotal = 0;
  let zakatCount = 0;
  let generalCount = 0;
  const constructionDonors = new Set<string>();
  let totalDonationAmount = 0;

  donationSnap.docs.forEach((doc) => {
    if (!isInRange(doc, since)) return;
    const d = doc.data();
    const amt = d.amount || 0;
    totalDonationAmount += amt;
    const des = (d.designation || "other").toLowerCase();
    if (des === "construction") {
      constructionTotal += amt;
      constructionDonors.add(
        (d.donorEmail as string | undefined)?.trim().toLowerCase() ||
          (d.email as string | undefined)?.trim().toLowerCase() ||
          doc.id,
      );
    } else if (des === "zakat" || des === "zakat-ul-mal" || des === "zakatulmal") {
      zakatTotal += amt;
      zakatCount++;
    } else if (des === "general" || des === "general fund") {
      generalTotal += amt;
      generalCount++;
    } else if (des === "programs") {
      programsTotal += amt;
    } else {
      otherTotal += amt;
    }
  });

  const docInRange = (d: FirebaseFirestore.DocumentSnapshot) => isInRange(d, since);

  return {
    programsCount: programsSnap.size,
    eventsCount: eventsSnap.docs.filter(docInRange).length,
    usersCount: usersSnap.docs.filter(docInRange).length,
    youthInPrograms: enrollmentSnap.docs.filter(docInRange).length,
    rsvpCount: rsvpSnap.docs.filter(docInRange).length,
    subscriberCount: subscriberSnap.size,
    contactCount: contactSnap.docs.filter(docInRange).length,
    pledgeCount: pledgeSnap.docs.filter(docInRange).length,
    volunteerCount: volunteerSnap.docs.filter(docInRange).length,
    newsCount: newsSnap.docs.filter(docInRange).length,
    totalDonationCount: donationSnap.docs.filter(docInRange).length,
    donorCount: constructionDonors.size,
    raisedForMasjid: Math.round(constructionTotal / 100),
    raisedForPrograms: Math.round(programsTotal / 100),
    raisedForZakat: Math.round(zakatTotal / 100),
    zakatDonationCount: zakatCount,
    raisedForGeneral: Math.round(generalTotal / 100),
    generalDonationCount: generalCount,
    raisedForOther: Math.round(otherTotal / 100),
    totalRaised: Math.round(totalDonationAmount / 100),
  };
}

async function recomputeAndStore(): Promise<Record<string, any>> {
  const computed = await recomputeAllStats();
  await firestore.collection(STATS_COLLECTION).doc(COMPUTED_DOC).set(computed);
  return computed;
}

async function recomputeAllStats(): Promise<Record<string, any>> {
  const [
    programsSnap,
    eventsSnap,
    usersSnap,
    donationSnap,
    enrollmentSnap,
    rsvpSnap,
    subscriberSnap,
    contactSnap,
    pledgeSnap,
    volunteerSnap,
    newsSnap,
  ] = await Promise.all([
    firestore.collection("programs").get(),
    firestore.collection("events").get(),
    firestore.collection("users").get(),
    firestore.collection("donations").where("status", "==", "completed").get(),
    firestore.collection("enrollments").get(),
    firestore.collection("rsvps").get(),
    firestore.collection("subscribers").where("status", "==", "active").get(),
    firestore.collection("contactSubmissions").get(),
    firestore.collection("pledges").get(),
    firestore.collection("volunteers").get(),
    firestore.collection("news").get(),
  ]);

  const computed: Record<string, any> = {};

  for (const r of RANGES) {
    const since = r === "all" ? null : daysAgo(r as number);
    computed[`_${r}`] = computeRangeStats(
      programsSnap, eventsSnap, usersSnap, donationSnap,
      enrollmentSnap, rsvpSnap, subscriberSnap, contactSnap,
      pledgeSnap, volunteerSnap, newsSnap, since,
    );
  }

  computed._computedAt = Date.now();
  return computed;
}

export async function GET(req: NextRequest) {
  try {
    const [computedSnap, statsSnap] = await Promise.all([
      firestore.collection(STATS_COLLECTION).doc(COMPUTED_DOC).get(),
      firestore.collection(STATS_COLLECTION).doc(STATS_DOC).get(),
    ]);

    const statsData: Record<string, any> = statsSnap.exists ? statsSnap.data()! : {};

    const computed = computedSnap.exists
      ? computedSnap.data()!
      : await recomputeAndStore();
    const ranges: Record<string, any> = {};
    for (const r of RANGES) {
      const key = `_${r}`;
      if (computed[key]) ranges[key] = computed[key];
    }

    return NextResponse.json({
      yearsServing: statsData.yearsServing ?? null,
      numberOfFamilies: statsData.numberOfFamilies ?? null,
      ranges,
    }, {
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
  } catch (err: any) {
    console.error("Failed to fetch about stats:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const userSnap = await firestore.collection("users").doc(uid).get();
    const userData = userSnap.data();
    const role = userData?.role;
    if (role !== "board_member" && role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { yearsServing, numberOfFamilies } = body;

    if (yearsServing !== undefined && (typeof yearsServing !== "number" || yearsServing < 0)) {
      return NextResponse.json({ error: "Invalid yearsServing" }, { status: 400 });
    }
    if (numberOfFamilies !== undefined && (typeof numberOfFamilies !== "number" || numberOfFamilies < 0)) {
      return NextResponse.json({ error: "Invalid numberOfFamilies" }, { status: 400 });
    }

    const update: Record<string, any> = {};
    if (yearsServing !== undefined) update.yearsServing = yearsServing;
    if (numberOfFamilies !== undefined) update.numberOfFamilies = numberOfFamilies;
    update.updatedAt = new Date();

    await firestore.collection(STATS_COLLECTION).doc(STATS_DOC).set(update, { merge: true });

    const computed = await recomputeAndStore();

    await firestore.collection("metadata").doc("cacheTimestamps").set({
      aboutStats: Date.now(),
      _updatedAt: Date.now(),
    }, { merge: true });

    return NextResponse.json({ success: true, ...update });
  } catch (err: any) {
    console.error("Failed to update about stats:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
