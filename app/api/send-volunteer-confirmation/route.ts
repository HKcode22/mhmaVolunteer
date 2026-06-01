import { NextResponse } from "next/server";
import { sendEmail, confirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    await sendEmail(
      email,
      "Thank You for Volunteering with MHMA!",
      confirmationEmail(name || "Volunteer",
        `<p>Thank you for signing up to volunteer with the Mountain House Muslim Association!</p>
        <p>We truly appreciate your willingness to give your time and skills to serve our community. Our volunteer coordinator will review your submission and reach out to you soon with next steps.</p>
        <p>In the meantime, feel free to explore our programs and events on the website. If you have any questions, please contact us at <a href="mailto:mhma@mhma.us" style="color:#C9A84C;">mhma@mhma.us</a>.</p>
        <p style="margin-top:20px;font-size:13px;color:#888;">This is an automated message — please do not reply directly.</p>`
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Volunteer confirmation email error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
