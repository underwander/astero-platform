import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function PATCH(req: Request) {
  try {
    const { userId, amount } = await req.json();

    if (!userId || amount === undefined || amount === null || amount === "") {
      return Response.json(
        { error: "UserId and amount required" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount === 0) {
      return Response.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, balance: true },
      });

      if (!currentUser) throw new Error("User not found");

      const nextBalance = Math.max(0, Number(currentUser.balance || 0) + numericAmount);

      return tx.user.update({
        where: { id: userId },
        data: { balance: nextBalance },
      });
    });

    await prisma.balanceHistory.create({
      data: {
        userId: user.id,
        type: numericAmount >= 0 ? "DEPOSIT" : "WITHDRAWAL_ADJUSTMENT",
        amount: numericAmount,
        balance: user.balance,
        description: numericAmount >= 0 ? "Admin deposit" : "Admin balance deduction",
      },
    });

    await sendEmail(
      user.email,
      numericAmount >= 0 ? "Deposit completed" : "Balance adjusted",
      `
      <h2>${numericAmount >= 0 ? "Deposit completed" : "Balance adjusted"}</h2>
      <p>${numericAmount >= 0 ? "Your account has been funded." : "Funds were deducted from your account."}</p>
      <p><b>Amount:</b> €${numericAmount.toFixed(2)}</p>
      <p><b>New balance:</b> €${Number(user.balance).toFixed(2)}</p>
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
