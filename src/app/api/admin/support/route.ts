import { prisma } from "@/lib/prisma";
import { ensureSupportMessagesTable } from "@/lib/support-messages";

export async function GET() {
  try {
    await ensureSupportMessagesTable();

    const messages = await prisma.supportMessage.findMany({
      select: {
        id: true,
        userId: true,
        message: true,
        sender: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

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

    const created = await prisma.supportMessage.create({
      data: {
        userId,
        sender: "ADMIN",
        message: text,
      },
      select: {
        id: true,
        userId: true,
        message: true,
        sender: true,
        createdAt: true,
      },
    });

    return Response.json(created, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
