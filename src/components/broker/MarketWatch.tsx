"use client";

import { useEffect, useState } from "react";

export type MarketSymbol = {
  symbol: string;
  group: "Forex" | "Metals" | "Crypto" | "Indices" | "Stocks";
};

type Quote = {
  symbol: string;
  price: number;
  change?: string;
  source?: string;
};

export const marketSymbols: MarketSymbol[] = [
  { symbol: "EUR/USD", group: "Forex" },
  { symbol: "GBP/USD", group: "Forex" },
  { symbol: "USD/JPY", group: "Forex" },
  { symbol: "AUD/USD", group: "Forex" },
  { symbol: "USD/CAD", group: "Forex" },
  { symbol: "USD/CHF", group: "Forex" },
  { symbol: "NZD/USD", group: "Forex" },
  { symbol: "EUR/GBP", group: "Forex" },
  { symbol: "EUR/JPY", group: "Forex" },
  { symbol: "XAU/USD", group: "Metals" },
  { symbol: "XAG/USD", group: "Metals" },
  { symbol: "BTC/USD", group: "Crypto" },
  { symbol: "ETH/USD", group: "Crypto" },
  { symbol: "SOL/USD", group: "Crypto" },
  { symbol: "US100", group: "Indices" },
  { symbol: "SPX500", group: "Indices" },
  { symbol: "US30", group: "Indices" },
  { symbol: "AAPL", group: "Stocks" },
  { symbol: "TSLA", group: "Stocks" },
  { symbol: "NVDA", group: "Stocks" },
];

export default function MarketWatch() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeGroup, setActiveGroup] = useState<MarketSymbol["group"] | "All">("All");

  const visibleSymbols = marketSymbols.filter(
    (item) => activeGroup === "All" || item.group === activeGroup
  );

  async function loadQuotes() {
    const results = await Promise.all(
      visibleSymbols.slice(0, 12).map(async ({ symbol }) => {
        try {
          const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(symbol)}`);
          const data = await res.json();
          if (!res.ok) return null;
          return { symbol, price: Number(data.price), change: data.change, source: data.source };
        } catch {
          return null;
        }
      })
    );

    setQuotes(results.filter(Boolean) as Quote[]);
  }

  useEffect(() => {
    loadQuotes();
    const interval = setInterval(loadQuotes, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup]);

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Market Watch</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-emerald-50/55">
            Forex, metals, crypto, indices and stocks with manual override support.
          </p>
        </div>
        <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          30s refresh
        </span>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["All", "Forex", "Metals", "Crypto", "Indices", "Stocks"] as const).map((group) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              activeGroup === group
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-200 dark:hover:bg-white/10"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleSymbols.slice(0, 12).map(({ symbol, group }) => {
          const quote = quotes.find((item) => item.symbol === symbol);
          const change = Number(quote?.change || 0);

          return (
            <div key={symbol} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-400/10 dark:bg-slate-950/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{symbol}</p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-emerald-50/45">{group}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${change >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>
                  {quote ? `${change.toFixed(2)}%` : "..."}
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {quote ? quote.price.toLocaleString(undefined, { maximumFractionDigits: 5 }) : "..."}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-emerald-50/45">Source: {quote?.source || "loading"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
