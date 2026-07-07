import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";

export async function POST(req: Request) {
  try {
    await ensureCrmSchema();
    const {
      clientId,
      userId,
      managerId,
      title,
      description,
      dueAt,
      status,
      reminderMinutes,
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
        managerId: managerId || null,
        reminderMinutes: reminderMinutes ? Number(reminderMinutes) : null,
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
    await ensureCrmSchema();
    const {
      actionId,
      title,
      description,
      status,
      dueAt,
      managerId,
      reminderMinutes,
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
        ...(typeof title === "string" && title.trim() ? { title: title.trim() } : {}),
        ...(typeof description === "string" ? { description: description.trim() || null } : {}),
        ...(status ? { status } : {}),
        ...(dueAt ? { dueAt: new Date(dueAt) } : {}),
        ...(managerId !== undefined ? { managerId: managerId || null } : {}),
        ...(reminderMinutes !== undefined ? { reminderMinutes: reminderMinutes ? Number(reminderMinutes) : null } : {}),
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
