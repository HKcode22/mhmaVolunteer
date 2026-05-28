import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const body = await req.text();

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const metadata = session.metadata || {};
  const designation = metadata.designation || "general";

  try {
    const amount = session.amount_total || session.amount_subtotal || 0;

    const existing = await firestore
      .collection("donations")
      .where("stripeSessionId", "==", session.id)
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log(`Donation already recorded for session ${session.id}`);
      return NextResponse.json({ received: true });
    }

    await firestore.collection("donations").add({
      donorId: metadata.firebaseUid || "",
      donorName: session.customer_details?.name || "Anonymous",
      donorEmail: session.customer_details?.email || "",
      amount,
      designation,
      method: "stripe",
      stripePaymentId: session.payment_intent || "",
      stripeSessionId: session.id,
      status: "completed",
      showOnWall: true,
      anonymous: false,
      createdAt: new Date().toISOString(),
    });
    console.log(`Donation recorded: $${(amount / 100).toFixed(2)} for ${designation}`);
  } catch (err) {
    console.error("Failed to save donation:", err);
  }

  return NextResponse.json({ received: true });
}
