import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { ensureCrmSchema } from "@/lib/crm-schema";
import { isAuthResponse, resolveScopedUserId } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    await ensureCrmSchema();
    const body = await req.json();

    const { userId, amount, method, destination, details } = body;
    const scoped = await resolveScopedUserId(userId, { allowStaffAccess: true });

    if (isAuthResponse(scoped)) return scoped;

    if (!amount || !method) {
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
        id: scoped.userId,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        userId: scoped.userId,
        status: "PENDING",
      },
      select: {
        amount: true,
      },
    });
    const pendingAmount = pendingWithdrawals.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const availableAmount = Math.max(0, Number(user.balance || 0) - pendingAmount);

    if (numericAmount > availableAmount) {
      return Response.json(
        {
          error: "Недостаточно доступных средств или уже есть ожидающая заявка на эту сумму",
          availableAmount,
          pendingAmount,
        },
        { status: 400 }
      );
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: scoped.userId,
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
      <p><b>Amount:</b> €${numericAmount.toFixed(2)}</p>
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
