export interface InternationalHoliday {
  year: number
  month: number
  day: number
  nameEs: string
  nameEn: string
  countryCode: string
}

interface HolidayDefinition {
  month: number
  day?: number
  nameEs: string
  nameEn: string
  getDay?: (year: number) => { month: number; day: number }
}

const COUNTRY_NAMES = {
  ES: { nameEs: 'España', nameEn: 'Spain' },
  US: { nameEs: 'Estados Unidos', nameEn: 'United States' },
  GB: { nameEs: 'Reino Unido', nameEn: 'United Kingdom' },
  FR: { nameEs: 'Francia', nameEn: 'France' },
  DE: { nameEs: 'Alemania', nameEn: 'Germany' },
  IT: { nameEs: 'Italia', nameEn: 'Italy' },
} as const

const MIN_SUPPORTED_YEAR = 2020
const MAX_SUPPORTED_YEAR = 2050

function getEasterDate(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

function offsetFromEaster(year: number, offset: number) {
  const easter = getEasterDate(year)
  const date = new Date(Date.UTC(year, easter.month - 1, easter.day + offset))
  return { month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

function nthWeekday(year: number, month: number, weekday: number, occurrence: number) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  return 1 + ((weekday - first + 7) % 7) + (occurrence - 1) * 7
}

function lastWeekday(year: number, month: number, weekday: number) {
  const last = new Date(Date.UTC(year, month, 0))
  return last.getUTCDate() - ((last.getUTCDay() - weekday + 7) % 7)
}

const FIXED: Record<string, HolidayDefinition[]> = {
  ES: [],
  US: [
    { month: 1, day: 1, nameEs: 'Año Nuevo', nameEn: "New Year's Day" },
    { month: 6, day: 19, nameEs: 'Juneteenth', nameEn: 'Juneteenth' },
    { month: 7, day: 4, nameEs: 'Día de la Independencia', nameEn: 'Independence Day' },
    { month: 11, day: 11, nameEs: 'Día de los Veteranos', nameEn: 'Veterans Day' },
    { month: 12, day: 25, nameEs: 'Navidad', nameEn: 'Christmas Day' },
  ],
  GB: [
    { month: 1, day: 1, nameEs: 'Año Nuevo', nameEn: "New Year's Day" },
    { month: 12, day: 25, nameEs: 'Navidad', nameEn: 'Christmas Day' },
    { month: 12, day: 26, nameEs: 'Día de San Esteban', nameEn: 'Boxing Day' },
  ],
  FR: [
    { month: 1, day: 1, nameEs: 'Año Nuevo', nameEn: "New Year's Day" },
    { month: 5, day: 1, nameEs: 'Día del Trabajo', nameEn: 'Labour Day' },
    { month: 5, day: 8, nameEs: 'Victoria de 1945', nameEn: 'Victory in Europe Day' },
    { month: 7, day: 14, nameEs: 'Fiesta Nacional', nameEn: 'Bastille Day' },
    { month: 8, day: 15, nameEs: 'Asunción', nameEn: 'Assumption of Mary' },
    { month: 11, day: 1, nameEs: 'Todos los Santos', nameEn: "All Saints' Day" },
    { month: 11, day: 11, nameEs: 'Armisticio de 1918', nameEn: 'Armistice Day' },
    { month: 12, day: 25, nameEs: 'Navidad', nameEn: 'Christmas Day' },
  ],
  DE: [
    { month: 1, day: 1, nameEs: 'Año Nuevo', nameEn: "New Year's Day" },
    { month: 5, day: 1, nameEs: 'Día del Trabajo', nameEn: 'Labour Day' },
    { month: 10, day: 3, nameEs: 'Día de la Unidad Alemana', nameEn: 'German Unity Day' },
    { month: 12, day: 25, nameEs: 'Navidad', nameEn: 'Christmas Day' },
    { month: 12, day: 26, nameEs: 'Día de San Esteban', nameEn: "St. Stephen's Day" },
  ],
  IT: [
    { month: 1, day: 1, nameEs: 'Año Nuevo', nameEn: "New Year's Day" },
    { month: 1, day: 6, nameEs: 'Epifanía', nameEn: 'Epiphany' },
    { month: 4, day: 25, nameEs: 'Día de la Liberación', nameEn: 'Liberation Day' },
    { month: 5, day: 1, nameEs: 'Día del Trabajo', nameEn: 'Labour Day' },
    { month: 6, day: 2, nameEs: 'Día de la República', nameEn: 'Republic Day' },
    { month: 8, day: 15, nameEs: 'Ferragosto', nameEn: 'Ferragosto' },
    { month: 11, day: 1, nameEs: 'Todos los Santos', nameEn: "All Saints' Day" },
    { month: 12, day: 8, nameEs: 'Inmaculada Concepción', nameEn: 'Immaculate Conception' },
    { month: 12, day: 25, nameEs: 'Navidad', nameEn: 'Christmas Day' },
    { month: 12, day: 26, nameEs: 'Día de San Esteban', nameEn: "St. Stephen's Day" },
  ],
}

const COMPUTED: Record<string, (year: number) => HolidayDefinition[]> = {
  ES: () => [],
  US: (year) => [
    {
      month: 1,
      nameEs: 'Día de Martin Luther King Jr.',
      nameEn: 'Martin Luther King Jr. Day',
      getDay: () => ({ month: 1, day: nthWeekday(year, 1, 1, 3) }),
    },
    {
      month: 2,
      nameEs: 'Día de los Presidentes',
      nameEn: "Presidents' Day",
      getDay: () => ({ month: 2, day: nthWeekday(year, 2, 1, 3) }),
    },
    {
      month: 5,
      nameEs: 'Día de los Caídos',
      nameEn: 'Memorial Day',
      getDay: () => ({ month: 5, day: lastWeekday(year, 5, 1) }),
    },
    {
      month: 9,
      nameEs: 'Día del Trabajo',
      nameEn: 'Labour Day',
      getDay: () => ({ month: 9, day: nthWeekday(year, 9, 1, 1) }),
    },
    {
      month: 10,
      nameEs: 'Día de Colón',
      nameEn: 'Columbus Day',
      getDay: () => ({ month: 10, day: nthWeekday(year, 10, 1, 2) }),
    },
    {
      month: 11,
      nameEs: 'Día de Acción de Gracias',
      nameEn: 'Thanksgiving Day',
      getDay: () => ({ month: 11, day: nthWeekday(year, 11, 4, 4) }),
    },
  ],
  GB: (year) => [
    {
      month: 3,
      nameEs: 'Viernes Santo',
      nameEn: 'Good Friday',
      getDay: () => offsetFromEaster(year, -2),
    },
    {
      month: 3,
      nameEs: 'Lunes de Pascua',
      nameEn: 'Easter Monday',
      getDay: () => offsetFromEaster(year, 1),
    },
    {
      month: 5,
      nameEs: 'Festivo de principios de mayo',
      nameEn: 'Early May Bank Holiday',
      getDay: () => ({ month: 5, day: nthWeekday(year, 5, 1, 1) }),
    },
    {
      month: 5,
      nameEs: 'Festivo de primavera',
      nameEn: 'Spring Bank Holiday',
      getDay: () => ({ month: 5, day: lastWeekday(year, 5, 1) }),
    },
    {
      month: 8,
      nameEs: 'Festivo de verano',
      nameEn: 'Summer Bank Holiday',
      getDay: () => ({ month: 8, day: lastWeekday(year, 8, 1) }),
    },
  ],
  FR: (year) => [
    {
      month: 4,
      nameEs: 'Lunes de Pascua',
      nameEn: 'Easter Monday',
      getDay: () => offsetFromEaster(year, 1),
    },
    {
      month: 5,
      nameEs: 'Ascensión',
      nameEn: 'Ascension Day',
      getDay: () => offsetFromEaster(year, 39),
    },
    {
      month: 5,
      nameEs: 'Lunes de Pentecostés',
      nameEn: 'Whit Monday',
      getDay: () => offsetFromEaster(year, 50),
    },
  ],
  DE: (year) => [
    {
      month: 3,
      nameEs: 'Viernes Santo',
      nameEn: 'Good Friday',
      getDay: () => offsetFromEaster(year, -2),
    },
    {
      month: 3,
      nameEs: 'Lunes de Pascua',
      nameEn: 'Easter Monday',
      getDay: () => offsetFromEaster(year, 1),
    },
    {
      month: 5,
      nameEs: 'Día de la Ascensión',
      nameEn: 'Ascension Day',
      getDay: () => offsetFromEaster(year, 39),
    },
    {
      month: 5,
      nameEs: 'Lunes de Pentecostés',
      nameEn: 'Whit Monday',
      getDay: () => offsetFromEaster(year, 50),
    },
  ],
  IT: (year) => [
    {
      month: 4,
      nameEs: 'Lunes de Pascua',
      nameEn: 'Easter Monday',
      getDay: () => offsetFromEaster(year, 1),
    },
  ],
}

export function getHolidayCountries() {
  return Object.entries(COUNTRY_NAMES).map(([code, names]) => ({ code, ...names }))
}

export function isSupportedHolidayCountry(countryCode: string): boolean {
  return countryCode in COUNTRY_NAMES
}

export function getInternationalHolidays(
  year: number,
  countryCode: string
): InternationalHoliday[] {
  if (
    year < MIN_SUPPORTED_YEAR ||
    year > MAX_SUPPORTED_YEAR ||
    !isSupportedHolidayCountry(countryCode) ||
    countryCode === 'ES'
  ) {
    return []
  }

  const definitions = [...(FIXED[countryCode] || []), ...(COMPUTED[countryCode]?.(year) || [])]
  return definitions.map((holiday) => {
    const date = holiday.getDay?.(year) || { month: holiday.month, day: holiday.day! }
    return { year, ...date, nameEs: holiday.nameEs, nameEn: holiday.nameEn, countryCode }
  })
}

export function getHolidaySupportError(year: number, countryCode: string): string | null {
  if (!isSupportedHolidayCountry(countryCode)) return 'UNSUPPORTED_COUNTRY'
  if (year < MIN_SUPPORTED_YEAR || year > MAX_SUPPORTED_YEAR) return 'UNSUPPORTED_YEAR'
  return null
}
