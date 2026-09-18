"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { calculateTradeProfit } from "@/lib/market-instruments";
import { clearClientAuthState } from "@/lib/client-auth";
import DashboardPanelIcon from "@/components/broker/DashboardPanelIcon";
import { DollarLineIcon, DownloadIcon, EnvelopeIcon, PieChartIcon } from "@/icons";
import type { ReactNode } from "react";

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
  const [error, setError] = useState("");
  const requestRunning = useRef(false);

  async function loadQuote(symbol: string) {
    const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(symbol)}`);
    const data = await res.json();
    if (!res.ok) return null;
    return { price: Number(data.price), tickValue: data.settings?.tickValue ?? null };
  }

  async function loadDashboard() {
    if (requestRunning.current) return;
    requestRunning.current = true;

    try {
      const [balanceRes, tradesRes] = await Promise.all([
        fetch("/api/user/balance", { cache: "no-store", credentials: "same-origin" }),
        fetch("/api/trades", { cache: "no-store", credentials: "same-origin" }),
      ]);

      if (balanceRes.status === 401 || tradesRes.status === 401) {
        clearClientAuthState();
        router.replace("/login?reason=session-expired");
        return;
      }
      if (!balanceRes.ok || !tradesRes.ok) {
        setError(t("dataTemporarilyUnavailable"));
        return;
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
      setError("");
    } finally {
      requestRunning.current = false;
    }
  }

  useEffect(() => {
    loadDashboard().catch(() => setError(t("dataTemporarilyUnavailable")));
    const interval = setInterval(() => loadDashboard().catch(() => setError(t("dataTemporarilyUnavailable"))), DASHBOARD_REFRESH_MS);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.35fr]">
        <AccountCard icon={<EnvelopeIcon />} label={t("clientEmail")} value={email || t("clientCabinet")} loading={loading} />
        <AccountCard icon={<DollarLineIcon />} label={t("funds")} value={`€${equity.toFixed(2)}`} loading={loading} />
        <AccountCard icon={<DownloadIcon />} label={t("availableToWithdraw")} value={`€${available.toFixed(2)}`} loading={loading} />
        <TerminalCard openLabel={t("open")} terminalLabel={t("terminal")} />
      </div>
    </div>
  );
}

function TerminalCard({ openLabel, terminalLabel }: { openLabel: string; terminalLabel: string }) {
  return (
    <Link
      href="/terminal"
      className="group relative flex min-h-32 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-center text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-300/30"
    >
      <div className="absolute right-4 top-4 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 transition group-hover:bg-emerald-100">
        {openLabel}
      </div>
      <div className="relative z-10 flex flex-col items-center gap-2">
        <DashboardPanelIcon><PieChartIcon /></DashboardPanelIcon>
        <p className="text-lg font-black tracking-wide text-slate-950">{terminalLabel}</p>
      </div>
    </Link>
  );
}

function AccountCard({ icon, label, value, loading }: { icon: ReactNode; label: string; value: string; loading: boolean }) {
  return (
    <div className="relative min-h-32 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
      <div className="relative flex h-full items-center gap-4">
        <DashboardPanelIcon>{icon}</DashboardPanelIcon>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">{label}</p>
          <p className="mt-2 break-words text-xl font-black leading-tight text-slate-950 sm:text-2xl">{loading ? "..." : value}</p>
        </div>
      </div>
    </div>
  );
}
