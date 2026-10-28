import { describe, expect, it } from 'vitest'
import { DEFAULT_PRINT_CONFIG, PAPER_DIMENSIONS, getPrintGeometry } from './types'

describe('getPrintGeometry', () => {
  it.each(['A4', 'A3', 'A5', 'LETTER'] as const)('keeps bleed symmetric for %s', (paperSize) => {
    const geometry = getPrintGeometry(
      { ...DEFAULT_PRINT_CONFIG, bleedEnabled: true, bleedMm: 3 },
      PAPER_DIMENSIONS[paperSize]
    )
    expect(geometry.outputWidthPx - PAPER_DIMENSIONS[paperSize].widthPx).toBe(
      geometry.contentOffsetPx * 2
    )
    expect(geometry.outputHeightPx - PAPER_DIMENSIONS[paperSize].heightPx).toBe(
      geometry.contentOffsetPx * 2
    )
  })

  it('reserves enough symmetric space for crop marks without changing trim dimensions', () => {
    const geometry = getPrintGeometry(
      { ...DEFAULT_PRINT_CONFIG, cropMarks: true },
      PAPER_DIMENSIONS.A4
    )
    expect(geometry.cropMarginPx).toBeGreaterThan(0)
    expect(geometry.contentOffsetPx).toBe(geometry.cropMarginPx)
    expect(geometry.outputWidthPx).toBe(PAPER_DIMENSIONS.A4.widthPx + geometry.contentOffsetPx * 2)
  })
})
