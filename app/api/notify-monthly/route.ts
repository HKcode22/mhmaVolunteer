import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { testEmail } = await req.json();
    const snapshot = await firestore
      .collection("donations")
      .where("method", "==", "stripe")
      .where("status", "==", "completed")
      .limit(200)
      .get();

    const monthlyDonors = new Map<string, { email: string; name: string; amount: number }>();
    snapshot.docs.forEach(d => {
      const data = d.data();
      const email = data.donorEmail;
      if (email && !monthlyDonors.has(email)) {
        monthlyDonors.set(email, { email, name: data.donorName || "Friend", amount: data.amount || 0 });
      }
    });

    const targets = testEmail ? [{ email: testEmail, name: "Friend", amount: 0 }] : Array.from(monthlyDonors.values());
    if (targets.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No donors found" });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f8f3;">
        <div style="background: #1a3a2a; padding: 30px; text-align: center;">
          <h1 style="color: #c9a227; margin: 0; font-size: 22px;">Your Monthly Impact</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Assalamu Alaikum,</p>
          <p style="color: #666; line-height: 1.6;">Thank you for your continued support through the MHMA Builders Club. Here is what your contributions helped accomplish this month:</p>
          <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
            <li>Supported daily and Jumu'ah prayers at the Unity Center</li>
            <li>Funded Quran Maktab and Hifz programs for children</li>
            <li>Powered youth sports and family events</li>
            <li>Continued masjid construction progress</li>
          </ul>
          <p style="color: #666; line-height: 1.6;">Your monthly gift makes this possible. JazakAllah Khair for being a Builders Club member!</p>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Mountain House Muslim Association</p>
        </div>
      </div>
    `;

    let sent = 0;
    for (const t of targets) {
      try {
        await sendEmail(t.email, "Your Monthly Impact — MHMA Builders Club", html);
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${t.email}:`, err);
      }
    }

    return NextResponse.json({ success: true, sent, total: targets.length });
  } catch (err: any) {
    console.error("notify-monthly error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
