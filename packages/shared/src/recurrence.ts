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
  userId: string
  createdAt?: Date
}

export function getEventRecurrence(event: Pick<RecurringEventInput, 'isRecurring' | 'recurrence'>) {
  return event.recurrence ?? (event.isRecurring ? 'YEARLY' : 'NONE')
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
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
    return event.month === month && event.day <= getDaysInMonth(year, month) ? [event] : []
  }

  if (recurrence === 'MONTHLY') {
    return event.day <= getDaysInMonth(year, month) ? [{ ...event, month } as T] : []
  }

  if (event.weekday === null || event.weekday === undefined) return []

  const occurrences: T[] = []
  for (let day = 1; day <= getDaysInMonth(year, month); day += 1) {
    if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() === event.weekday) {
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
