import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { AUTONOMY_CODES } from '../data/holidays.js'
import {
  getHolidayCountries,
  getHolidaySupportError,
  getInternationalHolidays,
} from '../data/internationalHolidays.js'
import { getSaintsForMonth } from '../data/saints.js'

const holidayRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /holidays — List holidays for a year/month, optionally filtered by autonomy
  fastify.get('/holidays', { preHandler: fastify.authenticate }, async (request, reply) => {
    const schema = z.object({
      year: z.coerce.number().int().min(2020).max(2050),
      month: z.coerce.number().int().min(1).max(12).optional(),
      autonomyCode: z.string().max(10).optional(),
      countryCode: z.string().length(2).default('ES'),
    })

    const parsed = schema.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    const { year, month, autonomyCode, countryCode } = parsed.data
    const supportError = getHolidaySupportError(year, countryCode)
    if (supportError) {
      return reply.code(422).send({
        error: supportError,
        message: 'Holiday data is not available for this country or year',
      })
    }

    if (countryCode !== 'ES') {
      const holidays = getInternationalHolidays(year, countryCode)
        .filter((holiday) => month === undefined || holiday.month === month)
        .map((holiday) => ({
          ...holiday,
          id: `${holiday.countryCode}-${holiday.year}-${holiday.month}-${holiday.day}`,
          scope: 'NATIONAL' as const,
          autonomyCode: null,
        }))
      return reply.send({ holidays })
    }

    const where: Record<string, unknown> = { year, countryCode: 'ES' }
    if (month !== undefined) where.month = month

    // Always include NATIONAL + specific autonomy if provided
    if (autonomyCode) {
      where.OR = [{ scope: 'NATIONAL' }, { scope: 'AUTONOMY', autonomyCode }]
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: [{ month: 'asc' }, { day: 'asc' }],
    })

    reply.send({ holidays })
  })

  // GET /saints — Saints for a given month
  fastify.get('/saints', { preHandler: fastify.authenticate }, async (request, reply) => {
    const schema = z.object({
      month: z.coerce.number().int().min(1).max(12),
    })

    const parsed = schema.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    const saints = getSaintsForMonth(parsed.data.month)
    reply.send({ saints })
  })

  // GET /autonomies — List all autonomy codes
  fastify.get('/autonomies', { preHandler: fastify.authenticate }, async (_request, reply) => {
    reply.send({ autonomies: AUTONOMY_CODES })
  })

  fastify.get(
    '/holiday-countries',
    { preHandler: fastify.authenticate },
    async (_request, reply) => {
      reply.send({ countries: getHolidayCountries() })
    }
  )
}

export default holidayRoutes
