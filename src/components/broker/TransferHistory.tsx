"use client";

import { useEffect, useState } from "react";

type BalanceHistoryItem = {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string | null;
  createdAt: string;
};

const visibleTypes = new Set(["DEPOSIT", "WITHDRAWAL"]);

export default function TransferHistory() {
  const [history, setHistory] = useState<BalanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadHistory() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const res = await fetch(`/api/user/balance-history?userId=${userId}`, { cache: "no-store" });
    const data = await res.json();
    const items = Array.isArray(data) ? data.filter((item: BalanceHistoryItem) => visibleTypes.has(item.type)) : [];
    setHistory(items);
    setLoading(false);
  }

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-black text-slate-950 dark:text-white">История операций</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-left uppercase text-slate-400 dark:border-white/10">
              <th className="px-3 py-2">Дата</th>
              <th className="px-3 py-2">Операция</th>
              <th className="px-3 py-2">Сумма</th>
              <th className="px-3 py-2">Баланс</th>
              <th className="px-3 py-2">Статус</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(-6).reverse().map((item) => (
              <tr key={item.id} className="border-b border-slate-100 text-slate-700 dark:border-white/10 dark:text-slate-300">
                <td className="px-3 py-3">{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
                <td className="px-3 py-3">{historyTypeLabel(item.type)}</td>
                <td className={`px-3 py-3 font-black ${Number(item.amount) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {Number(item.amount).toFixed(2)} EUR
                </td>
                <td className="px-3 py-3 font-bold">{Number(item.balance).toFixed(2)} EUR</td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">Обработано</span>
                </td>
              </tr>
            ))}
            {!loading && history.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">Пополнений и снятий пока нет</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">Загрузка...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function historyTypeLabel(type: string) {
  if (type === "DEPOSIT") return "Пополнение счета";
  if (type === "WITHDRAWAL") return "Снятие средств";
  return type;
}
