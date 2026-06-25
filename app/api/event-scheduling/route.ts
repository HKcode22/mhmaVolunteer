import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail, notifyBoard } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizer } = body;
    const firstName = organizer?.firstName || body.firstName || "";
    const lastName = organizer?.lastName || body.lastName || "";
    const email = organizer?.email || body.email || "";
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    await firestore.collection("schedulingRequests").add({
      ...body,
      status: "new",
      createdAt: Timestamp.now(),
    });

    // Touch metadata so other browsers invalidate cached `schedulingRequests`.
    const now = Date.now();
    await firestore.collection("metadata").doc("cacheTimestamps").set(
      { schedulingRequests: now, _updatedAt: now },
      { merge: true },
    );

    const name = `${firstName} ${lastName}`;
    // Emails — await but never fail the request
    try {
      await Promise.allSettled([
        sendEmail(email, "Event Request Received - MHMA", confirmationEmail(name,
          "Your event scheduling request has been received. Our events team will review it and contact you."
        )),
        notifyBoard("New Scheduling Request - MHMA",
          `New event scheduling request from <strong>${name}</strong> (${email}).<br/>` +
          `Event: <strong>${body.eventTitle || "N/A"}</strong><br/>` +
          `Category: ${body.category || "N/A"}`
        ),
      ]);
    } catch (_) { /* ignore email errors */ }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Event scheduling error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
