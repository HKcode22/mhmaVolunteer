import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, eventTitle, fullName, email, phone, attendees, notes } = body;

    if (!fullName || !email || !eventTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rsvpRef = await firestore.collection("rsvps").add({
      eventId: eventId || null,
      eventTitle,
      fullName,
      email,
      phone: phone || "",
      attendees: parseInt(attendees) || 1,
      notes: notes || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    const rsvpId = rsvpRef.id;

    // Send confirmation email via shared sendEmail() (Resend/SMTP/Gmail)
    // Keeping email content similar to the old one.
    await sendEmail(
      email,
      `RSVP Confirmed - ${eventTitle}`,
      confirmationEmail(
        fullName,
        `Your RSVP has been received for <strong>${eventTitle}</strong>.<br/><br/>` +
          `Attendees: <strong>${attendees || 1}</strong>${notes ? `<br/>Notes: <strong>${notes}</strong>` : ""}<br/><br/>` +
          `We will confirm your RSVP shortly. If you have any questions, please contact us.`
      )
    );

    return NextResponse.json({ success: true, id: rsvpId });
  } catch (err: any) {
    console.error("RSVP API error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit RSVP" }, { status: 500 });
  }
}
