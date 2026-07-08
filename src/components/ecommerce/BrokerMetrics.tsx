"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { calculateTradeProfit } from "@/lib/market-instruments";

type Trade = {
  id: string;
  symbol: string;
  side: string;
  openPrice: number;
  volume: number;
  closePrice: number | null;
  profit: number | null;
  swap?: number | null;
};

type QuoteMap = Record<string, { price: number; tickValue?: number | null }>;
const DASHBOARD_REFRESH_MS = 5000;

export default function BrokerMetrics() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [equity, setEquity] = useState(0);
  const [available, setAvailable] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadQuote(symbol: string) {
    const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(symbol)}`);
    const data = await res.json();
    if (!res.ok) return null;
    return { price: Number(data.price), tickValue: data.settings?.tickValue ?? null };
  }

  async function loadDashboard() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    const [balanceRes, tradesRes] = await Promise.all([
      fetch(`/api/user/balance?userId=${userId}`, { cache: "no-store" }),
      fetch(`/api/trades?userId=${userId}`, { cache: "no-store" }),
    ]);

    if (!balanceRes.ok || !tradesRes.ok) {
      throw new Error("Dashboard load error");
    }

    const balanceData = await balanceRes.json();
    const trades: Trade[] = await tradesRes.json();
    const numericBalance = Number(balanceData.balance || 0);
    const open = trades.filter((trade) => trade.closePrice === null);
    const symbols = Array.from(new Set(open.map((trade) => trade.symbol)));

    const quoteEntries = await Promise.all(
      symbols.map(async (symbol) => [symbol, await loadQuote(symbol)] as const)
    );

    const quotes: QuoteMap = {};
    quoteEntries.forEach(([symbol, quote]) => {
      if (quote) quotes[symbol] = quote;
    });

    const floating = open.reduce((sum, trade) => {
      const quote = quotes[trade.symbol];
      const currentPrice = quote?.price || trade.openPrice;
      return sum + calculateTradeProfit(trade.symbol, trade.side, trade.openPrice, currentPrice, trade.volume, trade.swap ?? 0, quote?.tickValue);
    }, 0);

    setEmail(balanceData.email || "");
    setEquity(numericBalance + floating);
    setAvailable(numericBalance + floating);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard().catch(() => setLoading(false));
    const interval = setInterval(() => loadDashboard().catch(() => setLoading(false)), DASHBOARD_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.35fr]">
        <AccountCard label={t("clientEmail")} value={email || t("clientCabinet")} loading={loading} />
        <AccountCard label={t("funds")} value={`€${equity.toFixed(2)}`} loading={loading} />
        <AccountCard label={t("availableToWithdraw")} value={`€${available.toFixed(2)}`} loading={loading} />
        <TerminalCard openLabel={t("open")} terminalLabel={t("terminal")} />
      </div>
    </div>
  );
}

function TerminalCard({ openLabel, terminalLabel }: { openLabel: string; terminalLabel: string }) {
  return (
    <Link
      href="/terminal"
      className="group relative flex min-h-28 items-center justify-center overflow-hidden rounded-lg border border-emerald-300/20 bg-[#0b1d16]/80 p-4 text-center text-white shadow-[0_18px_55px_rgba(3,44,28,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-emerald-300/45 hover:bg-[#0c251b]/88 hover:shadow-[0_24px_70px_rgba(16,185,129,0.22)] focus:outline-none focus:ring-4 focus:ring-emerald-300/25 sm:min-h-32"
    >
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015)_42%,rgba(45,212,156,0.12))]" />
      <div className="absolute -right-7 top-0 h-full w-24 bg-emerald-300/18 blur-2xl transition group-hover:bg-emerald-300/28" />
      <div className="absolute inset-y-0 right-12 w-20 opacity-45 [background:repeating-linear-gradient(90deg,transparent_0_13px,rgba(52,211,153,0.2)_13px_16px)]" />
      <div className="absolute right-3 top-3 rounded-full border border-emerald-200/20 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-100 shadow-sm backdrop-blur transition group-hover:bg-white/10">
        {openLabel}
      </div>
      <div className="relative z-10 flex flex-col items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-full border border-emerald-200/20 bg-emerald-300/10 text-emerald-200 shadow-inner shadow-white/5 transition group-hover:scale-105 group-hover:bg-emerald-300/18 sm:size-11">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 18H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M7 15V9M12 15V5M17 15V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M6 11H8M11 8H13M16 13H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-200 drop-shadow-sm sm:text-base">{terminalLabel}</p>
      </div>
    </Link>
  );
}

function AccountCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="relative min-h-28 overflow-hidden rounded-lg border border-emerald-300/20 bg-[#0b1d16]/80 p-4 text-white shadow-[0_18px_55px_rgba(3,44,28,0.18)] backdrop-blur-xl sm:min-h-32">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015)_42%,rgba(45,212,156,0.12))]" />
      <div className="absolute -right-7 top-0 h-full w-24 bg-emerald-300/18 blur-2xl" />
      <div className="absolute inset-y-0 right-12 w-20 opacity-45 [background:repeating-linear-gradient(90deg,transparent_0_13px,rgba(52,211,153,0.2)_13px_16px)]" />
      <div className="relative flex h-full flex-col justify-center">
        <p className="break-words text-lg font-black leading-tight text-emerald-300 drop-shadow-[0_0_14px_rgba(52,211,153,0.25)] sm:text-xl">{loading ? "..." : value}</p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-50/55">{label}</p>
      </div>
    </div>
  );
}
