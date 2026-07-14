"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

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
  const { language } = useLanguage();
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

  const ru = language === "ru";

  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-200/45 bg-white/76 shadow-xl shadow-emerald-950/[0.05] ring-1 ring-white/70 backdrop-blur-2xl dark:border-emerald-300/12 dark:bg-white/[0.055] dark:ring-white/8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/70 px-5 py-4 dark:border-white/10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700/62 dark:text-emerald-200/58">
            {ru ? "Финансы" : "Finance"}
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
            {ru ? "История операций" : "Operation History"}
          </h2>
        </div>
        <span className="rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-[11px] font-black text-emerald-700 dark:border-emerald-300/15 dark:bg-emerald-400/10 dark:text-emerald-200">
          {ru ? "EUR счет" : "EUR account"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-xs">
          <thead>
            <tr className="border-b border-emerald-100/70 bg-emerald-50/35 text-left uppercase tracking-[0.08em] text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-emerald-100/48">
              <th className="px-5 py-3">{ru ? "Дата" : "Date"}</th>
              <th className="px-5 py-3">{ru ? "Операция" : "Operation"}</th>
              <th className="px-5 py-3">{ru ? "Сумма" : "Amount"}</th>
              <th className="px-5 py-3">{ru ? "Баланс" : "Balance"}</th>
              <th className="px-5 py-3">{ru ? "Статус" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(-6).reverse().map((item) => (
              <tr key={item.id} className="border-b border-emerald-100/55 text-slate-700 last:border-0 dark:border-white/8 dark:text-slate-300">
                <td className="px-5 py-4">{new Date(item.createdAt).toLocaleString(ru ? "ru-RU" : "en-US")}</td>
                <td className="px-5 py-4 font-bold text-slate-950 dark:text-white">{historyTypeLabel(item.type, language)}</td>
                <td className={`px-5 py-4 font-black ${Number(item.amount) >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-red-500"}`}>
                  {Number(item.amount).toFixed(2)} EUR
                </td>
                <td className="px-5 py-4 font-bold">{Number(item.balance).toFixed(2)} EUR</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                    {ru ? "Обработано" : "Processed"}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && history.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  {ru ? "Пополнений и снятий пока нет" : "No deposits or withdrawals yet"}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  {ru ? "Загрузка..." : "Loading..."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function historyTypeLabel(type: string, language: "ru" | "en") {
  if (type === "DEPOSIT") return language === "ru" ? "Пополнение счета" : "Account deposit";
  if (type === "WITHDRAWAL") return language === "ru" ? "Снятие средств" : "Withdrawal";
  return type;
}
