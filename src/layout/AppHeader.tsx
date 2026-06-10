"use client";

import AsteroLogo from "@/components/brand/AsteroLogo";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useSidebar } from "@/context/SidebarContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function AppHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { t } = useLanguage();
  const [email, setEmail] = useState("Client");
  const [role, setRole] = useState("CLIENT");

  useEffect(() => {
    setEmail(localStorage.getItem("email") || "Client");
    setRole(localStorage.getItem("role") || "CLIENT");
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/90 backdrop-blur-xl dark:border-emerald-400/10 dark:bg-[#07130d]/90">
      <div className="flex min-h-18 items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="flex size-11 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-900 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-400/10 dark:bg-white/[0.04] dark:text-emerald-100 dark:hover:bg-white/[0.08]"
            onClick={handleToggle}
            aria-label="Toggle sidebar"
          >
            {isMobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            )}
          </button>

          <div className="hidden sm:block lg:hidden">
            <AsteroLogo />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{t("traderRoom")}</p>
            <p className="hidden text-xs text-slate-500 dark:text-emerald-50/50 sm:block">
              {t("realTimeDashboard")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" /> {t("live")}
          </div>

          {role === "ADMIN" && (
            <Link href="/crm" className="hidden rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 md:inline-flex">
              {t("crm")}
            </Link>
          )}

          <LanguageSwitcher />

          <ThemeToggleButton />

          <div className="hidden rounded-2xl border border-emerald-100 bg-white px-4 py-2 text-right shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] md:block">
            <p className="max-w-[210px] truncate text-sm font-semibold text-slate-900 dark:text-white">{email}</p>
            <p className="text-xs text-slate-500 dark:text-emerald-50/50">{role}</p>
          </div>

          <Link href="/logout" className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500">
            {t("logout")}
          </Link>
        </div>
      </div>
    </header>
  );
}
