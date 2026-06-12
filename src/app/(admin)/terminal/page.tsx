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
  change?: string;
  time?: string;
  source?: string;
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
  "h-9 w-full rounded border border-[#303544] bg-[#141824] px-2 text-xs font-semibold text-slate-100 outline-none transition focus:border-[#4c8dff]";

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
  const [quoteTime, setQuoteTime] = useState("");
  const [quoteSource, setQuoteSource] = useState("");
  const [activeGroup, setActiveGroup] = useState<MarketGroup | "All">("Forex");
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [trades, setTrades] = useState<Trade[]>([]);

  const instrument = getInstrument(symbol);
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
        change: data.change,
        time: data.time,
        source: data.source,
      },
    }));

    if (currentSymbol === symbol) {
      setOpenPrice(String(data.price));
      setQuoteTime(data.time);
      setQuoteSource(data.source);
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
    const interval = setInterval(() => loadQuote(symbol), 5000);
    return () => {
      window.clearTimeout(timer);
      clearInterval(interval);
    };
  }, [symbol]);

  useEffect(() => {
    const timer = window.setTimeout(loadVisibleQuotes, 0);
    const interval = setInterval(loadVisibleQuotes, 15000);
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

  async function openTrade() {
    if (!userId) {
      setMessage("Сначала войдите в аккаунт");
      router.push("/login");
      return;
    }

    if (!openPrice || !volume || Number(volume) < instrument.minLot) {
      setMessage(`Минимальный объём: ${instrument.minLot}`);
      return;
    }

    const payload = {
      userId,
      symbol,
      side,
      openPrice: Number(openPrice),
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
    const quote = quotes[trade.symbol]?.price || trade.openPrice;
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
    <div className="min-h-[calc(100vh-96px)] bg-[#151821] p-1 text-slate-100 shadow-2xl shadow-slate-950/30 sm:p-2">
      <div className="mb-2 flex flex-col gap-2 border border-[#2a2f3d] bg-[#1b1f2b] px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8290aa]">Astero Trader Room</p>
      <h1 className="text-base font-black text-white">Торговый терминал</h1>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs md:grid-cols-3">
          <InfoPill label="Символ" value={symbol} />
          <InfoPill label="Цена" value={openPrice ? formatPrice(symbol, Number(openPrice)) : "..."} />
          <InfoPill label="Источник" value={quoteSource || "..."} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-[260px_minmax(0,1fr)_285px] 2xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className="border border-[#2a2f3d] bg-[#1b1f2b]">
          <div className="flex items-center justify-between border-b border-[#2a2f3d] px-3 py-2">
            <p className="text-xs font-black uppercase text-[#b8c0d4]">Котировки</p>
            <span className="rounded bg-[#242a38] px-2 py-1 text-[10px] font-bold text-[#8290aa]">{visibleSymbols.length}</span>
          </div>
          <div className="flex gap-1 overflow-x-auto border-b border-[#2a2f3d] p-2">
            {marketGroups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`rounded px-2 py-1 text-[11px] font-black transition ${
                  activeGroup === group ? "bg-[#2f7cff] text-white" : "bg-[#242a38] text-[#b8c0d4] hover:bg-[#30384a]"
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_72px_72px_54px] border-b border-[#2a2f3d] px-3 py-2 text-[10px] font-black uppercase text-[#69758f]">
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
                  className={`grid w-full grid-cols-[1fr_72px_72px_54px] items-center gap-1 border-b border-[#252b38] px-3 py-2 text-left transition ${
                    symbol === item.symbol ? "bg-[#24324b]" : "bg-[#1b1f2b] hover:bg-[#222838]"
                  }`}
                >
                  <div>
                    <p className="text-xs font-black text-white">{item.symbol}</p>
                    <p className="text-[10px] text-[#69758f]">{item.group}</p>
                  </div>
                  <p className="text-right text-xs font-bold text-[#d8def0]">{formatPrice(item.symbol, price)}</p>
                  <p className="text-right text-xs font-bold text-[#d8def0]">{formatPrice(item.symbol, price + spread)}</p>
                  <p className={change >= 0 ? "text-right text-[11px] font-black text-[#0fd47a]" : "text-right text-[11px] font-black text-[#ff4d5e]"}>
                    {quote ? `${change.toFixed(2)}%` : "0.00%"}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 border border-[#2a2f3d] bg-[#1b1f2b]">
          <div className="flex gap-1 overflow-x-auto border-b border-[#2a2f3d] bg-[#171b25] px-2 pt-2">
            {marketInstruments.slice(0, 9).map((item) => (
              <button
                key={item.symbol}
                onClick={() => setSymbol(item.symbol)}
                className={`min-w-28 border-x border-t border-[#2a2f3d] px-3 py-2 text-left text-[11px] font-black ${
                  symbol === item.symbol ? "bg-[#1b1f2b] text-white" : "bg-[#11151e] text-[#8290aa] hover:text-white"
                }`}
              >
                {item.symbol}
              </button>
            ))}
          </div>
          <div className="border-b border-[#2a2f3d] bg-[#10131b] px-3 py-2 text-xs font-bold text-[#b8c0d4]">
            {symbol} · M15 · O {openPrice ? formatPrice(symbol, Number(openPrice)) : "..."} · Tick value ${instrument.tickValue} · Point {instrument.pointSize}
          </div>
          <iframe
            key={symbol}
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${
              instrument.tvSymbol
            }&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=10131b&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&locale=ru`}
            className="h-[520px] w-full border-0 bg-[#10131b] sm:h-[620px] xl:h-[720px] 2xl:h-[780px]"
            allowFullScreen
          />
          <PositionsPanel trades={trades} quotes={quotes} onClose={closeTrade} />
        </main>

        <aside className="space-y-2">
          <div className="border border-[#2a2f3d] bg-[#1b1f2b]">
            <div className="border-b border-[#2a2f3d] px-3 py-2">
            <p className="text-xs font-black uppercase text-[#b8c0d4]">Новая сделка</p>
            </div>
            <div className="p-3">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setSide("BUY")}
                className={`px-4 py-4 text-lg font-black ${side === "BUY" ? "bg-[#0bbf73] text-white" : "bg-[#153927] text-[#80e4b5]"}`}
              >
                <span className="block text-[10px] uppercase">Buy</span>
                {openPrice ? formatPrice(symbol, Number(openPrice) + instrument.pointSize * 14) : "..."}
              </button>
              <button
                onClick={() => setSide("SELL")}
                className={`px-4 py-4 text-lg font-black ${side === "SELL" ? "bg-[#e83b4b] text-white" : "bg-[#421d25] text-[#ff9aa5]"}`}
              >
                <span className="block text-[10px] uppercase">Sell</span>
                {openPrice ? formatPrice(symbol, Number(openPrice)) : "..."}
              </button>
            </div>

            <div className="mb-3 border border-[#2a2f3d] bg-[#11151e] p-3">
              <p className="text-[10px] font-bold uppercase text-[#69758f]">Рыночная цена</p>
              <p className="mt-1 text-3xl font-black text-white">{openPrice ? formatPrice(symbol, Number(openPrice)) : "..."}</p>
              <p className="mt-1 text-[11px] text-[#8290aa]">
                Обновлено: {quoteTime ? new Date(quoteTime).toLocaleTimeString("ru-RU") : "..."}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-emerald-50/60">Объём</label>
                <input value={volume} onChange={(e) => setVolume(e.target.value)} className={inputClass} type="number" step={instrument.lotStep} min={instrument.minLot} max={instrument.maxLot} />
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {["0.01", "0.05", "0.10", "1"].map((value) => (
                    <button key={value} onClick={() => setVolumePreset(value)} className="rounded bg-[#242a38] py-2 text-xs font-bold text-[#d8def0] hover:bg-[#30384a]">
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-emerald-50/60">Stop Loss</label>
                  <input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className={inputClass} type="number" step={instrument.pointSize} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-emerald-50/60">Take Profit</label>
                  <input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className={inputClass} type="number" step={instrument.pointSize} />
                </div>
              </div>
              <button onClick={openTrade} className={`w-full px-4 py-4 text-sm font-black text-white shadow-lg ${side === "BUY" ? "bg-[#0bbf73] hover:bg-[#13d684]" : "bg-[#e83b4b] hover:bg-[#ff4d5e]"}`}>
                Открыть {side}
              </button>
            </div>
            </div>
          </div>

          {message && (
            <div className="border border-[#2f7cff]/40 bg-[#102441] p-3 text-xs font-bold text-[#d8def0]">
              {message}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#2a2f3d] bg-[#11151e] px-2 py-1.5">
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#69758f]">{label}</p>
      <p className="mt-0.5 truncate text-xs font-black text-[#d8def0]">{value}</p>
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
    <div className="border-t border-[#2a2f3d] bg-[#171b25]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#2a2f3d] px-3 py-2">
        <button
          onClick={() => setActiveTab("open")}
          className={`px-3 py-1 text-[11px] font-black ${activeTab === "open" ? "bg-[#2f7cff] text-white" : "bg-[#242a38] text-[#b8c0d4] hover:bg-[#30384a]"}`}
        >
          Открытые позиции
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3 py-1 text-[11px] font-black ${activeTab === "history" ? "bg-[#2f7cff] text-white" : "bg-[#242a38] text-[#b8c0d4] hover:bg-[#30384a]"}`}
        >
          Отчет
        </button>
        <span className="ml-auto text-[11px] font-bold text-[#8290aa]">
          {activeTab === "open" ? `Открыто: ${openTrades.length}` : `Закрыто: ${closedTrades.length}`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-xs">
          <thead>
            <tr className="border-b border-[#2a2f3d] text-left text-[10px] uppercase text-[#69758f]">
              <th className="px-3 py-2">Символ</th>
              <th className="px-3 py-2">Тип</th>
              <th className="px-3 py-2">Объём</th>
              <th className="px-3 py-2">Открытие</th>
              <th className="px-3 py-2">{activeTab === "open" ? "Рынок" : "Закрытие"}</th>
              <th className="px-3 py-2">S/L</th>
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
                <tr key={trade.id} className="border-b border-[#252b38] text-[#d8def0]">
                  <td className="px-3 py-2 font-black text-white">{trade.symbol}</td>
                  <td className={`px-3 py-2 font-black ${trade.side === "BUY" ? "text-[#0fd47a]" : "text-[#ff4d5e]"}`}>{trade.side}</td>
                  <td className="px-3 py-2">{trade.volume}</td>
                  <td className="px-3 py-2">{formatPrice(trade.symbol, trade.openPrice)}</td>
                  <td className="px-3 py-2">{formatPrice(trade.symbol, marketPrice)}</td>
                  <td className="px-3 py-2">{trade.stopLoss ? formatPrice(trade.symbol, trade.stopLoss) : "-"}</td>
                  <td className="px-3 py-2">{trade.takeProfit ? formatPrice(trade.symbol, trade.takeProfit) : "-"}</td>
                  <td className="px-3 py-2">{trade.swap ?? 0}</td>
                  <td className={`px-3 py-2 font-black ${profit >= 0 ? "text-[#0fd47a]" : "text-[#ff4d5e]"}`}>${profit.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    {activeTab === "open" ? (
                      <button onClick={() => onClose(trade)} className="bg-[#30384a] px-3 py-1 font-black text-white hover:bg-[#e83b4b]">
                        Закрыть
                      </button>
                    ) : (
                      <span className="text-[#69758f]">{new Date(trade.createdAt).toLocaleString("ru-RU")}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {visibleTrades.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-[#69758f]" colSpan={10}>
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
