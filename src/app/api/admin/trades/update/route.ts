import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema();
    const { tradeId, openPrice, volume, swap, takeProfit, stopLoss, profit } = await req.json();

    if (!tradeId) {
      return Response.json({ error: "TradeId required" }, { status: 400 });
    }

    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

    if (!trade) {
      return Response.json({ error: "Trade not found" }, { status: 404 });
    }

    const data: {
      openPrice?: number;
      volume?: number;
      swap?: number;
      takeProfit?: number | null;
      stopLoss?: number | null;
      profit?: number;
    } = {};

    const isClosed = trade.closePrice !== null;

    if (openPrice !== undefined) {
      if (isClosed) return Response.json({ error: "Closed trade open price cannot be edited" }, { status: 400 });
      const numericOpenPrice = Number(openPrice);
      if (Number.isNaN(numericOpenPrice) || numericOpenPrice <= 0) {
        return Response.json({ error: "Invalid open price" }, { status: 400 });
      }
      data.openPrice = numericOpenPrice;
    }

    if (volume !== undefined) {
      if (isClosed) return Response.json({ error: "Closed trade volume cannot be edited" }, { status: 400 });
      const numericVolume = Number(volume);
      if (Number.isNaN(numericVolume) || numericVolume <= 0) {
        return Response.json({ error: "Invalid volume" }, { status: 400 });
      }
      data.volume = numericVolume;
    }

    if (swap !== undefined) {
      if (isClosed) return Response.json({ error: "Closed trade swap cannot be edited" }, { status: 400 });
      const numericSwap = Number(swap);
      if (Number.isNaN(numericSwap)) {
        return Response.json({ error: "Invalid swap" }, { status: 400 });
      }
      data.swap = numericSwap;
    }

    if (takeProfit !== undefined) {
      if (isClosed) return Response.json({ error: "Closed trade take profit cannot be edited" }, { status: 400 });
      data.takeProfit = takeProfit === null || takeProfit === "" ? null : Number(takeProfit);
    }

    if (stopLoss !== undefined) {
      if (isClosed) return Response.json({ error: "Closed trade stop loss cannot be edited" }, { status: 400 });
      data.stopLoss = stopLoss === null || stopLoss === "" ? null : Number(stopLoss);
    }

    if (profit !== undefined) {
      if (!isClosed) return Response.json({ error: "Only closed trade profit can be edited" }, { status: 400 });
      const numericProfit = Number(profit);
      if (Number.isNaN(numericProfit)) {
        return Response.json({ error: "Invalid profit" }, { status: 400 });
      }
      data.profit = numericProfit;
    }

    const updatedTrade = await prisma.$transaction(async (tx) => {
      if (data.profit !== undefined) {
        const previousProfit = Number(trade.profit || 0);
        const diff = data.profit - previousProfit;

        const user = await tx.user.findUnique({
          where: { id: trade.userId },
          select: { balance: true },
        });

        const nextBalance = Math.max(0, Number(user?.balance || 0) + diff);

        const result = await tx.trade.update({
          where: { id: tradeId },
          data,
        });

        await tx.user.update({
          where: { id: trade.userId },
          data: { balance: nextBalance },
        });

        await tx.balanceHistory.create({
          data: {
            userId: trade.userId,
            type: "TRADE_PROFIT_EDIT",
            amount: diff,
            balance: nextBalance,
            description: `Manual closed trade profit adjustment: ${trade.symbol} ${trade.side}`,
          },
        });

        return result;
      }

      return tx.trade.update({
        where: { id: tradeId },
        data,
      });
    });

    return Response.json(updatedTrade);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
