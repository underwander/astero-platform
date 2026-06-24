import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema();
    const { userId, tradingEnabled } = await req.json();

    if (!userId || typeof tradingEnabled !== "boolean") {
      return Response.json({ error: "UserId and tradingEnabled required" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { tradingEnabled },
      select: { id: true, email: true, tradingEnabled: true },
    });

    return Response.json(user);
  } catch (error) {
    console.error("Client trading permission error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
