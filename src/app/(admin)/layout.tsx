"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import SupportPage from "@/app/(admin)/support/page";
import { usePathname } from "next/navigation";
import React from "react";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const isTerminal = pathname === "/terminal";

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const reportActivity = () => {
      fetch("/api/user/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).catch(() => undefined);
    };

    reportActivity();
    const interval = window.setInterval(reportActivity, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white xl:flex">
      <AppSidebar />
      <Backdrop />

      <div className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <main
          className={
            isTerminal
              ? "w-full bg-[#151821]"
              : "w-full overflow-x-hidden bg-slate-50 p-3 dark:bg-slate-950 sm:p-4 lg:p-5"
          }
        >
          {children}
        </main>
        {pathname !== "/support" && <SupportPage />}
      </div>
    </div>
  );
}
