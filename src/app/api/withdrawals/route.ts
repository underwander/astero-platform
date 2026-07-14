import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";
import { isAuthResponse, resolveScopedUserId } from "@/lib/api-auth";

export async function GET(req: Request) {
  await ensureCrmSchema();
  const { searchParams } = new URL(req.url);
  const scoped = await resolveScopedUserId(searchParams.get("userId"), { allowStaffAccess: true });

  if (isAuthResponse(scoped)) return scoped;

  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      userId: scoped.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json(withdrawals);
}
