import { prisma } from "@/lib/prisma";
import { getInstrument } from "@/lib/market-instruments";

export async function POST(req: Request) {
  try {
    const {
      userId,
      symbol,
      side,
      openPrice,
      volume,
      stopLoss,
      takeProfit,
    } = await req.json();

    if (!userId || !symbol || !side || !openPrice || !volume) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const numericOpenPrice = Number(openPrice);
    const numericVolume = Number(volume);
    const instrument = getInstrument(symbol);

    if (
      Number.isNaN(numericOpenPrice) ||
      numericOpenPrice <= 0 ||
      Number.isNaN(numericVolume) ||
      numericVolume < instrument.minLot
    ) {
      return Response.json(
        { error: `Invalid price or volume. Minimum volume is ${instrument.minLot}` },
        { status: 400 }
      );
    }

    const trade = await prisma.trade.create({
      data: {
        userId,
        symbol,
        side,
        openPrice: numericOpenPrice,
        volume: numericVolume,
        stopLoss:
          stopLoss !== null && stopLoss !== undefined && stopLoss !== ""
            ? Number(stopLoss)
            : null,
        takeProfit:
          takeProfit !== null && takeProfit !== undefined && takeProfit !== ""
            ? Number(takeProfit)
            : null,
      },
    });

    return Response.json(trade);
  } catch (error) {
    console.error("Open trade error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
