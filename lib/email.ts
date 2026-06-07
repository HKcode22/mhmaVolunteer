import nodemailer from "nodemailer";

function getFrom(): string {
  return process.env.EMAIL_FROM || "noreply@mhma-backend.firebaseapp.com";
}

export async function sendEmail(to: string, subject: string, html: string) {
  // Try Resend first
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({ from: getFrom(), to, subject, html }),
      });
      if (res.ok) return;
      console.error("Resend failed, falling back to SMTP:", await res.text());
    } catch (err) {
      console.error("Resend error, falling back to SMTP:", err);
    }
  }

  // Fallback: SMTP (configure via env vars)
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user, pass },
      });
      await transporter.sendMail({ from: getFrom(), to, subject, html });
      return;
    } catch (err) {
      console.error("SMTP error:", err);
    }
  }

  // Fallback: Gmail App Password (via env vars)
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });
      await transporter.sendMail({ from: gmailUser, to, subject, html });
      return;
    } catch (err) {
      console.error("Gmail SMTP error:", err);
    }
  }

  // Make debugging easier: if no provider is configured or all providers fail,
  // surface this as a hard error so the API route returns 500 and logs show why.
  const hasProvider =
    !!process.env.RESEND_API_KEY ||
    (!!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS) ||
    (!!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD);

  const details = hasProvider
    ? "A provider is configured, but sending failed for all configured providers."
    : "No email provider configured. Set RESEND_API_KEY, SMTP_* env vars, or GMAIL_USER/GMAIL_APP_PASSWORD.";

  throw new Error(details);
}

export function notifyBoard(subject: string, html: string) {
  const boardEmail = process.env.BOARD_NOTIFY_EMAIL || "hk84164@gmail.com";
  return sendEmail(boardEmail, subject, html).catch(e => console.error("Board notification failed:", e));
}

export function confirmationEmail(name: string, message: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0d9488;">JazakAllahu Khairan, ${name}!</h2>
      <p>${message}</p>
      <p style="color: #6b7280; font-size: 14px;">Mountain House Muslim Association</p>
    </div>
  `;
}
