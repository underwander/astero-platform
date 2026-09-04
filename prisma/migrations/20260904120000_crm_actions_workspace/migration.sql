ALTER TABLE "ClientAction"
  ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'TASK',
  ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS "endAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "allDay" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "outcome" TEXT,
  ADD COLUMN IF NOT EXISTS "outcomeNote" TEXT,
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reminderAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reminderState" TEXT NOT NULL DEFAULT 'SCHEDULED';

CREATE TABLE IF NOT EXISTS "ClientActionHistory" (
  "id" TEXT NOT NULL,
  "actionId" TEXT NOT NULL,
  "userId" TEXT,
  "event" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientActionHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ClientAction_dueAt_idx" ON "ClientAction"("dueAt");
CREATE INDEX IF NOT EXISTS "ClientAction_managerId_dueAt_idx" ON "ClientAction"("managerId", "dueAt");
CREATE INDEX IF NOT EXISTS "ClientAction_userId_dueAt_idx" ON "ClientAction"("userId", "dueAt");
CREATE INDEX IF NOT EXISTS "ClientAction_status_dueAt_idx" ON "ClientAction"("status", "dueAt");
CREATE INDEX IF NOT EXISTS "ClientActionHistory_actionId_createdAt_idx" ON "ClientActionHistory"("actionId", "createdAt");
