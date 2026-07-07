import { prisma } from "@/lib/prisma";
import { ensureManualQuotesTable } from "@/lib/manual-quotes";

export async function GET() {
  try {
    await ensureManualQuotesTable();

    const quotes = await prisma.manualQuote.findMany({
      orderBy: {
        symbol: "asc",
      },
    });

    return Response.json(quotes);
  } catch (error) {
    console.error("Manual quotes get error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureManualQuotesTable();

    const {
      symbol,
      price,
      enabled,
      aBookEnabled,
      aBookAccountIds,
      ddeEnabled,
      mt4DdeServer,
      symbolEnabled,
      tradingHours,
      quoteSource,
      binanceEnabled,
      bitfinexEnabled,
      hitbtcEnabled,
      margin,
      leverage,
      swapLong,
      swapShort,
      spread,
      commission,
      riskMode,
      description,
      calculationType,
      symbolGroup,
      quotesFeed,
      spreadBid,
      spreadAsk,
      stopLevel,
      gapLevel,
      percentage,
      contractSize,
      tickValue,
      demoMinPrice,
      demoMaxPrice,
      demoVolatility,
      demoSpeed,
      marginCurrency,
      profitCurrency,
      digits,
      delay,
      tradeForbidden,
    } = await req.json();

    if (!symbol || price === undefined || price === null) {
      return Response.json(
        { error: "Symbol and price required" },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return Response.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    const settings = {
      enabled: typeof enabled === "boolean" ? enabled : true,
      aBookEnabled: typeof aBookEnabled === "boolean" ? aBookEnabled : false,
      aBookAccountIds: typeof aBookAccountIds === "string" ? aBookAccountIds : null,
      ddeEnabled: typeof ddeEnabled === "boolean" ? ddeEnabled : false,
      mt4DdeServer: typeof mt4DdeServer === "string" ? mt4DdeServer : null,
      symbolEnabled: typeof symbolEnabled === "boolean" ? symbolEnabled : true,
      tradingHours: typeof tradingHours === "string" && tradingHours.trim() ? tradingHours.trim() : "24/5",
      quoteSource: typeof quoteSource === "string" && quoteSource.trim() ? quoteSource.trim() : "TwelveData",
      binanceEnabled: typeof binanceEnabled === "boolean" ? binanceEnabled : false,
      bitfinexEnabled: typeof bitfinexEnabled === "boolean" ? bitfinexEnabled : false,
      hitbtcEnabled: typeof hitbtcEnabled === "boolean" ? hitbtcEnabled : false,
      margin: normalizeNumber(margin, 1),
      leverage: Math.max(1, Math.round(normalizeNumber(leverage, 100))),
      swapLong: normalizeNumber(swapLong, 0),
      swapShort: normalizeNumber(swapShort, 0),
      spread: normalizeNumber(spread, 14),
      commission: normalizeNumber(commission, 0),
      riskMode: typeof riskMode === "string" && riskMode.trim() ? riskMode.trim() : "B-Book",
      description: typeof description === "string" ? description : null,
      calculationType: normalizeText(calculationType, "forex"),
      symbolGroup: normalizeText(symbolGroup, "Currencies"),
      quotesFeed: normalizeText(quotesFeed, "Extra quotes feed"),
      spreadBid: normalizeNumber(spreadBid, 0),
      spreadAsk: normalizeNumber(spreadAsk, normalizeNumber(spread, 14)),
      stopLevel: normalizeNumber(stopLevel, 50),
      gapLevel: normalizeNumber(gapLevel, 100),
      percentage: normalizeNumber(percentage, 100),
      contractSize: normalizeNumber(contractSize, 100000),
      tickValue: normalizeOptionalPositiveNumber(tickValue),
      demoMinPrice: normalizeOptionalPositiveNumber(demoMinPrice),
      demoMaxPrice: normalizeOptionalPositiveNumber(demoMaxPrice),
      demoVolatility: Math.max(0.01, normalizeNumber(demoVolatility, 1)),
      demoSpeed: Math.max(1, Math.round(normalizeNumber(demoSpeed, 3))),
      marginCurrency: normalizeText(marginCurrency, "EUR"),
      profitCurrency: normalizeText(profitCurrency, "EUR"),
      digits: Math.max(0, Math.round(normalizeNumber(digits, 5))),
      delay: Math.max(0, Math.round(normalizeNumber(delay, 0))),
      tradeForbidden: typeof tradeForbidden === "boolean" ? tradeForbidden : false,
    };

    const quote = await prisma.manualQuote.upsert({
      where: {
        symbol,
      },
      update: {
        price: numericPrice,
        ...settings,
      },
      create: {
        symbol,
        price: numericPrice,
        ...settings,
      },
    });

    return Response.json(quote);
  } catch (error) {
    console.error("Manual quotes patch error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

function normalizeNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeOptionalPositiveNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}
