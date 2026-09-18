"use client";

import { useEffect, useState } from "react";
import { formatPrice, getInstrument, marketGroups, marketInstruments, type MarketGroup } from "@/lib/market-instruments";
import { useLanguage } from "@/context/LanguageContext";

export type MarketSymbol = {
  symbol: string;
  group: MarketGroup;
};

type Quote = {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  change?: string;
  changeValue?: number;
  time?: string;
  source?: string;
};

export const marketSymbols: MarketSymbol[] = marketInstruments.map(({ symbol, group }) => ({ symbol, group }));
const MARKET_WATCH_REFRESH_MS = 5000;

export default function MarketWatch({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeGroup, setActiveGroup] = useState<MarketSymbol["group"] | "All">("All");

  const visibleSymbols = marketSymbols.filter(
    (item) => activeGroup === "All" || item.group === activeGroup
  );

  async function loadQuotes() {
    const results = await Promise.all(
      visibleSymbols.slice(0, 12).map(async ({ symbol }) => {
        try {
          const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
          const data = await res.json();
          if (!res.ok) return null;

          return {
            symbol,
            price: Number(data.price),
            bid: Number(data.bid ?? data.price),
            ask: Number(data.ask ?? data.price),
            change: data.change,
            changeValue: Number(data.changeValue || 0),
            time: data.time,
            source: data.source,
          };
        } catch {
          return null;
        }
      })
    );

    setQuotes(results.filter(Boolean) as Quote[]);
  }

  useEffect(() => {
    loadQuotes();
    const interval = setInterval(loadQuotes, MARKET_WATCH_REFRESH_MS);
    return () => clearInterval(interval);
  }, [activeGroup]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{language === "ru" ? "Котировки" : "Quotes"}</h2>
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
            {group === "All" ? (language === "ru" ? "Все" : "All") : group}
          </button>
        ))}
      </div>

      <div className={compact ? "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
        {visibleSymbols.slice(0, 12).map(({ symbol, group }) => {
          const quote = quotes.find((item) => item.symbol === symbol);
          const instrument = getInstrument(symbol);
          const change = Number(quote?.change || 0);
          const changeValue = Number(quote?.changeValue || 0);
          const bid = quote?.bid ?? quote?.price ?? instrument.defaultPrice;
          const ask = quote?.ask ?? bid + instrument.pointSize * 14;
          const sourceLabel = quote?.source === "live" ? "Live" : quote?.source === "manual" ? "CRM" : (language === "ru" ? "Рынок" : "Market");
          const timeLabel = quote?.time ? new Date(quote.time).toLocaleTimeString(language === "ru" ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit" }) : "";
          const isPositive = change >= 0;

          return (
            <div key={symbol} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{symbol}</p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-emerald-50/45">{group}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${isPositive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>
                  {quote ? `${isPositive ? "+" : ""}${change.toFixed(2)}%` : "..."}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-slate-50 px-2 py-1.5 dark:bg-white/5">
                  <p className="text-[10px] font-black uppercase text-slate-400">Bid</p>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{quote ? formatPrice(symbol, bid) : "..."}</p>
                </div>
                <div className="rounded-md bg-slate-50 px-2 py-1.5 dark:bg-white/5">
                  <p className="text-[10px] font-black uppercase text-slate-400">Ask</p>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{quote ? formatPrice(symbol, ask) : "..."}</p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold">
                <span className={changeValue >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-red-500 dark:text-red-300"}>
                  {quote ? `${changeValue >= 0 ? "+" : ""}${formatPrice(symbol, changeValue)}` : "..."}
                </span>
                <span className="text-slate-400">{sourceLabel}{timeLabel ? ` · ${timeLabel}` : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
