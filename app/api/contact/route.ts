import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail, notifyBoard } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message required" }, { status: 400 });
    }

    await firestore.collection("contactSubmissions").add({
      name, email, phone: phone || "", subject: subject || "", message,
      status: "new", createdAt: Timestamp.now(),
    });

    // Emails — await but never fail the request
    try {
      await Promise.allSettled([
        sendEmail(email, "Contact Form Received - MHMA", confirmationEmail(name,
          `Your message has been received. We will get back to you as soon as possible.<br><br>
          <strong>Your message:</strong><br>${message.replace(/\n/g, "<br>")}`
        )),
        notifyBoard("New Contact Submission - MHMA",
          `New contact submission from <strong>${name}</strong> (${email}).` +
          (subject ? `<br/><strong>Subject:</strong> ${subject}` : "") +
          `<br/><br/><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}`
        ),
      ]);
    } catch (_) { /* ignore email errors */ }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Contact error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
