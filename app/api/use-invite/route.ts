import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { code, usedBy } = await req.json();
    if (!code || !usedBy) {
      return NextResponse.json({ success: false, error: "Code and usedBy required" }, { status: 400 });
    }

    const snap = await firestore
      .collection("inviteCodes")
      .where("code", "==", code.toUpperCase())
      .where("used", "==", false)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ success: false, error: "Code not found or already used" }, { status: 404 });
    }

    await snap.docs[0].ref.update({
      used: true,
      usedBy,
      usedAt: Timestamp.now(),
    });

    await firestore.collection('metadata').doc('cacheTimestamps').set({
      inviteCodes: Date.now(),
      _updatedAt: Date.now(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("use-invite API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
