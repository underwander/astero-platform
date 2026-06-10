import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const {
      clientId,
      userId,
      managerId,
      title,
      description,
      dueAt,
      status,
    } = await req.json();

    const targetUserId = clientId || userId;

    if (!targetUserId || !title || !dueAt) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const action = await prisma.clientAction.create({
      data: {
        userId: targetUserId,
        title,
        description: description || null,
        status: status || "OPEN",
        dueAt: new Date(dueAt),
      },
    });

    return Response.json(action);
  } catch (error) {
    console.error("Client action create error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const {
      actionId,
      status,
      dueAt,
    } = await req.json();

    if (!actionId) {
      return Response.json(
        { error: "Missing actionId" },
        { status: 400 }
      );
    }

    const action = await prisma.clientAction.update({
      where: {
        id: actionId,
      },
      data: {
        ...(status ? { status } : {}),
        ...(dueAt ? { dueAt: new Date(dueAt) } : {}),
      },
    });

    return Response.json(action);
  } catch (error) {
    console.error("Client action update error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}