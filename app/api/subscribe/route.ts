import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, name, source } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await firestore
      .collection("subscribers")
      .where("email", "==", email.trim().toLowerCase())
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
    }

    await firestore.collection("subscribers").add({
      email: email.trim().toLowerCase(),
      name: name || "",
      source: source || "website",
      status: "active",
      createdAt: Timestamp.now(),
    });

    // Send welcome email via shared sendEmail() (Resend/SMTP/Gmail)
    await sendEmail(
      email.trim().toLowerCase(),
      "Welcome to the MHMA Newsletter!",
      confirmationEmail(
        name || "Friend",
        `Thank you for subscribing to the MHMA mailing list.<br/><br/>` +
          `You'll now receive updates about:<br/>` +
          `• Upcoming events and programs<br/>` +
          `• Community announcements<br/>` +
          `• Masjid construction progress<br/>` +
          `• Volunteer opportunities<br/><br/>` +
          `If you did not subscribe, you can ignore this email.`
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("subscribe error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
