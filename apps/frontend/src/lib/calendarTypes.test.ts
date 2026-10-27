import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GRID_CONFIG,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  getDaysInMonth,
  getFirstDayOfWeek,
  isWeekend,
} from './calendarTypes'

describe('calendar helpers', () => {
  it('uses the A4 canvas dimensions', () => {
    expect(PAGE_WIDTH).toBe(794)
    expect(PAGE_HEIGHT).toBe(1123)
  })

  it('provides a complete default grid configuration', () => {
    expect(DEFAULT_GRID_CONFIG.gridWidth).toBeGreaterThan(0)
    expect(DEFAULT_GRID_CONFIG.gridHeight).toBeGreaterThan(0)
    expect(DEFAULT_GRID_CONFIG.borderStyle).toBe('solid')
  })

  it('calculates month lengths including leap years', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29)
    expect(getDaysInMonth(2025, 2)).toBe(28)
    expect(getDaysInMonth(2025, 12)).toBe(31)
  })

  it('respects the configured first day of the week', () => {
    expect(getFirstDayOfWeek(2025, 6, 'monday')).toBe(6)
    expect(getFirstDayOfWeek(2025, 6, 'sunday')).toBe(0)
  })

  it('identifies Saturdays and Sundays as weekends', () => {
    expect(isWeekend(14, 2025, 6)).toBe(true)
    expect(isWeekend(15, 2025, 6)).toBe(true)
    expect(isWeekend(16, 2025, 6)).toBe(false)
  })
})
