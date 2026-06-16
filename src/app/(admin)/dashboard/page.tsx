import type { Metadata } from "next";
import React from "react";

import BrokerMetrics from "@/components/ecommerce/BrokerMetrics";
import MarketWatch from "@/components/broker/MarketWatch";
import ProfitCalculator from "@/components/broker/ProfitCalculator";
import TraderNews from "@/components/broker/TraderNews";
import TransferHistory from "@/components/broker/TransferHistory";
import ProtectedPage from "@/components/auth/ProtectedPage";

export const metadata: Metadata = {
  title: "Панель клиента | Astero Trader Room",
  description: "Личный кабинет клиента Astero",
};

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-none space-y-4">
        <div className="px-1">
          <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
            Панель клиента
          </h1>
        </div>

        <BrokerMetrics />
        <ProfitCalculator />
        <TransferHistory />
        <MarketWatch compact />
        <TraderNews />
      </div>
    </ProtectedPage>
  );
}
