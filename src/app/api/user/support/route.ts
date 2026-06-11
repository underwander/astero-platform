import { prisma } from "@/lib/prisma";
import { ensureSupportMessagesTable } from "@/lib/support-messages";
import { randomUUID } from "crypto";

type SupportMessageRow = {
  id: string;
  userId: string;
  message: string;
  sender: string | null;
  createdAt: Date;
};

export async function GET(req: Request) {
  try {
    await ensureSupportMessagesTable();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "UserId required" }, { status: 400 });
    }

    const messages = await prisma.$queryRaw<SupportMessageRow[]>`
      SELECT "id", "userId", "message", "sender", "createdAt"
      FROM "SupportMessage"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" ASC
    `;

    return Response.json(messages, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
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
      return Response.json({ error: "Client not found. Please log in again." }, { status: 404 });
    }

    if (user.role === "ADMIN" || user.role === "MANAGER") {
      return Response.json(
        { error: "Open Support from a client account, not an admin account." },
        { status: 403 }
      );
    }

    const id = randomUUID();
    const created = await prisma.$queryRaw<SupportMessageRow[]>`
      INSERT INTO "SupportMessage" ("id", "userId", "message", "sender", "fromRole")
      VALUES (${id}, ${userId}, ${text}, 'CLIENT', 'CLIENT')
      RETURNING "id", "userId", "message", "sender", "createdAt"
    `;

    return Response.json(created[0], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
