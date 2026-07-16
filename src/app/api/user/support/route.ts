import { prisma } from "@/lib/prisma";
import { ensureSupportMessagesTable } from "@/lib/support-messages";
import { supportErrorMessage } from "@/lib/support-errors";
import { buildSupportBotReply } from "@/lib/support-ai";
import { randomUUID } from "crypto";
import { isAuthResponse, resolveScopedUserId } from "@/lib/api-auth";

type SupportMessageRow = {
  id: string;
  userId: string;
  message: string;
  sender: string | null;
  fromRole: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  attachmentBase64: string | null;
  createdAt: Date;
};

type SupportConversationRow = {
  status: string;
  closedAt: Date | null;
  clientLastReadAt: Date | null;
};

export async function GET(req: Request) {
  try {
    await ensureSupportMessagesTable();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const scoped = await resolveScopedUserId(userId);

    if (isAuthResponse(scoped)) return scoped;

    const conversation = await prisma.$queryRaw<SupportConversationRow[]>`
      SELECT "status", "closedAt", "clientLastReadAt"
      FROM "SupportConversation"
      WHERE "userId" = ${scoped.userId}
      LIMIT 1
    `;

    const currentConversation = conversation[0] || { status: "OPEN", closedAt: null, clientLastReadAt: null };

    if (currentConversation.status === "CLOSED") {
      return Response.json(
        { status: "CLOSED", messages: [], unreadCount: 0, clientLastReadAt: currentConversation.clientLastReadAt },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const messages = await loadClientMessages(scoped.userId, currentConversation.closedAt);
    const unreadCount = messages.filter((item) => {
      const sender = item.sender || item.fromRole;
      return ["ADMIN", "MANAGER", "BOT"].includes(sender || "") &&
        (!currentConversation.clientLastReadAt || new Date(item.createdAt) > new Date(currentConversation.clientLastReadAt));
    }).length;

    return Response.json({
      status: currentConversation.status,
      messages,
      unreadCount,
      clientLastReadAt: currentConversation.clientLastReadAt,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Support load failed", details: supportErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureSupportMessagesTable();

    const { userId, message, attachment } = await req.json();
    const scoped = await resolveScopedUserId(userId);
    const text = String(message || "").trim();
    const attachmentName = attachment?.name ? String(attachment.name).slice(0, 180) : null;
    const attachmentMimeType = attachment?.mimeType ? String(attachment.mimeType).slice(0, 120) : null;
    const attachmentBase64 = attachment?.base64 ? String(attachment.base64) : null;

    if (isAuthResponse(scoped)) return scoped;

    if (!text && !attachmentBase64) {
      return Response.json({ error: "Message or file required" }, { status: 400 });
    }

    if (attachmentBase64 && (!attachmentMimeType || attachmentBase64.length > 6_500_000)) {
      return Response.json({ error: "Files up to 5MB are supported" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: scoped.userId },
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
    await prisma.$executeRaw`
      INSERT INTO "SupportConversation" ("userId", "status", "createdAt", "updatedAt", "closedAt", "clientLastReadAt")
      VALUES (${scoped.userId}, 'OPEN', NOW(), NOW(), NULL, NOW())
      ON CONFLICT ("userId")
      DO UPDATE SET "status" = 'OPEN', "updatedAt" = NOW(), "closedAt" = NULL, "clientLastReadAt" = NOW()
    `;

    const created = await prisma.$queryRaw<SupportMessageRow[]>`
      INSERT INTO "SupportMessage" ("id", "userId", "message", "sender", "fromRole", "attachmentName", "attachmentMimeType", "attachmentBase64")
      VALUES (${id}, ${scoped.userId}, ${text}, 'CLIENT', 'CLIENT', ${attachmentName}, ${attachmentMimeType}, ${attachmentBase64})
      RETURNING "id", "userId", "message", "sender", "fromRole", "attachmentName", "attachmentMimeType", "attachmentBase64", "createdAt"
    `;

    const messages = await loadClientMessages(scoped.userId, null);
    const hasStaffReply = messages.some((item) => ["ADMIN", "MANAGER"].includes(item.sender || item.fromRole || ""));

    if (!hasStaffReply) {
      const botId = randomUUID();
      const botText = buildSupportBotReply(messages, Boolean(attachmentBase64));
      await prisma.$executeRaw`
        INSERT INTO "SupportMessage" ("id", "userId", "message", "sender", "fromRole")
        VALUES (${botId}, ${scoped.userId}, ${botText}, 'BOT', 'BOT')
      `;
    }

    return Response.json(created[0], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Support send failed", details: supportErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureSupportMessagesTable();

    const { userId, action } = await req.json();
    const scoped = await resolveScopedUserId(userId);

    if (isAuthResponse(scoped)) return scoped;

    if (action !== "read") {
      return Response.json({ error: "Unsupported action" }, { status: 400 });
    }

    await prisma.$executeRaw`
      INSERT INTO "SupportConversation" ("userId", "status", "createdAt", "updatedAt", "clientLastReadAt")
      VALUES (${scoped.userId}, 'OPEN', NOW(), NOW(), NOW())
      ON CONFLICT ("userId")
      DO UPDATE SET "clientLastReadAt" = NOW(), "updatedAt" = NOW()
    `;

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Support read update failed", details: supportErrorMessage(error) },
      { status: 500 }
    );
  }
}

function loadClientMessages(userId: string, closedAt: Date | null) {
  return prisma.$queryRaw<SupportMessageRow[]>`
    SELECT "id", "userId", "message", "sender", "fromRole", "attachmentName", "attachmentMimeType", "attachmentBase64", "createdAt"
    FROM "SupportMessage"
    WHERE "userId" = ${userId}
    AND (${closedAt}::timestamptz IS NULL OR "createdAt" > ${closedAt})
    ORDER BY "createdAt" ASC
  `;
}
