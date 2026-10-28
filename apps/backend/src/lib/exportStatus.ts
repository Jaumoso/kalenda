import type { ExportStatus } from '@prisma/client'

export function isExportCancellable(status: ExportStatus): boolean {
  return status === 'PENDING' || status === 'PROCESSING'
}
