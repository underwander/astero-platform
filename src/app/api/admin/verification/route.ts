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

export async function DELETE(req: Request) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return Response.json(
        { error: "Missing documentId" },
        { status: 400 }
      );
    }

    const deletedDocument = await prisma.verificationDocument.delete({
      where: {
        id: documentId,
      },
      select: {
        userId: true,
      },
    });

    const latestDocument = await prisma.verificationDocument.findFirst({
      where: {
        userId: deletedDocument.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        status: true,
      },
    });

    await prisma.user.update({
      where: {
        id: deletedDocument.userId,
      },
      data: {
        kycStatus: latestDocument?.status || "PENDING",
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Verification delete error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
