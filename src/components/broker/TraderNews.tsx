"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
};

export default function TraderNews() {
  const { language } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadNews() {
    try {
      const res = await fetch(`/api/market-news?lang=${language}`, { cache: "no-store" });
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [language]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-black text-slate-950 dark:text-white">{language === "ru" ? "Новости трейдера" : "Trader news"}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {news.map((item) => (
          <a
            key={`${item.link}-${item.publishedAt}`}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="group rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-white/10 dark:bg-slate-950/50 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-500/10"
          >
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase text-slate-400">
              <span>{formatDate(item.publishedAt, language)}</span>
            </div>
            <p className="line-clamp-2 text-sm font-black leading-5 text-slate-950 group-hover:text-emerald-800 dark:text-white dark:group-hover:text-emerald-200">
              {item.title}
            </p>
          </a>
        ))}

        {loading && Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-white/5" />
        ))}

        {!loading && news.length === 0 && (
          <div className="rounded-lg border border-slate-200 p-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {language === "ru" ? "Новости временно недоступны." : "News is temporarily unavailable."}
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string, language: "ru" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
