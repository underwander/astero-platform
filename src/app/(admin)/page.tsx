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
        <div className="overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-[#06130d] via-[#092016] to-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/10 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                Astero trader room
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                Trading account control center
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75">
                Live markets, equity analytics, open positions, finance journal and secure client account management in one clean interface.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <p className="text-lg font-black">LIVE</p>
                <p className="text-xs text-emerald-50/70">Quotes</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <p className="text-lg font-black">CRM</p>
                <p className="text-xs text-emerald-50/70">Separate</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <p className="text-lg font-black">MOBILE</p>
                <p className="text-xs text-emerald-50/70">Ready</p>
              </div>
            </div>
          </div>
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
