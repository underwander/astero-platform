import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { userId, balance } = await req.json();

    if (!userId || balance === undefined || balance === null) {
      return Response.json(
        { error: "UserId and balance required" },
        { status: 400 }
      );
    }

    const numericBalance = Number(balance);

    if (Number.isNaN(numericBalance) || numericBalance < 0) {
      return Response.json(
        { error: "Invalid balance" },
        { status: 400 }
      );
    }

    const oldUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!oldUser) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const difference = numericBalance - oldUser.balance;

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        balance: numericBalance,
      },
    });

    await prisma.balanceHistory.create({
  data: {
    userId: user.id,
    type: "SET_BALANCE",
    amount: difference,
    balance: user.balance,
    description: "Manual balance adjustment",
  },
});

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