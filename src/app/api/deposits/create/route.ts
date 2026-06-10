import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, amount, method, sourceDetails, details } = await req.json();

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

    const deposit = await prisma.deposit.create({
      data: {
        userId,
        amount: numericAmount,
        method,
        details:
          typeof details === "string"
            ? details
            : details
              ? JSON.stringify(details)
              : sourceDetails || null,
      },
    });

    return Response.json(deposit);
  } catch (error) {
    console.error("Deposit create error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}