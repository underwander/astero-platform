import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema();
    const { userId, isBlocked, clientStatus } = await req.json();

    if (!userId || (typeof isBlocked !== "boolean" && typeof clientStatus !== "string")) {
      return Response.json(
        { error: "UserId and update field required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(typeof isBlocked === "boolean" ? { isBlocked } : {}),
        ...(typeof clientStatus === "string" ? { clientStatus } : {}),
      },
    });

    return Response.json({
      id: user.id,
      email: user.email,
      isBlocked: user.isBlocked,
      clientStatus: user.clientStatus,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
