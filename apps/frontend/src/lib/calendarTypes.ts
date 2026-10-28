import { t } from 'i18next'
import type { PaperSize, PrintConfig } from '@kalenda/shared'

export type { PaperSize }
export type { PrintConfig }
export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  bleedEnabled: false,
  bleedMm: 3,
  cropMarks: false,
  cropMarkLengthMm: 10,
  cropMarkOffsetMm: 2,
}

export const PAPER_DIMENSIONS = {
  A4: {
    widthMm: 210,
    heightMm: 297,
    widthPx: 794,
    heightPx: 1123,
    widthPt: 595.28,
    heightPt: 841.89,
  },
  A3: {
    widthMm: 297,
    heightMm: 420,
    widthPx: 1123,
    heightPx: 1587,
    widthPt: 841.89,
    heightPt: 1190.55,
  },
  A5: {
    widthMm: 148,
    heightMm: 210,
    widthPx: 559,
    heightPx: 794,
    widthPt: 419.53,
    heightPt: 595.28,
  },
  LETTER: {
    widthMm: 216,
    heightMm: 279,
    widthPx: 816,
    heightPx: 1056,
    widthPt: 612,
    heightPt: 792,
  },
} as const

export interface GridConfig {
  layoutPaperSize?: PaperSize
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
  showWeekNumbers: boolean
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
  miniCalendarShow: boolean
  miniCalendarX: number
  miniCalendarY: number
  miniCalendarWidth: number
  miniCalendarHeight: number
  miniCalendarBgColor: string
  miniCalendarBgOpacity: number
  miniCalendarBorderColor: string
  miniCalendarBorderWidth: number
  miniCalendarFontSize: number
}

// A4 page dimensions at 96 DPI (210mm × 297mm), kept for backwards compatibility.
export const PAGE_WIDTH = PAPER_DIMENSIONS.A4.widthPx
export const PAGE_HEIGHT = PAPER_DIMENSIONS.A4.heightPx

export function getPaperDimensions(paperSize: PaperSize = 'A4') {
  return PAPER_DIMENSIONS[paperSize] ?? PAPER_DIMENSIONS.A4
}

export function getBleedPixels(config: Partial<PrintConfig> | null | undefined): number {
  if (!config?.bleedEnabled) return 0
  return Math.round(
    (Math.min(Math.max(config.bleedMm ?? DEFAULT_PRINT_CONFIG.bleedMm, 0), 10) / 25.4) * 96
  )
}

export function scaleGridConfig(config: GridConfig, paperSize: PaperSize): GridConfig {
  const dimensions = getPaperDimensions(paperSize)
  const scaleX = dimensions.widthPx / PAGE_WIDTH
  const scaleY = dimensions.heightPx / PAGE_HEIGHT
  return {
    ...config,
    layoutPaperSize: paperSize,
    gridX: Math.round(config.gridX * scaleX),
    gridY: Math.round(config.gridY * scaleY),
    gridWidth: Math.round(config.gridWidth * scaleX),
    gridHeight: Math.round(config.gridHeight * scaleY),
    miniCalendarX: Math.round(config.miniCalendarX * scaleX),
    miniCalendarY: Math.round(config.miniCalendarY * scaleY),
    miniCalendarWidth: Math.round(config.miniCalendarWidth * scaleX),
    miniCalendarHeight: Math.round(config.miniCalendarHeight * scaleY),
    dayFontSize: Math.max(8, Math.round(config.dayFontSize * Math.min(scaleX, scaleY))),
    headerFontSize: Math.max(8, Math.round(config.headerFontSize * Math.min(scaleX, scaleY))),
    monthTitleFontSize: Math.max(
      12,
      Math.round(config.monthTitleFontSize * Math.min(scaleX, scaleY))
    ),
    miniCalendarFontSize: Math.max(
      6,
      Math.round(config.miniCalendarFontSize * Math.min(scaleX, scaleY))
    ),
  }
}

export function getGridConfigForPaper(
  storedConfig: Partial<GridConfig> | null | undefined,
  paperSize: PaperSize
): GridConfig {
  const merged = { ...DEFAULT_GRID_CONFIG, ...(storedConfig ?? {}) }
  return merged.layoutPaperSize === paperSize ? merged : scaleGridConfig(merged, paperSize)
}

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
    printConfigJson?: PrintConfig
    paperSize: PaperSize
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
  recurrence?: 'NONE' | 'YEARLY' | 'MONTHLY' | 'WEEKLY'
  weekday?: number | null
  startDate?: string | null
  endDate?: string | null
  userId: string
}

export function getEventRecurrence(event: Pick<CalEvent, 'isRecurring' | 'recurrence'>) {
  return event.recurrence ?? (event.isRecurring ? 'YEARLY' : 'NONE')
}

export interface Saint {
  day: number
  name: string
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  layoutPaperSize: 'A4',
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
  showWeekNumbers: false,
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
  miniCalendarShow: false,
  miniCalendarX: 588,
  miniCalendarY: 20,
  miniCalendarWidth: 190,
  miniCalendarHeight: 86,
  miniCalendarBgColor: '#FFFFFF',
  miniCalendarBgOpacity: 92,
  miniCalendarBorderColor: '#E2DDD6',
  miniCalendarBorderWidth: 1,
  miniCalendarFontSize: 8,
}

export function getMonthNames(): string[] {
  return t('months', { returnObjects: true }) as string[]
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getAdjacentMonth(year: number, month: number, direction: -1 | 1) {
  const date = new Date(year, month - 1 + direction, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
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

/** Return the ISO 8601 week number for a calendar date. */
export function getIsoWeekNumber(year: number, month: number, day: number): number {
  const date = new Date(Date.UTC(year, month - 1, day))
  const dayOfWeek = date.getUTCDay() || 7

  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek)

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

export type WeekdayFormat = 'short' | 'medium' | 'long'

const DAYS_MON = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAYS_SUN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function getWeekdayHeaders(weekStartsOn: string, format: WeekdayFormat = 'short'): string[] {
  const days = weekStartsOn === 'monday' ? DAYS_MON : DAYS_SUN
  return days.map((d) => t(`weekDays.${format}.${d}`))
}
