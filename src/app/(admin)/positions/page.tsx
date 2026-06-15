"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateTradeProfit, formatPrice } from "@/lib/market-instruments";

type Trade = {
  id: string;
  symbol: string;
  side: string;
  openPrice: number;
  volume: number;
  closePrice: number | null;
  profit: number | null;
  swap?: number | null;
  createdAt: string;
};

type QuoteMap = Record<string, number>;

export default function OpenPositionsPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [positions, setPositions] = useState<Trade[]>([]);
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [loading, setLoading] = useState(true);

  function getCurrentPrice(position: Trade) {
    return quotes[position.symbol] || position.openPrice;
  }

  function calculateFloatingProfit(position: Trade) {
    const price = getCurrentPrice(position);

    if (!price || Number.isNaN(price)) {
      return 0;
    }

    return calculateTradeProfit(
      position.symbol,
      position.side,
      position.openPrice,
      price,
      position.volume,
      position.swap || 0
    );
  }

  async function loadQuote(symbol: string) {
    const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(symbol)}`);
    const data = await res.json();

    if (!res.ok) {
      return;
    }

    setQuotes((prev) => ({
      ...prev,
      [symbol]: Number(data.price),
    }));
  }

  async function loadAllQuotes(currentPositions: Trade[]) {
    const symbols = Array.from(
      new Set(currentPositions.map((position) => position.symbol))
    );

    await Promise.all(symbols.map((symbol) => loadQuote(symbol)));
  }

  async function loadPositions(currentUserId: string) {
    setLoading(true);

    const res = await fetch(`/api/trades?userId=${currentUserId}`);
    const data: Trade[] = await res.json();

    const openPositions = data.filter((trade) => trade.closePrice === null);

    setPositions(openPositions);
    await loadAllQuotes(openPositions);

    setLoading(false);
  }

  async function closeTrade(position: Trade) {
    if (!userId) {
      router.push("/login");
      return;
    }

    const currentPrice = getCurrentPrice(position);

    const res = await fetch("/api/trade/close", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tradeId: position.id,
        closePrice: Number(currentPrice),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Close trade error");
      return;
    }

    alert(`Trade closed. Profit: ${Number(data.trade.profit).toFixed(2)}`);
    await loadPositions(userId);
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    setUserId(storedUserId);
    loadPositions(storedUserId);
  }, [router]);

  useEffect(() => {
    if (positions.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      loadAllQuotes(positions);
    }, 3000);

    return () => clearInterval(interval);
  }, [positions]);

  const totalFloatingProfit = positions.reduce(
    (sum, position) => sum + calculateFloatingProfit(position),
    0
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Open Positions
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Live Quotes
          </h3>
          <p className="mt-2 text-3xl font-bold text-green-500">
            Active
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Open Positions
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "..." : positions.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Floating P/L
          </h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              totalFloatingProfit >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            ${totalFloatingProfit.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-4 text-left text-gray-500">ID</th>
                <th className="px-6 py-4 text-left text-gray-500">Symbol</th>
                <th className="px-6 py-4 text-left text-gray-500">Type</th>
                <th className="px-6 py-4 text-left text-gray-500">Volume</th>
                <th className="px-6 py-4 text-left text-gray-500">
                  Open Price
                </th>
                <th className="px-6 py-4 text-left text-gray-500">
                  Live Price
                </th>
                <th className="px-6 py-4 text-left text-gray-500">
                  Floating P/L
                </th>
                <th className="px-6 py-4 text-left text-gray-500">
                  Opened At
                </th>
                <th className="px-6 py-4 text-left text-gray-500">Status</th>
                <th className="px-6 py-4 text-left text-gray-500">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan={10}>
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && positions.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan={10}>
                    No open positions
                  </td>
                </tr>
              )}

              {!loading &&
                positions.map((position) => {
                  const currentPrice = getCurrentPrice(position);
                  const floatingProfit = calculateFloatingProfit(position);

                  return (
                    <tr
                      key={position.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {position.id}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">
                        {position.symbol}
                      </td>

                      <td
                        className={`px-6 py-4 font-semibold ${
                          position.side === "BUY"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {position.side}
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {position.volume}
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {formatPrice(position.symbol, position.openPrice)}
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white/90">
                        {formatPrice(position.symbol, currentPrice)}
                      </td>

                      <td
                        className={`px-6 py-4 font-semibold ${
                          floatingProfit >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        ${floatingProfit.toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {new Date(position.createdAt).toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                          Open
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => closeTrade(position)}
                          className="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600"
                        >
                          Close Trade
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
