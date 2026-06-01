import { NextResponse } from "next/server";
import { firestore, FieldValue } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

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

    // Fire confirmation email (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "https://mhma.us"}/api/send-volunteer-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: `${firstName} ${lastName}` }),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Volunteer submission error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
