import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth, firestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { oldEmail, newEmail } = await req.json();
    if (!oldEmail || !newEmail) {
      return NextResponse.json({ error: "oldEmail and newEmail required" }, { status: 400 });
    }

    // Verify Firebase ID token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Confirm oldEmail matches the user's current email
    const userRecord = await adminAuth.getUser(uid);
    if (userRecord.email !== oldEmail) {
      return NextResponse.json({ error: "Current email does not match your account." }, { status: 400 });
    }

    // Check if new email is already in use by another user
    try {
      const existingUser = await adminAuth.getUserByEmail(newEmail);
      if (existingUser.uid !== uid) {
        return NextResponse.json({
          error: "This email address is already in use by another account.",
        }, { status: 409 });
      }
    } catch (err: any) {
      if (err.code !== "auth/user-not-found") throw err;
    }

    // Send notification to OLD email via Resend (best-effort, informational)
    let oldEmailSent = false;
    let oldEmailError = "";
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: "MHMA Board <onboarding@resend.dev>",
            to: [oldEmail],
            subject: "Email Change Notification",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #c9a227;">Email Change Notification</h2>
                <p>Your MHMA account email is being changed.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Old Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${oldEmail}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>New Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${newEmail}</td></tr>
                </table>
                <p>A verification link has been sent to the new email address. The email will be updated once verified.</p>
                <p style="color: #6b7280; font-size: 14px;">If you did NOT request this change, please contact the MHMA board immediately at board@mhma.info.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 12px;">Mountain House Muslim Association — Board Dashboard</p>
              </div>
            `,
          }),
        });
        if (res.ok) oldEmailSent = true;
        else {
          const errData = await res.json().catch(() => ({}));
          oldEmailError = errData?.message || "Resend API error";
          console.error("Resend old-email failed:", errData);
        }
      } catch (err) {
        oldEmailError = String(err);
        console.error("Resend old-email error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notification sent to your old email address.",
      oldEmailSent,
      oldEmailError,
    });
  } catch (err: any) {
    console.error("change-email API error:", err);
    const msg =
      err.code === "auth/email-already-exists" ? "This email is already in use by another account." :
      err.message || "Failed to initiate email change";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
