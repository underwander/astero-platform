import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { cookies } from "next/headers";
import { ensureCrmSchema, getRequestIp } from "@/lib/crm-schema";
import { DepositCommentValidationError, parseManualBalanceAmount, prepareManualBalanceOperation } from "@/lib/deposit-comment";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema();
    const cookieStore = await cookies();
    const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
      return Response.json({ error: "Session expired" }, { status: 401 });
    }

    const { userId, amount, comment } = await req.json();

    if (!userId) {
      return Response.json(
        { error: "UserId required" },
        { status: 400 }
      );
    }

    const numericAmount = parseManualBalanceAmount(amount);
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${String(userId)} FOR UPDATE`;
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, balance: true },
      });

      if (!currentUser) throw new Error("User not found");

      const operationData = prepareManualBalanceOperation(currentUser.balance, numericAmount, comment);

      const user = await tx.user.update({
        where: { id: userId },
        data: { balance: operationData.nextBalance },
      });

      const operation = await tx.balanceHistory.create({
        data: {
          userId: user.id,
          type: operationData.type,
          amount: operationData.amount,
          balance: user.balance,
          description: operationData.description,
        },
      });

      await tx.securityEvent.create({
        data: {
          type: numericAmount >= 0 ? "ADMIN_DEPOSIT" : "ADMIN_BALANCE_DEDUCTION",
          risk: "MEDIUM",
          description: `${session.email} ${numericAmount >= 0 ? "credited" : "deducted"} EUR ${Math.abs(numericAmount).toFixed(2)} for ${user.email}${operationData.comment ? `: ${operationData.comment}` : ""}`,
          ip: getRequestIp(req),
          path: "/api/admin/users/deposit",
          userId: user.id,
        },
      });

      return { user, operation };
    });

    try {
      await sendEmail(
        result.user.email,
        numericAmount >= 0 ? "Deposit completed" : "Balance adjusted",
        `
        <h2>${numericAmount >= 0 ? "Deposit completed" : "Balance adjusted"}</h2>
        <p>${numericAmount >= 0 ? "Your account has been funded." : "Funds were deducted from your account."}</p>
        <p><b>Amount:</b> €${numericAmount.toFixed(2)}</p>
        <p><b>New balance:</b> €${Number(result.user.balance).toFixed(2)}</p>
        `
      );
    } catch (notificationError) {
      console.error("Deposit email notification failed:", notificationError);
    }

    return Response.json({
      id: result.user.id,
      email: result.user.email,
      balance: result.user.balance,
      operation: result.operation,
    });
  } catch (error) {
    if (error instanceof DepositCommentValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
