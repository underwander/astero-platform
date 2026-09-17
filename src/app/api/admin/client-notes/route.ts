import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

async function actor() {
  const store = await cookies();
  const session = await verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
  return session && ["ADMIN", "MANAGER"].includes(session.role) ? session : null;
}

async function canAccessClient(userId: string, session: { sub: string; role: string }) {
  if (session.role === "ADMIN") return true;
  const client = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
  return client?.managerId === session.sub;
}

export async function POST(req: Request) {
  try {
    await ensureCrmSchema();
    const session = await actor();
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });
    const { clientId, userId, managerId, text, status } = await req.json();

    const targetUserId = clientId || userId;

    if (!targetUserId || !text) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }
    if (!(await canAccessClient(targetUserId, session))) return Response.json({ error: "Недостаточно прав" }, { status: 403 });

    const note = await prisma.clientNote.create({
      data: {
        userId: targetUserId,
        text,
        status: status || "OPEN",
        managerId: session.role === "MANAGER" ? session.sub : managerId || session.sub,
      },
    });

    return Response.json(note);
  } catch (error) {
    console.error("Client note create error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema();
    const session = await actor();
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });
    const { noteId, text, status } = await req.json();

    if (!noteId) {
      return Response.json(
        { error: "Missing noteId" },
        { status: 400 }
      );
    }
    const existing = await prisma.clientNote.findUnique({ where: { id: noteId }, select: { userId: true } });
    if (!existing || !(await canAccessClient(existing.userId, session))) return Response.json({ error: "Заметка не найдена" }, { status: 404 });

    const note = await prisma.clientNote.update({
      where: {
        id: noteId,
      },
      data: {
        ...(typeof text === "string" && text.trim() ? { text: text.trim() } : {}),
        ...(status ? { status } : {}),
      },
    });

    return Response.json(note);
  } catch (error) {
    console.error("Client note update error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureCrmSchema();
    const session = await actor();
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });
    const { noteId } = await req.json();

    if (!noteId) {
      return Response.json({ error: "Missing noteId" }, { status: 400 });
    }
    const existing = await prisma.clientNote.findUnique({ where: { id: noteId }, select: { userId: true } });
    if (!existing || !(await canAccessClient(existing.userId, session))) return Response.json({ error: "Заметка не найдена" }, { status: 404 });

    await prisma.clientNote.delete({ where: { id: noteId } });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Client note delete error:", error);
    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
