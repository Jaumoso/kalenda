import { prisma } from '../prisma.js'
import { getHolidaySupportError, getInternationalHolidays } from '../data/internationalHolidays.js'
import { generateAutonomyHolidays, generateNationalHolidays } from '../data/holidays.js'

export async function getHolidaysForMonth(
  year: number,
  month: number,
  holidayCountryCode: string,
  autonomyCode: string | null
) {
  const supportError = getHolidaySupportError(year, holidayCountryCode)
  if (supportError) return { holidays: [], supportError }

  if (holidayCountryCode !== 'ES') {
    return {
      holidays: getInternationalHolidays(year, holidayCountryCode)
        .filter((holiday) => holiday.month === month)
        .map((holiday) => ({
          ...holiday,
          id: `${holiday.countryCode}-${holiday.year}-${holiday.month}-${holiday.day}`,
          scope: 'NATIONAL' as const,
          autonomyCode: null,
        })),
      supportError: null,
    }
  }

  const where: Record<string, unknown> = {
    year,
    month,
    countryCode: 'ES',
  }
  if (autonomyCode) {
    where.OR = [
      { scope: 'NATIONAL', countryCode: 'ES' },
      { scope: 'AUTONOMY', autonomyCode, countryCode: 'ES' },
    ]
  } else {
    where.scope = 'NATIONAL'
  }

  const holidays = await prisma.holiday.findMany({
    where,
    orderBy: { day: 'asc' },
  })

  if (holidays.length > 0) {
    return {
      holidays,
      supportError: null,
    }
  }

  const generated = [
    ...generateNationalHolidays(year),
    ...(autonomyCode
      ? generateAutonomyHolidays(year).filter((h) => h.autonomyCode === autonomyCode)
      : []),
  ]
    .filter((holiday) => holiday.month === month)
    .map((holiday) => ({
      ...holiday,
      id: `${holiday.scope}-${holiday.autonomyCode || 'ES'}-${holiday.year}-${holiday.month}-${holiday.day}`,
      countryCode: 'ES',
    }))

  return {
    holidays: generated,
    supportError: null,
  }
}
