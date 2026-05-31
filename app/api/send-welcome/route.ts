import { NextRequest, NextResponse } from "next/server";
import { sendEmail, confirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await sendEmail(
      email,
      "Welcome to MHMA — Your Account Has Been Created!",
      confirmationEmail(
        name || "Friend",
        `Your MHMA account has been successfully created.<br/><br/>` +
        `You can now:<br/>` +
        `• Enroll in programs<br/>` +
        `• RSVP for events<br/>` +
        `• Receive community updates<br/>` +
        `• Manage your profile<br/><br/>` +
        `Please verify your email address using the link sent by Firebase Authentication to complete your registration.`
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("send-welcome error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
