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
      ? "xl:ml-[290px]"
      : "xl:ml-[90px]";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_30%),linear-gradient(180deg,#f8fafc,#edfdf5_48%,#f8fafc)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),linear-gradient(180deg,#03110a,#07130d_48%,#020617)] dark:text-white xl:flex">
      <AppSidebar />
      <Backdrop />

      <div className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <main
          className={
            isTerminal
              ? "w-full bg-[#151821]"
              : "w-full overflow-x-hidden px-3 py-4 sm:px-4 lg:px-6 lg:py-6"
          }
        >
          {children}
        </main>
        {pathname !== "/support" && <SupportPage />}
      </div>
    </div>
  );
}
