import { prisma } from "@/lib/prisma";
import { supportErrorMessage } from "@/lib/support-errors";
import { ensureSupportMessagesTable } from "@/lib/support-messages";

export async function POST(req: Request) {
  try {
    await ensureSupportMessagesTable();

    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: "UserId required" }, { status: 400 });
    }

    await prisma.$executeRaw`
      INSERT INTO "SupportConversation" ("userId", "status", "createdAt", "updatedAt", "closedAt")
      VALUES (${userId}, 'CLOSED', NOW(), NOW(), NOW())
      ON CONFLICT ("userId")
      DO UPDATE SET "status" = 'CLOSED', "updatedAt" = NOW(), "closedAt" = NOW()
    `;

    return Response.json(
      { ok: true, userId, status: "CLOSED" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json(
      { error: "Support close failed", details: supportErrorMessage(error) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
