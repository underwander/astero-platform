import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";
import { isAuthResponse, resolveScopedUserId } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    await ensureCrmSchema();
    const { searchParams } = new URL(req.url);
    const scoped = await resolveScopedUserId(searchParams.get("userId"), { allowStaffAccess: true });

    if (isAuthResponse(scoped)) return scoped;

    const trades = await prisma.trade.findMany({
      where: { userId: scoped.userId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(trades);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
