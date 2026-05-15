import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, any> = {};

  const trim = (s: string | undefined) => (s || "").trim();

  results.config = {
    projectId: trim(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    projectIdRaw: JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    authDomain: trim(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  };

  try {
    const collections = await firestore.listCollections();
    const collectionNames = collections.map(c => c.id).sort();
    results.firestore = {
      status: "connected",
      collections: collectionNames,
      collectionCount: collectionNames.length,
    };
  } catch (err: any) {
    results.firestore = {
      status: "error",
      code: err.code,
      message: err.message,
    };
  }

  if (results.firestore?.status === "connected") {
    const targets = ["events", "programs", "journal", "users", "inviteCodes", "enrollments", "schedulingRequests", "contactSubmissions", "notifications"];
    results.collections = {};
    for (const name of targets) {
      try {
        const snap = await firestore.collection(name).limit(1).get();
        results.collections[name] = {
          exists: !snap.empty,
          docCount: snap.size,
        };
      } catch (err: any) {
        results.collections[name] = { error: err.message };
      }
    }
  }

  try {
    const userSnap = await firestore.collection("users").limit(5).get();
    results.users = userSnap.docs.map(d => {
      const data = d.data();
      return { id: d.id, email: data.email, role: data.role, displayName: data.displayName };
    });
  } catch (err: any) {
    results.users = { error: err.message };
  }

  return NextResponse.json(results);
}
