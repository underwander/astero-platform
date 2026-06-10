import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function PATCH(req: Request) {
  try {
    const { userId, amount } = await req.json();

    if (!userId || !amount) {
      return Response.json(
        { error: "UserId and amount required" },
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

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        balance: {
          increment: numericAmount,
        },
      },
    });

    await prisma.balanceHistory.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount: numericAmount,
        balance: user.balance,
        description: "Admin deposit",
      },
    });

    await sendEmail(
      user.email,
      "Deposit completed",
      `
      <h2>Deposit completed</h2>
      <p>Your account has been funded.</p>
      <p><b>Amount:</b> $${numericAmount.toFixed(2)}</p>
      <p><b>New balance:</b> $${Number(user.balance).toFixed(2)}</p>
      `
    );

    return Response.json({
      id: user.id,
      email: user.email,
      balance: user.balance,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}