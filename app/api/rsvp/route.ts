import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail, notifyBoard } from "@/lib/email";

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

    await firestore.collection('metadata').doc('cacheTimestamps').set({
      rsvps: Date.now(),
      _updatedAt: Date.now(),
    }, { merge: true });

    // Emails — await but never fail the request
    try {
      await Promise.allSettled([
        sendEmail(
          email,
          `RSVP Confirmed - ${eventTitle}`,
          confirmationEmail(
            fullName,
            `Your RSVP has been received for <strong>${eventTitle}</strong>.<br/><br/>` +
              `Attendees: <strong>${attendees || 1}</strong>${notes ? `<br/>Notes: <strong>${notes}</strong>` : ""}<br/><br/>` +
              `We will confirm your RSVP shortly. If you have any questions, please contact us.`
          )
        ),
        notifyBoard(`New RSVP - ${eventTitle}`,
          `New RSVP from <strong>${fullName}</strong> (${email}) for <strong>${eventTitle}</strong>.<br/>` +
          `Attendees: <strong>${attendees || 1}</strong>` +
          (notes ? `<br/><strong>Notes:</strong> ${notes}` : "")
        ),
      ]);
    } catch (_) { /* ignore email errors */ }

    return NextResponse.json({ success: true, id: rsvpId });
  } catch (err: any) {
    console.error("RSVP API error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit RSVP" }, { status: 500 });
  }
}
