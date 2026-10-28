// Tipos compartidos entre frontend y backend
export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
  language?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  userId: string
  name: string
  year: number
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  weekStartsOn: 'monday' | 'sunday'
  paperSize: PaperSize
  printConfigJson?: PrintConfig
  holidayCountryCode: string
  autonomyCode?: string
  templateId?: string
  highlightedEventId?: string | null
  countdownEventIds?: string[]
  countdownEvents?: HighlightedEvent[]
  createdAt: Date
  updatedAt: Date
}

export type PaperSize = 'A4' | 'A3' | 'A5' | 'LETTER'

export interface PrintConfig {
  bleedEnabled: boolean
  bleedMm: number
  cropMarks: boolean
  cropMarkLengthMm: number
  cropMarkOffsetMm: number
}

export interface PrintGeometry {
  bleedPx: number
  cropMarginPx: number
  contentOffsetPx: number
  outputWidthPx: number
  outputHeightPx: number
}

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  bleedEnabled: false,
  bleedMm: 3,
  cropMarks: false,
  cropMarkLengthMm: 10,
  cropMarkOffsetMm: 2,
}

export function getPrintGeometry(
  config: Partial<PrintConfig> | null | undefined,
  paper: Pick<PaperDimensions, 'widthPx' | 'heightPx'>
): PrintGeometry {
  const resolved = { ...DEFAULT_PRINT_CONFIG, ...(config ?? {}) }
  const bleedPx = resolved.bleedEnabled ? Math.round((resolved.bleedMm / 25.4) * 96) : 0
  const cropLengthPx = (resolved.cropMarkLengthMm / 25.4) * 96
  const cropOffsetPx = (resolved.cropMarkOffsetMm / 25.4) * 96
  const cropMarginPx = resolved.cropMarks ? Math.ceil(cropLengthPx + cropOffsetPx) : 0
  const contentOffsetPx = cropMarginPx + bleedPx
  return {
    bleedPx,
    cropMarginPx,
    contentOffsetPx,
    outputWidthPx: paper.widthPx + 2 * contentOffsetPx,
    outputHeightPx: paper.heightPx + 2 * contentOffsetPx,
  }
}

export interface PaperDimensions {
  widthMm: number
  heightMm: number
  widthPx: number
  heightPx: number
  widthPt: number
  heightPt: number
}

export const PAPER_DIMENSIONS: Record<PaperSize, PaperDimensions> = {
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
}

export interface HighlightedEvent {
  id: string
  name: string
  day: number
  month: number
  year: number | null
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'SAINT' | 'CUSTOM'
  color: string
  icon?: string | null
  userId: string
  recurrence?: 'NONE' | 'YEARLY' | 'MONTHLY' | 'WEEKLY'
  isRecurring: boolean
  startDate?: Date | string | null
  endDate?: Date | string | null
}

export interface CalendarMonth {
  id: string
  projectId: string
  month: number // 1-12
  year: number
  canvasTopJson?: object // Fabric.js zona superior
  gridConfigJson?: object // Configuración visual del grid
  overlayJson?: object // Fabric.js capa de decoración
  isCustomized: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DayCell {
  id: string
  monthId: string
  dayNumber: number
  contentJson?: string // Cell content (image, sticker, text)
  bgColor?: string
  hasEvent: boolean
  hasHoliday: boolean
}

export interface Asset {
  id: string
  userId: string
  folderId?: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  thumbPath?: string
  type: 'IMAGE' | 'STICKER'
  createdAt: Date
}

export interface AssetFolder {
  id: string
  userId: string
  name: string
  parentId?: string
  createdAt: Date
}

export interface Event {
  id: string
  userId: string
  name: string
  day: number
  month: number
  year?: number | null // NULL for recurring events
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'SAINT' | 'CUSTOM'
  color: string
  icon?: string | null
  isRecurring: boolean
  recurrence?: 'NONE' | 'YEARLY' | 'MONTHLY' | 'WEEKLY'
  weekday?: number | null
  startDate?: Date | string | null
  endDate?: Date | string | null
  sourceUid?: string | null
  createdAt: Date
}

export interface Holiday {
  id: string
  year: number
  month: number
  day: number
  nameEs: string
  nameEn: string
  countryCode: string
  scope: 'NATIONAL' | 'AUTONOMY'
  autonomyCode?: string
}

export interface Template {
  id: string
  userId: string
  name: string
  configJson: string // Template configuration
  isDefault: boolean
  createdAt: Date
}

export interface ExportJob {
  id: string
  projectId: string
  userId: string
  format: 'PDF' | 'PNG'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  progress: number
  totalPages: number
  currentPage: number
  filename: string | null
  filePath: string | null
  fileSize: number | null
  dpi: number
  bindingGuide: boolean
  error: string | null
  createdAt: Date
  updatedAt: Date
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export type AuthUser = User
