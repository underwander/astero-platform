"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function QuickActions() {
  const [role, setRole] = useState("CLIENT");

  useEffect(() => {
    setRole(localStorage.getItem("role") || "CLIENT");
  }, []);

  const actions = [
    { title: "Open trade", text: "Launch terminal", href: "/terminal", tone: "bg-emerald-600 text-white" },
    { title: "Fund account", text: "Deposit form", href: "/deposits", tone: "bg-lime-500 text-slate-950" },
    { title: "Withdraw", text: "Card, wallet or account", href: "/withdrawals", tone: "bg-slate-950 text-white dark:bg-white dark:text-slate-950" },
    { title: "Support", text: "Message your manager", href: "/support", tone: "bg-sky-600 text-white" },
    ...(role === "ADMIN" ? [{ title: "Astero CRM", text: "Admin only", href: "/crm", tone: "bg-green-700 text-white" }] : []),
  ];

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] sm:p-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Actions</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-emerald-50/55">
        Fast access to trading and finance operations.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${action.tone}`}
          >
            <p className="text-sm font-black">{action.title}</p>
            <p className="mt-1 text-xs opacity-80">{action.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
