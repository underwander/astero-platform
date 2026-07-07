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
const demoQuoteState = new Map<string, CachedQuote>();
const CACHE_TTL = 3 * 1000;
const TRADINGVIEW_SCAN_ENDPOINTS = [
  "https://scanner.tradingview.com/global/scan",
  "https://scanner.tradingview.com/forex/scan",
  "https://scanner.tradingview.com/crypto/scan",
  "https://scanner.tradingview.com/cfd/scan",
  "https://scanner.tradingview.com/america/scan",
];

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

function buildDemoProviderQuote(
  symbol: string,
  basePrice: number,
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined,
  volatility: number | null | undefined,
  speed: number | null | undefined,
  spreadPoints = 14
) {
  const instrument = getInstrument(symbol);
  const now = Date.now();
  const low = Number.isFinite(Number(minPrice)) && Number(minPrice) > 0 ? Number(minPrice) : basePrice * 0.75;
  const high = Number.isFinite(Number(maxPrice)) && Number(maxPrice) > low ? Number(maxPrice) : basePrice * 1.25;
  const updateMs = Math.max(1000, Math.round(Number(speed || 3)) * 1000);
  const vol = Math.max(0.01, Number(volatility || 1));
  const previous = demoQuoteState.get(symbol);

  if (previous && now - previous.cachedAt < updateMs) {
    return {
      ...previous,
      bid: previous.price,
      ask: previous.price + instrument.pointSize * spreadPoints,
    };
  }

  const previousPrice = previous?.price && previous.price >= low && previous.price <= high
    ? previous.price
    : Math.min(high, Math.max(low, basePrice));
  const range = high - low;
  const center = low + range / 2;
  const centerPull = ((center - previousPrice) / range) * vol * 0.18;
  const randomMove = (Math.random() - 0.5) * vol * 0.025;
  const wave = Math.sin(now / updateMs + Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0)) * vol * 0.006;
  const nextRaw = previousPrice + range * (randomMove + centerPull + wave);
  const price = Math.min(high, Math.max(low, nextRaw));
  const changeValue = price - previousPrice;
  const changePercent = previousPrice ? (changeValue / previousPrice) * 100 : 0;

  const quote: CachedQuote = {
    symbol,
    price,
    open: previousPrice,
    change: String(Number.isFinite(changePercent) ? changePercent : 0),
    changeValue,
    time: new Date().toISOString(),
    cachedAt: now,
    source: "demo-provider",
  };

  demoQuoteState.set(symbol, quote);

  return {
    ...quote,
    bid: price,
    ask: price + instrument.pointSize * spreadPoints,
  };
}

async function fetchTradingViewQuote(symbol: string, tvSymbol: string) {
  const ticker = decodeURIComponent(tvSymbol);
  const body = JSON.stringify({
    symbols: {
      tickers: [ticker],
      query: { types: [] },
    },
    columns: ["close", "change", "change_abs"],
  });

  for (const endpoint of TRADINGVIEW_SCAN_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        body,
        cache: "no-store",
      });

      if (!response.ok) continue;

      const payload = await response.json();
      const values = payload?.data?.[0]?.d;
      const close = Number(values?.[0]);

      if (!Number.isFinite(close) || close <= 0) continue;

      const percentChange = Number(values?.[1] ?? 0);
      const changeValue = Number(values?.[2] ?? 0);

      return {
        symbol,
        price: close,
        open: close - (Number.isFinite(changeValue) ? changeValue : 0),
        change: String(Number.isFinite(percentChange) ? percentChange : 0),
        changeValue: Number.isFinite(changeValue) ? changeValue : 0,
        time: new Date().toISOString(),
        cachedAt: Date.now(),
        source: "tradingview",
      } satisfies CachedQuote;
    } catch {
      continue;
    }
  }

  return null;
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

    const useManualPrice = manualQuote?.enabled && manualQuote.quoteSource === "Manual";

    if (useManualPrice) {
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

    if (manualQuote?.quoteSource === "Demo Provider") {
      return Response.json({
        ...buildDemoProviderQuote(
          symbol,
          manualQuote.price || getInstrument(symbol).defaultPrice,
          manualQuote.demoMinPrice,
          manualQuote.demoMaxPrice,
          manualQuote.demoVolatility,
          manualQuote.demoSpeed,
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

    const tradingViewQuote = await fetchTradingViewQuote(symbol, instrument.tvSymbol);

    if (tradingViewQuote) {
      quoteCache.set(symbol, tradingViewQuote);

      return Response.json({
        symbol: tradingViewQuote.symbol,
        price: tradingViewQuote.price,
        bid: tradingViewQuote.price,
        ask: tradingViewQuote.price + instrument.pointSize * spreadPoints,
        change: tradingViewQuote.change,
        changeValue: tradingViewQuote.changeValue,
        time: tradingViewQuote.time,
        source: tradingViewQuote.source,
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
  demoMinPrice: number | null;
  demoMaxPrice: number | null;
  demoVolatility: number;
  demoSpeed: number;
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
    demoMinPrice: manualQuote.demoMinPrice,
    demoMaxPrice: manualQuote.demoMaxPrice,
    demoVolatility: manualQuote.demoVolatility,
    demoSpeed: manualQuote.demoSpeed,
  };
}
