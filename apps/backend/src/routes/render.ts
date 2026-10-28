import { FastifyPluginAsync } from 'fastify'
import jwt from 'jsonwebtoken'
import { expandEventsForMonth } from '@kalenda/shared'
import { prisma } from '@/prisma.js'
import { getSaintsForMonth } from '@/data/saints.js'
import { getSecret, rateLimitConfig } from '@/config.js'
import { getHolidaysForMonth } from '@/lib/holidayService.js'

const jwtSecret = getSecret('JWT_SECRET', 'dev-jwt-secret')

const rateLimit = rateLimitConfig.strict

/**
 * Public render-data endpoint for Puppeteer.
 * Uses a short-lived render token instead of session cookies.
 */
const renderRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /render-data/:monthId?token=xxx
  fastify.get(
    '/render-data/:monthId',
    {
      config: {
        rateLimit,
      },
    },
    async (request, reply) => {
      const { monthId } = request.params as { monthId: string }
      const { token } = request.query as { token?: string }

      if (!token) {
        return reply.code(401).send({ error: 'Token required' })
      }

      // Validate render token
      let payload: { monthId: string; purpose: string }
      try {
        payload = jwt.verify(token, jwtSecret) as { monthId: string; purpose: string }
      } catch {
        return reply.code(401).send({ error: 'Invalid or expired token' })
      }

      if (payload.purpose !== 'render' || payload.monthId !== monthId) {
        return reply.code(403).send({ error: 'Token mismatch' })
      }

      const month = await prisma.calendarMonth.findFirst({
        where: { id: monthId },
        include: {
          project: {
            select: {
              userId: true,
              weekStartsOn: true,
              paperSize: true,
              printConfigJson: true,
              name: true,
              year: true,
              autonomyCode: true,
              holidayCountryCode: true,
              countdownEventIds: true,
              highlightedEvent: {
                select: {
                  id: true,
                  name: true,
                  day: true,
                  month: true,
                  year: true,
                  type: true,
                  color: true,
                  icon: true,
                  isRecurring: true,
                  recurrence: true,
                  weekday: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
          dayCells: { orderBy: { dayNumber: 'asc' } },
        },
      })

      if (!month) {
        return reply.code(404).send({ error: 'Month not found' })
      }

      const holidayResult = await getHolidaysForMonth(
        month.year,
        month.month,
        month.project.holidayCountryCode,
        month.project.autonomyCode
      )

      // Fetch events
      const storedEvents = await prisma.event.findMany({
        where: {
          userId: month.project.userId,
          OR: [{ isRecurring: true }, { year: month.year }],
        },
        orderBy: { day: 'asc' },
      })
      const events = expandEventsForMonth(storedEvents, month.year, month.month)
      const countdownIds = month.project.countdownEventIds.length
        ? month.project.countdownEventIds
        : month.project.highlightedEvent
          ? [month.project.highlightedEvent.id]
          : []
      const countdownEvents = await prisma.event.findMany({
        where: { userId: month.project.userId, id: { in: countdownIds } },
        orderBy: { createdAt: 'asc' },
      })

      const saints = getSaintsForMonth(month.month)

      reply.send({
        month: {
          ...month,
          project: {
            ...month.project,
            countdownEventIds: countdownEvents.map((event) => event.id),
            countdownEvents,
          },
        },
        holidays: holidayResult.holidays,
        holidaySupportError: holidayResult.supportError,
        events,
        saints,
      })
    }
  )

  // GET /render-data/cover/:projectId?token=xxx&type=front|back
  fastify.get(
    '/render-data/cover/:projectId',
    {
      config: {
        rateLimit,
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const { token, type } = request.query as { token?: string; type?: string }

      if (!token) {
        return reply.code(401).send({ error: 'Token required' })
      }

      let payload: { projectId: string; purpose: string }
      try {
        payload = jwt.verify(token, jwtSecret) as { projectId: string; purpose: string }
      } catch {
        return reply.code(401).send({ error: 'Invalid or expired token' })
      }

      if (payload.purpose !== 'render-cover' || payload.projectId !== projectId) {
        return reply.code(403).send({ error: 'Token mismatch' })
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          year: true,
          paperSize: true,
          printConfigJson: true,
          coverJson: true,
          backCoverJson: true,
        },
      })

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      const canvasJson = type === 'back' ? project.backCoverJson : project.coverJson

      reply.send({
        project: {
          id: project.id,
          name: project.name,
          year: project.year,
          paperSize: project.paperSize,
        },
        canvasJson,
      })
    }
  )

  // GET /preview-tokens/:projectId — Generate short-lived render tokens for print preview
  fastify.get(
    '/preview-tokens/:projectId',
    { preHandler: fastify.authenticate, config: { rateLimit } },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: request.user!.id },
        include: { months: { orderBy: { month: 'asc' } } },
      })

      if (!project) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Project not found' })
      }

      const monthTokens = project.months.map((m) => ({
        monthId: m.id,
        month: m.month,
        token: jwt.sign({ monthId: m.id, purpose: 'render' }, jwtSecret, { expiresIn: '10m' }),
      }))

      const coverToken = jwt.sign({ projectId, purpose: 'render-cover' }, jwtSecret, {
        expiresIn: '10m',
      })

      reply.send({ monthTokens, coverToken })
    }
  )
}

export default renderRoutes
