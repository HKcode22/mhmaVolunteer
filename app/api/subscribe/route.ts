import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail, notifyBoard } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, name, source } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await firestore
      .collection("subscribers")
      .where("email", "==", email.trim().toLowerCase())
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
    }

    await firestore.collection("subscribers").add({
      email: email.trim().toLowerCase(),
      name: name || "",
      source: source || "website",
      status: "active",
      createdAt: Timestamp.now(),
    });

    // Touch metadata so other browsers invalidate cached `subscribers`.
    const now = Date.now();
    await firestore.collection("metadata").doc("cacheTimestamps").set(
      { subscribers: now, _updatedAt: now },
      { merge: true },
    );

    // Emails — await but never fail the request
    try {
      await Promise.allSettled([
        sendEmail(
          email.trim().toLowerCase(),
          "Welcome to the MHMA Newsletter!",
          confirmationEmail(
            name || "Friend",
            `Thank you for subscribing to the MHMA mailing list.<br/><br/>` +
              `You'll now receive updates about:<br/>` +
              `• Upcoming events and programs<br/>` +
              `• Community announcements<br/>` +
              `• Masjid construction progress<br/>` +
              `• Volunteer opportunities<br/><br/>` +
              `If you did not subscribe, you can ignore this email.`
          )
        ),
        notifyBoard("New Newsletter Subscriber - MHMA",
          `New subscriber: <strong>${name || email}</strong> (${email}).<br/>Source: ${source || "website"}`
        ),
      ]);
    } catch (_) { /* ignore email errors */ }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("subscribe error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
