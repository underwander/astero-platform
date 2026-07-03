import { prisma } from "@/lib/prisma";

let announcementsReady: Promise<void> | null = null;

export function ensureAnnouncementsTable() {
  announcementsReady ??= prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Announcement" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL DEFAULT '',
      "text" TEXT NOT NULL DEFAULT '',
      "imageName" TEXT,
      "imageMimeType" TEXT,
      "imageBase64" TEXT,
      "fontSize" INTEGER NOT NULL DEFAULT 16,
      "textColor" TEXT NOT NULL DEFAULT '#0f172a',
      "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
      "isPublished" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.then(async () => {
    await prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT ''
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "text" TEXT NOT NULL DEFAULT ''
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "imageName" TEXT
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "imageMimeType" TEXT
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "imageBase64" TEXT
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "fontSize" INTEGER NOT NULL DEFAULT 16
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "textColor" TEXT NOT NULL DEFAULT '#0f172a'
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "fontFamily" TEXT NOT NULL DEFAULT 'Inter'
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT true
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `;
  });

  return announcementsReady;
}
