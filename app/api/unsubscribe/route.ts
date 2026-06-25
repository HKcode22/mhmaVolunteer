import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const snap = await firestore
      .collection("subscribers")
      .where("email", "==", email.trim().toLowerCase())
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Not subscribed" }, { status: 404 });
    }

    const doc = snap.docs[0];
    await doc.ref.update({ status: "unsubscribed", unsubscribedAt: new Date().toISOString() });

    await firestore.collection('metadata').doc('cacheTimestamps').set({
      subscribers: Date.now(),
      _updatedAt: Date.now(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("unsubscribe error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
