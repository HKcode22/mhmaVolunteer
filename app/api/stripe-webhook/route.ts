import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import crypto from "crypto";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    console.warn("Stripe webhook: missing env vars");
    return NextResponse.json({ received: true, note: "not configured" });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }

  const parts = signature.split(",");
  let sigValue = "";
  let timestamp = "";
  for (const p of parts) {
    const [k, v] = p.trim().split("=");
    if (k === "v1") sigValue = v;
    if (k === "t") timestamp = v;
  }

  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  if (expectedSig !== sigValue) {
    console.error("Stripe webhook: signature mismatch");
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.type === "checkout.session.completed") {
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
  }

  return NextResponse.json({ received: true });
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
