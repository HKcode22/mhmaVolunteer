export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: "MHMA <onboarding@resend.dev>", to, subject, html }),
    });
  } catch (err) {
    console.error("Email send error:", err);
  }
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
