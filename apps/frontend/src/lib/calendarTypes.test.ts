import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GRID_CONFIG,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  getAdjacentMonth,
  getDaysInMonth,
  getFirstDayOfWeek,
  getIsoWeekNumber,
  getPaperDimensions,
  isWeekend,
  scaleGridConfig,
} from './calendarTypes'

describe('calendar helpers', () => {
  it('uses the A4 canvas dimensions', () => {
    expect(PAGE_WIDTH).toBe(794)
    expect(PAGE_HEIGHT).toBe(1123)
  })

  it('exposes dimensions for supported paper sizes', () => {
    expect(getPaperDimensions('A3')).toMatchObject({ widthPx: 1123, heightPx: 1587 })
    expect(getPaperDimensions('LETTER')).toMatchObject({ widthPx: 816, heightPx: 1056 })
    expect(getPaperDimensions('A5')).toMatchObject({ widthPx: 559, heightPx: 794 })
  })

  it('scales the default grid for non-A4 paper', () => {
    expect(scaleGridConfig(DEFAULT_GRID_CONFIG, 'A4')).toEqual(DEFAULT_GRID_CONFIG)
    const a5 = scaleGridConfig(DEFAULT_GRID_CONFIG, 'A5')
    expect(a5.gridWidth).toBeLessThan(DEFAULT_GRID_CONFIG.gridWidth)
    expect(a5.gridHeight).toBeLessThan(DEFAULT_GRID_CONFIG.gridHeight)
    expect(a5.gridY + a5.gridHeight).toBeLessThanOrEqual(794)
  })

  it('provides a complete default grid configuration', () => {
    expect(DEFAULT_GRID_CONFIG.gridWidth).toBeGreaterThan(0)
    expect(DEFAULT_GRID_CONFIG.gridHeight).toBeGreaterThan(0)
    expect(DEFAULT_GRID_CONFIG.borderStyle).toBe('solid')
    expect(DEFAULT_GRID_CONFIG.showWeekNumbers).toBe(false)
  })

  it('calculates month lengths including leap years', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29)
    expect(getDaysInMonth(2025, 2)).toBe(28)
    expect(getDaysInMonth(2025, 12)).toBe(31)
  })

  it('calculates adjacent months across year boundaries', () => {
    expect(getAdjacentMonth(2025, 1, -1)).toEqual({ year: 2024, month: 12 })
    expect(getAdjacentMonth(2025, 12, 1)).toEqual({ year: 2026, month: 1 })
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

  it('calculates ISO week numbers across year boundaries', () => {
    expect(getIsoWeekNumber(2025, 1, 1)).toBe(1)
    expect(getIsoWeekNumber(2025, 1, 5)).toBe(1)
    expect(getIsoWeekNumber(2025, 12, 31)).toBe(1)
    expect(getIsoWeekNumber(2026, 1, 1)).toBe(1)
  })
})
