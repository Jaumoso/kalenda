import { getEventRecurrence, type RecurringEventInput } from './recurrence.js'

export type CountdownStatus = 'countdown' | 'missing' | 'expired'

export interface CountdownResult {
  status: CountdownStatus
  daysRemaining: number | null
  targetDate: string | null
}

function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function dateKeyToUtcDay(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`)
}

function isValidOccurrence(year: number, month: number, day: number): boolean {
  return (
    month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
  )
}

function isWithinValidity(event: RecurringEventInput, dateKey: string): boolean {
  const start = event.startDate
    ? typeof event.startDate === 'string'
      ? event.startDate.slice(0, 10)
      : event.startDate.toISOString().slice(0, 10)
    : null
  const end = event.endDate
    ? typeof event.endDate === 'string'
      ? event.endDate.slice(0, 10)
      : event.endDate.toISOString().slice(0, 10)
    : null
  return (!start || dateKey >= start) && (!end || dateKey <= end)
}

function getCandidateDates(
  event: RecurringEventInput,
  projectYear: number,
  today: string
): string[] {
  const recurrence = getEventRecurrence(event)
  const dates: string[] = []

  if (recurrence === 'NONE') {
    if (event.year === projectYear && isValidOccurrence(projectYear, event.month, event.day)) {
      dates.push(
        `${projectYear.toString().padStart(4, '0')}-${event.month
          .toString()
          .padStart(2, '0')}-${event.day.toString().padStart(2, '0')}`
      )
    }
  } else if (recurrence === 'YEARLY' && isValidOccurrence(projectYear, event.month, event.day)) {
    dates.push(
      `${projectYear.toString().padStart(4, '0')}-${event.month
        .toString()
        .padStart(2, '0')}-${event.day.toString().padStart(2, '0')}`
    )
  } else if (recurrence === 'MONTHLY') {
    for (let month = 1; month <= 12; month += 1) {
      const date = new Date(Date.UTC(projectYear, month, 0))
      if (event.day <= date.getUTCDate()) {
        dates.push(
          `${projectYear}-${month.toString().padStart(2, '0')}-${event.day
            .toString()
            .padStart(2, '0')}`
        )
      }
    }
  } else if (event.weekday !== null && event.weekday !== undefined) {
    for (let month = 1; month <= 12; month += 1) {
      const daysInMonth = new Date(Date.UTC(projectYear, month, 0)).getUTCDate()
      for (let day = 1; day <= daysInMonth; day += 1) {
        if (new Date(Date.UTC(projectYear, month - 1, day)).getUTCDay() === event.weekday) {
          dates.push(
            `${projectYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          )
        }
      }
    }
  }

  return dates.filter((date) => isWithinValidity(event, date)).filter((date) => date >= today)
}

export function getHighlightedEventCountdown(
  event: RecurringEventInput | null | undefined,
  projectYear: number,
  now: Date = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
): CountdownResult {
  if (!event) return { status: 'missing', daysRemaining: null, targetDate: null }

  const today = dateKeyInTimeZone(now, timeZone)
  const candidates = getCandidateDates(event, projectYear, today)
  if (candidates.length === 0) {
    return { status: 'expired', daysRemaining: null, targetDate: null }
  }

  const targetDate = candidates.sort()[0]
  return {
    status: 'countdown',
    targetDate,
    daysRemaining: Math.max(
      0,
      Math.round((dateKeyToUtcDay(targetDate) - dateKeyToUtcDay(today)) / 86_400_000)
    ),
  }
}
