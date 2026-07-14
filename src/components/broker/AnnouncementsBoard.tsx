"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

type Announcement = {
  id: string;
  title: string;
  text: string;
  imageMimeType?: string | null;
  imageBase64?: string | null;
  fontSize: number;
  textColor: string;
  fontFamily: string;
};

export default function AnnouncementsBoard() {
  const { language } = useLanguage();
  const [items, setItems] = useState<Announcement[]>([]);

  async function loadAnnouncements() {
    const res = await fetch("/api/announcements", { cache: "no-store" });
    const data = await res.json().catch(() => []);
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 30000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  const ru = language === "ru";

  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-200/45 bg-white/76 shadow-xl shadow-emerald-950/[0.05] ring-1 ring-white/70 backdrop-blur-2xl dark:border-emerald-300/12 dark:bg-white/[0.055] dark:ring-white/8">
      <div className="border-b border-emerald-100/70 px-5 py-4 dark:border-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700/62 dark:text-emerald-200/58">
          {ru ? "Информация" : "Information"}
        </p>
        <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
          {ru ? "Доска объявлений" : "Announcement Board"}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
        {items.map((item) => {
          const imageUrl = item.imageBase64 && item.imageMimeType ? `data:${item.imageMimeType};base64,${item.imageBase64}` : "";
          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl border border-emerald-100/70 bg-white/74 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/[0.06] dark:border-white/10 dark:bg-slate-950/42"
            >
              {imageUrl && <img src={imageUrl} alt={item.title || "Announcement"} className="h-44 w-full object-cover" />}
              <div className="p-4">
                {item.title && <h3 className="text-lg font-black text-slate-950 dark:text-white">{item.title}</h3>}
                {item.text && (
                  <p
                    className="mt-2 whitespace-pre-line leading-relaxed"
                    style={{ color: item.textColor, fontSize: item.fontSize, fontFamily: item.fontFamily }}
                  >
                    {item.text}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
