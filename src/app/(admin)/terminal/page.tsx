"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calculateTradeProfit,
  formatPrice,
  getInstrument,
  marketGroups,
  marketInstruments,
  type MarketGroup,
} from "@/lib/market-instruments";
import { calculateAccountRisk, calculateRequiredMargin } from "@/lib/trading-risk";
import { useLanguage } from "@/context/LanguageContext";

type Quote = {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  change?: string;
  time?: string;
  source?: string;
  settings?: QuoteSettings | null;
};

type QuoteSettings = {
  spreadAsk: number;
  leverage: number;
  margin: number;
  contractSize: number;
  tickValue?: number | null;
  marginCurrency: string;
  profitCurrency: string;
};

type Trade = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  openPrice: number;
  closePrice: number | null;
  volume: number;
  profit: number | null;
  swap?: number | null;
  takeProfit?: number | null;
  stopLoss?: number | null;
  createdAt: string;
  closedAt?: string | null;
};

const inputClass =
  "h-9 w-full rounded border border-[#24453c] bg-[#0e1815] px-2 text-xs font-semibold text-slate-100 outline-none transition focus:border-[#22c55e]";
const ACTIVE_QUOTE_REFRESH_MS = 2500;
const WATCHLIST_REFRESH_MS = 5000;
const CHART_POINTS = 72;

function parsePositiveNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatCurrency(value: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function buildInitialSeries(symbol: string, price: number) {
  const seed = Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: CHART_POINTS - 1 }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.37) * 0.0025 + Math.cos((index + seed) * 0.19) * 0.0015;
    return Math.max(price * (1 + wave), price * 0.2);
  });
}

function appendChartPoint(current: number[] | undefined, symbol: string, price: number) {
  if (!Number.isFinite(price) || price <= 0) {
    return current || [];
  }
  const seeded = current && current.length > 0 ? current : buildInitialSeries(symbol, price);
  return [...seeded.slice(-(CHART_POINTS - 1)), price];
}

function getTradeMarketPrice(trade: Trade, quote?: Quote) {
  if (trade.closePrice !== null) {
    return trade.closePrice ?? trade.openPrice;
  }
  const instrument = getInstrument(trade.symbol);
  const bid = quote?.bid ?? quote?.price ?? trade.openPrice;
  const ask = quote?.ask ?? bid + instrument.pointSize * (quote?.settings?.spreadAsk ?? 14);
  return trade.side === "BUY" ? bid : ask;
}

