"use client";

import { useEffect, useState } from "react";

type Trade = {
  id: string;
  symbol: string;
  side: string;
  openPrice: number;
  volume: number;
  closePrice: number | null;
  profit: number | null;
};

type QuoteMap = Record<string, number>;

export default function BrokerMetrics() {
  const [balance, setBalance] = useState(0);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [openTrades, setOpenTrades] = useState(0);
  const [closedTrades, setClosedTrades] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [floatingProfit, setFloatingProfit] = useState(0);
  const [margin, setMargin] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadQuote(symbol: string) {
    const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(symbol)}`);
    const data = await res.json();

    if (!res.ok) {
      return null;
    }

    return Number(data.price);
  }

  async function loadDashboard(isInitialLoad = false) {
    if (isInitialLoad) {
      setLoading(true);
    }

    const userId = localStorage.getItem("userId");
    const storedRole = localStorage.getItem("role");

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    setRole(storedRole || "CLIENT");

    const balanceRes = await fetch(`/api/user/balance?userId=${userId}`);

    if (!balanceRes.ok) {
      throw new Error("Balance API error");
    }

    const balanceData = await balanceRes.json();
    const numericBalance = Number(balanceData.balance);

    setBalance(numericBalance);
    setEmail(balanceData.email);

    const tradesRes = await fetch(`/api/trades?userId=${userId}`);

    if (!tradesRes.ok) {
      throw new Error("Trades API error");
    }

    const trades: Trade[] = await tradesRes.json();

    const open = trades.filter((trade) => trade.closePrice === null);
    const closed = trades.filter((trade) => trade.closePrice !== null);

    const profit = closed.reduce(
      (sum, trade) => sum + Number(trade.profit || 0),
      0
    );

    const volume = trades.reduce(
      (sum, trade) => sum + Number(trade.volume || 0),
      0
    );

    const symbols = Array.from(new Set(open.map((trade) => trade.symbol)));

    const quoteEntries = await Promise.all(
      symbols.map(async (symbol) => {
        const price = await loadQuote(symbol);
        return [symbol, price] as const;
      })
    );

    const quotes: QuoteMap = {};

    quoteEntries.forEach(([symbol, price]) => {
      if (price) {
        quotes[symbol] = price;
      }
    });

    const floating = open.reduce((sum, trade) => {
      const currentPrice = quotes[trade.symbol] || trade.openPrice;

      if (trade.side === "BUY") {
        return (
          sum +
          (currentPrice - trade.openPrice) *
            10000 *
            Number(trade.volume)
        );
      }

      return (
        sum +
        (trade.openPrice - currentPrice) *
          10000 *
          Number(trade.volume)
      );
    }, 0);

    const usedMargin = open.reduce((sum, trade) => {
      return sum + Number(trade.openPrice) * Number(trade.volume) * 100;
    }, 0);

    setOpenTrades(open.length);
    setClosedTrades(closed.length);
    setTotalProfit(profit);
    setTotalVolume(volume);
    setFloatingProfit(floating);
    setMargin(usedMargin);
    setLastUpdate(new Date().toLocaleTimeString());
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard(true).catch(() => {
      setLoading(false);
      setEmail("Could not load data");
    });

    const interval = setInterval(() => {
      loadDashboard(false).catch(() => {
        setLoading(false);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const equity = balance + floatingProfit;
  const freeMargin = equity - margin;
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Real Equity updates every 30 seconds
          {lastUpdate ? ` • Last update: ${lastUpdate}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Balance</h3>
          <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "..." : `$${balance.toFixed(2)}`}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Equity</h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              equity >= balance ? "text-green-500" : "text-red-500"
            }`}
          >
            {loading ? "..." : `$${equity.toFixed(2)}`}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Margin</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-500">
            {loading ? "..." : `$${margin.toFixed(2)}`}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Free Margin
          </h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              freeMargin >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {loading ? "..." : `$${freeMargin.toFixed(2)}`}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Floating P/L
          </h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              floatingProfit >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {loading ? "..." : `$${floatingProfit.toFixed(2)}`}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Margin Level
          </h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              marginLevel >= 100 || margin === 0
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {loading ? "..." : margin === 0 ? "∞" : `${marginLevel.toFixed(2)}%`}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Client</h3>
          <p className="mt-2 truncate text-sm font-semibold text-gray-800 dark:text-white/90">
            {email}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Role: {role}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Trades</h3>
          <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "..." : `${openTrades}/${closedTrades}`}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Open / Closed
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Total Volume
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "..." : totalVolume.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Closed Profit
          </h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              totalProfit >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {loading ? "..." : `$${totalProfit.toFixed(2)}`}
          </p>
        </div>
      </div>
    </div>
  );
}