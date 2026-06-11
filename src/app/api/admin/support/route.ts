import { prisma } from "@/lib/prisma";
import { ensureSupportMessagesTable } from "@/lib/support-messages";
import { supportErrorMessage } from "@/lib/support-errors";
import { randomUUID } from "crypto";

type SupportMessageRow = {
  id: string;
  userId: string;
  message: string;
  sender: string | null;
  createdAt: Date;
};

export async function GET() {
  try {
    await ensureSupportMessagesTable();

    const messages = await prisma.$queryRaw<SupportMessageRow[]>`
      SELECT "id", "userId", "message", "sender", "createdAt"
      FROM "SupportMessage"
      ORDER BY "createdAt" DESC
    `;

    return Response.json(messages, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Admin support load failed", details: supportErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureSupportMessagesTable();

    const { userId, message } = await req.json();
    const text = String(message || "").trim();

    if (!userId || !text) {
      return Response.json({ error: "UserId and message required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    const id = randomUUID();
    const created = await prisma.$queryRaw<SupportMessageRow[]>`
      INSERT INTO "SupportMessage" ("id", "userId", "message", "sender", "fromRole")
      VALUES (${id}, ${userId}, ${text}, 'ADMIN', 'ADMIN')
      RETURNING "id", "userId", "message", "sender", "createdAt"
    `;

    return Response.json(created[0], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Admin support send failed", details: supportErrorMessage(error) },
      { status: 500 }
    );
  }
}
