"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function DashboardTitle() {
  const { language } = useLanguage();

  return (
    <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
      {language === "ru" ? "Панель клиента" : "Client dashboard"}
    </h1>
  );
}
