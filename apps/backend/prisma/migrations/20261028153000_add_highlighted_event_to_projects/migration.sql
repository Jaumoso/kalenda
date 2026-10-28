-- AlterTable
ALTER TABLE "projects"
ADD COLUMN "highlightedEventId" TEXT;

-- AddForeignKey
ALTER TABLE "projects"
ADD CONSTRAINT "projects_highlightedEventId_fkey"
FOREIGN KEY ("highlightedEventId") REFERENCES "events"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
