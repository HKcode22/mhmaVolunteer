import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { sendEmail, notifyBoard } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { title, slug } = await req.json();

    const boardHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#C9A84C;">New Program Created</h2>
        <p><strong>${title}</strong></p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://mhma-update.vercel.app"}/programs/${slug}" style="display:inline-block;background:#C9A84C;color:#0A1F14;padding:10px 20px;text-decoration:none;border-radius:4px;margin-top:12px;">View Program</a>
      </div>`;
    await notifyBoard(`New Program: ${title}`, boardHtml);

    const subsSnap = await firestore.collection("subscribers").where("status", "==", "active").get();
    const subscriberHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#C9A84C;">New Program at MHMA</h2>
        <p>We're excited to announce a new program:</p>
        <h3 style="color:#0A1F14;">${title}</h3>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://mhma-update.vercel.app"}/programs/${slug}" style="display:inline-block;background:#C9A84C;color:#0A1F14;padding:10px 20px;text-decoration:none;border-radius:4px;margin-top:12px;">Program Details</a>
        <p style="margin-top:24px;font-size:12px;color:#888;">You received this because you subscribed. <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://mhma-update.vercel.app"}/unsubscribe">Unsubscribe</a></p>
      </div>`;

    let sent = 0;
    const results = await Promise.allSettled(
      subsSnap.docs.map((doc: any) => {
        const email = doc.data().email;
        if (!email) return Promise.resolve();
        return sendEmail(email, `New Program: ${title}`, subscriberHtml);
      })
    );
    sent = results.filter((r) => r.status === "fulfilled").length;

    return NextResponse.json({ success: true, boardNotified: true, subscriberNotifySent: sent });
  } catch (err: any) {
    console.error("Failed to notify program:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
