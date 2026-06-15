"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

type QuoteMap = Record<string, number>;
const DASHBOARD_REFRESH_MS = 5000;

export default function BrokerMetrics() {
  const [email, setEmail] = useState("");
  const [equity, setEquity] = useState(0);
  const [available, setAvailable] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadQuote(symbol: string) {
    const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(symbol)}`);
    const data = await res.json();
    if (!res.ok) return null;
    return Number(data.price);
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
    quoteEntries.forEach(([symbol, price]) => {
      if (price) quotes[symbol] = price;
    });

    const floating = open.reduce((sum, trade) => {
      const currentPrice = quotes[trade.symbol] || trade.openPrice;
      return sum + calculateTradeProfit(trade.symbol, trade.side, trade.openPrice, currentPrice, trade.volume, trade.swap ?? 0);
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
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
        <AccountCard label="Счет" value={email || "Клиент"} loading={loading} />
        <AccountCard label="Капитал" value={`€${equity.toFixed(2)}`} loading={loading} />
        <AccountCard label="Доступно для вывода средств" value={`€${available.toFixed(2)}`} loading={loading} />
        <TerminalCard />
      </div>
    </div>
  );
}

function TerminalCard() {
  return (
    <Link
      href="/terminal"
      className="group relative flex min-h-32 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/25 bg-gradient-to-br from-[#07130d] via-[#0d2f22] to-[#10b981] p-5 text-center text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:border-white/45 hover:shadow-xl hover:shadow-emerald-950/25"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(16,185,129,0.14)_42%,rgba(0,0,0,0.28))]" />
      <div className="relative z-10 flex items-center gap-3">
        <p className="text-lg font-black tracking-wide text-white drop-shadow-sm">Торговый терминал</p>
      </div>
    </Link>
  );
}

function AccountCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="relative min-h-32 overflow-hidden rounded-xl border border-emerald-200/25 bg-gradient-to-br from-[#0f5132] via-[#15803d] to-[#37c871] p-4 text-white shadow-lg shadow-emerald-950/15">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_42%,rgba(0,0,0,0.18))]" />
      <div className="relative flex h-full flex-col justify-between">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-white/85 drop-shadow-sm">{label}</p>
        <p className="mt-5 truncate text-2xl font-black text-white drop-shadow-sm">{loading ? "..." : value}</p>
      </div>
    </div>
  );
}
