import { prisma } from "@/lib/prisma";
import { ensureManualQuotesTable } from "@/lib/manual-quotes";
import { getInstrument, marketInstruments } from "@/lib/market-instruments";

type CachedQuote = {
  symbol: string;
  price: number;
  open: number;
  change: string;
  changeValue: number;
  time: string;
  cachedAt: number;
  source: string;
};

const quoteCache = new Map<string, CachedQuote>();
const CACHE_TTL = 3 * 1000;

function getSyntheticChangePercent(symbol: string) {
  const seed = Array.from(symbol).reduce((total, char) => total + char.charCodeAt(0), 0);
  const bucket = Math.floor(Date.now() / CACHE_TTL);
  const instrument = getInstrument(symbol);
  const volatility =
    instrument.group === "Crypto"
      ? 1.6
      : instrument.group === "Stocks"
        ? 0.9
        : instrument.group === "Indices"
          ? 0.65
          : instrument.group === "Metals" || instrument.group === "Energy"
            ? 0.75
            : 0.28;

  const change =
    Math.sin(bucket * 0.73 + seed) * volatility +
    Math.cos(bucket * 0.31 + seed / 3) * volatility * 0.4;

  return Number(change.toFixed(2));
}

function buildFallbackQuote(
  symbol: string,
  basePrice: number,
  source: string,
  lockPrice = false,
  time = new Date().toISOString(),
  spreadPoints = 14
) {
  const instrument = getInstrument(symbol);
  const changePercent = getSyntheticChangePercent(symbol);
  const changeValue = basePrice * (changePercent / 100);
  const price = lockPrice ? basePrice : basePrice + changeValue;
  const spread = instrument.pointSize * spreadPoints;

  return {
    symbol,
    price,
    bid: price,
    ask: price + spread,
    change: String(changePercent),
    changeValue,
    time,
    source,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol") || "EUR/USD";
    const instrument = marketInstruments.find((item) => item.symbol === symbol);
    const twelveSymbol = instrument?.quoteSymbol;

    if (!twelveSymbol) {
      return Response.json({ error: "Unsupported symbol" }, { status: 400 });
    }

    await ensureManualQuotesTable();

    const manualQuote = await prisma.manualQuote.findUnique({ where: { symbol } });
    const spreadPoints = manualQuote?.spreadAsk ?? manualQuote?.spread ?? 14;

    if (manualQuote && (manualQuote.symbolEnabled === false || manualQuote.tradeForbidden)) {
      return Response.json(
        { error: "Trading symbol disabled", symbol },
        { status: 403 }
      );
    }

    if (manualQuote?.enabled) {
      return Response.json({
        ...buildFallbackQuote(
          symbol,
          manualQuote.price,
          manualQuote.quoteSource || "manual",
          true,
          manualQuote.updatedAt.toISOString(),
          spreadPoints
        ),
        settings: buildQuoteSettings(manualQuote),
      });
    }

    const cached = quoteCache.get(symbol);
    const now = Date.now();

    if (cached && now - cached.cachedAt < CACHE_TTL) {
      return Response.json({
        symbol: cached.symbol,
        price: cached.price,
        bid: cached.price,
        ask: cached.price + instrument.pointSize * spreadPoints,
        change: cached.change,
        changeValue: cached.changeValue,
        time: cached.time,
        source: cached.source,
        settings: manualQuote ? buildQuoteSettings(manualQuote) : null,
      });
    }

    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      const fallback = getInstrument(symbol).defaultPrice;
      return Response.json({
        ...buildFallbackQuote(symbol, fallback, "default", false, new Date().toISOString(), spreadPoints),
        settings: manualQuote ? buildQuoteSettings(manualQuote) : null,
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
        ...buildFallbackQuote(symbol, fallback, "default", false, new Date().toISOString(), spreadPoints),
        warning: data.message || "Quote fallback",
        settings: manualQuote ? buildQuoteSettings(manualQuote) : null,
      });
    }

    const close = Number(data.close);
    const open = Number(data.open || close);
    const changeValue = Number(data.change || close - open || 0);
    const percentChange = Number(data.percent_change ?? (open ? (changeValue / open) * 100 : 0));

    const quote: CachedQuote = {
      symbol,
      price: close,
      open,
      change: String(Number.isFinite(percentChange) ? percentChange : 0),
      changeValue,
      time: data.datetime || new Date().toISOString(),
      cachedAt: now,
      source: "live",
    };

    quoteCache.set(symbol, quote);

    return Response.json({
      symbol: quote.symbol,
      price: quote.price,
      bid: quote.price,
      ask: quote.price + instrument.pointSize * spreadPoints,
      change: quote.change,
      changeValue: quote.changeValue,
      time: quote.time,
      source: quote.source,
      settings: manualQuote ? buildQuoteSettings(manualQuote) : null,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

function buildQuoteSettings(manualQuote: {
  tradingHours: string;
  quoteSource: string;
  spreadBid: number;
  spreadAsk: number;
  stopLevel: number;
  gapLevel: number;
  swapLong: number;
  swapShort: number;
  commission: number;
  leverage: number;
  margin: number;
  contractSize: number;
  marginCurrency: string;
  profitCurrency: string;
  riskMode: string;
  tradeForbidden: boolean;
  tickValue: number | null;
}) {
  return {
    tradingHours: manualQuote.tradingHours,
    quoteSource: manualQuote.quoteSource,
    spreadBid: manualQuote.spreadBid,
    spreadAsk: manualQuote.spreadAsk,
    stopLevel: manualQuote.stopLevel,
    gapLevel: manualQuote.gapLevel,
    swapLong: manualQuote.swapLong,
    swapShort: manualQuote.swapShort,
    commission: manualQuote.commission,
    leverage: manualQuote.leverage,
    margin: manualQuote.margin,
    contractSize: manualQuote.contractSize,
    marginCurrency: manualQuote.marginCurrency,
    profitCurrency: manualQuote.profitCurrency,
    riskMode: manualQuote.riskMode,
    tradeForbidden: manualQuote.tradeForbidden,
    tickValue: manualQuote.tickValue,
  };
}
