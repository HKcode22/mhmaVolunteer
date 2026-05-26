import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, error: "Code required" }, { status: 400 });
    }

    const snap = await firestore
      .collection("inviteCodes")
      .where("code", "==", code.toUpperCase())
      .where("used", "==", false)
      .limit(1)
      .get();

    return NextResponse.json({ valid: !snap.empty });
  } catch (err: any) {
    console.error("validate-invite API error:", err);
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
