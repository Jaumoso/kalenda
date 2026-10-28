import { describe, expect, it } from 'vitest'
import { getSafeExportJobId } from './renderer.js'

describe('export job directory identifiers', () => {
  it('accepts Prisma cuid values', () => {
    expect(getSafeExportJobId('cmvscr84b0000qwkw2lmexe82')).toBe('cmvscr84b0000qwkw2lmexe82')
  })

  it.each(['../outside', '/tmp/outside', 'cshort', 'c' + 'a'.repeat(23) + '../'])(
    'rejects unsafe job id %s',
    (jobId) => {
      expect(getSafeExportJobId(jobId)).toBeNull()
    }
  )
})
