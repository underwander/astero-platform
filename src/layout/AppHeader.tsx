"use client";

import AsteroLogo from "@/components/brand/AsteroLogo";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useSidebar } from "@/context/SidebarContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt?: () => Promise<void>;
};

export default function AppHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { t } = useLanguage();
  const [email, setEmail] = useState("Client");
  const [role, setRole] = useState("CLIENT");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setEmail(localStorage.getItem("email") || "Client");
    setRole(localStorage.getItem("role") || "CLIENT");
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1280) toggleSidebar();
    else toggleMobileSidebar();
  };

  async function installApp() {
    if (installPrompt?.prompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    if (installPrompt?.prompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/90 backdrop-blur-xl dark:border-emerald-400/10 dark:bg-[#07130d]/90">
      <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-900 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-400/10 dark:bg-white/[0.04] dark:text-emerald-100 dark:hover:bg-white/[0.08] sm:size-11"
            onClick={handleToggle}
            aria-label="Toggle sidebar"
          >
            {isMobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <div className="hidden sm:block lg:hidden">
            <AsteroLogo />
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" /> {t("live")}
          </div>

          <button
            type="button"
            onClick={installApp}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300 lg:hidden"
          >
            {t("installApp")}
          </button>

          <LanguageSwitcher />

          <ThemeToggleButton />

          <div className="hidden rounded-2xl border border-emerald-100 bg-white px-4 py-2 text-right shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] md:block">
            <p className="max-w-[210px] truncate text-sm font-semibold text-slate-900 dark:text-white">{email}</p>
            <p className="text-xs text-slate-500 dark:text-emerald-50/50">{role}</p>
          </div>

          <Link href="/logout" className="rounded-2xl bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 sm:px-4 sm:text-sm">
            {t("logout")}
          </Link>
        </div>
      </div>
    </header>
  );
}
