import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema();

    const { withdrawalId, method, destination, details } = await req.json();

    if (!withdrawalId) {
      return Response.json({ error: "Withdrawal id required" }, { status: 400 });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: {
        id: withdrawalId,
      },
    });

    if (!withdrawal) {
      return Response.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    const normalizedMethod = typeof method === "string" && method.trim() ? method.trim() : withdrawal.method;
    const normalizedDestination = typeof destination === "string" && destination.trim() ? destination.trim() : null;
    const normalizedDetails =
      typeof details === "string"
        ? details
        : details
          ? JSON.stringify(details)
          : null;

    const updated = await prisma.withdrawal.update({
      where: {
        id: withdrawalId,
      },
      data: {
        method: normalizedMethod,
        destination: normalizedDestination,
        details: normalizedDetails,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            managerId: true,
          },
        },
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Withdrawal update error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
