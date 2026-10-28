import { createHash } from 'node:crypto'

export interface IcsImportEvent {
  name: string
  day: number
  month: number
  year: number | null
  recurrence: 'NONE' | 'YEARLY' | 'MONTHLY' | 'WEEKLY'
  weekday: number | null
  startDate: string | null
  endDate: string | null
  sourceUid: string
}

export interface IcsParseResult {
  events: IcsImportEvent[]
  errors: string[]
}

interface IcsProperty {
  name: string
  value: string
  parameters: Record<string, string>
}

const WEEKDAY_BY_NAME: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
}

function unfold(content: string): string[] {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const unfolded: string[] = []
  for (const line of lines) {
    if (/^[ \t]/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1)
    } else {
      unfolded.push(line)
    }
  }
  return unfolded
}

function parseProperty(line: string): IcsProperty | null {
  const separator = line.indexOf(':')
  if (separator <= 0) return null
  const [nameAndParameters, value] = [line.slice(0, separator), line.slice(separator + 1)]
  const [rawName, ...rawParameters] = nameAndParameters.split(';')
  const parameters: Record<string, string> = {}
  for (const parameter of rawParameters) {
    const equals = parameter.indexOf('=')
    if (equals > 0)
      parameters[parameter.slice(0, equals).toUpperCase()] = parameter.slice(equals + 1)
  }
  return { name: rawName.toUpperCase(), value, parameters }
}

function unescape(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

function parseDate(value: string): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

function dateParts(date: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return null
  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  const parsed = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  return parsed.getUTCFullYear() === parts.year &&
    parsed.getUTCMonth() === parts.month - 1 &&
    parsed.getUTCDate() === parts.day
    ? parts
    : null
}

function fingerprint(summary: string, start: string, recurrence: string): string {
  return `kalenda:${createHash('sha1').update(`${summary}\u0000${start}\u0000${recurrence}`).digest('hex')}`
}

function parseRule(
  rule: string,
  start: { month: number; day: number }
): {
  frequency: 'YEARLY' | 'MONTHLY' | 'WEEKLY'
  until: string | null
  weekday: number | null
} | null {
  const values = new Map<string, string>()
  for (const part of rule.split(';')) {
    const [key, value] = part.split('=')
    if (key && value) values.set(key.toUpperCase(), value.toUpperCase())
  }
  const frequency = values.get('FREQ')
  if (frequency !== 'YEARLY' && frequency !== 'MONTHLY' && frequency !== 'WEEKLY') return null
  if (values.get('INTERVAL') && values.get('INTERVAL') !== '1') return null
  for (const key of ['BYHOUR', 'BYMINUTE', 'BYSECOND', 'BYSETPOS', 'COUNT']) {
    if (values.has(key)) return null
  }
  if (values.get('BYMONTH') && values.get('BYMONTH') !== String(start.month)) return null
  if (values.get('BYMONTHDAY') && values.get('BYMONTHDAY') !== String(start.day)) return null
  const byDay = values.get('BYDAY')
  if (frequency === 'WEEKLY' && byDay && WEEKDAY_BY_NAME[byDay] === undefined) return null
  if (frequency !== 'WEEKLY' && byDay) return null
  return {
    frequency,
    until: values.get('UNTIL') ? parseDate(values.get('UNTIL')!) : null,
    weekday: byDay ? WEEKDAY_BY_NAME[byDay] : null,
  }
}

export function parseIcs(content: string): IcsParseResult {
  const lines = unfold(content)
  const events: IcsImportEvent[] = []
  const errors: string[] = []
  let current: IcsProperty[] | null = null

  const flush = () => {
    if (!current) return
    const properties = new Map(current.map((property) => [property.name, property]))
    const summary = properties.get('SUMMARY')?.value
    const startProperty = properties.get('DTSTART')
    if (!summary || !startProperty) {
      errors.push('VEVENT is missing SUMMARY or DTSTART')
      current = null
      return
    }
    const start = parseDate(startProperty.value)
    const parts = start ? dateParts(start) : null
    if (!start || !parts) {
      errors.push(`Event "${unescape(summary)}" has an invalid DTSTART`)
      current = null
      return
    }
    const ruleProperty = properties.get('RRULE')
    const recurrence = ruleProperty ? parseRule(ruleProperty.value, parts) : null
    if (ruleProperty && !recurrence) {
      errors.push(`Event "${unescape(summary)}" uses an unsupported RRULE`)
      current = null
      return
    }
    if (properties.has('EXDATE') || properties.has('RDATE')) {
      errors.push(`Event "${unescape(summary)}" uses unsupported EXDATE or RDATE rules`)
      current = null
      return
    }
    const frequency = recurrence?.frequency ?? 'NONE'
    const uid =
      unescape(properties.get('UID')?.value || '') || fingerprint(summary, start, frequency)
    const endDate = recurrence?.until ?? null
    events.push({
      name: unescape(summary).slice(0, 100),
      day: frequency === 'WEEKLY' ? 1 : parts.day,
      month: frequency === 'YEARLY' || frequency === 'NONE' ? parts.month : 1,
      year: frequency === 'NONE' ? parts.year : null,
      recurrence: frequency,
      weekday:
        frequency === 'WEEKLY'
          ? (recurrence?.weekday ?? new Date(`${start}T00:00:00Z`).getUTCDay())
          : null,
      startDate: frequency === 'NONE' ? null : start,
      endDate,
      sourceUid: uid.slice(0, 512),
    })
    current = null
  }

  for (const line of lines) {
    if (line.toUpperCase() === 'BEGIN:VEVENT') current = []
    else if (line.toUpperCase() === 'END:VEVENT') flush()
    else if (current) {
      const property = parseProperty(line)
      if (property) current.push(property)
    }
  }
  if (current) errors.push('ICS file contains an incomplete VEVENT')
  return { events, errors }
}
