import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { testEmail } = await req.json();
    const snapshot = await firestore
      .collection("donations")
      .where("status", "==", "completed")
      .limit(500)
      .get();

    const donors = new Map<string, { email: string; name: string }>();
    snapshot.docs.forEach(d => {
      const data = d.data();
      const email = data.donorEmail;
      if (email && !donors.has(email)) {
        donors.set(email, { email, name: data.donorName || "Friend" });
      }
    });

    const targets = testEmail ? [{ email: testEmail, name: "Friend" }] : Array.from(donors.values());
    if (targets.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No donors found" });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f8f3;">
        <div style="background: #1a3a2a; padding: 30px; text-align: center;">
          <h1 style="color: #c9a227; margin: 0; font-size: 22px;">MHMA Quarterly Update</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <p style="color: #333; font-size: 16px;">Assalamu Alaikum ${targets[0]?.name || "Friend"},</p>
          <p style="color: #666; line-height: 1.6;">Here is a summary of what we accomplished together this quarter:</p>
          <div style="background: #f9f8f3; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #1a3a2a; font-weight: bold; margin: 0 0 8px;">Quarterly Highlights</p>
            <ul style="color: #666; line-height: 1.8; padding-left: 20px; margin: 0;">
              <li>Continued masjid construction — foundation work progressing</li>
              <li>Served 500+ families through programs and events</li>
              <li>Expanded youth programs with new activities</li>
              <li>Hosted community iftars and family nights</li>
            </ul>
          </div>
          <p style="color: #666; line-height: 1.6;">Thank you for being part of the MHMA community. Your support makes all of this possible.</p>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Mountain House Muslim Association</p>
        </div>
      </div>
    `;

    let sent = 0;
    for (const t of targets) {
      try {
        await sendEmail(t.email, "MHMA Quarterly Update — Community Impact Report", html);
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${t.email}:`, err);
      }
    }

    return NextResponse.json({ success: true, sent, total: targets.length });
  } catch (err: any) {
    console.error("notify-quarterly error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
