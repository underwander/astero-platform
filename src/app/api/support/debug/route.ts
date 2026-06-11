import { prisma } from "@/lib/prisma";
import { supportErrorMessage } from "@/lib/support-errors";
import { ensureSupportMessagesTable } from "@/lib/support-messages";

type CountRow = {
  count: bigint;
};

export async function GET(req: Request) {
  try {
    await ensureSupportMessagesTable();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const users = await prisma.user.count();
    const totalMessages = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::bigint AS count FROM "SupportMessage"
    `;

    const userMessages = userId
      ? await prisma.$queryRaw<CountRow[]>`
          SELECT COUNT(*)::bigint AS count
          FROM "SupportMessage"
          WHERE "userId" = ${userId}
        `
      : [{ count: BigInt(0) }];

    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, role: true },
        })
      : null;

    return Response.json(
      {
        ok: true,
        database: "connected",
        supportTable: "ready",
        users,
        totalMessages: Number(totalMessages[0]?.count || 0),
        userMessages: Number(userMessages[0]?.count || 0),
        user,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: supportErrorMessage(error),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
