"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function ProfitCalculator() {
  const { language } = useLanguage();
  const [amount, setAmount] = useState("1000");
  const base = Math.max(0, Number(amount) || 0);
  const monthlyProfitMin = base * 0.15;
  const monthlyProfitMax = base * 0.3;
  const progress = useMemo(() => Math.min(100, Math.max(8, base / 100)), [base]);
  const ru = language === "ru";

  return (
    <section className="rounded-[28px] border border-emerald-200/45 bg-white/76 p-4 shadow-xl shadow-emerald-950/[0.05] ring-1 ring-white/70 backdrop-blur-2xl dark:border-emerald-300/12 dark:bg-white/[0.055] dark:ring-white/8 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700/70 dark:text-emerald-200/58">
            {ru ? "Планирование" : "Planning"}
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
            {ru ? "Калькулятор примерной прибыли" : "Estimated Profit Calculator"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {ru
              ? "Введите сумму на счете, чтобы увидеть ориентировочный месячный диапазон."
              : "Enter an account amount to see an approximate monthly range."}
          </p>
        </div>

        <div className="grid w-full gap-3 lg:max-w-2xl lg:grid-cols-[260px_1fr]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              {ru ? "Сумма на счете" : "Account Amount"}
            </span>
            <div className="relative">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-14 w-full rounded-2xl border border-emerald-100 bg-white/82 px-4 pr-16 text-2xl font-black text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/62 dark:text-white"
                placeholder="1000"
                type="number"
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500 dark:text-slate-300">
                EUR
              </span>
            </div>
          </label>

          <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-4 dark:border-emerald-400/10 dark:from-emerald-500/12 dark:via-white/[0.04] dark:to-white/[0.02]">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              {ru ? "Примерная прибыль в месяц" : "Estimated Monthly Profit"}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
              €{monthlyProfitMin.toFixed(2)} - €{monthlyProfitMax.toFixed(2)}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
