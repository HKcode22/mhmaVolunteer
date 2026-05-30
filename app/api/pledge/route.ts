import { NextRequest, NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, amount, message, timeframe } = await req.json();
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    await firestore.collection("pledges").add({
      name, email, phone: phone || "", amount: amount || "", message: message || "",
      timeframe: timeframe || "60", status: "pending", createdAt: Timestamp.now(),
    });

    await sendEmail(email, "Pledge Received - MHMA", confirmationEmail(name,
      `Thank you for your pledge of ${amount ? `$${amount}` : "a contribution"}!<br><br>
      Your pledge helps us plan and build for the future of our community.`
    ));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Pledge error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
