import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth, firestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "phone required" }, { status: 400 });
    }

    // Verify Firebase ID token
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

    // Check if phone matches the user's Firestore record
    const userSnap = await firestore.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userData = userSnap.data()!;
    if (userData.phone !== phone) {
      return NextResponse.json({ error: "Phone number does not match your account." }, { status: 400 });
    }

    // Check Twilio config
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioSid || !twilioToken || !twilioFrom) {
      return NextResponse.json({
        error: "SMS verification is not configured. Please contact the board.",
        notConfigured: true,
      }, { status: 501 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    // Store code in Firestore
    await firestore.collection("smsVerifications").add({
      uid,
      phone,
      code,
      expiresAt: expiresAt.toISOString(),
      verified: false,
      createdAt: new Date().toISOString(),
    });

    // Send SMS via Twilio
    const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioFrom,
          Body: `Your MHMA verification code is: ${code}. Valid for 10 minutes.`,
        }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Twilio SMS failed:", errData);
      return NextResponse.json({
        error: "Failed to send SMS. Please try again or contact the board.",
        twilioError: errData?.message || "Twilio API error",
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "SMS sent to your phone." });
  } catch (err: any) {
    console.error("send-sms error:", err);
    return NextResponse.json({ error: err.message || "Failed to send SMS" }, { status: 500 });
  }
}
