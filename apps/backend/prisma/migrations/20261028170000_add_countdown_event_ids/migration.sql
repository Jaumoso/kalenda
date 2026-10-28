ALTER TABLE "projects"
ADD COLUMN "countdownEventIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "projects"
SET "countdownEventIds" = ARRAY["highlightedEventId"]
WHERE "highlightedEventId" IS NOT NULL;
