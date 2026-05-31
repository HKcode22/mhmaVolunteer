import { NextRequest, NextResponse } from "next/server";
import { firestore, auth as adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const STATS_DOC = "stats";
const STATS_COLLECTION = "aboutStats";

export async function GET() {
  try {
    const [
      statsSnap,
      programsSnap,
      eventsSnap,
      usersSnap,
      donationSnap,
      enrollmentSnap,
    ] = await Promise.all([
      firestore.collection(STATS_COLLECTION).doc(STATS_DOC).get(),
      firestore.collection("programs").get(),
      firestore.collection("events").get(),
      firestore.collection("users").get(),
      firestore.collection("donations").where("status", "==", "completed").get(),
      firestore.collection("enrollments").get(),
    ]);

    const statsData: Record<string, any> = statsSnap.exists ? statsSnap.data()! : {};

    let constructionTotal = 0;
    const constructionDonors = new Set<string>();
    const byDesignation: Record<string, number> = {};

    donationSnap.forEach((doc: any) => {
      const d = doc.data();
      const amt = d.amount || 0;
      if (d.designation === "construction") {
        constructionTotal += amt;
        const key =
          (d.donorEmail as string | undefined)?.trim().toLowerCase() ||
          (d.email as string | undefined)?.trim().toLowerCase() ||
          doc.id;
        constructionDonors.add(key);
      }
      byDesignation[d.designation || "other"] =
        (byDesignation[d.designation || "other"] || 0) + amt;
    });

    return NextResponse.json({
      yearsServing: statsData.yearsServing ?? null,
      numberOfFamilies: statsData.numberOfFamilies ?? null,
      programsCount: programsSnap.size,
      eventsCount: eventsSnap.size,
      usersCount: usersSnap.size,
      youthInPrograms: enrollmentSnap.size,
      donorCount: constructionDonors.size,
      raisedForMasjid: Math.round(constructionTotal / 100),
      raisedForPrograms: Math.round((byDesignation["programs"] || 0) / 100),
      totalRaised: Math.round(
        (donationSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0)) / 100
      ),
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

    await firestore.collection(STATS_COLLECTION).doc(STATS_DOC).set(update, { merge: true });

    return NextResponse.json({ success: true, ...update });
  } catch (err: any) {
    console.error("Failed to update about stats:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
