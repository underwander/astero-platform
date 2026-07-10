import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema();
    const { depositId, createdAt, adminComment } = await req.json();

    if (!depositId) {
      return Response.json({ error: "Deposit id required" }, { status: 400 });
    }

    const data: { createdAt?: Date; adminComment?: string | null } = {};

    if (createdAt) {
      const nextDate = new Date(createdAt);
      if (Number.isNaN(nextDate.getTime())) {
        return Response.json({ error: "Invalid date" }, { status: 400 });
      }
      data.createdAt = nextDate;
    }

    if (adminComment !== undefined) {
      data.adminComment = typeof adminComment === "string" ? adminComment.trim() || null : null;
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No changes provided" }, { status: 400 });
    }

    const deposit = await prisma.deposit.update({
      where: { id: String(depositId) },
      data,
    });

    return Response.json(deposit);
  } catch (error) {
    console.error("Deposit update error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
