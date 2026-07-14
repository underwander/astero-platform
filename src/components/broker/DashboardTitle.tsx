"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function DashboardTitle() {
  const { language } = useLanguage();
  const ru = language === "ru";

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#07130f] px-4 py-5 text-white shadow-2xl shadow-emerald-950/20 sm:px-6 lg:px-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(52,211,153,0.26),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02)_44%,rgba(0,0,0,0.14))]" />
      <div className="absolute right-[-70px] top-[-90px] size-56 rounded-full bg-emerald-300/16 blur-3xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">
            Astero Trader Room
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
            {ru ? "Панель клиента" : "Client Dashboard"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-emerald-50/68">
            {ru
              ? "Баланс, операции, котировки, новости и доступ к торговому терминалу в одном рабочем пространстве."
              : "Balance, operations, quotes, news and trading terminal access in one workspace."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
          <HeroPill value="24/7" label={ru ? "доступ" : "access"} />
          <HeroPill value="LIVE" label={ru ? "рынки" : "markets"} />
          <HeroPill value="EUR" label={ru ? "счета" : "accounts"} />
        </div>
      </div>
    </section>
  );
}

function HeroPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.07] px-3 py-3 shadow-inner shadow-white/5 backdrop-blur-xl">
      <p className="text-sm font-black text-emerald-200 sm:text-base">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/52">{label}</p>
    </div>
  );
}
