import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(req: Request) {
  if (!stripe) {
    console.warn("Stripe webhook: STRIPE_SECRET_KEY not configured");
    return NextResponse.json({ received: true, note: "stripe not configured" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("Stripe webhook: STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook: signature verification failed:", err.message);
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata || {};
    const designation = metadata.designation || "general";

    try {
      await firestore.collection("donations").add({
        donorId: metadata.firebaseUid || "",
        donorName: session.customer_details?.name || "Anonymous",
        donorEmail: session.customer_details?.email || "",
        amount: session.amount_total || 0,
        designation,
        method: "stripe",
        stripePaymentId: session.payment_intent || "",
        stripeSessionId: session.id,
        status: "completed",
        showOnWall: true,
        anonymous: false,
        createdAt: new Date().toISOString(),
      });
      console.log(`Donation recorded: $${((session.amount_total || 0) / 100).toFixed(2)} for ${designation}`);
    } catch (err) {
      console.error("Failed to save donation:", err);
    }
  }

  return NextResponse.json({ received: true });
}
