import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export async function POST() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const snapshot = await firestore
      .collection("activityLog")
      .where("createdAt", "<", thirtyDaysAgo)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ deleted: 0 });
    }

    let deleted = 0;
    const batches: any[] = [];
    let currentBatch = firestore.batch();
    let count = 0;

    for (const doc of snapshot.docs) {
      currentBatch.delete(doc.ref);
      count++;
      deleted++;
      if (count >= 500) {
        batches.push(currentBatch.commit());
        currentBatch = firestore.batch();
        count = 0;
      }
    }
    if (count > 0) batches.push(currentBatch.commit());
    await Promise.all(batches);

    if (deleted > 0) {
      await firestore.collection('metadata').doc('cacheTimestamps').set({
        activityLog: Date.now(),
        _updatedAt: Date.now(),
      }, { merge: true });
    }

    console.log(`Cleanup: deleted ${deleted} activity log entries older than 30 days`);
    return NextResponse.json({ deleted });
  } catch (err: any) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
