import { prisma } from "@/lib/prisma";
import { isAuthResponse, resolveScopedUserId } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scoped = await resolveScopedUserId(searchParams.get("userId"), { allowStaffAccess: true });

    if (isAuthResponse(scoped)) return scoped;

    const deposits = await prisma.deposit.findMany({
      where: { userId: scoped.userId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(deposits);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
