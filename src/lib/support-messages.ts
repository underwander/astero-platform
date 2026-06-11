import { prisma } from "@/lib/prisma";

let supportTableReady: Promise<void> | null = null;

export function ensureSupportMessagesTable() {
  supportTableReady ??= prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SupportMessage" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "sender" TEXT,
      "fromRole" TEXT NOT NULL DEFAULT 'CLIENT',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.then(async () => {
    await prisma.$executeRaw`
      ALTER TABLE "SupportMessage"
      ADD COLUMN IF NOT EXISTS "sender" TEXT
    `;

    await prisma.$executeRaw`
      ALTER TABLE "SupportMessage"
      ADD COLUMN IF NOT EXISTS "fromRole" TEXT NOT NULL DEFAULT 'CLIENT'
    `;

    await prisma.$executeRaw`
      ALTER TABLE "SupportMessage"
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "SupportMessage_userId_createdAt_idx"
      ON "SupportMessage" ("userId", "createdAt")
    `;
  });

  return supportTableReady;
}
