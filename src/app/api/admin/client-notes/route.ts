import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { clientId, userId, text, status } = await req.json();

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
    const { noteId, status } = await req.json();

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