import { NextResponse } from "next/server";
import { firestore, FieldValue } from "@/lib/firebase-admin";
import { notifyBoard } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, availability, interests, message } = body;

    if (!firstName || !lastName || !email || !phone || !availability || !interests?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await firestore.collection("volunteers").add({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone,
      availability,
      interests,
      message: message || "",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Touch metadata so other browsers invalidate cached `volunteers`.
    const now = Date.now();
    await firestore.collection("metadata").doc("cacheTimestamps").set(
      { volunteers: now, _updatedAt: now },
      { merge: true },
    );

    // Emails — await but never fail the request
    try {
      await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "https://mhma.us"}/api/send-volunteer-confirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: `${firstName} ${lastName}` }),
        }),
        notifyBoard("New Volunteer - MHMA",
          `New volunteer: <strong>${firstName} ${lastName}</strong> (${email}).<br/>` +
          `Availability: ${availability}<br/>` +
          `Interests: ${interests.join(", ")}` +
          (message ? `<br/><br/><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}` : "")
        ),
      ]);
    } catch (_) { /* ignore email errors */ }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Volunteer submission error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
