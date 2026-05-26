import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ error: "uid required" }, { status: 400 });

    await adminAuth.setCustomUserClaims(uid, { role: "board_member" });
    console.log("Custom claims set for:", uid);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("set-claims error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
