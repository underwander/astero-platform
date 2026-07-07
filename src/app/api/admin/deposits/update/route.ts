import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { depositId, createdAt } = await req.json();

    if (!depositId || !createdAt) {
      return Response.json({ error: "Deposit id and date required" }, { status: 400 });
    }

    const nextDate = new Date(createdAt);
    if (Number.isNaN(nextDate.getTime())) {
      return Response.json({ error: "Invalid date" }, { status: 400 });
    }

    const deposit = await prisma.deposit.update({
      where: { id: String(depositId) },
      data: { createdAt: nextDate },
    });

    return Response.json(deposit);
  } catch (error) {
    console.error("Deposit update error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
