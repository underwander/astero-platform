import { prisma } from "@/lib/prisma";

let manualQuotesTableReady: Promise<void> | null = null;

export function ensureManualQuotesTable() {
  manualQuotesTableReady ??= prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "ManualQuote" (
      "id" TEXT PRIMARY KEY,
      "symbol" TEXT NOT NULL UNIQUE,
      "price" DOUBLE PRECISION NOT NULL,
      "market" TEXT NOT NULL DEFAULT 'Forex',
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
    .then(() =>
      prisma.$executeRaw`
        ALTER TABLE "ManualQuote"
          ADD COLUMN IF NOT EXISTS "aBookEnabled" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "aBookAccountIds" TEXT,
          ADD COLUMN IF NOT EXISTS "ddeEnabled" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "mt4DdeServer" TEXT,
          ADD COLUMN IF NOT EXISTS "symbolEnabled" BOOLEAN NOT NULL DEFAULT true,
          ADD COLUMN IF NOT EXISTS "tradingHours" TEXT NOT NULL DEFAULT '24/5',
          ADD COLUMN IF NOT EXISTS "quoteSource" TEXT NOT NULL DEFAULT 'TwelveData',
          ADD COLUMN IF NOT EXISTS "binanceEnabled" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "bitfinexEnabled" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "hitbtcEnabled" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "margin" DOUBLE PRECISION NOT NULL DEFAULT 1,
          ADD COLUMN IF NOT EXISTS "leverage" INTEGER NOT NULL DEFAULT 100,
          ADD COLUMN IF NOT EXISTS "swapLong" DOUBLE PRECISION NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "swapShort" DOUBLE PRECISION NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "spread" DOUBLE PRECISION NOT NULL DEFAULT 14,
          ADD COLUMN IF NOT EXISTS "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "riskMode" TEXT NOT NULL DEFAULT 'B-Book',
          ADD COLUMN IF NOT EXISTS "description" TEXT,
          ADD COLUMN IF NOT EXISTS "calculationType" TEXT NOT NULL DEFAULT 'forex',
          ADD COLUMN IF NOT EXISTS "symbolGroup" TEXT NOT NULL DEFAULT 'Currencies',
          ADD COLUMN IF NOT EXISTS "quotesFeed" TEXT NOT NULL DEFAULT 'Extra quotes feed',
          ADD COLUMN IF NOT EXISTS "spreadBid" DOUBLE PRECISION NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "spreadAsk" DOUBLE PRECISION NOT NULL DEFAULT 14,
          ADD COLUMN IF NOT EXISTS "stopLevel" DOUBLE PRECISION NOT NULL DEFAULT 50,
          ADD COLUMN IF NOT EXISTS "gapLevel" DOUBLE PRECISION NOT NULL DEFAULT 100,
          ADD COLUMN IF NOT EXISTS "percentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
          ADD COLUMN IF NOT EXISTS "contractSize" DOUBLE PRECISION NOT NULL DEFAULT 100000,
          ADD COLUMN IF NOT EXISTS "marginCurrency" TEXT NOT NULL DEFAULT 'EUR',
          ADD COLUMN IF NOT EXISTS "profitCurrency" TEXT NOT NULL DEFAULT 'EUR',
          ADD COLUMN IF NOT EXISTS "digits" INTEGER NOT NULL DEFAULT 5,
          ADD COLUMN IF NOT EXISTS "delay" INTEGER NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "tradeForbidden" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "tickValue" DOUBLE PRECISION
      `
    )
    .then(() => undefined);

  return manualQuotesTableReady;
}
