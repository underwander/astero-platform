"use client";

import { useState } from "react";

const documents = [
  {
    title: "AML",
    heading: "Политика противодействия отмыванию денег (AML)",
    text:
      "Настоящая Политика AML описывает процедуры и механизмы Astero для предотвращения использования услуг в целях отмывания денег или финансирования терроризма. Компания соблюдает международные финансовые стандарты, не принимает переводы третьим лицам, мониторит подозрительные транзакции и оставляет за собой право заморозить счет при выявлении подозрительной активности.",
  },
  {
    title: "KYC",
    heading: "Политика «Знай своего клиента» (KYC)",
    text:
      "Astero применяет процедуру KYC для подтверждения личности клиентов, защиты персональных данных и финансовой системы. Клиент может быть обязан предоставить документ, удостоверяющий личность, подтверждение адреса и документы по платежному методу.",
  },
  {
    title: "Клиентское соглашение",
    heading: "Клиентское соглашение",
    text:
      "Клиентское соглашение определяет порядок взаимодействия между Astero и клиентом при использовании личного кабинета, торгового терминала, аналитических данных, операций пополнения, вывода и поддержки.",
  },
  {
    title: "Политика конфиденциальности",
    heading: "Политика конфиденциальности",
    text:
      "Astero обрабатывает персональные данные клиента для работы аккаунта, безопасности, верификации, поддержки и улучшения сервиса. Данные не передаются третьим лицам без законного основания, кроме технических поставщиков и случаев, предусмотренных требованиями закона.",
  },
  {
    title: "Конфликт интересов",
    heading: "Политика урегулирования конфликтов интересов",
    text:
      "Политика описывает подход Astero к выявлению и управлению конфликтами интересов. Компания применяет внутренние ограничения, разделение функций и контроль доступа к конфиденциальной информации.",
  },
  {
    title: "Правовая информация",
    heading: "Правовая информация и регулирование",
    text:
      "Astero стремится обеспечивать прозрачность своей деятельности и соблюдает применимые международные стандарты. Сервисы платформы предоставляются как программные решения, инструменты аналитики и рыночной агрегации.",
  },
  {
    title: "Риски",
    heading: "Уведомление о рисках",
    text:
      "Торговля финансовыми инструментами с использованием кредитного плеча связана с высоким уровнем риска. Цены могут быстро меняться под влиянием рыночных, экономических и политических событий. Прошлые результаты не гарантируют будущих.",
  },
];

export default function LegalDocumentsLinks() {
  const [active, setActive] = useState<(typeof documents)[number] | null>(null);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap gap-2">
        {documents.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActive(item)}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
          >
            {item.title}
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="max-h-[82vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-200 bg-white p-5 text-slate-900 shadow-2xl dark:border-emerald-400/20 dark:bg-slate-950 dark:text-white">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-black">{active.heading}</h2>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white"
              >
                ×
              </button>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">{active.text}</p>
          </div>
        </div>
      )}
    </section>
  );
}
