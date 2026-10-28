-- CreateEnum
CREATE TYPE "EventRecurrence" AS ENUM ('NONE', 'YEARLY', 'MONTHLY', 'WEEKLY');

-- AlterTable
ALTER TABLE "events"
ADD COLUMN "recurrence" "EventRecurrence" NOT NULL DEFAULT 'YEARLY',
ADD COLUMN "weekday" INTEGER;
