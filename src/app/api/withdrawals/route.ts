import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";

export async function GET(req: Request) {
  await ensureCrmSchema();
  const { searchParams } = new URL(req.url);

  const userId = searchParams.get("userId");

  if (!userId) {
    return Response.json(
      { error: "UserId required" },
      { status: 400 }
    );
  }

  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json(withdrawals);
}
