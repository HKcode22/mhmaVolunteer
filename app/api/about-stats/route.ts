import { NextRequest, NextResponse } from "next/server";
import { firestore, auth as adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const STATS_DOC = "stats";
const STATS_COLLECTION = "aboutStats";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get('range') || '30';
    const rangeDays = rangeParam === 'all' ? null : parseInt(rangeParam, 10);
    const since = rangeDays ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000) : null;

    const inRange = (doc: any): boolean => {
      if (!since) return true;
      const ts = doc.data().createdAt?.toDate?.();
      return ts && ts >= since;
    };

    const [
      statsSnap,
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
      firestore.collection(STATS_COLLECTION).doc(STATS_DOC).get(),
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

    const statsData: Record<string, any> = statsSnap.exists ? statsSnap.data()! : {};

    let constructionTotal = 0;
    let zakatTotal = 0;
    let generalTotal = 0;
    let programsTotal = 0;
    let otherTotal = 0;
    let zakatCount = 0;
    let generalCount = 0;
    const constructionDonors = new Set<string>();

    donationSnap.forEach((doc: any) => {
      if (!inRange(doc)) return;
      const d = doc.data();
      const amt = d.amount || 0;
      const des = (d.designation || "other").toLowerCase();
      if (des === "construction") {
        constructionTotal += amt;
        const key =
          (d.donorEmail as string | undefined)?.trim().toLowerCase() ||
          (d.email as string | undefined)?.trim().toLowerCase() ||
          doc.id;
        constructionDonors.add(key);
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

    return NextResponse.json({
      yearsServing: statsData.yearsServing ?? null,
      numberOfFamilies: statsData.numberOfFamilies ?? null,
      programsCount: programsSnap.size,
      eventsCount: [...eventsSnap.docs].filter(inRange).length,
      usersCount: [...usersSnap.docs].filter(inRange).length,
      youthInPrograms: [...enrollmentSnap.docs].filter(inRange).length,
      rsvpCount: [...rsvpSnap.docs].filter(inRange).length,
      subscriberCount: subscriberSnap.size,
      contactCount: [...contactSnap.docs].filter(inRange).length,
      pledgeCount: [...pledgeSnap.docs].filter(inRange).length,
      volunteerCount: [...volunteerSnap.docs].filter(inRange).length,
      newsCount: [...newsSnap.docs].filter(inRange).length,
      totalDonationCount: [...donationSnap.docs].filter(inRange).length,
      donorCount: constructionDonors.size,
      raisedForMasjid: Math.round(constructionTotal / 100),
      raisedForPrograms: Math.round(programsTotal / 100),
      raisedForZakat: Math.round(zakatTotal / 100),
      zakatDonationCount: zakatCount,
      raisedForGeneral: Math.round(generalTotal / 100),
      generalDonationCount: generalCount,
      raisedForOther: Math.round(otherTotal / 100),
      totalRaised: Math.round(
        (donationSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0)) / 100
      ),
      range: rangeDays || 'all',
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

    await firestore.collection('metadata').doc('cacheTimestamps').set({
      aboutStats: Date.now(),
      _updatedAt: Date.now(),
    }, { merge: true });

    return NextResponse.json({ success: true, ...update });
  } catch (err: any) {
    console.error("Failed to update about stats:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
