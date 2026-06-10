import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
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