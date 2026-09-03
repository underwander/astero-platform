import { Resend } from "resend";

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Email is not configured: RESEND_API_KEY is missing");
      return false;
    }

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Astero <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
}
