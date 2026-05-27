import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { oldEmail, newEmail } = await req.json();
    if (!oldEmail || !newEmail) {
      return NextResponse.json({ error: "oldEmail and newEmail required" }, { status: 400 });
    }

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

    const userRecord = await adminAuth.getUser(uid);
    if (userRecord.email !== oldEmail) {
      return NextResponse.json({ error: "Current email does not match your account." }, { status: 400 });
    }

    try {
      const existingUser = await adminAuth.getUserByEmail(newEmail);
      if (existingUser.uid !== uid) {
        return NextResponse.json({
          error: "This email address is already in use by another account.",
        }, { status: 409 });
      }
    } catch (err: any) {
      if (err.code !== "auth/user-not-found") throw err;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("change-email API error:", err);
    const msg =
      err.code === "auth/email-already-exists" ? "This email is already in use by another account." :
      err.message || "Failed to initiate email change";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
