"use client";

import AsteroLogo from "@/components/brand/AsteroLogo";
import { useSidebar } from "@/context/SidebarContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  GridIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
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
  { key: "dashboard", name: "Dashboard", path: "/", icon: <GridIcon /> },
  { key: "trading", name: "Trading", path: "/terminal", icon: <PieChartIcon />, badge: "LIVE" },
  { key: "positions", name: "Positions", path: "/positions", icon: <TableIcon /> },
  { key: "history", name: "History", path: "/history", icon: <ListIcon /> },
  { key: "deposits", name: "Deposits", path: "/deposits", icon: <PageIcon /> },
  { key: "withdrawals", name: "Withdrawals", path: "/withdrawals", icon: <PlugInIcon /> },
  { key: "profile", name: "Profile", path: "/profile", icon: <UserCircleIcon /> },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { t } = useLanguage();

  const showText = isExpanded || isHovered || isMobileOpen;
  const sidebarWidth = showText ? "w-[290px]" : "w-[90px]";

  function isActive(path: string) {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-emerald-400/10 bg-[#07130d] px-4 text-white transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarWidth} ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center py-7 ${showText ? "justify-start" : "justify-center"}`}>
        <Link href="/" aria-label="Astero home">
          <AsteroLogo compact={!showText} />
        </Link>
      </div>

      {showText && (
        <div className="mb-6 rounded-3xl border border-emerald-400/15 bg-emerald-400/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            {t("liveDesk")}
          </p>
          <p className="mt-2 text-sm leading-5 text-emerald-50/75">
            {t("liveDeskText")}
          </p>
        </div>
      )}

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
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/25"
                      : "text-emerald-50/70 hover:bg-white/10 hover:text-white"
                  } ${!showText ? "justify-center px-3" : ""}`}
                >
                  <span className={`flex size-5 shrink-0 items-center justify-center ${active ? "text-slate-950" : "text-emerald-200/70 group-hover:text-white"}`}>
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

      {showText && (
        <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-bold text-white">Separate CRM</p>
          <p className="mt-1 text-xs leading-5 text-emerald-50/60">
            Admin panel is isolated at /crm and hidden from the client menu.
          </p>
        </div>
      )}
    </aside>
  );
}
