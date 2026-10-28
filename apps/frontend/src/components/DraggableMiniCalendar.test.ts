import { describe, expect, it } from 'vitest'
import { constrainRectOutsideGrid } from './DraggableMiniCalendar'

describe('draggable mini-calendar geometry', () => {
  const grid = { x: 16, y: 652, width: 762, height: 455 }

  it('moves an overlapping mini-calendar to the nearest free area', () => {
    const result = constrainRectOutsideGrid({ x: 590, y: 700, width: 190, height: 86 }, grid)

    expect(result.y + result.height).toBeLessThanOrEqual(grid.y)
    expect(result.x).toBeGreaterThanOrEqual(0)
  })

  it('keeps the mini-calendar inside the A4 page bounds', () => {
    const result = constrainRectOutsideGrid({ x: 900, y: 1200, width: 190, height: 86 }, grid)

    expect(result.x + result.width).toBeLessThanOrEqual(794)
    expect(result.y + result.height).toBeLessThanOrEqual(1123)
  })
})
