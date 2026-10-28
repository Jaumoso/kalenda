import { describe, expect, it } from 'vitest'
import { expandEventForMonth, expandEventsForMonth } from './recurrence'

const baseEvent: {
  id: string
  name: string
  day: number
  month: number
  year: number | null
  type: string
  color: string
  icon: string | null
  isRecurring: boolean
  startDate: string | null
  endDate: string | null
  userId: string
} = {
  id: 'event-1',
  name: 'Team sync',
  day: 15,
  month: 1,
  year: null,
  type: 'CUSTOM',
  color: '#000000',
  icon: null,
  isRecurring: true,
  startDate: null,
  endDate: null,
  userId: 'user-1',
}

describe('event recurrence expansion', () => {
  it('expands a monthly event on the configured day', () => {
    const occurrences = expandEventForMonth(
      { ...baseEvent, recurrence: 'MONTHLY' as const },
      2026,
      2
    )

    expect(occurrences).toHaveLength(1)
    expect(occurrences[0].day).toBe(15)
    expect(occurrences[0].month).toBe(2)
  })

  it('does not render a monthly day that does not exist', () => {
    const occurrences = expandEventForMonth(
      { ...baseEvent, day: 31, recurrence: 'MONTHLY' as const },
      2026,
      2
    )

    expect(occurrences).toHaveLength(0)
  })

  it('expands weekly events to every matching weekday', () => {
    const occurrences = expandEventForMonth(
      { ...baseEvent, recurrence: 'WEEKLY' as const, weekday: 1 },
      2026,
      2
    )

    expect(occurrences.map((event) => event.day)).toEqual([2, 9, 16, 23])
    expect(occurrences.every((event) => event.month === 2)).toBe(true)
  })

  it('keeps one-time events limited to their date', () => {
    const event = { ...baseEvent, isRecurring: false, recurrence: 'NONE' as const, year: 2026 }

    expect(expandEventsForMonth([event], 2026, 1)).toHaveLength(1)
    expect(expandEventsForMonth([event], 2026, 2)).toHaveLength(0)
  })

  it('limits recurring events to their validity range', () => {
    const event = {
      ...baseEvent,
      recurrence: 'YEARLY' as const,
      month: 1,
      day: 2,
      startDate: '2027-01-02',
      endDate: '2028-12-31',
    }

    expect(expandEventForMonth(event, 2026, 1)).toHaveLength(0)
    expect(expandEventForMonth(event, 2027, 1)).toHaveLength(1)
    expect(expandEventForMonth(event, 2028, 1)).toHaveLength(1)
    expect(expandEventForMonth(event, 2029, 1)).toHaveLength(0)
  })

  it('limits monthly occurrences by the configured month range', () => {
    const event = {
      ...baseEvent,
      day: 15,
      recurrence: 'MONTHLY' as const,
      startDate: '2027-03-01',
      endDate: '2027-05-31',
    }

    expect(expandEventForMonth(event, 2027, 2)).toHaveLength(0)
    expect(expandEventForMonth(event, 2027, 3)).toHaveLength(1)
    expect(expandEventForMonth(event, 2027, 5)).toHaveLength(1)
    expect(expandEventForMonth(event, 2027, 6)).toHaveLength(0)
  })

  it('limits weekly occurrences to complete date boundaries', () => {
    const event = {
      ...baseEvent,
      recurrence: 'WEEKLY' as const,
      weekday: 1,
      startDate: '2026-02-09',
      endDate: '2026-02-16',
    }

    expect(expandEventForMonth(event, 2026, 2).map((occurrence) => occurrence.day)).toEqual([9, 16])
    expect(expandEventForMonth(event, 2026, 3)).toHaveLength(0)
  })
})
