import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth, firestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { oldEmail, newEmail } = await req.json();
    if (!oldEmail || !newEmail) {
      return NextResponse.json({ error: "oldEmail and newEmail required" }, { status: 400 });
    }

    // Verify Firebase ID token from Authorization header to get uid
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

    // Check if new email is already in use
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

    // Generate unique tokens for both email approvals
    const oldToken = crypto.randomUUID();
    const newToken = crypto.randomUUID();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const oldLink = `${baseUrl}/api/verify-email-change?token=${oldToken}&type=old`;
    const newLink = `${baseUrl}/api/verify-email-change?token=${newToken}&type=new`;

    // Firestore pending change doc
    const changeDoc = {
      uid,
      oldEmail,
      newEmail,
      oldToken,
      newToken,
      oldApproved: false,
      newApproved: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    await firestore.collection("pendingEmailChanges").add(changeDoc);

    // Resend setup
    const resendKey = process.env.RESEND_API_KEY;

    // Send to OLD email: approval request
    let oldEmailSent = false;
    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: "MHMA Board <onboarding@resend.dev>",
            to: [oldEmail],
            subject: "Approve Email Change Request",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #c9a227;">Email Change Approval Required</h2>
                <p>We received a request to change the email on your MHMA account.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Current Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${oldEmail}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>New Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${newEmail}</td></tr>
                </table>
                <p>If YOU requested this change, click the button below to approve it. <strong>If you did NOT request this, please contact the board immediately.</strong></p>
                <a href="${oldLink}" style="display: inline-block; background-color: #c9a227; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Approve Email Change</a>
                <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours. If you did not request this change, no action is needed and the change will not proceed.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 12px;">Mountain House Muslim Association — Board Dashboard</p>
              </div>
            `,
          }),
        });
        if (res.ok) oldEmailSent = true;
        else console.error("Resend old-email failed:", await res.json().catch(() => ({})));
      } catch (err) {
        console.error("Resend old-email error:", err);
      }
    }

    // Send to NEW email: verification link
    let newEmailSent = false;
    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: "MHMA Board <onboarding@resend.dev>",
            to: [newEmail],
            subject: "Verify Your New Email Address",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #c9a227;">Verify Your New Email</h2>
                <p>You requested to change the email on your MHMA account to this address.</p>
                <p style="color: #6b7280; font-size: 14px;"><strong>Note:</strong> This change also requires approval from your current email address. You will receive a separate email there.</p>
                <p>Click the button below to verify that this email belongs to you:</p>
                <a href="${newLink}" style="display: inline-block; background-color: #c9a227; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Verify New Email</a>
                <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours. If you did not request this, you can ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 12px;">Mountain House Muslim Association — Board Dashboard</p>
              </div>
            `,
          }),
        });
        if (res.ok) newEmailSent = true;
        else console.error("Resend new-email failed:", await res.json().catch(() => ({})));
      } catch (err) {
        console.error("Resend new-email error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Verification emails sent to both addresses. Click the links in both emails to complete the change.",
      oldEmailSent,
      newEmailSent,
    });
  } catch (err: any) {
    console.error("send-email-change API error:", err);
    return NextResponse.json({ error: err.message || "Failed to initiate email change" }, { status: 500 });
  }
}
