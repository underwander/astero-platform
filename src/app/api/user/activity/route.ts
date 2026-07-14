import { prisma } from "@/lib/prisma";
import { ensureCrmSchema, getRequestIp } from "@/lib/crm-schema";
import { isAuthResponse, resolveScopedUserId } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    await ensureCrmSchema();
    const { userId } = await req.json();
    const scoped = await resolveScopedUserId(userId, { allowStaffAccess: true });

    if (isAuthResponse(scoped)) return scoped;

    await prisma.user.update({
      where: { id: scoped.userId },
      data: { lastSeenAt: new Date(), lastIp: getRequestIp(req) },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("User activity error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
