-- AlterTable
ALTER TABLE "events" ADD COLUMN "sourceUid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "events_userId_sourceUid_key" ON "events"("userId", "sourceUid");
