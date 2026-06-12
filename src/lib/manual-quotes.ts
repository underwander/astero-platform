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
  `.then(() => undefined);

  return manualQuotesTableReady;
}
