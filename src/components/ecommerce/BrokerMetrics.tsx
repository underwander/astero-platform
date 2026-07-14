"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      router.push("/login");
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
  }, [router]);

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.35fr]">
      <AccountCard label={t("clientEmail")} value={email || t("clientCabinet")} loading={loading} tone="identity" />
      <AccountCard label={t("funds")} value={`€${equity.toFixed(2)}`} loading={loading} tone="equity" />
      <AccountCard label={t("availableToWithdraw")} value={`€${available.toFixed(2)}`} loading={loading} tone="available" />
      <TerminalCard openLabel={t("open")} terminalLabel={t("terminal")} />
    </section>
  );
}

function TerminalCard({ openLabel, terminalLabel }: { openLabel: string; terminalLabel: string }) {
  return (
    <Link
      href="/terminal"
      className="group relative flex min-h-[136px] items-center justify-center overflow-hidden rounded-[28px] border border-emerald-200/35 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.34),transparent_26%),linear-gradient(135deg,#31c975,#0f8a52_56%,#08633c)] p-5 text-center text-white shadow-xl shadow-emerald-950/15 ring-1 ring-white/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-950/20 focus:outline-none focus:ring-4 focus:ring-emerald-300/40 dark:border-emerald-300/20 dark:ring-white/10"
    >
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.28),transparent_35%,rgba(0,0,0,0.18))]" />
      <div className="absolute left-5 top-5 rounded-full border border-white/25 bg-white/18 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/92 backdrop-blur-md">
        {openLabel}
      </div>
      <div className="absolute -right-10 -top-12 size-32 rounded-full bg-white/18 blur-2xl transition group-hover:bg-white/24" />
      <div className="absolute bottom-4 left-6 right-6 h-px bg-white/25" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-2xl border border-white/25 bg-white/18 shadow-inner shadow-white/10 backdrop-blur-md transition group-hover:scale-105 group-hover:bg-white/25">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 18H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M7 15V9M12 15V5M17 15V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M6 11H8M11 8H13M16 13H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <p className="text-xl font-black tracking-wide text-white drop-shadow-sm">{terminalLabel}</p>
      </div>
    </Link>
  );
}

function AccountCard({ label, value, loading, tone }: { label: string; value: string; loading: boolean; tone: "identity" | "equity" | "available" }) {
  const glow = {
    identity: "from-emerald-400/24 via-white/10 to-lime-300/18",
    equity: "from-lime-300/26 via-white/10 to-emerald-500/20",
    available: "from-teal-300/24 via-white/10 to-emerald-400/20",
  }[tone];

  return (
    <div className="relative min-h-[136px] overflow-hidden rounded-[28px] border border-emerald-200/40 bg-white/68 p-5 shadow-xl shadow-emerald-950/[0.06] ring-1 ring-white/70 backdrop-blur-2xl dark:border-emerald-300/12 dark:bg-white/[0.055] dark:shadow-black/20 dark:ring-white/8">
      <div className={`absolute inset-0 bg-gradient-to-br ${glow}`} />
      <div className="absolute -right-8 -top-10 size-28 rounded-full bg-emerald-300/22 blur-2xl" />
      <div className="relative flex h-full flex-col justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800/70 dark:text-emerald-100/62">{label}</p>
        <p className="mt-6 break-words text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-[28px]">
          {loading ? "..." : value}
        </p>
      </div>
    </div>
  );
}
