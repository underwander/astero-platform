import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { documentId, status } = await req.json();

    if (!documentId || !status) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const document = await prisma.verificationDocument.update({
      where: {
        id: documentId,
      },
      data: {
        status,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (document.user?.id) {
      await prisma.user.update({
        where: {
          id: document.user.id,
        },
        data: {
          kycStatus: status,
        },
      });
    }

    return Response.json(document);
  } catch (error) {
    console.error("Verification update error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}