import { prisma } from "@/lib/prisma";

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

const symbolMap: Record<string, string> = {
  "EUR/USD": "EUR/USD",
  "GBP/USD": "GBP/USD",
  "USD/JPY": "USD/JPY",
  "AUD/USD": "AUD/USD",
  "USD/CAD": "USD/CAD",
  "USD/CHF": "USD/CHF",
  "NZD/USD": "NZD/USD",
  "EUR/GBP": "EUR/GBP",
  "EUR/JPY": "EUR/JPY",
  "XAU/USD": "XAU/USD",
  "XAG/USD": "XAG/USD",
  "BTC/USD": "BTC/USD",
  "ETH/USD": "ETH/USD",
  "SOL/USD": "SOL/USD",
  "US100": "NDX",
  "SPX500": "SPX",
  "US30": "DJI",
  "AAPL": "AAPL",
  "TSLA": "TSLA",
  "NVDA": "NVDA",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol") || "EUR/USD";
    const twelveSymbol = symbolMap[symbol];

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
      return Response.json({ error: "Missing TWELVE_DATA_API_KEY" }, { status: 500 });
    }

    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(twelveSymbol)}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (data.status === "error") {
      return Response.json({ error: data.message || "Quote error" }, { status: 400 });
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
