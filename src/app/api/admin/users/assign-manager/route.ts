import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { userId, managerId } = await req.json();

    if (!userId) {
      return Response.json({ error: "User id required" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { managerId: managerId || null },
      select: { id: true, email: true, managerId: true },
    });

    return Response.json(user);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
