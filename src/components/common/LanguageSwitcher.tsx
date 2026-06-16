"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex shrink-0 items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-1 text-[11px] font-black text-emerald-700 dark:text-emerald-200 sm:text-xs">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-xl px-2 py-1.5 transition sm:px-3 ${language === "en" ? "bg-emerald-500 text-slate-950" : "hover:bg-white/10"}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ru")}
        className={`rounded-xl px-2 py-1.5 transition sm:px-3 ${language === "ru" ? "bg-emerald-500 text-slate-950" : "hover:bg-white/10"}`}
      >
        RU
      </button>
    </div>
  );
}
