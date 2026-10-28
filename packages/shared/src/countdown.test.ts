import { describe, expect, it } from 'vitest'
import { getHighlightedEventCountdown } from './countdown'

const baseEvent = {
  id: 'event-1',
  name: 'Birthday',
  day: 20,
  month: 6,
  year: null,
  type: 'CUSTOM',
  color: '#000000',
  icon: null,
  isRecurring: true,
  recurrence: 'YEARLY' as const,
  userId: 'user-1',
}

describe('getHighlightedEventCountdown', () => {
  it('calculates date-only days across daylight-saving changes', () => {
    expect(
      getHighlightedEventCountdown(
        baseEvent,
        2027,
        new Date('2027-03-27T23:30:00Z'),
        'Europe/Madrid'
      )
    ).toMatchObject({ status: 'countdown', daysRemaining: 84, targetDate: '2027-06-20' })
  })

  it('returns missing when no event is selected', () => {
    expect(getHighlightedEventCountdown(null, 2027)).toEqual({
      status: 'missing',
      daysRemaining: null,
      targetDate: null,
    })
  })

  it('returns expired when the event has no future occurrence', () => {
    expect(
      getHighlightedEventCountdown(
        { ...baseEvent, startDate: '2020-01-01', endDate: '2026-01-01' },
        2027,
        new Date('2027-01-02T12:00:00Z'),
        'UTC'
      )
    ).toMatchObject({ status: 'expired' })
  })

  it('does not create an invalid leap-day occurrence', () => {
    expect(
      getHighlightedEventCountdown(
        { ...baseEvent, day: 29, month: 2 },
        2027,
        new Date('2027-01-01T12:00:00Z'),
        'UTC'
      )
    ).toMatchObject({ status: 'expired' })
  })
})
