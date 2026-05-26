import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth, firestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { uid, newEmail } = await req.json();
    if (!uid || !newEmail) {
      return NextResponse.json({ error: "uid and newEmail required" }, { status: 400 });
    }

    // Check if the email is already used by another user
    try {
      const existingUser = await adminAuth.getUserByEmail(newEmail);
      if (existingUser.uid !== uid) {
        return NextResponse.json({
          error: "This email address is already in use by another account. If you believe this is an error, please contact the administrator.",
        }, { status: 409 });
      }
    } catch (err: any) {
      // UserNotFound error means email is available — that's fine
      if (err.code !== "auth/user-not-found") throw err;
    }

    await adminAuth.updateUser(uid, { email: newEmail });
    await firestore.collection("users").doc(uid).set({ email: newEmail }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("change-email API error:", err);
    const msg =
      err.code === "auth/email-already-exists" ? "This email is already in use by another account." :
      err.message || "Failed to change email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
