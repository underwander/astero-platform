import { prisma } from "@/lib/prisma";
import { ensureManualQuotesTable } from "@/lib/manual-quotes";
import { getInstrument } from "@/lib/market-instruments";
import { calculateAccountRisk, calculateRequiredMargin } from "@/lib/trading-risk";

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

    await ensureManualQuotesTable();

    const manualQuote = await prisma.manualQuote.findUnique({
      where: { symbol },
    });

    if (manualQuote?.symbolEnabled === false || manualQuote?.tradeForbidden) {
      return Response.json(
        { error: "Trading symbol disabled" },
        { status: 403 }
      );
    }

    if (manualQuote?.tradingHours && !isTradingAllowed(manualQuote.tradingHours)) {
      return Response.json(
        { error: "Trading is closed for this symbol" },
        { status: 403 }
      );
    }

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trades: {
          where: { closePrice: null },
        },
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const quoteMap = {
      [symbol]: {
        price: numericOpenPrice,
        bid: numericOpenPrice,
        ask: numericOpenPrice,
        settings: manualQuote
          ? {
              leverage: manualQuote.leverage,
              margin: manualQuote.margin,
              contractSize: manualQuote.contractSize,
              spreadAsk: manualQuote.spreadAsk,
              tickValue: manualQuote.tickValue,
            }
          : null,
      },
    };
    const accountRisk = calculateAccountRisk(user.balance, user.trades, quoteMap);
    const orderMargin = calculateRequiredMargin(
      { symbol, side, openPrice: numericOpenPrice, volume: numericVolume },
      quoteMap
    );

    if (accountRisk.equity <= 0 || accountRisk.freeMargin < orderMargin) {
      return Response.json(
        {
          error: "Недостаточно свободных средств для открытия сделки",
          freeMargin: accountRisk.freeMargin,
          requiredMargin: orderMargin,
        },
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
        swap:
          side === "BUY"
            ? Number(manualQuote?.swapLong || 0) - Number(manualQuote?.commission || 0)
            : Number(manualQuote?.swapShort || 0) - Number(manualQuote?.commission || 0),
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

function isTradingAllowed(tradingHours: string) {
  const value = tradingHours.trim().toLowerCase();

  if (!value || value === "24/7") return true;
  if (value === "closed" || value === "disabled") return false;

  if (value === "24/5") {
    const day = new Date().getUTCDay();
    return day !== 0 && day !== 6;
  }

  return true;
}
