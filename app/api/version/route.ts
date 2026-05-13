import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "2.0.0",
    deployedAt: new Date().toISOString(),
    backend: "Firebase (Firestore + Auth)",
    features: [
      "Migrated from WordPress to Firebase",
      "Firestore for all data (events, programs, journal, contact, etc.)",
      "Firebase Auth for login/registration",
      "Board dashboard with full CRUD",
      "$0 hosting on Firebase Spark plan",
    ],
  });
}
