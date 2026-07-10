import type { Metadata } from "next";
import React from "react";

import BrokerMetrics from "@/components/ecommerce/BrokerMetrics";
import MarketWatch from "@/components/broker/MarketWatch";
import ProfitCalculator from "@/components/broker/ProfitCalculator";
import TraderNews from "@/components/broker/TraderNews";
import TransferHistory from "@/components/broker/TransferHistory";
import AnnouncementsBoard from "@/components/broker/AnnouncementsBoard";
import LegalDocumentsPanel from "@/components/broker/LegalDocumentsPanel";
import DashboardTitle from "@/components/broker/DashboardTitle";
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
          <DashboardTitle />
        </div>

        <BrokerMetrics />
        <ProfitCalculator />
        <TransferHistory />
        <AnnouncementsBoard />
        <MarketWatch compact />
        <TraderNews />
        <LegalDocumentsPanel />
      </div>
    </ProtectedPage>
  );
}
