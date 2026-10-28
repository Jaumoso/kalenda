import { FastifyPluginAsync } from 'fastify'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const recurrenceSchema = z.enum(['NONE', 'YEARLY', 'MONTHLY', 'WEEKLY'])
const dateOnlySchema = z.string().date()

const createEventSchema = z
  .object({
    name: z.string().min(1).max(100),
    day: z.number().int().min(1).max(31),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2050).nullable().optional(),
    type: z.enum(['BIRTHDAY', 'ANNIVERSARY', 'CUSTOM']).default('CUSTOM'),
    color: z.string().max(20).default('#C8502A'),
    icon: z.string().max(10).nullable().optional(),
    isRecurring: z.boolean().default(true),
    recurrence: recurrenceSchema.optional(),
    weekday: z.number().int().min(0).max(6).nullable().optional(),
    startDate: dateOnlySchema.nullable().optional(),
    endDate: dateOnlySchema.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const recurrence = value.recurrence ?? (value.isRecurring ? 'YEARLY' : 'NONE')
    if (recurrence === 'WEEKLY' && value.weekday == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['weekday'],
        message: 'Weekday is required for weekly events',
      })
    }
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be on or after start date',
      })
    }
  })

const updateEventSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  day: z.number().int().min(1).max(31).optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).max(2050).nullable().optional(),
  type: z.enum(['BIRTHDAY', 'ANNIVERSARY', 'CUSTOM']).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(10).nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrence: recurrenceSchema.optional(),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  startDate: dateOnlySchema.nullable().optional(),
  endDate: dateOnlySchema.nullable().optional(),
})

function toDateOnly(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  return new Date(`${value}T00:00:00.000Z`)
}

function dateKey(value: string | Date | null | undefined): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString().slice(0, 10) : value
}

const eventRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /events — List all events for the current user
  fastify.get('/events', { preHandler: fastify.authenticate }, async (request, reply) => {
    const schema = z.object({
      month: z.coerce.number().int().min(1).max(12).optional(),
      year: z.coerce.number().int().min(2020).max(2050).optional(),
    })

    const parsed = schema.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    const filters: Prisma.EventWhereInput[] = []
    if (parsed.data.month !== undefined) {
      filters.push({
        OR: [{ month: parsed.data.month }, { recurrence: 'MONTHLY' }, { recurrence: 'WEEKLY' }],
      })
    }
    if (parsed.data.year !== undefined) {
      filters.push({ OR: [{ isRecurring: true }, { year: parsed.data.year }] })
    }

    const events = await prisma.event.findMany({
      where: { userId: request.user!.id, AND: filters },
      orderBy: [{ month: 'asc' }, { day: 'asc' }],
    })

    reply.send({ events })
  })

  // POST /events — Create a new event
  fastify.post('/events', { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = createEventSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    const recurrence = parsed.data.recurrence ?? (parsed.data.isRecurring ? 'YEARLY' : 'NONE')
    const startDate = recurrence === 'NONE' ? null : toDateOnly(parsed.data.startDate)
    const endDate = recurrence === 'NONE' ? null : toDateOnly(parsed.data.endDate)
    const event = await prisma.event.create({
      data: {
        name: parsed.data.name,
        day: parsed.data.day,
        month: parsed.data.month,
        type: parsed.data.type,
        color: parsed.data.color,
        isRecurring: recurrence !== 'NONE',
        year: recurrence === 'NONE' ? (parsed.data.year ?? null) : null,
        icon: parsed.data.icon ?? null,
        recurrence,
        weekday: recurrence === 'WEEKLY' ? (parsed.data.weekday ?? null) : null,
        startDate,
        endDate,
        userId: request.user!.id,
      },
    })

    reply.code(201).send({ event })
  })

  // PUT /events/:id — Update an event
  fastify.put('/events/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateEventSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    const existing = await prisma.event.findFirst({
      where: { id, userId: request.user!.id },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Event not found' })
    }

    const recurrence =
      parsed.data.recurrence ??
      (parsed.data.isRecurring === undefined
        ? existing.recurrence
        : parsed.data.isRecurring
          ? 'YEARLY'
          : 'NONE')
    const weekday = parsed.data.weekday !== undefined ? parsed.data.weekday : existing.weekday
    if (recurrence === 'WEEKLY' && weekday == null) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Weekday is required for weekly events',
      })
    }
    const startDate =
      parsed.data.startDate !== undefined ? parsed.data.startDate : existing.startDate
    const endDate = parsed.data.endDate !== undefined ? parsed.data.endDate : existing.endDate
    if (startDate && endDate && (dateKey(endDate) ?? '') < (dateKey(startDate) ?? '')) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'End date must be on or after start date',
      })
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.day !== undefined ? { day: parsed.data.day } : {}),
        ...(parsed.data.month !== undefined ? { month: parsed.data.month } : {}),
        ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
        ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
        ...(parsed.data.icon !== undefined ? { icon: parsed.data.icon } : {}),
        year: recurrence === 'NONE' ? (parsed.data.year ?? existing.year) : null,
        isRecurring: recurrence !== 'NONE',
        recurrence,
        weekday: recurrence === 'WEEKLY' ? weekday : null,
        startDate: recurrence === 'NONE' ? null : toDateOnly(startDate),
        endDate: recurrence === 'NONE' ? null : toDateOnly(endDate),
      },
    })

    reply.send({ event })
  })

  // DELETE /events/:id — Delete an event
  fastify.delete('/events/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const existing = await prisma.event.findFirst({
      where: { id, userId: request.user!.id },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Event not found' })
    }

    await prisma.event.delete({ where: { id } })
    reply.send({ success: true })
  })
}

export default eventRoutes
