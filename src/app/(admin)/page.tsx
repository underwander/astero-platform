import type { Metadata } from "next";
import React from "react";

import BrokerMetrics from "@/components/ecommerce/BrokerMetrics";
import MarketWatch from "@/components/broker/MarketWatch";
import TransferHistory from "@/components/broker/TransferHistory";
import ProtectedPage from "@/components/auth/ProtectedPage";

export const metadata: Metadata = {
  title: "Astero Trader Room",
  description: "Astero client dashboard",
};

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
            Панель клиента
          </h1>
        </div>

        <BrokerMetrics />
        <TransferHistory />
        <MarketWatch compact />
      </div>
    </ProtectedPage>
  );
}
