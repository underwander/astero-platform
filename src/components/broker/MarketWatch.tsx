"use client";

import { useEffect, useState } from "react";
import { formatPrice, marketGroups, marketInstruments, type MarketGroup } from "@/lib/market-instruments";

export type MarketSymbol = {
  symbol: string;
  group: MarketGroup;
};

type Quote = {
  symbol: string;
  price: number;
  change?: string;
  source?: string;
};

export const marketSymbols: MarketSymbol[] = marketInstruments.map(({ symbol, group }) => ({ symbol, group }));

export default function MarketWatch({ compact = false }: { compact?: boolean }) {
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Котировки</h2>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
          Обновление 30 сек.
        </span>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {marketGroups.map((group) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              activeGroup === group
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      <div className={compact ? "grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6" : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
        {visibleSymbols.slice(0, 12).map(({ symbol, group }) => {
          const quote = quotes.find((item) => item.symbol === symbol);
          const change = Number(quote?.change || 0);

          return (
            <div key={symbol} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{symbol}</p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-emerald-50/45">{group}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${change >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>
                  {quote ? `${change.toFixed(2)}%` : "..."}
                </span>
              </div>
              <p className={compact ? "mt-2 text-lg font-black text-slate-900 dark:text-white" : "mt-3 text-2xl font-black text-slate-900 dark:text-white"}>
                {quote ? formatPrice(symbol, quote.price) : "..."}
              </p>
              {!compact && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Источник: {quote?.source || "загрузка"}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
