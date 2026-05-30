import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snap = await firestore
      .collection("donations")
      .where("status", "==", "completed")
      .get();

    let total = 0;
    let constructionTotal = 0;
    const byDesignation: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    const constructionDonors = new Set<string>();

    snap.forEach(doc => {
      const d = doc.data();
      const amt = d.amount || 0;
      total += amt;
      if (d.designation === "construction") {
        constructionTotal += amt;
        if (d.email) constructionDonors.add(d.email);
      }
      byDesignation[d.designation || "other"] = (byDesignation[d.designation || "other"] || 0) + amt;
      byMethod[d.method || "unknown"] = (byMethod[d.method || "unknown"] || 0) + amt;
    });

    return NextResponse.json({
      total: Math.round(total / 100),        // dollars
      constructionTotal: Math.round(constructionTotal / 100), // dollars
      donorCount: constructionDonors.size,
      byDesignation: Object.fromEntries(
        Object.entries(byDesignation).map(([k, v]) => [k, Math.round(v / 100)])
      ),
      byMethod: Object.fromEntries(
        Object.entries(byMethod).map(([k, v]) => [k, Math.round(v / 100)])
      ),
      count: snap.size,
    });
  } catch (err: any) {
    console.error("Failed to fetch donation totals:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
