import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await firestore.collection("enrollments").get();
    return NextResponse.json({ count: snap.size }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch enrollment count:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
