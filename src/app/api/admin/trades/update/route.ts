import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { tradeId, openPrice, volume, swap, takeProfit, stopLoss } = await req.json();

    if (!tradeId) {
      return Response.json({ error: "TradeId required" }, { status: 400 });
    }

    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

    if (!trade) {
      return Response.json({ error: "Trade not found" }, { status: 404 });
    }

    if (trade.closePrice !== null) {
      return Response.json({ error: "Closed trade cannot be edited" }, { status: 400 });
    }

    const data: {
      openPrice?: number;
      volume?: number;
      swap?: number;
      takeProfit?: number | null;
      stopLoss?: number | null;
    } = {};

    if (openPrice !== undefined) {
      const numericOpenPrice = Number(openPrice);
      if (Number.isNaN(numericOpenPrice) || numericOpenPrice <= 0) {
        return Response.json({ error: "Invalid open price" }, { status: 400 });
      }
      data.openPrice = numericOpenPrice;
    }

    if (volume !== undefined) {
      const numericVolume = Number(volume);
      if (Number.isNaN(numericVolume) || numericVolume <= 0) {
        return Response.json({ error: "Invalid volume" }, { status: 400 });
      }
      data.volume = numericVolume;
    }

    if (swap !== undefined) {
      const numericSwap = Number(swap);
      if (Number.isNaN(numericSwap)) {
        return Response.json({ error: "Invalid swap" }, { status: 400 });
      }
      data.swap = numericSwap;
    }

    if (takeProfit !== undefined) {
      data.takeProfit = takeProfit === null || takeProfit === "" ? null : Number(takeProfit);
    }

    if (stopLoss !== undefined) {
      data.stopLoss = stopLoss === null || stopLoss === "" ? null : Number(stopLoss);
    }

    const updatedTrade = await prisma.trade.update({
      where: { id: tradeId },
      data,
    });

    return Response.json(updatedTrade);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
