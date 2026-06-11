import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        city: true,
        address: true,
        balance: true,
        role: true,
        isBlocked: true,
        kycStatus: true,
        managerId: true,
        createdAt: true,

        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },

        trades: true,
        withdrawals: true,

        verificationDocs: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            fileUrl: true,
            mimeType: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        clientNotes: {
          orderBy: {
            createdAt: "desc",
          },
        },

        clientActions: {
          orderBy: {
            dueAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const withdrawals = await prisma.withdrawal.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const trades = await prisma.trade.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      users,
      withdrawals,
      trades,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
