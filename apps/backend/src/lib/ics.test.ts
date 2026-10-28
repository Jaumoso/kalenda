import { describe, expect, it } from 'vitest'
import { parseIcs } from './ics.js'

describe('parseIcs', () => {
  it('parses all-day one-time and yearly events', () => {
    const result = parseIcs(
      [
        'BEGIN:VCALENDAR',
        'BEGIN:VEVENT',
        'UID:one@example.com',
        'DTSTART;VALUE=DATE:20261028',
        'SUMMARY:Launch day',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:year@example.com',
        'DTSTART;VALUE=DATE:20260115',
        'RRULE:FREQ=YEARLY;UNTIL=20281231',
        'SUMMARY:Birthday\\, Ana',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n')
    )

    expect(result.errors).toEqual([])
    expect(result.events).toEqual([
      expect.objectContaining({
        name: 'Launch day',
        day: 28,
        month: 10,
        year: 2026,
        recurrence: 'NONE',
        sourceUid: 'one@example.com',
      }),
      expect.objectContaining({
        name: 'Birthday, Ana',
        day: 15,
        month: 1,
        recurrence: 'YEARLY',
        startDate: '2026-01-15',
        endDate: '2028-12-31',
      }),
    ])
  })

  it('parses weekly recurrence and reports unsupported rules', () => {
    const result = parseIcs(
      [
        'BEGIN:VEVENT',
        'DTSTART:20260105T090000Z',
        'RRULE:FREQ=WEEKLY;BYDAY=MO',
        'SUMMARY:Weekly meeting',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'DTSTART;VALUE=DATE:20260101',
        'RRULE:FREQ=DAILY',
        'SUMMARY:Unsupported',
        'END:VEVENT',
      ].join('\n')
    )

    expect(result.events[0]).toEqual(
      expect.objectContaining({ recurrence: 'WEEKLY', weekday: 1, startDate: '2026-01-05' })
    )
    expect(result.errors).toEqual(['Event "Unsupported" uses an unsupported RRULE'])
  })

  it('accepts the monthly BYMONTHDAY form commonly exported by Google Calendar', () => {
    const result = parseIcs(
      [
        'BEGIN:VEVENT',
        'DTSTART;VALUE=DATE:20260115',
        'RRULE:FREQ=MONTHLY;BYMONTHDAY=15',
        'SUMMARY:Monthly payment',
        'END:VEVENT',
      ].join('\n')
    )

    expect(result.errors).toEqual([])
    expect(result.events[0]).toEqual(expect.objectContaining({ recurrence: 'MONTHLY', day: 15 }))
  })
})
