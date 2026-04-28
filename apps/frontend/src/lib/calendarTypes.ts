import { t } from 'i18next'

export interface GridConfig {
  bgColor: string
  bgOpacity: number
  gridOverlayOpacity: number // overall grid overlay opacity (0-100) so background shows through
  gridX: number // px from left
  gridY: number // px from top
  gridWidth: number // px
  gridHeight: number // px
  borderColor: string
  borderWidth: number
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none'
  borderRadius: number
  innerBorderColor: string
  innerBorderWidth: number
  innerBorderStyle: 'solid' | 'dashed' | 'dotted' | 'none'
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
  headerFormat: 'short' | 'medium' | 'long'
  monthTitleShow: boolean
  monthTitleFontFamily: string
  monthTitleFontSize: number
  monthTitleFontColor: string
  monthTitleFontWeight: 'normal' | 'bold'
  monthTitleAlign: 'left' | 'center' | 'right'
  monthTitlePosition: 'top' | 'bottom'
  monthTitleBgColor: string
  monthTitleBgOpacity: number
  monthTitleUppercase: boolean
  showHolidays: boolean
  holidayBgColor: string
  showSaints: boolean
  showEvents: boolean
  showMoonPhase: boolean
}

// A4 page dimensions at 96 DPI (210mm × 297mm)
export const PAGE_WIDTH = 794
export const PAGE_HEIGHT = 1123

// Default grid layout (bottom ~42% of the page)
export const DEFAULT_GRID_X = 16
export const DEFAULT_GRID_Y = 652
export const DEFAULT_GRID_WIDTH = 762
export const DEFAULT_GRID_HEIGHT = 455

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
    imageFilename?: string
    stickerAssetId?: string
    stickerFilename?: string
    stickerX?: number // 0-100 (% from left)
    stickerY?: number // 0-100 (% from top)
    stickerSize?: number // 10-100 (% of cell)
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
    autonomyCode: string | null
  }
  dayCells: DayCell[]
}

export interface Holiday {
  id: string
  year: number
  month: number
  day: number
  nameEs: string
  nameEn: string
  scope: 'NATIONAL' | 'AUTONOMY'
  autonomyCode: string | null
}

export interface CalEvent {
  id: string
  name: string
  day: number
  month: number
  year: number | null
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'SAINT' | 'CUSTOM'
  color: string
  icon: string | null
  isRecurring: boolean
  userId: string
}

export interface Saint {
  day: number
  name: string
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  bgColor: '#FFFFFF',
  bgOpacity: 100,
  gridOverlayOpacity: 90,
  gridX: 16,
  gridY: 652,
  gridWidth: 762,
  gridHeight: 455,
  borderColor: '#E2DDD6',
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: 8,
  innerBorderColor: '#E2DDD6',
  innerBorderWidth: 1,
  innerBorderStyle: 'solid',
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
  headerFormat: 'short',
  monthTitleShow: true,
  monthTitleFontFamily: 'Inter Variable',
  monthTitleFontSize: 24,
  monthTitleFontColor: '#1A1A1A',
  monthTitleFontWeight: 'bold',
  monthTitleAlign: 'center',
  monthTitlePosition: 'top',
  monthTitleBgColor: '#ECE7D8',
  monthTitleBgOpacity: 100,
  monthTitleUppercase: false,
  showHolidays: true,
  holidayBgColor: '#FECACA',
  showSaints: false,
  showEvents: true,
  showMoonPhase: false,
}

export function getMonthNames(): string[] {
  return t('months', { returnObjects: true }) as string[]
}

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

export type WeekdayFormat = 'short' | 'medium' | 'long'

const DAYS_MON = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAYS_SUN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function getWeekdayHeaders(weekStartsOn: string, format: WeekdayFormat = 'short'): string[] {
  const days = weekStartsOn === 'monday' ? DAYS_MON : DAYS_SUN
  return days.map((d) => t(`weekDays.${format}.${d}`))
}
