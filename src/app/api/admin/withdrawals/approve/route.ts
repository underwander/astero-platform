import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { withdrawalId } = await req.json();

    const withdrawal = await prisma.withdrawal.findUnique({
      where: {
        id: withdrawalId,
      },
    });

    if (!withdrawal) {
      return Response.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    if (withdrawal.status !== "PENDING") {
      return Response.json(
        { error: "Already processed" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: {
        id: withdrawal.userId,
      },
      data: {
        balance: {
          decrement: withdrawal.amount,
        },
      },
    });

    const updated = await prisma.withdrawal.update({
      where: {
        id: withdrawalId,
      },
      data: {
        status: "APPROVED",
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}