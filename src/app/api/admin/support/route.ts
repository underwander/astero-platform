import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const messages = await prisma.supportMessage.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
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
        sender: "ADMIN",
        fromRole: "ADMIN",
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
