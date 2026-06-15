import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { depositId } = await req.json();

    if (!depositId) {
      return Response.json({ error: "DepositId required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposit.findUnique({
        where: {
          id: depositId,
        },
      });

      if (!deposit) {
        throw new Error("DEPOSIT_NOT_FOUND");
      }

      if (deposit.status !== "PENDING") {
        throw new Error("ALREADY_PROCESSED");
      }

      const user = await tx.user.update({
        where: {
          id: deposit.userId,
        },
        data: {
          balance: {
            increment: deposit.amount,
          },
        },
      });

      await tx.balanceHistory.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          amount: deposit.amount,
          balance: user.balance,
          description: `Deposit request approved: ${deposit.method || "manual"}`,
        },
      });

      return tx.deposit.update({
        where: {
          id: depositId,
        },
        data: {
          status: "APPROVED",
        },
      });
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "DEPOSIT_NOT_FOUND") {
      return Response.json({ error: "Deposit not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "ALREADY_PROCESSED") {
      return Response.json({ error: "Already processed" }, { status: 400 });
    }

    console.error("Deposit approve error:", error);

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
