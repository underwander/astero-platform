import { prisma } from "@/lib/prisma";

let crmSchemaReady: Promise<void> | null = null;

export function ensureCrmSchema() {
  crmSchemaReady ??= Promise.all([
    prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
        ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "lastIp" TEXT
    `),
    prisma.$executeRawUnsafe(`
      ALTER TABLE "ClientNote"
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "managerId" TEXT
    `),
    prisma.$executeRawUnsafe(`
      ALTER TABLE "ClientAction"
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "managerId" TEXT
    `),
  ]).then(() => undefined);

  return crmSchemaReady;
}

export function getRequestIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || null;
}
