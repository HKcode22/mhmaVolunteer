import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail } from "@/lib/email";

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

    await sendEmail(email, "Enrollment Received - MHMA", confirmationEmail(fullName,
      `Your enrollment for <strong>${program || "our program"}</strong> has been received. We will contact you soon.`
    ));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Enroll error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
