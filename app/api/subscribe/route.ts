import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";

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

    // Send welcome email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "MHMA <onboarding@resend.dev>",
            to: [email.trim().toLowerCase()],
            subject: "Welcome to the MHMA Newsletter!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0d9488;">JazakAllahu Khairan!</h2>
                <p>Thank you for subscribing to the MHMA mailing list.</p>
                <p>You'll now receive updates about:</p>
                <ul style="color: #4b5563;">
                  <li>Upcoming events and programs</li>
                  <li>Community announcements</li>
                  <li>Masjid construction progress</li>
                  <li>Volunteer opportunities</li>
                </ul>
                <p style="color: #6b7280; font-size: 14px;">If you did not subscribe, you can ignore this email.</p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                  <a href="https://mhma-update.vercel.app/subscribe" style="color: #c9a227;">Unsubscribe</a> at any time.
                </p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Mountain House Muslim Association</p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("Welcome email error:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("subscribe error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
