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
import ClientWisdomTicker from "@/components/broker/ClientWisdomTicker";
import styles from "./DashboardLiquidGlass.module.css";

export const metadata: Metadata = {
  title: "Панель клиента | Astero Trader Room",
  description: "Личный кабинет клиента Astero",
};

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <div className={styles.shell}>
        <div className={`${styles.stack} mx-auto min-h-[calc(100vh-72px)] w-full max-w-none space-y-4`}>
          <div className="px-1">
            <DashboardTitle />
          </div>

          <div className={styles.metricsPanel}><BrokerMetrics /></div>
          <ClientWisdomTicker />
          <div className={styles.glassPanel}><ProfitCalculator /></div>
          <div className={styles.glassPanel}><TransferHistory /></div>
          <div className={styles.glassPanel}><AnnouncementsBoard /></div>
          <div className={styles.glassPanel}><MarketWatch compact /></div>
          <div className={styles.glassPanel}><TraderNews /></div>
          <div className={`${styles.glassPanel} ${styles.modalPanel}`}><LegalDocumentsPanel /></div>
        </div>
      </div>
    </ProtectedPage>
  );
}
