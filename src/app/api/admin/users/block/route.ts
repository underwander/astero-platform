import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { userId, isBlocked } = await req.json();

    if (!userId || typeof isBlocked !== "boolean") {
      return Response.json(
        { error: "UserId and isBlocked required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isBlocked,
      },
    });

    return Response.json({
      id: user.id,
      email: user.email,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}