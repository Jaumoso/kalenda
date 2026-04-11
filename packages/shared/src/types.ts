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
  autonomyCode?: string
  templateId?: string
  createdAt: Date
  updatedAt: Date
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
  year?: number // NULL for recurring events
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'SAINT' | 'CUSTOM'
  color: string
  icon?: string
  isRecurring: boolean
  createdAt: Date
}

export interface Holiday {
  id: string
  year: number
  month: number
  day: number
  nameEs: string
  nameEn: string
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

export interface AuthUser extends User {
  // Additional fields if needed
}
