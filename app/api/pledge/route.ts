import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail, notifyBoard } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, amount, message, timeframe } = await req.json();
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    await firestore.collection("pledges").add({
      name, email, phone: phone || "", amount: amount || "", message: message || "",
      timeframe: timeframe || "60", status: "pending", createdAt: Timestamp.now(),
    });

    // Non-blocking email — don't fail if email provider not configured
    sendEmail(email, "Pledge Received - MHMA", confirmationEmail(name,
      `Thank you for your pledge of ${amount ? `$${amount}` : "a contribution"}!<br><br>
      Your pledge helps us plan and build for the future of our community.`
    )).catch(e => console.error("Email send failed (non-blocking):", e));

    // Non-blocking board notification
    notifyBoard("New Pledge - MHMA",
      `New pledge from <strong>${name}</strong> (${email}).` +
      (amount ? `<br/><strong>Amount:</strong> $${amount}` : "") +
      (message ? `<br/><br/><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}` : "")
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Pledge error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
