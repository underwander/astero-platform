import { prisma } from "@/lib/prisma";
import { calculateAccountRisk, getClosePriceForTrade, type RiskQuoteMap } from "@/lib/trading-risk";
import { calculateTradeProfit } from "@/lib/market-instruments";

export async function POST(req: Request) {
  try {
    const { userId, quotes } = await req.json();

    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    const quoteMap: RiskQuoteMap = quotes && typeof quotes === "object" ? quotes : {};

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trades: {
          where: { closePrice: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const metrics = calculateAccountRisk(user.balance, user.trades, quoteMap);

    if (!metrics.stopOut) {
      return Response.json({ ...metrics, closedTrades: 0 });
    }

    const closeItems = user.trades.map((trade) => {
      const closePrice = getClosePriceForTrade(trade, quoteMap);
      const profit = calculateTradeProfit(
        trade.symbol,
        trade.side,
        trade.openPrice,
        closePrice,
        trade.volume,
        trade.swap ?? 0,
        quoteMap[trade.symbol]?.settings?.tickValue
      );

      return { trade, closePrice, profit };
    });

    const totalProfit = closeItems.reduce((sum, item) => sum + item.profit, 0);
    const nextBalance = Math.max(0, Number(user.balance || 0) + totalProfit);

    await prisma.$transaction(async (tx) => {
      for (const item of closeItems) {
        await tx.trade.update({
          where: { id: item.trade.id },
          data: {
            closePrice: item.closePrice,
            profit: item.profit,
          },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { balance: nextBalance },
      });

      await tx.balanceHistory.create({
        data: {
          userId: user.id,
          type: "STOP_OUT",
          amount: totalProfit,
          balance: nextBalance,
          description: `Stop out: закрыто ${closeItems.length} позиций`,
        },
      });
    });

    return Response.json({
      ...metrics,
      stopOut: true,
      closedTrades: closeItems.length,
      balance: nextBalance,
      equity: nextBalance,
      freeMargin: nextBalance,
      usedMargin: 0,
      marginLevel: null,
    });
  } catch (error) {
    console.error("Risk check error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
