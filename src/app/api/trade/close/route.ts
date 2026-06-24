import { prisma } from "@/lib/prisma";
import { calculateTradeProfit } from "@/lib/market-instruments";

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

    const quoteSettings = await prisma.manualQuote.findUnique({
      where: { symbol: trade.symbol },
      select: { tickValue: true },
    });

    const profit = calculateTradeProfit(
      trade.symbol,
      trade.side,
      trade.openPrice,
      numericClosePrice,
      trade.volume,
      trade.swap,
      quoteSettings?.tickValue
    );

    const result = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: trade.userId },
        select: { balance: true },
      });

      const nextBalance = Math.max(0, Number(currentUser?.balance || 0) + profit);

      const updatedTrade = await tx.trade.update({
        where: { id: tradeId },
        data: {
          closePrice: numericClosePrice,
          profit,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: trade.userId },
        data: {
          balance: nextBalance,
        },
      });

      await tx.balanceHistory.create({
        data: {
          userId: trade.userId,
          type: profit >= 0 ? "TRADE_PROFIT" : "TRADE_LOSS",
          amount: profit,
          balance: updatedUser.balance,
          description: `${trade.symbol} ${trade.side} closed`,
        },
      });

      return { updatedTrade, updatedUser };
    });

    return Response.json({
      trade: result.updatedTrade,
      balance: result.updatedUser.balance,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
