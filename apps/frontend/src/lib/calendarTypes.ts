export interface GridConfig {
  bgColor: string
  bgOpacity: number
  borderColor: string
  borderWidth: number
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none'
  dayFontFamily: string
  dayFontSize: number
  dayFontColor: string
  dayFontWeight: 'normal' | 'bold'
  dayPosition: DayPosition
  weekendBgColor: string
  headerFontFamily: string
  headerFontSize: number
  headerFontColor: string
  headerBgColor: string
}

export type DayPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface DayCell {
  id: string
  dayNumber: number
  monthId: string
  bgColor: string | null
  contentJson: {
    text?: string
    imageAssetId?: string
    stickerAssetId?: string
    emoji?: string
  } | null
  hasEvent: boolean
  hasHoliday: boolean
}

export interface MonthData {
  id: string
  month: number
  year: number
  projectId: string
  gridConfigJson: GridConfig | null
  canvasTopJson: unknown
  overlayJson: unknown
  isCustomized: boolean
  project: {
    userId: string
    weekStartsOn: string
    name: string
    year: number
  }
  dayCells: DayCell[]
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  bgColor: '#FFFFFF',
  bgOpacity: 100,
  borderColor: '#E2DDD6',
  borderWidth: 1,
  borderStyle: 'solid',
  dayFontFamily: 'Inter Variable',
  dayFontSize: 14,
  dayFontColor: '#1A1A1A',
  dayFontWeight: 'normal',
  dayPosition: 'top-right',
  weekendBgColor: '#FFF5F5',
  headerFontFamily: 'Inter Variable',
  headerFontSize: 12,
  headerFontColor: '#6B6560',
  headerBgColor: '#F8F7F4',
}

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getFirstDayOfWeek(year: number, month: number, weekStartsOn: string): number {
  const day = new Date(year, month - 1, 1).getDay() // 0=Sun
  if (weekStartsOn === 'monday') {
    return day === 0 ? 6 : day - 1
  }
  return day
}

export function isWeekend(dayNumber: number, year: number, month: number): boolean {
  const d = new Date(year, month - 1, dayNumber)
  const dow = d.getDay()
  return dow === 0 || dow === 6
}

export const WEEKDAY_HEADERS_MON = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const WEEKDAY_HEADERS_SUN = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
