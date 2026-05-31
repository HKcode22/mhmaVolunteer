import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { sendEmail, confirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { title, excerpt, slug } = await req.json();
    if (!title || !slug) {
      return NextResponse.json({ error: "Missing title or slug" }, { status: 400 });
    }

    const snapshot = await firestore
      .collection("subscribers")
      .where("status", "==", "active")
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, sent: 0, total: 0 });
    }

    const subscribers = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    const newsUrl = `https://mhma-update.vercel.app/news/${slug}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f8f3;">
        <div style="background: #1a3a2a; padding: 30px; text-align: center;">
          <h1 style="color: #c9a227; margin: 0; font-size: 24px;">MHMA Newsletter</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1a3a2a;">${title}</h2>
          <p style="color: #666; line-height: 1.6;">${excerpt}</p>
          <a href="${newsUrl}" style="display: inline-block; padding: 12px 24px; background: #c9a227; color: #1a3a2a; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">
            Read Full Article
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Mountain House Muslim Association</p>
          <p><a href="https://mhma-update.vercel.app/unsubscribe" style="color: #c9a227;">Unsubscribe</a></p>
        </div>
      </div>
    `;

    let sent = 0;
    for (const sub of subscribers) {
      try {
        await sendEmail(sub.email, `New Article: ${title}`, html);
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${sub.email}:`, err);
      }
    }

    return NextResponse.json({ success: true, sent, total: subscribers.length });
  } catch (err: any) {
    console.error("notify-news error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
