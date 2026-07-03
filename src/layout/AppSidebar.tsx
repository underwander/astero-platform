"use client";

import AsteroLogo from "@/components/brand/AsteroLogo";
import { useSidebar } from "@/context/SidebarContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  GridIcon,
  UserCircleIcon,
} from "@/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type NavItem = {
  key: string;
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
};

const clientNavItems: NavItem[] = [
  { key: "dashboard", name: "Dashboard", path: "/dashboard", icon: <GridIcon /> },
  { key: "deposits", name: "Deposits", path: "/deposits", icon: <DepositMenuIcon /> },
  { key: "withdrawals", name: "Withdrawals", path: "/withdrawals", icon: <WithdrawalMenuIcon /> },
  { key: "profile", name: "Profile", path: "/profile", icon: <UserCircleIcon /> },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const { t } = useLanguage();

  const showText = isExpanded || isHovered || isMobileOpen;
  const sidebarWidth = showText ? "w-[min(82vw,290px)] xl:w-[290px]" : "w-[90px]";

  function isActive(path: string) {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-emerald-400/10 bg-[#07130d] px-4 text-white transition-all duration-300 ease-in-out xl:translate-x-0 ${sidebarWidth} ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center py-7 ${showText ? "justify-start" : "justify-center"}`}>
        <Link href="/dashboard" aria-label="Astero dashboard">
          <AsteroLogo compact={!showText} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto pb-6">
        {showText && (
          <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/45">
            {t("clientCabinet")}
          </p>
        )}

        <ul className="space-y-2">
          {clientNavItems.map((item) => {
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={() => {
                    if (isMobileOpen) toggleMobileSidebar();
                  }}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/25"
                      : "text-emerald-50/70 hover:bg-white/10 hover:text-white"
                  } ${!showText ? "justify-center px-3" : ""}`}
                >
                  <span className={`flex size-5 shrink-0 items-center justify-center [&_svg]:size-5 [&_svg]:shrink-0 ${active ? "text-slate-950" : "text-emerald-200/70 group-hover:text-white"}`}>
                    {item.icon}
                  </span>

                  {showText && (
                    <>
                      <span className="flex-1 truncate">{t(item.key)}</span>
                      {item.badge && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-slate-950/10 text-slate-950" : "bg-emerald-500/15 text-emerald-300"}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

    </aside>
  );
}

function DepositMenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 8.25C6 6.73 8.46 5.5 11.5 5.5C14.54 5.5 17 6.73 17 8.25C17 9.77 14.54 11 11.5 11C8.46 11 6 9.77 6 8.25Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 8.25V12.25C6 13.77 8.46 15 11.5 15C12.16 15 12.79 14.94 13.38 14.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 12.25V16.25C6 17.77 8.46 19 11.5 19C12.05 19 12.57 18.96 13.07 18.88" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 14V20M15 17H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WithdrawalMenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 7.75C4.5 6.65 5.4 5.75 6.5 5.75H17.5C18.6 5.75 19.5 6.65 19.5 7.75V16.25C19.5 17.35 18.6 18.25 17.5 18.25H6.5C5.4 18.25 4.5 17.35 4.5 16.25V7.75Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.25 11.25H19.5V14.75H15.25C14.28 14.75 13.5 13.97 13.5 13C13.5 12.03 14.28 11.25 15.25 11.25Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.75 13H15.76" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 9.25H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
