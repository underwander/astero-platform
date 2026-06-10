import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { userId, amount, method, destination, details } = body;

    if (!userId || !amount || !method) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return Response.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount: numericAmount,
        method,
        destination: destination || null,
        details:
          typeof details === "string"
            ? details
            : details
              ? JSON.stringify(details)
              : null,
      },
    });

    await sendEmail(
      user.email,
      "Withdrawal Request Received",
      `
      <h2>Withdrawal Request Received</h2>
      <p>Your withdrawal request has been received.</p>
      <p><b>Amount:</b> $${numericAmount.toFixed(2)}</p>
      <p><b>Method:</b> ${method}</p>
      <p><b>Status:</b> PENDING</p>
      `
    );

    return Response.json(withdrawal);
  } catch (error) {
    console.error("Withdrawal create error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}