export default function TradingTerminalPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [symbol, setSymbol] = useState("EUR/USD");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [openPrice, setOpenPrice] = useState("");
  const [volume, setVolume] = useState("0.01");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [message, setMessage] = useState("");
  const [balance, setBalance] = useState(0);
  const [activeGroup, setActiveGroup] = useState<MarketGroup | "All">("Forex");
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [chartSeries, setChartSeries] = useState<Record<string, number[]>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [chartSymbols, setChartSymbols] = useState<string[]>(() => marketInstruments.slice(0, 9).map((item) => item.symbol));
  const [symbolToAdd, setSymbolToAdd] = useState(marketInstruments[9]?.symbol || marketInstruments[0].symbol);

  const instrument = getInstrument(symbol);
  const selectedQuote = quotes[symbol];
  const selectedQuoteSettings = selectedQuote?.settings;
  const tradeVolume = parsePositiveNumber(volume, instrument.minLot);
  const basePrice = parsePositiveNumber(openPrice, selectedQuote?.price ?? instrument.defaultPrice);
  const activeSpreadPoints = selectedQuoteSettings?.spreadAsk ?? 14;
  const activeBid = selectedQuote?.bid ?? selectedQuote?.price ?? basePrice;
  const activeAsk = selectedQuote?.ask ?? activeBid + instrument.pointSize * activeSpreadPoints;
  const activeTradePrice = side === "BUY" ? activeAsk : activeBid;
  const activeLeverage = Math.max(1, selectedQuoteSettings?.leverage ?? 100);
  const activeMarginRate = Math.max(0, selectedQuoteSettings?.margin ?? 1);
  const activeContractSize = Math.max(1, selectedQuoteSettings?.contractSize ?? instrument.contractSize);
  const marginCurrency = selectedQuoteSettings?.marginCurrency || "EUR";
  const profitCurrency = selectedQuoteSettings?.profitCurrency || "EUR";
  const requiredMargin = calculateRequiredMargin(
    {
      symbol,
      side,
      openPrice: activeTradePrice,
      volume: tradeVolume,
    },
    {
      [symbol]: {
        price: activeTradePrice,
        bid: activeBid,
        ask: activeAsk,
        settings: {
          leverage: activeLeverage,
          margin: activeMarginRate,
          contractSize: activeContractSize,
          spreadAsk: activeSpreadPoints,
        },
      },
    }
  );
  const activeTickValue = selectedQuoteSettings?.tickValue || instrument.tickValue;
  const pointValue = activeTickValue * tradeVolume;
  const openTrades = trades.filter((trade) => trade.closePrice === null);
  const accountMetrics = calculateAccountRisk(balance, openTrades, quotes);
  const visibleSymbols = useMemo(
    () => marketInstruments.filter((item) => activeGroup === "All" || item.group === activeGroup),
    [activeGroup]
  );
  const chartInterval = instrument.group === "Indices" ? "D" : "15";

  async function loadQuote(currentSymbol: string) {
    const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(currentSymbol)}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Quote error");
      return;
    }

    const nextBid = Number(data.bid ?? data.price);
    const nextAsk = Number(data.ask ?? data.price);
    const nextPrice = Number(data.price);

    setQuotes((prev) => ({
      ...prev,
      [currentSymbol]: {
        symbol: currentSymbol,
        price: nextPrice,
        bid: nextBid,
        ask: nextAsk,
        change: data.change,
        time: data.time,
        source: data.source,
        settings: data.settings ?? null,
      },
    }));
    setChartSeries((prev) => ({
      ...prev,
      [currentSymbol]: appendChartPoint(prev[currentSymbol], currentSymbol, nextBid),
    }));

    if (currentSymbol === symbol) {
      setOpenPrice(String(data.price));
    }
  }

  async function loadVisibleQuotes() {
    await Promise.all(visibleSymbols.slice(0, 18).map((item) => loadQuote(item.symbol)));
  }

  async function loadOpenTradeQuotes() {
    const openSymbols = Array.from(new Set(trades.filter((trade) => trade.closePrice === null).map((trade) => trade.symbol)));
    await Promise.all(openSymbols.map((tradeSymbol) => loadQuote(tradeSymbol)));
  }

  async function loadTrades(currentUserId = userId) {
    if (!currentUserId) return;
    const res = await fetch(`/api/trades?userId=${encodeURIComponent(currentUserId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    setTrades(Array.isArray(data) ? data : []);
  }

  async function loadBalance(currentUserId = userId) {
    if (!currentUserId) return;
    const res = await fetch(`/api/user/balance?userId=${encodeURIComponent(currentUserId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    setBalance(Number(data.balance || 0));
  }

  async function runRiskCheck(currentUserId = userId) {
    if (!currentUserId || openTrades.length === 0) return;

    const res = await fetch("/api/trade/risk-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId, quotes }),
    });
    const data = await res.json();

    if (!res.ok) return;

    if (data.stopOut) {
      setMessage(`Stop out: закрыто ${data.closedTrades || 0} позиций. Баланс защищен от минуса.`);
      await loadBalance(currentUserId);
      await loadTrades(currentUserId);
    }
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    const timer = window.setTimeout(() => {
      setUserId(storedUserId);
      loadTrades(storedUserId);
      loadBalance(storedUserId);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadQuote(symbol), 0);
    const interval = setInterval(() => loadQuote(symbol), ACTIVE_QUOTE_REFRESH_MS);
    return () => {
      window.clearTimeout(timer);
      clearInterval(interval);
    };
  }, [symbol]);

  useEffect(() => {
    const timer = window.setTimeout(loadVisibleQuotes, 0);
    const interval = setInterval(loadVisibleQuotes, WATCHLIST_REFRESH_MS);
    return () => {
      window.clearTimeout(timer);
      clearInterval(interval);
    };
  }, [activeGroup]);

  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => loadTrades(userId), 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const openTradeSymbolsKey = useMemo(
    () => Array.from(new Set(trades.filter((trade) => trade.closePrice === null).map((trade) => trade.symbol))).sort().join("|"),
    [trades]
  );

  useEffect(() => {
    if (!openTradeSymbolsKey) return;
    const timer = window.setTimeout(loadOpenTradeQuotes, 0);
    const interval = window.setInterval(loadOpenTradeQuotes, ACTIVE_QUOTE_REFRESH_MS);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [openTradeSymbolsKey]);

  function setVolumePreset(next: string) {
    setVolume(next);
  }

  function addChartSymbol() {
    if (!symbolToAdd || chartSymbols.includes(symbolToAdd)) return;
    setChartSymbols((prev) => [...prev, symbolToAdd]);
    setSymbol(symbolToAdd);
  }

  function removeChartSymbol(nextSymbol: string) {
    setChartSymbols((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((item) => item !== nextSymbol);
      if (symbol === nextSymbol) {
        setSymbol(next[0]);
      }
      return next;
    });
  }

  async function openTrade(nextSide = side) {
    if (!userId) {
      setMessage("Сначала войдите в аккаунт");
      router.push("/login");
      return;
    }

    if (!openPrice || !volume || Number(volume) < instrument.minLot) {
      setMessage(`Минимальный объем: ${instrument.minLot}`);
      return;
    }

    const bidPrice = selectedQuote?.bid ?? Number(openPrice);
    const askPrice = selectedQuote?.ask ?? bidPrice + instrument.pointSize * activeSpreadPoints;
    const tradePrice = nextSide === "BUY" ? askPrice : bidPrice;

    const payload = {
      userId,
      symbol,
      side: nextSide,
      openPrice: tradePrice,
      volume: Number(volume),
      stopLoss: stopLoss ? Number(stopLoss) : null,
      takeProfit: takeProfit ? Number(takeProfit) : null,
    };

    setMessage("Открытие сделки...");

    const res = await fetch("/api/trade/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Ошибка открытия сделки");
      return;
    }

    setMessage(`Сделка открыта: ${data.symbol} ${data.side}, объем ${data.volume}, цена ${data.openPrice}`);
    setStopLoss("");
    setTakeProfit("");
    await loadBalance();
    await loadTrades();
  }

  async function closeTrade(trade: Trade) {
    const tradeInstrument = getInstrument(trade.symbol);
    const quoteData = quotes[trade.symbol];
    const bidPrice = quoteData?.bid ?? quoteData?.price ?? trade.openPrice;
    const askPrice = quoteData?.ask ?? bidPrice + tradeInstrument.pointSize * (quoteData?.settings?.spreadAsk ?? 14);
    const quote = trade.side === "BUY" ? bidPrice : askPrice;
    const res = await fetch("/api/trade/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeId: trade.id, closePrice: quote }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Close trade error");
      return;
    }
    setMessage(`Сделка закрыта: ${trade.symbol} по цене ${formatPrice(trade.symbol, quote)}`);
    await loadBalance();
    await loadTrades();
  }

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#0b1110] p-1 text-slate-100 shadow-2xl shadow-slate-950/30 sm:p-2">
      <MobileTerminal
        activeGroup={activeGroup}
        setActiveGroup={setActiveGroup}
        visibleSymbols={visibleSymbols}
        symbol={symbol}
        setSymbol={setSymbol}
        quotes={quotes}
        volume={volume}
        setVolume={setVolume}
        side={side}
        setSide={setSide}
        openTrade={openTrade}
        chartInterval={chartInterval}
        chartSeries={chartSeries}
        trades={trades}
        onClose={closeTrade}
      />
      <div className="mb-2 border border-[#1f332f] bg-[#101a18] px-3 py-2">
        <div>
      <h1 className="text-base font-black text-white">Торговый терминал</h1>
        </div>
      </div>

      <div className="hidden gap-2 xl:grid xl:grid-cols-[260px_minmax(0,1fr)_285px] 2xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className="border border-[#1f332f] bg-[#101a18]">
          <div className="flex items-center justify-between border-b border-[#1f332f] px-3 py-2">
            <p className="text-xs font-black uppercase text-[#b8d4c7]">Котировки</p>
            <span className="rounded bg-[#17332b] px-2 py-1 text-[10px] font-bold text-[#7fa293]">{visibleSymbols.length}</span>
          </div>
          <div className="flex gap-1 overflow-x-auto border-b border-[#1f332f] p-2">
            {marketGroups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`rounded px-2 py-1 text-[11px] font-black transition ${
                  activeGroup === group ? "bg-[#16a34a] text-white" : "bg-[#17332b] text-[#b8d4c7] hover:bg-[#21483d]"
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_72px_72px_54px] border-b border-[#1f332f] px-3 py-2 text-[10px] font-black uppercase text-[#658579]">
            <span>Символ</span>
            <span className="text-right">Bid</span>
            <span className="text-right">Ask</span>
            <span className="text-right">Chg</span>
          </div>

          <div className="max-h-[320px] overflow-y-auto xl:max-h-[865px]">
            {visibleSymbols.map((item) => {
              const quote = quotes[item.symbol];
              const change = Number(quote?.change || 0);
              const bid = quote?.bid ?? quote?.price ?? item.defaultPrice;
              const ask = quote?.ask ?? bid + item.pointSize * (quote?.settings?.spreadAsk ?? 14);

              return (
                <button
                  key={item.symbol}
                  onClick={() => {
                    setSymbol(item.symbol);
                    setMessage("");
                    const nextQuote = quotes[item.symbol]?.bid ?? quotes[item.symbol]?.price ?? item.defaultPrice;
                    setOpenPrice(String(nextQuote));
                  }}
                  className={`grid w-full grid-cols-[1fr_72px_72px_54px] items-center gap-1 border-b border-[#1a2b27] px-3 py-2 text-left transition ${
                    symbol === item.symbol ? "bg-[#123d2f]" : "bg-[#101a18] hover:bg-[#172f2a]"
                  }`}
                >
                  <div>
                    <p className="text-xs font-black text-white">{item.symbol}</p>
                    <p className="text-[10px] text-[#658579]">{item.group}</p>
                  </div>
                  <p className="text-right text-xs font-bold text-[#d7efe5]">{formatPrice(item.symbol, bid)}</p>
                  <p className="text-right text-xs font-bold text-[#d7efe5]">{formatPrice(item.symbol, ask)}</p>
                  <p className={change >= 0 ? "text-right text-[11px] font-black text-[#0fd47a]" : "text-right text-[11px] font-black text-[#ff4d5e]"}>
                    {quote ? `${change.toFixed(2)}%` : "0.00%"}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 border border-[#1f332f] bg-[#101a18]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#1f332f] bg-[#07110f] px-3 py-2 text-xs font-bold text-[#b8d4c7]">
            <span>{symbol} · {chartInterval} · O {openPrice ? formatPrice(symbol, Number(openPrice)) : "..."}</span>
            <span className="ml-auto rounded bg-[#0f3a2a] px-2 py-1 font-black text-[#8af5bd]">
              Свободные средства: {formatCurrency(accountMetrics.freeMargin)}
            </span>
          </div>
          <LivePriceChart symbol={symbol} quote={selectedQuote} series={chartSeries[symbol]} />
          <PositionsPanel trades={trades} quotes={quotes} onClose={closeTrade} />
        </main>

        <aside className="space-y-2">
          <div className="border border-[#1f332f] bg-[#101a18]">
            <div className="border-b border-[#1f332f] px-3 py-2">
            <p className="text-xs font-black uppercase text-[#b8d4c7]">Новая сделка</p>
            </div>
            <div className="p-3">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setSide("BUY")}
                className={`px-4 py-4 text-lg font-black ${side === "BUY" ? "bg-[#0bbf73] text-white" : "bg-[#0f3a2a] text-[#8af5bd]"}`}
              >
                Buy
              </button>
              <button
                onClick={() => setSide("SELL")}
                className={`px-4 py-4 text-lg font-black ${side === "SELL" ? "bg-[#e83b4b] text-white" : "bg-[#3c171c] text-[#ff9aa5]"}`}
              >
                Sell
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-emerald-50/60">Объем</label>
                <input value={volume} onChange={(e) => setVolume(e.target.value)} className={inputClass} type="number" step={instrument.lotStep} min={instrument.minLot} max={instrument.maxLot} />
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {["0.01", "0.05", "0.10", "1"].map((value) => (
                    <button key={value} onClick={() => setVolumePreset(value)} className="rounded bg-[#17332b] py-2 text-xs font-bold text-[#d7efe5] hover:bg-[#21483d]">
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="border border-[#24453c] bg-[#0b1512] p-3">
                  <p className="text-[10px] font-black uppercase text-[#7fa293]">Средства</p>
                  <p className="mt-1 text-sm font-black text-white">{formatCurrency(accountMetrics.equity)}</p>
                </div>
                <div className="border border-[#24453c] bg-[#0b1512] p-3">
                  <p className="text-[10px] font-black uppercase text-[#7fa293]">Залог</p>
                  <p className="mt-1 text-sm font-black text-white">{formatCurrency(requiredMargin, "EUR")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-emerald-50/60">Take Profit</label>
                  <input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className={inputClass} type="number" step={instrument.pointSize} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-emerald-50/60">Stop Loss</label>
                  <input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className={inputClass} type="number" step={instrument.pointSize} />
                </div>
              </div>
              <button onClick={() => openTrade()} className={`w-full px-4 py-4 text-sm font-black text-white shadow-lg ${side === "BUY" ? "bg-[#0bbf73] hover:bg-[#13d684]" : "bg-[#e83b4b] hover:bg-[#ff4d5e]"}`}>
                Открыть {side}
              </button>
            </div>
            </div>
          </div>

          {message && (
            <div className="border border-[#16a34a]/40 bg-[#0c2f24] p-3 text-xs font-bold text-[#d7efe5]">
              {message}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function LivePriceChart({
  symbol,
  quote,
  series,
  compact = false,
}: {
  symbol: string;
  quote?: Quote;
  series?: number[];
  compact?: boolean;
}) {
  const instrument = getInstrument(symbol);
  const currentPrice = quote?.bid ?? quote?.price ?? instrument.defaultPrice;
  const points = (series && series.length > 1 ? series : buildInitialSeries(symbol, currentPrice))
    .concat(currentPrice)
    .slice(-CHART_POINTS);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || currentPrice * 0.01 || 1;
  const width = 1000;
  const height = 320;
  const topPadding = 24;
  const bottomPadding = 28;
  const chartHeight = height - topPadding - bottomPadding;
  const xStep = points.length > 1 ? width / (points.length - 1) : width;
  const yFor = (price: number) => topPadding + (1 - (price - min) / range) * chartHeight;
  const path = points
    .map((price, index) => `${index === 0 ? "M" : "L"} ${(index * xStep).toFixed(2)} ${yFor(price).toFixed(2)}`)
    .join(" ");
  const lastY = yFor(currentPrice);
  const change = points.length > 1 ? currentPrice - points[0] : 0;
  const changePercent = points[0] ? (change / points[0]) * 100 : 0;

  return (
    <div className={`relative w-full overflow-hidden bg-[#07110f] ${compact ? "h-[310px] touch-pan-y" : "h-[360px] sm:h-[400px] xl:h-[455px] 2xl:h-[500px]"}`}>
      <div className="absolute left-3 top-3 z-10 rounded border border-[#24453c] bg-[#07110f]/80 px-3 py-2 backdrop-blur">
        <p className="text-[11px] font-black uppercase text-[#7fa293]">{symbol}</p>
        <p className="text-lg font-black text-white">{formatPrice(symbol, currentPrice)}</p>
        <p className={changePercent >= 0 ? "text-xs font-black text-[#0fd47a]" : "text-xs font-black text-[#ff4d5e]"}>
          {changePercent >= 0 ? "+" : ""}
          {changePercent.toFixed(2)}%
        </p>
      </div>
      <div className="absolute right-3 top-3 z-10 rounded border border-[#24453c] bg-[#07110f]/80 px-3 py-2 text-right backdrop-blur">
        <p className="text-[10px] font-black uppercase text-[#7fa293]">Bid / Ask</p>
        <p className="text-xs font-black text-[#d7efe5]">
          {formatPrice(symbol, quote?.bid ?? currentPrice)} / {formatPrice(symbol, quote?.ask ?? currentPrice)}
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none" aria-label={`Live chart ${symbol}`}>
        <defs>
          <linearGradient id={`terminal-chart-fill-${symbol.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = topPadding + (chartHeight / 3) * line;
          return <line key={line} x1="0" x2={width} y1={y} y2={y} stroke="#17332b" strokeWidth="1" />;
        })}
        {[0, 1, 2, 3, 4].map((line) => {
          const x = (width / 4) * line;
          return <line key={line} x1={x} x2={x} y1="0" y2={height} stroke="#10231e" strokeWidth="1" />;
        })}
        <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={`url(#terminal-chart-fill-${symbol.replace(/[^a-zA-Z0-9]/g, "")})`} />
        <path d={path} fill="none" stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2={width} y1={lastY} y2={lastY} stroke="#8af5bd" strokeDasharray="6 8" strokeOpacity="0.6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <circle cx={width - 2} cy={lastY} r="5" fill="#8af5bd" />
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-bold uppercase text-[#658579]">
        <span>Live</span>
        <span>Единая цена терминала</span>
      </div>
    </div>
  );
}

function MobileTerminal({
  activeGroup,
  setActiveGroup,
  visibleSymbols,
  symbol,
  setSymbol,
  quotes,
  volume,
  setVolume,
  side,
  setSide,
  openTrade,
  chartInterval,
  chartSeries,
  trades,
  onClose,
}: {
  activeGroup: MarketGroup | "All";
  setActiveGroup: (group: MarketGroup | "All") => void;
  visibleSymbols: typeof marketInstruments;
  symbol: string;
  setSymbol: (symbol: string) => void;
  quotes: Record<string, Quote>;
  volume: string;
  setVolume: (volume: string) => void;
  side: "BUY" | "SELL";
  setSide: (side: "BUY" | "SELL") => void;
  openTrade: (side?: "BUY" | "SELL") => void;
  chartInterval: string;
  chartSeries: Record<string, number[]>;
  trades: Trade[];
  onClose: (trade: Trade) => void;
}) {
  const [marketsOpen, setMarketsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"open" | "history">("open");
  const [pendingSide, setPendingSide] = useState<"BUY" | "SELL" | null>(null);
  const [tradeToClose, setTradeToClose] = useState<Trade | null>(null);
  const openTrades = trades.filter((trade) => trade.closePrice === null);
  const closedTrades = trades.filter((trade) => trade.closePrice !== null);
  const visibleTrades = activeTab === "open" ? openTrades : closedTrades;

  return (
    <div className="space-y-2 xl:hidden">
      <div className="border border-[#1f332f] bg-[#101a18]">
        <div className="flex items-center gap-2 border-b border-[#1f332f] p-2">
          <button
            type="button"
            onClick={() => setMarketsOpen((value) => !value)}
            className="flex size-10 shrink-0 items-center justify-center rounded bg-[#16a34a] text-xl font-black text-white"
          >
            +
          </button>
          <div className="min-w-0">
            <p className="text-sm font-black text-white">{symbol}</p>
            <p className="text-[11px] text-[#7fa293]">{chartInterval} interval</p>
          </div>
        </div>
        {marketsOpen && (
          <div className="border-b border-[#1f332f] bg-[#0e1715] p-2">
            <div className="flex gap-1 overflow-x-auto pb-2">
              {marketGroups.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setActiveGroup(group)}
                  className={`shrink-0 rounded px-3 py-2 text-[11px] font-black ${activeGroup === group ? "bg-[#16a34a] text-white" : "bg-[#17332b] text-[#b8d4c7]"}`}
                >
                  {group}
                </button>
              ))}
            </div>
            <div className="max-h-52 overflow-y-auto">
              {visibleSymbols.map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => {
                    setSymbol(item.symbol);
                    setMarketsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between border-b border-[#1f332f] px-2 py-2 text-left ${symbol === item.symbol ? "bg-[#123d2f]" : ""}`}
                >
                  <span className="font-black text-white">{item.symbol}</span>
                  <span className="text-xs text-[#7fa293]">{formatPrice(item.symbol, quotes[item.symbol]?.bid ?? quotes[item.symbol]?.price ?? item.defaultPrice)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <LivePriceChart symbol={symbol} quote={quotes[symbol]} series={chartSeries[symbol]} compact />
      </div>

      <div className="grid grid-cols-[1fr_112px_1fr] gap-2">
        <button
          type="button"
          onClick={() => {
            setSide("BUY");
            setPendingSide("BUY");
          }}
          className={`h-14 rounded bg-[#0bbf73] text-base font-black text-white ${side === "BUY" ? "ring-2 ring-white/50" : ""}`}
        >
          BUY
        </button>
        <input
          value={volume}
          onChange={(event) => setVolume(event.target.value)}
          type="number"
          min="0.01"
          step="0.01"
          className="h-14 rounded border border-[#24453c] bg-[#0e1815] px-2 text-center text-sm font-black text-white outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setSide("SELL");
            setPendingSide("SELL");
          }}
          className={`h-14 rounded bg-[#e83b4b] text-base font-black text-white ${side === "SELL" ? "ring-2 ring-white/50" : ""}`}
        >
          SELL
        </button>
      </div>

      {pendingSide && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#24453c] bg-[#101a18] p-5 text-white shadow-2xl">
            <p className="text-lg font-black">Подтвердите операцию</p>
            <p className="mt-2 text-sm text-[#b8d4c7]">
              Открыть сделку {pendingSide} по инструменту {symbol} с объемом {volume}?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingSide(null)}
                className="h-12 rounded-xl border border-[#24453c] text-sm font-black text-[#d7efe5]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  const sideToOpen = pendingSide;
                  setPendingSide(null);
                  setSide(sideToOpen);
                  openTrade(sideToOpen);
                }}
                className={`h-12 rounded-xl text-sm font-black text-white ${pendingSide === "BUY" ? "bg-[#0bbf73]" : "bg-[#e83b4b]"}`}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {tradeToClose && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#24453c] bg-[#101a18] p-5 text-white shadow-2xl">
            <p className="text-lg font-black">Закрыть сделку?</p>
            <p className="mt-2 text-sm text-[#b8d4c7]">
              Закрыть {tradeToClose.side} {tradeToClose.symbol} объемом {tradeToClose.volume}?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTradeToClose(null)}
                className="h-12 rounded-xl border border-[#24453c] text-sm font-black text-[#d7efe5]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentTrade = tradeToClose;
                  setTradeToClose(null);
                  onClose(currentTrade);
                }}
                className="h-12 rounded-xl bg-[#e83b4b] text-sm font-black text-white"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border border-[#1f332f] bg-[#101a18]">
        <div className="flex border-b border-[#1f332f] p-2">
          <button onClick={() => setActiveTab("open")} className={`flex-1 rounded py-2 text-xs font-black ${activeTab === "open" ? "bg-[#16a34a] text-white" : "text-[#b8d4c7]"}`}>Открытые сделки</button>
          <button onClick={() => setActiveTab("history")} className={`flex-1 rounded py-2 text-xs font-black ${activeTab === "history" ? "bg-[#16a34a] text-white" : "text-[#b8d4c7]"}`}>Отчет</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full text-xs">
            <thead>
              <tr className="border-b border-[#1f332f] text-left text-[#658579]">
                <th className="px-2 py-2">Символ</th>
                <th className="px-2 py-2">Прибыль</th>
                <th className="px-2 py-2">Тип</th>
                <th className="px-2 py-2">Объем</th>
                <th className="px-2 py-2">Дата</th>
              </tr>
            </thead>
            <tbody>
              {visibleTrades.map((trade) => {
                const isClosed = trade.closePrice !== null;
                const marketPrice = getTradeMarketPrice(trade, quotes[trade.symbol]);
                const profit = trade.closePrice === null
                  ? calculateTradeProfit(trade.symbol, trade.side, trade.openPrice, marketPrice, trade.volume, trade.swap ?? 0, quotes[trade.symbol]?.settings?.tickValue)
                  : Number(trade.profit || 0);
                return (
                  <tr key={trade.id} className="border-b border-[#1a2b27] text-[#d7efe5]">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        {activeTab === "open" && (
                          <button
                            type="button"
                            onClick={() => setTradeToClose(trade)}
                            aria-label={`Закрыть ${trade.symbol}`}
                            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-red-400/40 bg-red-500/10 text-base font-black leading-none text-red-300 transition hover:bg-red-500 hover:text-white"
                          >
                            ×
                          </button>
                        )}
                        <span className="font-black text-white">{trade.symbol}</span>
                      </div>
                    </td>
                    <td className={profit >= 0 ? "px-2 py-2 font-black text-[#0fd47a]" : "px-2 py-2 font-black text-[#ff4d5e]"}>€{profit.toFixed(2)}</td>
                    <td className={trade.side === "BUY" ? "px-2 py-2 font-black text-[#0fd47a]" : "px-2 py-2 font-black text-[#ff4d5e]"}>{trade.side}</td>
                    <td className="px-2 py-2">{trade.volume}</td>
                    <td className="px-2 py-2">{new Date((isClosed && trade.closedAt) || trade.createdAt).toLocaleDateString("ru-RU")}</td>
                  </tr>
                );
              })}
              {visibleTrades.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[#658579]">Нет сделок</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PositionsPanel({
  trades,
  quotes,
  onClose,
}: {
  trades: Trade[];
  quotes: Record<string, Quote>;
  onClose: (trade: Trade) => void;
}) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"open" | "history">("open");
  const [page, setPage] = useState(1);
  const openTrades = trades.filter((trade) => trade.closePrice === null);
  const closedTrades = trades.filter((trade) => trade.closePrice !== null);
  const visibleTrades = activeTab === "open" ? openTrades : closedTrades;
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(visibleTrades.length / pageSize));
  const pagedTrades = visibleTrades.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="border-t border-[#1f332f] bg-[#0e1715]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1f332f] px-3 py-2">
        <button
          onClick={() => { setActiveTab("open"); setPage(1); }}
          className={`px-3 py-1 text-[11px] font-black ${activeTab === "open" ? "bg-[#16a34a] text-white" : "bg-[#17332b] text-[#b8d4c7] hover:bg-[#21483d]"}`}
        >
          {language === "ru" ? "Открытые позиции" : "Open positions"}
        </button>
        <button
          onClick={() => { setActiveTab("history"); setPage(1); }}
          className={`px-3 py-1 text-[11px] font-black ${activeTab === "history" ? "bg-[#16a34a] text-white" : "bg-[#17332b] text-[#b8d4c7] hover:bg-[#21483d]"}`}
        >
          {language === "ru" ? "Отчет" : "Report"}
        </button>
        <span className="ml-auto text-[11px] font-bold text-[#7fa293]">
          {activeTab === "open" ? `${language === "ru" ? "Открыто" : "Open"}: ${openTrades.length}` : `${language === "ru" ? "Закрыто" : "Closed"}: ${closedTrades.length}`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-xs">
          <thead>
            <tr className="border-b border-[#1f332f] text-left text-[10px] uppercase text-[#658579]">
              <th className="px-3 py-2">{language === "ru" ? "Символ" : "Symbol"}</th>
              <th className="px-3 py-2">{language === "ru" ? "Тип" : "Type"}</th>
              <th className="px-3 py-2">{language === "ru" ? "Объем" : "Volume"}</th>
              <th className="px-3 py-2">{language === "ru" ? "Открытие" : "Open"}</th>
              <th className="px-3 py-2">{activeTab === "open" ? (language === "ru" ? "Рынок" : "Market") : (language === "ru" ? "Закрытие" : "Close")}</th>
              <th className="px-3 py-2">{language === "ru" ? "Дата открытия" : "Open date"}</th>
              <th className="px-3 py-2">T/P</th>
              <th className="px-3 py-2">S/L</th>
              <th className="px-3 py-2">{language === "ru" ? "Прибыль" : "Profit"}</th>
              {activeTab === "open" && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {pagedTrades.map((trade) => {
              const isClosed = trade.closePrice !== null;
              const marketPrice = getTradeMarketPrice(trade, quotes[trade.symbol]);
              const profit =
                trade.closePrice === null
                  ? calculateTradeProfit(trade.symbol, trade.side, trade.openPrice, marketPrice, trade.volume, trade.swap ?? 0, quotes[trade.symbol]?.settings?.tickValue)
                  : Number(trade.profit || 0);

              return (
                <tr key={trade.id} className="border-b border-[#1a2b27] text-[#d7efe5]">
                  <td className="px-3 py-2 font-black text-white">{trade.symbol}</td>
                  <td className={`px-3 py-2 font-black ${trade.side === "BUY" ? "text-[#0fd47a]" : "text-[#ff4d5e]"}`}>{trade.side}</td>
                  <td className="px-3 py-2">{trade.volume}</td>
                  <td className="px-3 py-2">{formatPrice(trade.symbol, trade.openPrice)}</td>
                  <td className="px-3 py-2">{formatPrice(trade.symbol, marketPrice)}</td>
                  <td className="px-3 py-2 text-[#7fa293]">{new Date(trade.createdAt).toLocaleString("ru-RU")}</td>
                  <td className="px-3 py-2">{trade.takeProfit ? formatPrice(trade.symbol, trade.takeProfit) : "-"}</td>
                  <td className="px-3 py-2">{trade.stopLoss ? formatPrice(trade.symbol, trade.stopLoss) : "-"}</td>
                  <td className={`px-3 py-2 font-black ${profit >= 0 ? "text-[#0fd47a]" : "text-[#ff4d5e]"}`}>${profit.toFixed(2)}</td>
                  {activeTab === "open" && (
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => onClose(trade)} className="bg-[#21483d] px-3 py-1 font-black text-white hover:bg-[#e83b4b]">
                        {language === "ru" ? "Закрыть" : "Close"}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {visibleTrades.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-[#658579]" colSpan={activeTab === "open" ? 10 : 9}>
                  {activeTab === "open" ? (language === "ru" ? "Открытых позиций пока нет" : "No open positions yet") : (language === "ru" ? "Закрытых сделок пока нет" : "No closed trades yet")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {visibleTrades.length > pageSize && (
        <div className="flex items-center justify-end gap-2 border-t border-[#1f332f] px-3 py-2 text-xs text-[#b8d4c7]">
          <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="bg-[#17332b] px-3 py-1 font-black disabled:opacity-40">{language === "ru" ? "Назад" : "Back"}</button>
          <span className="font-black">{page} / {pageCount}</span>
          <button disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="bg-[#17332b] px-3 py-1 font-black disabled:opacity-40">{language === "ru" ? "Далее" : "Next"}</button>
        </div>
      )}
    </div>
  );
}


