import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

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

    // Send confirmation email via Resend (free tier: 3000/month)
    let emailSent = false;
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "MHMA <onboarding@resend.dev>",
            to: [email],
            subject: `RSVP Confirmed - ${eventTitle}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0d9488;">JazakAllahu Khairan!</h2>
                <p>Your RSVP has been received for:</p>
                <h3 style="color: #1f2937;">${eventTitle}</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${fullName}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${email}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Attendees:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${attendees || 1}</td></tr>
                  ${notes ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Notes:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${notes}</td></tr>` : ""}
                </table>
                <p style="color: #6b7280; font-size: 14px;">We will confirm your RSVP shortly. If you have any questions, please contact us.</p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Mountain House Muslim Association</p>
              </div>
            `,
          }),
        });

        if (res.ok) {
          emailSent = true;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Resend email failed:", errData);
        }
      } catch (emailErr) {
        console.error("Resend email error:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      id: rsvpId,
      emailSent,
    });
  } catch (err: any) {
    console.error("RSVP API error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit RSVP" }, { status: 500 });
  }
}
