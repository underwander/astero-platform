"use client";

import Link from "next/link";
import { useState } from "react";

export default function QuickActions() {
  const [role] = useState(() => {
    if (typeof window === "undefined") return "CLIENT";
    return window.localStorage.getItem("role") || "CLIENT";
  });

  const actions = [
    { title: "Терминал", text: "Открыть сделку", href: "/terminal", tone: "bg-emerald-600 text-white" },
    { title: "Пополнить", text: "Заявка на депозит", href: "/deposits", tone: "bg-lime-500 text-slate-950" },
    { title: "Вывести", text: "Заявка на вывод", href: "/withdrawals", tone: "bg-slate-950 text-white dark:bg-white dark:text-slate-950" },
    { title: "Поддержка", text: "Чат с менеджером", href: "/support", tone: "bg-sky-600 text-white" },
    ...(role === "ADMIN" ? [{ title: "CRM", text: "Панель администратора", href: "/crm", tone: "bg-green-700 text-white" }] : []),
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <h2 className="text-base font-bold text-slate-900 dark:text-white">Действия</h2>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`rounded-lg p-3 transition hover:opacity-90 ${action.tone}`}
          >
            <p className="text-sm font-black">{action.title}</p>
            <p className="mt-1 text-xs opacity-80">{action.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
