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
  const ru = language === "ru";

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
    <section className="rounded-[28px] border border-emerald-200/45 bg-white/76 p-4 shadow-xl shadow-emerald-950/[0.05] ring-1 ring-white/70 backdrop-blur-2xl dark:border-emerald-300/12 dark:bg-white/[0.055] dark:ring-white/8 sm:p-5">
      <div className="mb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700/70 dark:text-emerald-200/58">
          {ru ? "Информация" : "Insights"}
        </p>
        <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
          {ru ? "Новости трейдера" : "Trader News"}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {news.map((item) => (
          <a
            key={`${item.link}-${item.publishedAt}`}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-white/92 to-emerald-50/45 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-950/[0.06] dark:border-white/10 dark:from-slate-950/72 dark:to-white/[0.03]"
          >
            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              <span>{formatDate(item.publishedAt, language)}</span>
            </div>
            <p className="line-clamp-2 text-sm font-black leading-5 text-slate-950 group-hover:text-emerald-800 dark:text-white dark:group-hover:text-emerald-200">
              {item.title}
            </p>
          </a>
        ))}

        {loading && Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-emerald-50 dark:bg-white/5" />
        ))}

        {!loading && news.length === 0 && (
          <div className="rounded-2xl border border-dashed border-emerald-200 p-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {ru ? "Новости временно недоступны." : "News is temporarily unavailable."}
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
