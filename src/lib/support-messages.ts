import { prisma } from "@/lib/prisma";

let supportTableReady: Promise<void> | null = null;

export function ensureSupportMessagesTable() {
  supportTableReady ??= prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SupportConversation" (
      "userId" TEXT PRIMARY KEY,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "closedAt" TIMESTAMPTZ
    )
  `.then(async () => {
    await prisma.$executeRaw`
      ALTER TABLE "SupportConversation"
      ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'OPEN'
    `;

    await prisma.$executeRaw`
      ALTER TABLE "SupportConversation"
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `;

    await prisma.$executeRaw`
      ALTER TABLE "SupportConversation"
      ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMPTZ
    `;

    await prisma.$executeRaw`
      ALTER TABLE "SupportConversation"
      ADD COLUMN IF NOT EXISTS "adminLastReadAt" TIMESTAMPTZ
    `;

    await prisma.$executeRaw`
      ALTER TABLE "SupportConversation"
      ADD COLUMN IF NOT EXISTS "clientLastReadAt" TIMESTAMPTZ
    `;

    await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SupportMessage" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "sender" TEXT,
      "fromRole" TEXT NOT NULL DEFAULT 'CLIENT',
      "attachmentName" TEXT,
      "attachmentMimeType" TEXT,
      "attachmentBase64" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    `;

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
      ALTER TABLE "SupportMessage"
      ADD COLUMN IF NOT EXISTS "attachmentName" TEXT
    `;

    await prisma.$executeRaw`
      ALTER TABLE "SupportMessage"
      ADD COLUMN IF NOT EXISTS "attachmentMimeType" TEXT
    `;

    await prisma.$executeRaw`
      ALTER TABLE "SupportMessage"
      ADD COLUMN IF NOT EXISTS "attachmentBase64" TEXT
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "SupportMessage_userId_createdAt_idx"
      ON "SupportMessage" ("userId", "createdAt")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "SupportMessage_sender_createdAt_idx"
      ON "SupportMessage" ("sender", "createdAt")
    `;

    await prisma.$executeRaw`
      INSERT INTO "SupportConversation" ("userId", "status", "createdAt", "updatedAt")
      SELECT DISTINCT "userId", 'OPEN', MIN("createdAt"), NOW()
      FROM "SupportMessage"
      GROUP BY "userId"
      ON CONFLICT ("userId") DO NOTHING
    `;
  });

  return supportTableReady;
}
