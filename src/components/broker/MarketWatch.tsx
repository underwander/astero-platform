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
  const ru = language === "ru";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup]);

  return (
    <section className="rounded-[28px] border border-emerald-200/45 bg-white/76 p-4 shadow-xl shadow-emerald-950/[0.05] ring-1 ring-white/70 backdrop-blur-2xl dark:border-emerald-300/12 dark:bg-white/[0.055] dark:ring-white/8 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700/70 dark:text-emerald-200/58">
            {ru ? "Рынки" : "Markets"}
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
            {ru ? "Котировки" : "Quotes"}
          </h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {marketGroups.map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${
                activeGroup === group
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15 dark:bg-emerald-400 dark:text-slate-950"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/6 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              {group === "All" ? (ru ? "Все" : "All") : group}
            </button>
          ))}
        </div>
      </div>

      <div className={compact ? "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-2" : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
        {visibleSymbols.slice(0, 12).map(({ symbol, group }) => {
          const quote = quotes.find((item) => item.symbol === symbol);
          const instrument = getInstrument(symbol);
          const change = Number(quote?.change || 0);
          const changeValue = Number(quote?.changeValue || 0);
          const bid = quote?.bid ?? quote?.price ?? instrument.defaultPrice;
          const ask = quote?.ask ?? bid + instrument.pointSize * 14;
          const sourceLabel = quote?.source === "live" ? "Live" : quote?.source === "manual" ? "CRM" : (ru ? "Рынок" : "Market");
          const timeLabel = quote?.time ? new Date(quote.time).toLocaleTimeString(ru ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit" }) : "";
          const isPositive = change >= 0;

          return (
            <div key={symbol} className="group rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-white/92 to-emerald-50/45 p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-950/[0.06] dark:border-white/10 dark:from-slate-950/72 dark:to-white/[0.03]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{symbol}</p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-emerald-50/45">{group}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${isPositive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>
                  {quote ? `${isPositive ? "+" : ""}${change.toFixed(2)}%` : "..."}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <QuoteCell label="Bid" value={quote ? formatPrice(symbol, bid) : "..."} />
                <QuoteCell label="Ask" value={quote ? formatPrice(symbol, ask) : "..."} />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-bold">
                <span className={changeValue >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-red-500 dark:text-red-300"}>
                  {quote ? `${changeValue >= 0 ? "+" : ""}${formatPrice(symbol, changeValue)}` : "..."}
                </span>
                <span className="text-slate-400">{sourceLabel}{timeLabel ? ` · ${timeLabel}` : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function QuoteCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-100/70 bg-white/82 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
