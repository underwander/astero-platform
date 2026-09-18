"use client";

import { useEffect, useState } from "react";

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

  return (
    <section className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <h2 className="text-base font-black text-slate-950 dark:text-white">Доска объявлений</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {items.map((item) => {
          const imageUrl = item.imageBase64 && item.imageMimeType ? `data:${item.imageMimeType};base64,${item.imageBase64}` : "";
          return (
            <article key={item.id} className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-slate-950/50">
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
