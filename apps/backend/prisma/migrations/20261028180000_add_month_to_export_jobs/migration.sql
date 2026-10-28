ALTER TABLE "export_jobs" ADD COLUMN "monthId" TEXT;

CREATE INDEX "export_jobs_monthId_idx" ON "export_jobs"("monthId");

ALTER TABLE "export_jobs"
ADD CONSTRAINT "export_jobs_monthId_fkey"
FOREIGN KEY ("monthId") REFERENCES "calendar_months"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
