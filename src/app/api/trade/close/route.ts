import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { tradeId, closePrice } = await req.json();

    if (!tradeId || !closePrice) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const numericClosePrice = Number(closePrice);

    if (Number.isNaN(numericClosePrice) || numericClosePrice <= 0) {
      return Response.json(
        { error: "Invalid close price" },
        { status: 400 }
      );
    }

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      return Response.json(
        { error: "Trade not found" },
        { status: 404 }
      );
    }

    if (trade.closePrice !== null) {
      return Response.json(
        { error: "Trade already closed" },
        { status: 400 }
      );
    }

    let profit = 0;

    if (trade.side === "BUY") {
      profit =
        (numericClosePrice - trade.openPrice) *
        10000 *
        trade.volume;
    } else {
      profit =
        (trade.openPrice - numericClosePrice) *
        10000 *
        trade.volume;
    }

    const updatedTrade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        closePrice: numericClosePrice,
        profit,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: trade.userId },
      data: {
        balance: {
          increment: profit,
        },
      },
    });

    await prisma.balanceHistory.create({
  data: {
    userId: trade.userId,
    type: profit >= 0 ? "TRADE_PROFIT" : "TRADE_LOSS",
    amount: profit,
    balance: updatedUser.balance,
    description: `${trade.symbol} ${trade.side} closed`,
  },
});

    return Response.json({
      trade: updatedTrade,
      balance: updatedUser.balance,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}