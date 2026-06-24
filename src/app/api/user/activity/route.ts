import { prisma } from "@/lib/prisma";
import { ensureCrmSchema, getRequestIp } from "@/lib/crm-schema";

export async function POST(req: Request) {
  try {
    await ensureCrmSchema();
    const { userId } = await req.json();

    if (!userId || typeof userId !== "string") {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date(), lastIp: getRequestIp(req) },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("User activity error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
