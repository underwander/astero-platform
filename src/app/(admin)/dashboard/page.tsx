import type { Metadata } from "next";
import React from "react";

import ProtectedPage from "@/components/auth/ProtectedPage";
import AnnouncementsBoard from "@/components/broker/AnnouncementsBoard";
import DashboardTitle from "@/components/broker/DashboardTitle";
import LegalDocumentsPanel from "@/components/broker/LegalDocumentsPanel";
import MarketWatch from "@/components/broker/MarketWatch";
import ProfitCalculator from "@/components/broker/ProfitCalculator";
import TraderNews from "@/components/broker/TraderNews";
import TransferHistory from "@/components/broker/TransferHistory";
import BrokerMetrics from "@/components/ecommerce/BrokerMetrics";

export const metadata: Metadata = {
  title: "Панель клиента | Astero Trader Room",
  description: "Личный кабинет клиента Astero",
};

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1760px] space-y-4 pb-8">
        <DashboardTitle />
        <BrokerMetrics />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
          <div className="space-y-4">
            <ProfitCalculator />
            <TransferHistory />
            <AnnouncementsBoard />
          </div>

          <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <MarketWatch compact />
            <TraderNews />
          </div>
        </div>

        <LegalDocumentsPanel />
      </div>
    </ProtectedPage>
  );
}
