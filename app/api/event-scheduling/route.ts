import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail } from "@/lib/email";

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

    const name = `${firstName} ${lastName}`;
    await sendEmail(email, "Event Request Received - MHMA", confirmationEmail(name,
      "Your event scheduling request has been received. Our events team will review it and contact you."
    ));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Event scheduling error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
