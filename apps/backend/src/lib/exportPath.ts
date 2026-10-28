const EXPORT_JOB_ID_PATTERN = /^c[a-z0-9]{24}$/

export function getSafeExportJobId(jobId: string): string | null {
  return EXPORT_JOB_ID_PATTERN.exec(jobId)?.[0] ?? null
}
