import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth, firestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { code, phone } = await req.json();
    if (!code || !phone) {
      return NextResponse.json({ error: "code and phone required" }, { status: 400 });
    }

    // Verify Firebase ID token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find matching, unexpired, unverified code
    const now = new Date().toISOString();
    const snapshot = await firestore
      .collection("smsVerifications")
      .where("uid", "==", uid)
      .where("phone", "==", phone)
      .where("code", "==", code)
      .where("verified", "==", false)
      .where("expiresAt", ">=", now)
      .orderBy("expiresAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
    }

    // Mark as verified
    const docRef = snapshot.docs[0].ref;
    await docRef.update({ verified: true, verifiedAt: now });

    // Clean up old verification docs for this uid + phone
    const oldSnap = await firestore
      .collection("smsVerifications")
      .where("uid", "==", uid)
      .where("phone", "==", phone)
      .where("verified", "==", false)
      .get();
    const batch = firestore.batch();
    oldSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();

    return NextResponse.json({ success: true, message: "Phone verified." });
  } catch (err: any) {
    console.error("verify-sms error:", err);
    return NextResponse.json({ error: err.message || "Failed to verify code" }, { status: 500 });
  }
}
