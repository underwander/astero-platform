"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type BalanceHistoryItem = {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string | null;
  createdAt: string;
};

export default function BalanceHistoryChart() {
  const [history, setHistory] = useState<BalanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadHistory() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    const res = await fetch(`/api/user/balance-history?userId=${userId}`);
    const data = await res.json();

    setHistory(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadHistory();

    const interval = setInterval(() => {
      loadHistory();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const chartData = history.map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString(),
    balance: Number(item.balance),
    type: item.type,
  }));

  const lastItem = history[history.length - 1];
  const firstItem = history[0];

  const latestBalance = lastItem ? Number(lastItem.balance) : 0;
  const totalChange =
    lastItem && firstItem
      ? Number(lastItem.balance) - Number(firstItem.balance)
      : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Equity Curve
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Balance growth history, updated every 30 seconds.
          </p>
        </div>

        {history.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Latest Balance
              </p>
              <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">
                ${latestBalance.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Change
              </p>
              <p
                className={`mt-1 text-lg font-bold ${
                  totalChange >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                ${totalChange.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-gray-500">No balance history yet</p>
      ) : (
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="py-3 text-left text-gray-500">Type</th>
                <th className="py-3 text-left text-gray-500">Description</th>
                <th className="py-3 text-left text-gray-500">Amount</th>
                <th className="py-3 text-left text-gray-500">Balance</th>
                <th className="py-3 text-left text-gray-500">Date</th>
              </tr>
            </thead>

            <tbody>
              {history
                .slice(-5)
                .reverse()
                .map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.type === "DEPOSIT"
                            ? "bg-green-100 text-green-700"
                            : item.type === "TRADE_PROFIT"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.type === "TRADE_LOSS"
                                ? "bg-red-100 text-red-700"
                                : item.type === "SET_BALANCE"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3 text-gray-700 dark:text-gray-300">
                      {item.description || "-"}
                    </td>

                    <td
                      className={`py-3 font-semibold ${
                        item.amount >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      ${item.amount.toFixed(2)}
                    </td>

                    <td className="py-3 text-gray-700 dark:text-gray-300">
                      ${item.balance.toFixed(2)}
                    </td>

                    <td className="py-3 text-gray-700 dark:text-gray-300">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}