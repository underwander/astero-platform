import { prisma } from "@/lib/prisma";
import { ensureSupportMessagesTable } from "@/lib/support-messages";
import { supportErrorMessage } from "@/lib/support-errors";
import { randomUUID } from "crypto";

type SupportMessageRow = {
  id: string;
  userId: string;
  message: string;
  sender: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  attachmentBase64: string | null;
  createdAt: Date;
};

type SupportConversationRow = {
  userId: string;
  status: string;
  closedAt: Date | null;
  updatedAt: Date;
};

export async function GET() {
  try {
    await ensureSupportMessagesTable();

    const messages = await prisma.$queryRaw<SupportMessageRow[]>`
      SELECT "id", "userId", "message", "sender", "attachmentName", "attachmentMimeType", "attachmentBase64", "createdAt"
      FROM "SupportMessage"
      ORDER BY "createdAt" DESC
    `;

    const conversations = await prisma.$queryRaw<SupportConversationRow[]>`
      SELECT "userId", "status", "closedAt", "updatedAt"
      FROM "SupportConversation"
      ORDER BY "updatedAt" DESC
    `;

    return Response.json({ messages, conversations }, {
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

    const { userId, message, attachment } = await req.json();
    const text = String(message || "").trim();
    const attachmentName = attachment?.name ? String(attachment.name).slice(0, 180) : null;
    const attachmentMimeType = attachment?.mimeType ? String(attachment.mimeType).slice(0, 120) : null;
    const attachmentBase64 = attachment?.base64 ? String(attachment.base64) : null;

    if (!userId || (!text && !attachmentBase64)) {
      return Response.json({ error: "UserId and message or image required" }, { status: 400 });
    }

    if (attachmentBase64 && (!attachmentMimeType?.startsWith("image/") || attachmentBase64.length > 6_500_000)) {
      return Response.json({ error: "Only images up to 5MB are supported" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "SupportConversation" ("userId", "status", "createdAt", "updatedAt", "closedAt")
      VALUES (${userId}, 'OPEN', NOW(), NOW(), NULL)
      ON CONFLICT ("userId")
      DO UPDATE SET "status" = 'OPEN', "updatedAt" = NOW()
    `;

    const created = await prisma.$queryRaw<SupportMessageRow[]>`
      INSERT INTO "SupportMessage" ("id", "userId", "message", "sender", "fromRole", "attachmentName", "attachmentMimeType", "attachmentBase64")
      VALUES (${id}, ${userId}, ${text}, 'ADMIN', 'ADMIN', ${attachmentName}, ${attachmentMimeType}, ${attachmentBase64})
      RETURNING "id", "userId", "message", "sender", "attachmentName", "attachmentMimeType", "attachmentBase64", "createdAt"
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
