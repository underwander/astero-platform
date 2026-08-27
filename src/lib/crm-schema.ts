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
      ALTER TABLE "Deposit"
        ADD COLUMN IF NOT EXISTS "adminComment" TEXT
    `),
    prisma.$executeRawUnsafe(`
      ALTER TABLE "Trade"
        ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "clientOrderId" TEXT
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
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SecurityEvent" (
        "id" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "risk" TEXT NOT NULL DEFAULT 'LOW',
        "description" TEXT NOT NULL,
        "ip" TEXT,
        "country" TEXT,
        "city" TEXT,
        "userAgent" TEXT,
        "device" TEXT,
        "browser" TEXT,
        "os" TEXT,
        "path" TEXT,
        "userId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "IpAccessRule" (
        "id" TEXT NOT NULL,
        "ip" TEXT NOT NULL,
        "mode" TEXT NOT NULL DEFAULT 'BLACKLIST',
        "reason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "IpAccessRule_pkey" PRIMARY KEY ("id")
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt")
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SecurityEvent_ip_idx" ON "SecurityEvent"("ip")
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SecurityEvent_type_idx" ON "SecurityEvent"("type")
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SecurityEvent_risk_idx" ON "SecurityEvent"("risk")
    `),
    prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IpAccessRule_ip_mode_key" ON "IpAccessRule"("ip", "mode")
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "IpAccessRule_ip_idx" ON "IpAccessRule"("ip")
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "IpAccessRule_mode_idx" ON "IpAccessRule"("mode")
    `),
  ]).then(async () => {
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Trade_userId_clientOrderId_key"
      ON "Trade"("userId", "clientOrderId")
    `);
  });

  return crmSchemaReady;
}

export function getRequestIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || null;
}
