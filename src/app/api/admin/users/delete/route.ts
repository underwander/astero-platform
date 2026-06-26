import { prisma } from "@/lib/prisma";
import { ensureSupportMessagesTable } from "@/lib/support-messages";

export async function DELETE(req: Request) {
  try {
    await ensureSupportMessagesTable();
    const { userId } = await req.json();

    if (!userId) {
      return Response.json(
        { error: "UserId required" },
        { status: 400 }
      );
    }

    const openTrades = await prisma.trade.findMany({
      where: {
        userId,
        closePrice: null,
      },
    });

    if (openTrades.length > 0) {
      return Response.json(
        { error: "Cannot delete user with open positions" },
        { status: 400 }
      );
    }

    await prisma.withdrawal.deleteMany({
      where: {
        userId,
      },
    });

    await prisma.deposit.deleteMany({
      where: {
        userId,
      },
    });

    await prisma.balanceHistory.deleteMany({
      where: {
        userId,
      },
    });

    await prisma.trade.deleteMany({
      where: {
        userId,
      },
    });

    await prisma.clientNote.deleteMany({ where: { userId } });
    await prisma.clientAction.deleteMany({ where: { userId } });
    await prisma.verificationDocument.deleteMany({ where: { userId } });

    await prisma.$executeRaw`
      DELETE FROM "SupportMessage"
      WHERE "userId" = ${userId}
    `;

    await prisma.$executeRaw`
      DELETE FROM "SupportConversation"
      WHERE "userId" = ${userId}
    `;

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Delete error" },
      { status: 500 }
    );
  }
}
