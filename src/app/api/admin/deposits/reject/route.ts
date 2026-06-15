import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { depositId } = await req.json();

    if (!depositId) {
      return Response.json({ error: "DepositId required" }, { status: 400 });
    }

    const deposit = await prisma.deposit.findUnique({
      where: {
        id: depositId,
      },
    });

    if (!deposit) {
      return Response.json({ error: "Deposit not found" }, { status: 404 });
    }

    if (deposit.status !== "PENDING") {
      return Response.json({ error: "Already processed" }, { status: 400 });
    }

    const updated = await prisma.deposit.update({
      where: {
        id: depositId,
      },
      data: {
        status: "REJECTED",
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Deposit reject error:", error);

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
