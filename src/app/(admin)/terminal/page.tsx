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
};

const inputClass =
  "h-9 w-full rounded border border-[#24453c] bg-[#0e1815] px-2 text-xs font-semibold text-slate-100 outline-none transition focus:border-[#22c55e]";
const ACTIVE_QUOTE_REFRESH_MS = 2500;
const WATCHLIST_REFRESH_MS = 5000;

function parsePositiveNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatCurrency(value: number, currency = "USD") {
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
  const [activeGroup, setActiveGroup] = useState<MarketGroup | "All">("Forex");
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
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
  const marginCurrency = selectedQuoteSettings?.marginCurrency || "USD";
  const profitCurrency = selectedQuoteSettings?.profitCurrency || "USD";
  const requiredMargin = (activeContractSize * tradeVolume * activeTradePrice * activeMarginRate) / activeLeverage;
  const pointValue = instrument.tickValue * tradeVolume;
  const visibleSymbols = useMemo(
    () => marketInstruments.filter((item) => activeGroup === "All" || item.group === activeGroup),
    [activeGroup]
  );

  async function loadQuote(currentSymbol: string) {
    const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(currentSymbol)}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Quote error");
      return;
    }

    setQuotes((prev) => ({
      ...prev,
      [currentSymbol]: {
        symbol: currentSymbol,
        price: Number(data.price),
        bid: Number(data.bid ?? data.price),
        ask: Number(data.ask ?? data.price),
        change: data.change,
        time: data.time,
        source: data.source,
        settings: data.settings ?? null,
      },
    }));

    if (currentSymbol === symbol) {
      setOpenPrice(String(data.price));
    }
  }

  async function loadVisibleQuotes() {
    await Promise.all(visibleSymbols.slice(0, 18).map((item) => loadQuote(item.symbol)));
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

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    const timer = window.setTimeout(() => {
      setUserId(storedUserId);
      loadTrades(storedUserId);
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

  async function openTrade() {
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
    const tradePrice = side === "BUY" ? askPrice : bidPrice;

    const payload = {
      userId,
      symbol,
      side,
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
    await loadTrades();
  }

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#0b1110] p-1 text-slate-100 shadow-2xl shadow-slate-950/30 sm:p-2">
      <div className="mb-2 border border-[#1f332f] bg-[#101a18] px-3 py-2">
        <div>
      <h1 className="text-base font-black text-white">Торговый терминал</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-[260px_minmax(0,1fr)_285px] 2xl:grid-cols-[280px_minmax(0,1fr)_300px]">
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
              const price = quote?.price || item.defaultPrice;
              const spread = item.pointSize * 14;

              return (
                <button
                  key={item.symbol}
                  onClick={() => {
                    setSymbol(item.symbol);
                    setMessage("");
                    const nextQuote = quotes[item.symbol]?.price || item.defaultPrice;
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
                  <p className="text-right text-xs font-bold text-[#d7efe5]">{formatPrice(item.symbol, price)}</p>
                  <p className="text-right text-xs font-bold text-[#d7efe5]">{formatPrice(item.symbol, price + spread)}</p>
                  <p className={change >= 0 ? "text-right text-[11px] font-black text-[#0fd47a]" : "text-right text-[11px] font-black text-[#ff4d5e]"}>
                    {quote ? `${change.toFixed(2)}%` : "0.00%"}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 border border-[#1f332f] bg-[#101a18]">
          <div className="flex items-stretch gap-1 overflow-x-auto border-b border-[#1f332f] bg-[#0e1715] px-2 pt-2">
            {chartSymbols.map((chartSymbol) => (
              <div
                key={chartSymbol}
                className={`flex min-w-32 items-center border-x border-t border-[#1f332f] ${
                  symbol === chartSymbol ? "bg-[#101a18] text-white" : "bg-[#0a1311] text-[#7fa293]"
                }`}
              >
                <button
                  onClick={() => setSymbol(chartSymbol)}
                  className="min-w-0 flex-1 px-3 py-2 text-left text-[11px] font-black hover:text-white"
                >
                  {chartSymbol}
                </button>
                <button
                  type="button"
                  onClick={() => removeChartSymbol(chartSymbol)}
                  className="flex h-full w-8 items-center justify-center border-l border-[#1f332f] text-sm font-black text-[#658579] hover:bg-[#21483d] hover:text-white"
                  aria-label={`Удалить ${chartSymbol}`}
                >
                  ×
                </button>
              </div>
            ))}
            <div className="ml-auto flex shrink-0 items-center gap-1 pb-0">
              <select
                value={symbolToAdd}
                onChange={(event) => setSymbolToAdd(event.target.value)}
                className="h-9 rounded border border-[#1f332f] bg-[#0a1311] px-2 text-[11px] font-black text-[#d7efe5] outline-none"
              >
                {marketInstruments.map((item) => (
                  <option key={item.symbol} value={item.symbol}>
                    {item.symbol}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addChartSymbol}
                className="flex h-9 w-9 items-center justify-center rounded bg-[#16a34a] text-xl font-black leading-none text-white hover:bg-[#22c55e]"
                aria-label="Добавить котировку"
              >
                +
              </button>
            </div>
          </div>
          <div className="border-b border-[#1f332f] bg-[#07110f] px-3 py-2 text-xs font-bold text-[#b8d4c7]">
            {symbol} · M15 · O {openPrice ? formatPrice(symbol, Number(openPrice)) : "..."} · Цена пункта ${instrument.tickValue} · Шаг {instrument.pointSize}
          </div>
          <iframe
            key={symbol}
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${
              instrument.tvSymbol
            }&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=10131b&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&locale=ru`}
            className="h-[520px] w-full border-0 bg-[#07110f] sm:h-[620px] xl:h-[720px] 2xl:h-[780px]"
            allowFullScreen
          />
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
                  <p className="text-[10px] font-black uppercase text-[#7fa293]">Залог</p>
                  <p className="mt-1 text-sm font-black text-white">{formatCurrency(requiredMargin, marginCurrency)}</p>
                </div>
                <div className="border border-[#24453c] bg-[#0b1512] p-3">
                  <p className="text-[10px] font-black uppercase text-[#7fa293]">Стоимость пункта</p>
                  <p className="mt-1 text-sm font-black text-white">{formatCurrency(pointValue, profitCurrency)}</p>
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
              <button onClick={openTrade} className={`w-full px-4 py-4 text-sm font-black text-white shadow-lg ${side === "BUY" ? "bg-[#0bbf73] hover:bg-[#13d684]" : "bg-[#e83b4b] hover:bg-[#ff4d5e]"}`}>
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

function PositionsPanel({
  trades,
  quotes,
  onClose,
}: {
  trades: Trade[];
  quotes: Record<string, Quote>;
  onClose: (trade: Trade) => void;
}) {
  const [activeTab, setActiveTab] = useState<"open" | "history">("open");
  const openTrades = trades.filter((trade) => trade.closePrice === null);
  const closedTrades = trades.filter((trade) => trade.closePrice !== null);
  const visibleTrades = activeTab === "open" ? openTrades : closedTrades;

  return (
    <div className="border-t border-[#1f332f] bg-[#0e1715]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1f332f] px-3 py-2">
        <button
          onClick={() => setActiveTab("open")}
          className={`px-3 py-1 text-[11px] font-black ${activeTab === "open" ? "bg-[#16a34a] text-white" : "bg-[#17332b] text-[#b8d4c7] hover:bg-[#21483d]"}`}
        >
          Открытые позиции
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3 py-1 text-[11px] font-black ${activeTab === "history" ? "bg-[#16a34a] text-white" : "bg-[#17332b] text-[#b8d4c7] hover:bg-[#21483d]"}`}
        >
          Отчет
        </button>
        <span className="ml-auto text-[11px] font-bold text-[#7fa293]">
          {activeTab === "open" ? `Открыто: ${openTrades.length}` : `Закрыто: ${closedTrades.length}`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-xs">
          <thead>
            <tr className="border-b border-[#1f332f] text-left text-[10px] uppercase text-[#658579]">
              <th className="px-3 py-2">Символ</th>
              <th className="px-3 py-2">Тип</th>
              <th className="px-3 py-2">Объем</th>
              <th className="px-3 py-2">Открытие</th>
              <th className="px-3 py-2">{activeTab === "open" ? "Рынок" : "Закрытие"}</th>
              <th className="px-3 py-2">S/L</th>
              <th className="px-3 py-2">Дата открытия</th>
              <th className="px-3 py-2">T/P</th>
              <th className="px-3 py-2">Своп</th>
              <th className="px-3 py-2">Прибыль</th>
              <th className="px-3 py-2">{activeTab === "open" ? "" : "Дата"}</th>
            </tr>
          </thead>
          <tbody>
            {visibleTrades.map((trade) => {
              const marketPrice = quotes[trade.symbol]?.price || trade.closePrice || trade.openPrice;
              const profit =
                trade.closePrice === null
                  ? calculateTradeProfit(trade.symbol, trade.side, trade.openPrice, marketPrice, trade.volume, trade.swap ?? 0)
                  : Number(trade.profit || 0);

              return (
                <tr key={trade.id} className="border-b border-[#1a2b27] text-[#d7efe5]">
                  <td className="px-3 py-2 font-black text-white">{trade.symbol}</td>
                  <td className={`px-3 py-2 font-black ${trade.side === "BUY" ? "text-[#0fd47a]" : "text-[#ff4d5e]"}`}>{trade.side}</td>
                  <td className="px-3 py-2">{trade.volume}</td>
                  <td className="px-3 py-2">{formatPrice(trade.symbol, trade.openPrice)}</td>
                  <td className="px-3 py-2">{formatPrice(trade.symbol, marketPrice)}</td>
                  <td className="px-3 py-2">{trade.stopLoss ? formatPrice(trade.symbol, trade.stopLoss) : "-"}</td>
                  <td className="px-3 py-2 text-[#7fa293]">{new Date(trade.createdAt).toLocaleString("ru-RU")}</td>
                  <td className="px-3 py-2">{trade.takeProfit ? formatPrice(trade.symbol, trade.takeProfit) : "-"}</td>
                  <td className="px-3 py-2">{trade.swap ?? 0}</td>
                  <td className={`px-3 py-2 font-black ${profit >= 0 ? "text-[#0fd47a]" : "text-[#ff4d5e]"}`}>${profit.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    {activeTab === "open" ? (
                      <button onClick={() => onClose(trade)} className="bg-[#21483d] px-3 py-1 font-black text-white hover:bg-[#e83b4b]">
                        Закрыть
                      </button>
                    ) : (
                      <span className="text-[#658579]">{new Date(trade.createdAt).toLocaleString("ru-RU")}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {visibleTrades.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-[#658579]" colSpan={11}>
                  {activeTab === "open" ? "Открытых позиций пока нет" : "Закрытых сделок пока нет"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


