"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { marketSymbols } from "@/components/broker/MarketWatch";

const tradingViewSymbols: Record<string, string> = {
  "EUR/USD": "FX_IDC%3AEURUSD",
  "GBP/USD": "FX_IDC%3AGBPUSD",
  "USD/JPY": "FX_IDC%3AUSDJPY",
  "AUD/USD": "FX_IDC%3AAUDUSD",
  "USD/CAD": "FX_IDC%3AUSDCAD",
  "USD/CHF": "FX_IDC%3AUSDCHF",
  "NZD/USD": "FX_IDC%3ANZDUSD",
  "EUR/GBP": "FX_IDC%3AEURGBP",
  "EUR/JPY": "FX_IDC%3AEURJPY",
  "XAU/USD": "OANDA%3AXAUUSD",
  "XAG/USD": "OANDA%3AXAGUSD",
  "BTC/USD": "BITSTAMP%3ABTCUSD",
  "ETH/USD": "BITSTAMP%3AETHUSD",
  "SOL/USD": "BINANCE%3ASOLUSDT",
  US100: "TVC%3ANDX",
  SPX500: "SP%3ASPX",
  US30: "DJ%3ADJI",
  AAPL: "NASDAQ%3AAAPL",
  TSLA: "NASDAQ%3ATSLA",
  NVDA: "NASDAQ%3ANVDA",
};

const defaultPrices: Record<string, string> = {
  "EUR/USD": "1.0850",
  "GBP/USD": "1.2700",
  "USD/JPY": "157.50",
  "AUD/USD": "0.6650",
  "USD/CAD": "1.3700",
  "USD/CHF": "0.8900",
  "NZD/USD": "0.6100",
  "EUR/GBP": "0.8550",
  "EUR/JPY": "170.50",
  "XAU/USD": "2320.00",
  "XAG/USD": "29.00",
  "BTC/USD": "69000.00",
  "ETH/USD": "3600.00",
  "SOL/USD": "165.00",
  US100: "19000.00",
  SPX500: "5300.00",
  US30: "39000.00",
  AAPL: "190.00",
  TSLA: "175.00",
  NVDA: "120.00",
};

const inputClass =
  "h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white";

export default function TradingTerminalPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [symbol, setSymbol] = useState("EUR/USD");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [openPrice, setOpenPrice] = useState(defaultPrices["EUR/USD"]);
  const [volume, setVolume] = useState("1");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [quoteTime, setQuoteTime] = useState("");
  const [activeGroup, setActiveGroup] = useState("Forex");

  const visibleSymbols = marketSymbols.filter(
    (item) => activeGroup === "All" || item.group === activeGroup
  );

  async function loadQuote(currentSymbol: string) {
    const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(currentSymbol)}`);
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Ошибка котировки");
      return;
    }

    setOpenPrice(String(data.price));
    setQuoteTime(data.time);
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    setUserId(storedUserId);
  }, [router]);

  useEffect(() => {
    loadQuote(symbol);

    const interval = setInterval(() => {
      loadQuote(symbol);
    }, 15000);

    return () => clearInterval(interval);
  }, [symbol]);

  async function openTrade() {
    if (!userId) {
      setMessage("Сначала войдите в аккаунт");
      router.push("/login");
      return;
    }

    if (!openPrice || !volume || Number(volume) <= 0) {
      setMessage("Введите корректную цену и объём");
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
      comment: comment.trim() || null,
    };

    setMessage("Открытие сделки...");

    const res = await fetch("/api/trade/open", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Ошибка открытия сделки");
      return;
    }

    setMessage(
      `Сделка открыта: ${data.symbol} ${data.side}, объём ${data.volume}, цена ${data.openPrice}`
    );

    setStopLoss("");
    setTakeProfit("");
    setComment("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
              Торговый терминал
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-emerald-50/60">
              Выберите рынок, укажите объём, Stop Loss / Take Profit и откройте сделку.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right dark:border-emerald-400/10 dark:bg-slate-950/70">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              Инструмент
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {symbol}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-3 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] sm:p-4 xl:col-span-9">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                График
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-emerald-50/55">
                TradingView market view.
              </p>
            </div>

            <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              LIVE
            </span>
          </div>

          <iframe
            key={symbol}
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${
              tradingViewSymbols[symbol] || tradingViewSymbols["EUR/USD"]
            }&interval=60&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=F1F3F6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=ru`}
            className="h-[460px] w-full rounded-2xl border border-emerald-100 bg-slate-950 dark:border-emerald-400/10 md:h-[760px]"
            allowFullScreen
          />
        </div>

        <div className="space-y-4 xl:col-span-3">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04]">
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-400/10 dark:bg-slate-950/70">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-500 dark:text-emerald-50/55">
                  Текущая цена
                </p>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  15s
                </span>
              </div>

              <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                {openPrice}
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-emerald-50/45">
                Обновлено: {quoteTime ? new Date(quoteTime).toLocaleTimeString("ru-RU") : "..."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(["All", "Forex", "Metals", "Crypto", "Indices", "Stocks"] as const).map(
                  (group) => (
                    <button
                      key={group}
                      onClick={() => setActiveGroup(group)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        activeGroup === group
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-200"
                      }`}
                    >
                      {group}
                    </button>
                  )
                )}
              </div>

              <div className="grid max-h-[260px] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {visibleSymbols.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => {
                      setSymbol(item.symbol);
                      setOpenPrice(defaultPrices[item.symbol] || "0");
                      setMessage("");
                    }}
                    className={`rounded-2xl border px-3 py-3 text-xs font-bold transition ${
                      symbol === item.symbol
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-emerald-100 bg-white text-slate-700 hover:bg-emerald-50 dark:border-emerald-400/10 dark:bg-slate-950/60 dark:text-emerald-50/80 dark:hover:bg-white/10"
                    }`}
                  >
                    {item.symbol}
                  </button>
                ))}
              </div>

              <div className="sticky top-3 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSide("BUY")}
                  className={`rounded-2xl px-4 py-3 text-sm font-black text-white transition ${
                    side === "BUY"
                      ? "bg-emerald-600"
                      : "bg-emerald-600/40 hover:bg-emerald-600/70"
                  }`}
                >
                  BUY
                </button>

                <button
                  onClick={() => setSide("SELL")}
                  className={`rounded-2xl px-4 py-3 text-sm font-black text-white transition ${
                    side === "SELL"
                      ? "bg-red-600"
                      : "bg-red-600/40 hover:bg-red-600/70"
                  }`}
                >
                  SELL
                </button>
              </div>

              <input
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className={inputClass}
                placeholder="Объём / Lot"
                type="number"
                step="0.01"
                min="0.01"
              />

              <input
                value={openPrice}
                onChange={(e) => setOpenPrice(e.target.value)}
                className={inputClass}
                placeholder="Цена открытия"
                type="number"
                step="0.0001"
              />

              <input
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className={inputClass}
                placeholder="Stop Loss"
                type="number"
                step="0.0001"
              />

              <input
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className={inputClass}
                placeholder="Take Profit"
                type="number"
                step="0.0001"
              />

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[90px] w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white"
                placeholder="Комментарий к сделке"
              />

              <button
                onClick={openTrade}
                className={`w-full rounded-2xl px-4 py-3.5 text-sm font-black text-white shadow-lg transition ${
                  side === "BUY"
                    ? "bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-500"
                    : "bg-red-600 shadow-red-900/20 hover:bg-red-500"
                }`}
              >
                Открыть {side}
              </button>

              {message && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-700 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-emerald-50/80">
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}