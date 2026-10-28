import { describe, expect, it } from 'vitest'
import { isExportCancellable } from './exportStatus.js'

describe('isExportCancellable', () => {
  it.each(['PENDING', 'PROCESSING'] as const)('allows %s jobs', (status) => {
    expect(isExportCancellable(status)).toBe(true)
  })

  it.each(['COMPLETED', 'FAILED', 'CANCELLED'] as const)('rejects %s jobs', (status) => {
    expect(isExportCancellable(status)).toBe(false)
  })
})
