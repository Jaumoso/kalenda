/**
 * Moon phase calculation using a simplified algorithm.
 * Based on Conway's method — accurate enough for calendar display.
 *
 * Returns the moon phase emoji for a given date.
 */

export type MoonPhase =
  | 'new' // 🌑
  | 'waxing-crescent' // 🌒
  | 'first-quarter' // 🌓
  | 'waxing-gibbous' // 🌔
  | 'full' // 🌕
  | 'waning-gibbous' // 🌖
  | 'last-quarter' // 🌗
  | 'waning-crescent' // 🌘

const MOON_EMOJIS: Record<MoonPhase, string> = {
  new: '🌑',
  'waxing-crescent': '🌒',
  'first-quarter': '🌓',
  'waxing-gibbous': '🌔',
  full: '🌕',
  'waning-gibbous': '🌖',
  'last-quarter': '🌗',
  'waning-crescent': '🌘',
}

/** Synodic month length in days */
const SYNODIC_MONTH = 29.53058770576

/** Known new moon reference: January 6, 2000 18:14 UTC */
const KNOWN_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime()

/**
 * Get the age of the moon (days since last new moon) for a given date.
 * Returns a value between 0 and ~29.53.
 */
function getMoonAge(year: number, month: number, day: number): number {
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const diff = date.getTime() - KNOWN_NEW_MOON
  const daysSinceNewMoon = diff / (1000 * 60 * 60 * 24)
  const age = daysSinceNewMoon % SYNODIC_MONTH
  return age < 0 ? age + SYNODIC_MONTH : age
}

/**
 * Get the moon phase for a given date.
 */
export function getMoonPhase(year: number, month: number, day: number): MoonPhase {
  const age = getMoonAge(year, month, day)
  const fraction = age / SYNODIC_MONTH

  if (fraction < 0.0625) return 'new'
  if (fraction < 0.1875) return 'waxing-crescent'
  if (fraction < 0.3125) return 'first-quarter'
  if (fraction < 0.4375) return 'waxing-gibbous'
  if (fraction < 0.5625) return 'full'
  if (fraction < 0.6875) return 'waning-gibbous'
  if (fraction < 0.8125) return 'last-quarter'
  if (fraction < 0.9375) return 'waning-crescent'
  return 'new'
}

/**
 * Get the moon emoji for a given date.
 */
export function getMoonEmoji(year: number, month: number, day: number): string {
  return MOON_EMOJIS[getMoonPhase(year, month, day)]
}

/**
 * Check if a date has a "notable" moon phase (new, first quarter, full, last quarter).
 * These are the 4 primary phases shown on most calendars.
 */
export function isNotableMoonPhase(year: number, month: number, day: number): boolean {
  const phase = getMoonPhase(year, month, day)
  return (
    phase === 'new' || phase === 'first-quarter' || phase === 'full' || phase === 'last-quarter'
  )
}
