import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail, notifyBoard } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, phone, program, message } = await req.json();
    if (!fullName || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    await firestore.collection("enrollments").add({
      fullName, email, phone: phone || "", program: program || "", message: message || "",
      status: "pending", createdAt: Timestamp.now(),
    });

    // Emails — await but never fail the request
    try {
      await Promise.allSettled([
        sendEmail(email, "Enrollment Received - MHMA", confirmationEmail(fullName,
          `Your enrollment for <strong>${program || "our program"}</strong> has been received. We will contact you soon.` +
          (message ? `<br><br><strong>Your message:</strong><br>${message.replace(/\n/g, "<br>")}` : "")
        )),
        notifyBoard("New Enrollment - MHMA",
          `New enrollment from <strong>${fullName}</strong> (${email}) for <strong>${program || "N/A"}</strong>.` +
          (message ? `<br><br><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}` : "")
        ),
      ]);
    } catch (_) { /* ignore email errors */ }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Enroll error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
