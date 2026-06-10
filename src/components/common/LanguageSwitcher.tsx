"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-xl px-3 py-1.5 transition ${language === "en" ? "bg-emerald-500 text-slate-950" : "hover:bg-white/10"}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ru")}
        className={`rounded-xl px-3 py-1.5 transition ${language === "ru" ? "bg-emerald-500 text-slate-950" : "hover:bg-white/10"}`}
      >
        RU
      </button>
    </div>
  );
}
