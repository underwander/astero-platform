import { prisma } from "@/lib/prisma";
import { getInstrument, marketInstruments } from "@/lib/market-instruments";

type CachedQuote = {
  symbol: string;
  price: number;
  change: string;
  time: string;
  cachedAt: number;
  source: string;
};

const quoteCache = new Map<string, CachedQuote>();
const CACHE_TTL = 30 * 1000;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol") || "EUR/USD";
    const instrument = marketInstruments.find((item) => item.symbol === symbol);
    const twelveSymbol = instrument?.quoteSymbol;

    if (!twelveSymbol) {
      return Response.json({ error: "Unsupported symbol" }, { status: 400 });
    }

    const manualQuote = await prisma.manualQuote.findUnique({ where: { symbol } });

    if (manualQuote?.enabled) {
      return Response.json({
        symbol,
        price: manualQuote.price,
        change: "0",
        time: manualQuote.updatedAt.toISOString(),
        source: "manual",
      });
    }

    const cached = quoteCache.get(symbol);
    const now = Date.now();

    if (cached && now - cached.cachedAt < CACHE_TTL) {
      return Response.json({
        symbol: cached.symbol,
        price: cached.price,
        change: cached.change,
        time: cached.time,
        source: cached.source,
      });
    }

    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      const fallback = getInstrument(symbol).defaultPrice;
      return Response.json({
        symbol,
        price: fallback,
        change: "0",
        time: new Date().toISOString(),
        source: "default",
      });
    }

    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(twelveSymbol)}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (data.status === "error") {
      const fallback = getInstrument(symbol).defaultPrice;
      return Response.json({
        symbol,
        price: fallback,
        change: "0",
        time: new Date().toISOString(),
        source: "default",
        warning: data.message || "Quote fallback",
      });
    }

    const quote: CachedQuote = {
      symbol,
      price: Number(data.close),
      change: String(data.percent_change || "0"),
      time: data.datetime || new Date().toISOString(),
      cachedAt: now,
      source: "live",
    };

    quoteCache.set(symbol, quote);

    return Response.json({
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      time: quote.time,
      source: quote.source,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
