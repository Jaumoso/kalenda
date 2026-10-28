export type EventRecurrence = 'NONE' | 'YEARLY' | 'MONTHLY' | 'WEEKLY'

export interface RecurringEventInput {
  id: string
  name: string
  day: number
  month: number
  year: number | null
  type: string
  color: string
  icon: string | null
  isRecurring: boolean
  recurrence?: EventRecurrence | null
  weekday?: number | null
  startDate?: Date | string | null
  endDate?: Date | string | null
  userId: string
  createdAt?: Date
}

export function getEventRecurrence(event: Pick<RecurringEventInput, 'isRecurring' | 'recurrence'>) {
  return event.recurrence ?? (event.isRecurring ? 'YEARLY' : 'NONE')
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function dateKey(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

function isWithinRange(
  event: RecurringEventInput,
  year: number,
  month: number,
  day: number
): boolean {
  const occurrence = `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  const start = dateKey(event.startDate)
  const end = dateKey(event.endDate)
  return (!start || occurrence >= start) && (!end || occurrence <= end)
}

export function expandEventForMonth<T extends RecurringEventInput>(
  event: T,
  year: number,
  month: number
): T[] {
  const recurrence = getEventRecurrence(event)

  if (recurrence === 'NONE') {
    return event.year === year && event.month === month ? [event] : []
  }

  if (recurrence === 'YEARLY') {
    return event.month === month &&
      event.day <= getDaysInMonth(year, month) &&
      isWithinRange(event, year, month, event.day)
      ? [event]
      : []
  }

  if (recurrence === 'MONTHLY') {
    return event.day <= getDaysInMonth(year, month) && isWithinRange(event, year, month, event.day)
      ? [{ ...event, month } as T]
      : []
  }

  if (event.weekday === null || event.weekday === undefined) return []

  const occurrences: T[] = []
  for (let day = 1; day <= getDaysInMonth(year, month); day += 1) {
    if (
      new Date(Date.UTC(year, month - 1, day)).getUTCDay() === event.weekday &&
      isWithinRange(event, year, month, day)
    ) {
      occurrences.push({ ...event, day, month } as T)
    }
  }
  return occurrences
}

export function expandEventsForMonth<T extends RecurringEventInput>(
  events: T[],
  year: number,
  month: number
): T[] {
  return events.flatMap((event) => expandEventForMonth(event, year, month))
}
