import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { sendEmail, notifyBoard } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { title, date, time, location, slug } = await req.json();

    // Notify board
    const boardHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#C9A84C;">New Event Created</h2>
        <p><strong>${title}</strong></p>
        <p>Date: ${date || "TBD"}<br/>Time: ${time || "TBD"}<br/>Location: ${location || "TBD"}</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://mhma-update.vercel.app"}/events/${slug}" style="display:inline-block;background:#C9A84C;color:#0A1F14;padding:10px 20px;text-decoration:none;border-radius:4px;margin-top:12px;">View Event</a>
      </div>`;
    await notifyBoard(`New Event: ${title}`, boardHtml);

    // Notify active subscribers
    const subsSnap = await firestore.collection("subscribers").where("status", "==", "active").get();
    const subscriberHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#C9A84C;">New Event at MHMA</h2>
        <p>We're excited to announce a new event:</p>
        <h3 style="color:#0A1F14;">${title}</h3>
        <p>Date: ${date || "TBD"}<br/>Time: ${time || "TBD"}<br/>Location: ${location || "TBD"}</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://mhma-update.vercel.app"}/events/${slug}" style="display:inline-block;background:#C9A84C;color:#0A1F14;padding:10px 20px;text-decoration:none;border-radius:4px;margin-top:12px;">Event Details</a>
        <p style="margin-top:24px;font-size:12px;color:#888;">You received this because you subscribed. <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://mhma-update.vercel.app"}/unsubscribe">Unsubscribe</a></p>
      </div>`;

    let sent = 0;
    const results = await Promise.allSettled(
      subsSnap.docs.map((doc: any) => {
        const email = doc.data().email;
        if (!email) return Promise.resolve();
        return sendEmail(email, `New Event: ${title}`, subscriberHtml);
      })
    );
    sent = results.filter((r) => r.status === "fulfilled").length;

    return NextResponse.json({ success: true, boardNotified: true, subscriberNotifySent: sent });
  } catch (err: any) {
    console.error("Failed to notify event:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
