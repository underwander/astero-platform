"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const inputClass =
  "h-[76px] w-full rounded-xl border border-emerald-100 bg-white px-4 pr-16 text-3xl font-black text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white";

export default function ProfitCalculator() {
  const { language } = useLanguage();
  const [amount, setAmount] = useState("1000");
  const base = Math.max(0, Number(amount) || 0);
  const monthlyProfitMin = base * 0.15;
  const monthlyProfitMax = base * 0.3;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <h2 className="text-base font-black text-slate-900 dark:text-white">{language === "ru" ? "Калькулятор прибыли" : "Profit calculator"}</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr] md:items-end">
        <label>
          <span className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">{language === "ru" ? "Сумма на счете" : "Account amount"}</span>
          <div className="relative">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={inputClass}
              placeholder="1000"
              type="number"
              min="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-500 dark:text-slate-300">
              EUR
            </span>
          </div>
        </label>

        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-400/10 dark:from-emerald-500/10 dark:to-white/[0.03]">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{language === "ru" ? "Примерная прибыль в месяц" : "Estimated monthly profit"}</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            €{monthlyProfitMin.toFixed(2)} - €{monthlyProfitMax.toFixed(2)}
          </p>
        </div>
      </div>
    </section>
  );
}
