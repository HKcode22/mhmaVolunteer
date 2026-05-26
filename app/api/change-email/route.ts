import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth, firestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { uid, newEmail } = await req.json();
    if (!uid || !newEmail) {
      return NextResponse.json({ error: "uid and newEmail required" }, { status: 400 });
    }

    await adminAuth.updateUser(uid, { email: newEmail });
    await firestore.collection("users").doc(uid).set({ email: newEmail }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("change-email API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
