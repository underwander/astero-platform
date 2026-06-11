import type { Metadata } from "next";
import React from "react";

import BalanceHistoryChart from "@/components/ecommerce/BalanceHistoryChart";
import BrokerMetrics from "@/components/ecommerce/BrokerMetrics";
import MarketWatch from "@/components/broker/MarketWatch";
import QuickActions from "@/components/broker/QuickActions";
import ProtectedPage from "@/components/auth/ProtectedPage";

export const metadata: Metadata = {
  title: "Astero Trader Room",
  description: "Astero trading dashboard with live quotes, finance and portfolio analytics",
};

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <div className="space-y-6">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 dark:border-white/10">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Панель клиента
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Счёт, позиции, операции и котировки.
          </p>
        </div>

        <BrokerMetrics />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <BalanceHistoryChart />
          </div>
          <div className="space-y-6 xl:col-span-4">
            <QuickActions />
            <MarketWatch />
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
