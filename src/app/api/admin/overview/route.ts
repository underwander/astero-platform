import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";

export async function GET(req: Request) {
  try {
    await ensureCrmSchema();
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get("requesterId");
    const requesterRole = searchParams.get("role");
    const managerScope = requesterRole === "MANAGER" && requesterId ? requesterId : null;
    const users = await prisma.user.findMany({
      where: managerScope
        ? { OR: [{ managerId: managerScope }, { id: managerScope }, { role: "ADMIN" }] }
        : undefined,
      select: {
        id: true,
        clientNumber: true,
        email: true,
        plainPassword: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        city: true,
        address: true,
        balance: true,
        role: true,
        isBlocked: true,
        clientStatus: true,
        tradingEnabled: true,
        kycStatus: true,
        managerId: true,
        createdAt: true,
        lastLoginAt: true,
        lastSeenAt: true,
        lastIp: true,

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
            mimeType: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        clientNotes: {
          include: {
            manager: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        clientActions: {
          include: {
            manager: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
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
      where: managerScope ? { user: { managerId: managerScope } } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            managerId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const deposits = await prisma.deposit.findMany({
      where: managerScope ? { user: { managerId: managerScope } } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            managerId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const trades = await prisma.trade.findMany({
      where: managerScope ? { user: { managerId: managerScope } } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            managerId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      users,
      deposits,
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
