import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Check environment config
  results.config = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "missing",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "missing",
    hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  };

  // 2. Try Firestore admin SDK read
  try {
    const collections = await firestore.listCollections();
    const collectionNames = collections.map(c => c.id);
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

  // 3. Try reading from specific collections
  if (results.firestore?.status === "connected") {
    const targets = ["events", "programs", "users", "inviteCodes"];
    results.collections = {};
    for (const name of targets) {
      try {
        const snap = await firestore.collection(name).limit(1).get();
        results.collections[name] = {
          exists: !snap.empty,
          size: snap.size,
        };
      } catch (err: any) {
        results.collections[name] = {
          error: err.message,
        };
      }
    }
  }

  // 4. Test auth
  try {
    const userRecord = await firestore.collection("users").limit(1).get();
    results.auth = {
      userCount: userRecord.size,
    };
    if (!userRecord.empty) {
      const first = userRecord.docs[0].data();
      results.auth.sampleUser = {
        email: first.email,
        role: first.role,
        fields: Object.keys(first),
      };
    }
  } catch (err: any) {
    results.auth = { error: err.message };
  }

  return NextResponse.json(results);
}
