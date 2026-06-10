import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  try {
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