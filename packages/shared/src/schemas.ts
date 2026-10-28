import { z } from 'zod'

// Auth schemas
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'USER']),
  isActive: z.boolean().default(true),
  language: z.string().default('es').optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Project schemas
export const projectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  year: z.number().int().min(2020).max(2050),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED']),
  weekStartsOn: z.enum(['monday', 'sunday']).default('monday'),
  paperSize: z.enum(['A4', 'A3', 'A5', 'LETTER']).default('A4'),
  printConfigJson: z.unknown().optional(),
  autonomyCode: z.string().optional(),
  templateId: z.string().optional(),
  highlightedEventId: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1),
  year: z.number().int().min(2020).max(2050),
  weekStartsOn: z.enum(['monday', 'sunday']).default('monday'),
  paperSize: z.enum(['A4', 'A3', 'A5', 'LETTER']).default('A4'),
  printConfigJson: z.unknown().optional(),
  autonomyCode: z.string().optional(),
  templateId: z.string().optional(),
})

// Calendar month schemas
export const calendarMonthSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  canvasTopJson: z.unknown().optional(),
  gridConfigJson: z.unknown().optional(),
  overlayJson: z.unknown().optional(),
  isCustomized: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const updateMonthSchema = z.object({
  canvasTopJson: z.unknown().optional(),
  gridConfigJson: z.unknown().optional(),
  overlayJson: z.unknown().optional(),
  dayCells: z.array(z.unknown()).optional(),
})

// Asset schemas
export const assetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  folderId: z.string().optional(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  thumbPath: z.string().optional(),
  type: z.enum(['IMAGE', 'STICKER']),
  createdAt: z.date(),
})

// Event schemas
export const eventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  day: z.number().int().min(1).max(31),
  month: z.number().int().min(1).max(12),
  year: z.number().int().nullable().optional(),
  type: z.enum(['BIRTHDAY', 'ANNIVERSARY', 'SAINT', 'CUSTOM']),
  color: z.string(),
  icon: z.string().nullable().optional(),
  isRecurring: z.boolean(),
  recurrence: z.enum(['NONE', 'YEARLY', 'MONTHLY', 'WEEKLY']).optional(),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
  sourceUid: z.string().max(512).nullable().optional(),
  createdAt: z.date(),
})

export const createEventSchema = z.object({
  name: z.string().min(1),
  day: z.number().int().min(1).max(31),
  month: z.number().int().min(1).max(12),
  year: z.number().int().nullable().optional(),
  type: z.enum(['BIRTHDAY', 'ANNIVERSARY', 'SAINT', 'CUSTOM']),
  color: z.string().default('#C8502A'),
  icon: z.string().nullable().optional(),
  isRecurring: z.boolean().default(true),
  recurrence: z.enum(['NONE', 'YEARLY', 'MONTHLY', 'WEEKLY']).optional(),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
})

// API response schemas
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  })

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    hasMore: z.boolean(),
  })

// Export types
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type User = z.infer<typeof userSchema>
export type Project = z.infer<typeof projectSchema>
export type CreateProject = z.infer<typeof createProjectSchema>
export type CalendarMonth = z.infer<typeof calendarMonthSchema>
export type UpdateMonth = z.infer<typeof updateMonthSchema>
export type Asset = z.infer<typeof assetSchema>
export type Event = z.infer<typeof eventSchema>
export type CreateEvent = z.infer<typeof createEventSchema>
