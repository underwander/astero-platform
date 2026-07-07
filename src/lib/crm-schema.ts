import { prisma } from "@/lib/prisma";

let crmSchemaReady: Promise<void> | null = null;

export function ensureCrmSchema() {
  crmSchemaReady ??= Promise.all([
    prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
        ADD COLUMN IF NOT EXISTS "clientNumber" TEXT,
        ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "lastIp" TEXT,
        ADD COLUMN IF NOT EXISTS "plainPassword" TEXT,
        ADD COLUMN IF NOT EXISTS "clientStatus" TEXT NOT NULL DEFAULT 'ACTIVE'
    `),
    prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_clientNumber_key" ON "User"("clientNumber")
    `),
    prisma.$executeRawUnsafe(`
      ALTER TABLE "Withdrawal"
        ADD COLUMN IF NOT EXISTS "adminComment" TEXT
    `),
    prisma.$executeRawUnsafe(`
      ALTER TABLE "Trade"
        ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3)
    `),
    prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'User'
            AND column_name = 'tradingEnabled'
        ) THEN
          EXECUTE 'ALTER TABLE "User" ADD COLUMN "tradingEnabled" BOOLEAN NOT NULL DEFAULT true';
        END IF;
        EXECUTE 'ALTER TABLE "User" ALTER COLUMN "tradingEnabled" SET DEFAULT false';
      END
      $$
    `),
    prisma.$executeRawUnsafe(`
      ALTER TABLE "ClientNote"
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "managerId" TEXT
    `),
    prisma.$executeRawUnsafe(`
      ALTER TABLE "ClientAction"
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "managerId" TEXT,
        ADD COLUMN IF NOT EXISTS "reminderMinutes" INTEGER
    `),
  ]).then(() => undefined);

  return crmSchemaReady;
}

export function getRequestIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || null;
}
