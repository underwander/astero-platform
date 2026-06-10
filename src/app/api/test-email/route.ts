import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    await sendEmail(
      "miki2525@tutamail.com",
      "Astero Test",
      `
      <h1>Email works 🚀</h1>
      <p>This is a test message from Astero.</p>
      `
    );

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Email send failed",
      },
      {
        status: 500,
      }
    );
  }
}