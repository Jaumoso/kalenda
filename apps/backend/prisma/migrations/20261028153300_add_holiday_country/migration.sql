ALTER TABLE "projects" ADD COLUMN "holidayCountryCode" TEXT NOT NULL DEFAULT 'ES';

ALTER TABLE "holidays" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'ES';

DROP INDEX IF EXISTS "holidays_year_month_day_scope_autonomyCode_key";
CREATE UNIQUE INDEX "holidays_year_month_day_countryCode_scope_autonomyCode_key"
ON "holidays"("year", "month", "day", "countryCode", "scope", "autonomyCode");
