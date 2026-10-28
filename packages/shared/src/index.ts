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
} from './types'

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
