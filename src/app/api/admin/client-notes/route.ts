import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";

export async function POST(req: Request) {
  try {
    await ensureCrmSchema();
    const { clientId, userId, managerId, text, status } = await req.json();

    const targetUserId = clientId || userId;

    if (!targetUserId || !text) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const note = await prisma.clientNote.create({
      data: {
        userId: targetUserId,
        text,
        status: status || "OPEN",
        managerId: managerId || null,
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
    const { noteId, text, status } = await req.json();

    if (!noteId) {
      return Response.json(
        { error: "Missing noteId" },
        { status: 400 }
      );
    }

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
