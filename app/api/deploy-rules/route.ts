import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const rulesPath = path.join(process.cwd(), "firestore.rules");
    const rulesSource = fs.readFileSync(rulesPath, "utf8");

    await admin.securityRules().releaseFirestoreRulesetFromSource(rulesSource);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("deploy-rules error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
