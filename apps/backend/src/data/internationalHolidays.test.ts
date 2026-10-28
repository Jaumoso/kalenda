import { describe, expect, it } from 'vitest'
import {
  getHolidayCountries,
  getHolidaySupportError,
  getInternationalHolidays,
} from './internationalHolidays.js'

describe('international holiday data', () => {
  it('exposes a stable country configuration', () => {
    expect(getHolidayCountries().map((country) => country.code)).toEqual([
      'ES',
      'US',
      'GB',
      'FR',
      'DE',
      'IT',
    ])
  })

  it('calculates movable holidays without duplicating dates', () => {
    const holidays = getInternationalHolidays(2027, 'US')
    const dates = holidays.map((holiday) => `${holiday.month}-${holiday.day}`)

    expect(dates).toContain('11-25')
    expect(new Set(dates).size).toBe(dates.length)
  })

  it('reports unsupported countries and years clearly', () => {
    expect(getHolidaySupportError(2027, 'XX')).toBe('UNSUPPORTED_COUNTRY')
    expect(getHolidaySupportError(2051, 'US')).toBe('UNSUPPORTED_YEAR')
    expect(getHolidaySupportError(2027, 'US')).toBeNull()
  })
})
