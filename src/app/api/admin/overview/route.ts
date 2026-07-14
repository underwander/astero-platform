import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    await ensureCrmSchema();
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

    if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requesterId = session.sub;
    const requesterRole = session.role;
    const requestedManagerId = searchParams.get("managerId");
    const mainAdminManagerScope =
      requesterRole === "ADMIN" &&
      session.email === "test6@test.com" &&
      requestedManagerId &&
      requestedManagerId !== "all"
        ? requestedManagerId
        : null;
    const managerScope = requesterRole === "MANAGER" && requesterId ? requesterId : mainAdminManagerScope;
    const restrictUsers = requesterRole === "MANAGER" && requesterId ? requesterId : null;
    const users = await prisma.user.findMany({
      where: restrictUsers
        ? { OR: [{ managerId: restrictUsers }, { id: restrictUsers }, { role: "ADMIN" }] }
        : undefined,
      select: {
        id: true,
        clientNumber: true,
        email: true,
        password: true,
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

    const usersWithSafePasswords = await Promise.all(
      users.map(async (user) => {
        const { password, ...safeUser } = user;
        const plainPasswordSynced =
          typeof safeUser.plainPassword === "string" &&
          safeUser.plainPassword.length > 0 &&
          (await bcrypt.compare(safeUser.plainPassword, password));

        return {
          ...safeUser,
          plainPassword: plainPasswordSynced ? safeUser.plainPassword : null,
          plainPasswordSynced,
        };
      })
    );

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
      users: usersWithSafePasswords,
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
