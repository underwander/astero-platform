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

export default function BrokerMetrics() {
  const [balance, setBalance] = useState(0);
  const [email, setEmail] = useState("");
  const [equity, setEquity] = useState(0);
  const [floatingProfit, setFloatingProfit] = useState(0);
  const [available, setAvailable] = useState(0);
  const [openTrades, setOpenTrades] = useState(0);
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

    setBalance(numericBalance);
    setEmail(balanceData.email || "");
    setFloatingProfit(floating);
    setEquity(numericBalance + floating);
    setAvailable(numericBalance + floating);
    setOpenTrades(open.length);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard().catch(() => setLoading(false));
    const interval = setInterval(() => loadDashboard().catch(() => setLoading(false)), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
        <AccountCard label="Счёт" value={email || "Клиент"} sub="Account ID" loading={loading} />
        <AccountCard label="Equity" value={`€${equity.toFixed(2)}`} sub="Средства" loading={loading} />
        <AccountCard label="Доступно" value={`€${available.toFixed(2)}`} sub={`${openTrades} открытых позиций`} loading={loading} />
        <Link
          href="/terminal"
          className="flex min-h-28 items-center justify-center rounded-xl border border-slate-700/40 bg-gradient-to-br from-[#1c2b5d] to-[#10214a] p-5 text-center text-white shadow-sm transition hover:brightness-110"
        >
          <div>
            <p className="text-sm font-black">Trading Terminal</p>
            <p className="mt-1 text-xs text-white/60">Открыть терминал</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SmallAccountCard label="Прибыль / убыток" value={`€${floatingProfit.toFixed(2)}`} positive={floatingProfit >= 0} loading={loading} />
        <SmallAccountCard label="Бонусы" value="€0.00" loading={loading} />
        <SmallAccountCard label="Кредитное плечо" value="1:100" loading={loading} />
      </div>

      <div className="rounded-xl border border-blue-300/20 bg-[#14275b] p-4 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black">Быстрые депозиты временно недоступны</p>
            <p className="mt-1 text-xs text-white/65">Заполните профиль и пройдите верификацию, чтобы открыть все функции кабинета.</p>
          </div>
          <Link href="/profile" className="rounded-lg border border-white/20 px-4 py-2 text-xs font-black text-white hover:bg-white/10">
            Перейти в профиль
          </Link>
        </div>
      </div>
    </div>
  );
}

function AccountCard({ label, value, sub, loading }: { label: string; value: string; sub: string; loading: boolean }) {
  return (
    <div className="rounded-xl border border-slate-700/30 bg-[#1b2d62] p-4 text-white shadow-sm">
      <p className="text-xs font-bold uppercase text-white/45">{label}</p>
      <p className="mt-3 truncate text-xl font-black">{loading ? "..." : value}</p>
      <p className="mt-1 text-xs text-white/55">{sub}</p>
    </div>
  );
}

function SmallAccountCard({ label, value, loading, positive = true }: { label: string; value: string; loading: boolean; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-black ${positive ? "text-emerald-600" : "text-red-500"}`}>{loading ? "..." : value}</p>
    </div>
  );
}
