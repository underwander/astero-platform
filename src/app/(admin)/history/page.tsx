"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Trade = {
  id: string;
  symbol: string;
  side: string;
  openPrice: number;
  volume: number;
  closePrice: number | null;
  profit: number | null;
  createdAt: string;
};

export default function TradeHistoryPage() {
  const router = useRouter();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadHistory(userId: string) {
    setLoading(true);

    const res = await fetch(`/api/trades?userId=${userId}`);
    const data: Trade[] = await res.json();

    setTrades(data.filter((trade) => trade.closePrice !== null));
    setLoading(false);
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    loadHistory(storedUserId);
  }, [router]);

  const totalProfit = trades.reduce(
    (sum, trade) => sum + Number(trade.profit || 0),
    0
  );

  const winningTrades = trades.filter((trade) => Number(trade.profit) > 0).length;
  const losingTrades = trades.filter((trade) => Number(trade.profit) < 0).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Trade History
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Реальная история закрытых сделок текущего клиента.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Closed Trades
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "..." : trades.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Winning Trades
          </h3>
          <p className="mt-2 text-3xl font-bold text-green-500">
            {loading ? "..." : winningTrades}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Losing Trades
          </h3>
          <p className="mt-2 text-3xl font-bold text-red-500">
            {loading ? "..." : losingTrades}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">
            Total Profit
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

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-4 text-left text-gray-500">ID</th>
                <th className="px-6 py-4 text-left text-gray-500">Symbol</th>
                <th className="px-6 py-4 text-left text-gray-500">Type</th>
                <th className="px-6 py-4 text-left text-gray-500">Volume</th>
                <th className="px-6 py-4 text-left text-gray-500">Open</th>
                <th className="px-6 py-4 text-left text-gray-500">Close</th>
                <th className="px-6 py-4 text-left text-gray-500">Profit</th>
                <th className="px-6 py-4 text-left text-gray-500">Result</th>
                <th className="px-6 py-4 text-left text-gray-500">Date</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan={9}>
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && trades.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan={9}>
                    No closed trades
                  </td>
                </tr>
              )}

              {!loading &&
                trades.map((trade) => {
                  const profit = Number(trade.profit || 0);

                  return (
                    <tr
                      key={trade.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {trade.id}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">
                        {trade.symbol}
                      </td>

                      <td
                        className={`px-6 py-4 font-semibold ${
                          trade.side === "BUY"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {trade.side}
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {trade.volume}
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {trade.openPrice}
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {trade.closePrice}
                      </td>

                      <td
                        className={`px-6 py-4 font-semibold ${
                          profit >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        ${profit.toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            profit >= 0
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {profit >= 0 ? "WIN" : "LOSS"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {new Date(trade.createdAt).toLocaleString()}
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