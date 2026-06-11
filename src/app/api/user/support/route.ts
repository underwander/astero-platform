import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "UserId required" }, { status: 400 });
    }

    const messages = await prisma.supportMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
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
    const { userId, message } = await req.json();
    const text = String(message || "").trim();

    if (!userId || !text) {
      return Response.json({ error: "UserId and message required" }, { status: 400 });
    }

    const created = await prisma.supportMessage.create({
      data: {
        userId,
        sender: "CLIENT",
        fromRole: "CLIENT",
        message: text,
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
