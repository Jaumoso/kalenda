// Export types
export type {
  User,
  Project,
  CalendarMonth,
  DayCell,
  Asset,
  AssetFolder,
  Event,
  Holiday,
  Template,
  ApiResponse,
  PaginatedResponse,
  AuthTokens,
  AuthUser,
  LoginRequest,
  PaperSize,
  PaperDimensions,
  PrintConfig,
  HighlightedEvent,
} from './types'

export { DEFAULT_PRINT_CONFIG, PAPER_DIMENSIONS } from './types'

// Export schemas
export {
  loginRequestSchema,
  userSchema,
  projectSchema,
  createProjectSchema,
  calendarMonthSchema,
  updateMonthSchema,
  assetSchema,
  eventSchema,
  createEventSchema,
  apiResponseSchema,
  paginatedResponseSchema,
} from './schemas'

export {
  expandEventForMonth,
  expandEventsForMonth,
  getDaysInMonth,
  getEventRecurrence,
} from './recurrence'
export type { EventRecurrence, RecurringEventInput } from './recurrence'
export { getHighlightedEventCountdown } from './countdown'
export type { CountdownResult, CountdownStatus } from './countdown'
