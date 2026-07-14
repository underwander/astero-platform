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

    const res = await fetch(`/api/trades?userId=${userId}`, { cache: "no-store" });
    const data: Trade[] = await res.json();

    setTrades(Array.isArray(data) ? data.filter((trade) => trade.closePrice !== null) : []);
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
          История сделок
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Закрытые торговые операции текущего клиента.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <MetricCard title="Закрытые сделки" value={loading ? "..." : String(trades.length)} />
        <MetricCard title="Прибыльные" value={loading ? "..." : String(winningTrades)} positive />
        <MetricCard title="Убыточные" value={loading ? "..." : String(losingTrades)} negative />
        <MetricCard title="Итог" value={loading ? "..." : `€${totalProfit.toFixed(2)}`} positive={totalProfit >= 0} negative={totalProfit < 0} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-4 text-left text-gray-500">Символ</th>
                <th className="px-6 py-4 text-left text-gray-500">Тип</th>
                <th className="px-6 py-4 text-left text-gray-500">Объем</th>
                <th className="px-6 py-4 text-left text-gray-500">Открытие</th>
                <th className="px-6 py-4 text-left text-gray-500">Закрытие</th>
                <th className="px-6 py-4 text-left text-gray-500">Прибыль</th>
                <th className="px-6 py-4 text-left text-gray-500">Результат</th>
                <th className="px-6 py-4 text-left text-gray-500">Дата</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan={8}>
                    Загрузка...
                  </td>
                </tr>
              )}

              {!loading && trades.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan={8}>
                    Закрытых сделок пока нет
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
                        €{profit.toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            profit >= 0
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {profit >= 0 ? "Прибыль" : "Убыток"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {new Date(trade.createdAt).toLocaleString("ru-RU")}
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

function MetricCard({ title, value, positive, negative }: { title: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="text-sm text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      <p className={`mt-2 text-3xl font-bold ${positive ? "text-green-500" : negative ? "text-red-500" : "text-gray-800 dark:text-white/90"}`}>
        {value}
      </p>
    </div>
  );
}
