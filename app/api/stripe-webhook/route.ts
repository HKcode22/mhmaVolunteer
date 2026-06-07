import { NextResponse } from "next/server";
import { firestore, FieldValue } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail, notifyBoard } from "@/lib/email";

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
    const donorEmail =
      ((session.customer_details?.email || (session as any).customer_email || "") + "").trim();
    const donorName = session.customer_details?.name || "Anonymous";
    const donorNameForEmail = session.customer_details?.name || "Valued Donor";

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
      donorName,
      donorEmail,
      amount,
      designation,
      method: "stripe",
      stripePaymentId: session.payment_intent || "",
      stripeSessionId: session.id,
      status: "completed",
      showOnWall: true,
      anonymous: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`Donation recorded: $${(amount / 100).toFixed(2)} for ${designation}`);

    // Non-blocking email — don't fail if email provider not configured
    if (donorEmail) {
      sendEmail(donorEmail, "Donation Received - MHMA", confirmationEmail(donorNameForEmail,
        `Your donation of <strong>$${(amount / 100).toFixed(2)}</strong> for <strong>${designation}</strong> has been received. Thank you for supporting the Mountain House Muslim Association!`
      )).catch(e => console.error("Email send failed (non-blocking):", e));
    }

    // Non-blocking board notification
    const boardSubject = `New $${(amount / 100).toFixed(2)} Donation - ${designation}`;
    notifyBoard(boardSubject,
      `New donation received.<br/>` +
      `Donor: <strong>${donorName}</strong> (${donorEmail || "no email"})<br/>` +
      `Amount: <strong>$${(amount / 100).toFixed(2)}</strong><br/>` +
      `Designation: <strong>${designation}</strong>`
    );
  } catch (err) {
    console.error("Failed to save donation:", err);
  }

  return NextResponse.json({ received: true });
}
