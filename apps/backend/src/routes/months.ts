import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const gridConfigSchema = z.object({
  bgColor: z.string().optional(),
  bgOpacity: z.number().min(0).max(100).optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().min(0).max(10).optional(),
  borderStyle: z.enum(['solid', 'dashed', 'dotted', 'none']).optional(),
  dayFontFamily: z.string().optional(),
  dayFontSize: z.number().min(8).max(72).optional(),
  dayFontColor: z.string().optional(),
  dayFontWeight: z.enum(['normal', 'bold']).optional(),
  dayPosition: z
    .enum([
      'top-left',
      'top-center',
      'top-right',
      'middle-left',
      'middle-center',
      'middle-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ])
    .optional(),
  weekendBgColor: z.string().optional(),
  headerFontFamily: z.string().optional(),
  headerFontSize: z.number().min(8).max(72).optional(),
  headerFontColor: z.string().optional(),
  headerBgColor: z.string().optional(),
})

const updateMonthSchema = z.object({
  gridConfigJson: gridConfigSchema.optional(),
  canvasTopJson: z.any().optional(),
  overlayJson: z.any().optional(),
})

const updateCellSchema = z.object({
  bgColor: z.string().nullable().optional(),
  contentJson: z
    .object({
      text: z.string().optional(),
      imageAssetId: z.string().optional(),
      stickerAssetId: z.string().optional(),
      emoji: z.string().optional(),
    })
    .nullable()
    .optional(),
})

const monthRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /months/:id — Get a single month with day cells
  fastify.get('/months/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const month = await prisma.calendarMonth.findFirst({
      where: { id },
      include: {
        project: { select: { userId: true, weekStartsOn: true, name: true, year: true } },
        dayCells: { orderBy: { dayNumber: 'asc' } },
      },
    })

    if (!month || month.project.userId !== request.user!.id) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Month not found' })
    }

    reply.send({ month })
  })

  // PUT /months/:id — Update month (grid config, canvas JSON, etc.)
  fastify.put('/months/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateMonthSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    // Verify ownership
    const existing = await prisma.calendarMonth.findFirst({
      where: { id },
      include: { project: { select: { userId: true } } },
    })
    if (!existing || existing.project.userId !== request.user!.id) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Month not found' })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.gridConfigJson !== undefined) data.gridConfigJson = parsed.data.gridConfigJson
    if (parsed.data.canvasTopJson !== undefined) data.canvasTopJson = parsed.data.canvasTopJson
    if (parsed.data.overlayJson !== undefined) data.overlayJson = parsed.data.overlayJson

    // Mark as customized if any config is being saved
    const hasContent =
      parsed.data.gridConfigJson || parsed.data.canvasTopJson || parsed.data.overlayJson
    if (hasContent) data.isCustomized = true

    const month = await prisma.calendarMonth.update({
      where: { id },
      data,
      include: {
        dayCells: { orderBy: { dayNumber: 'asc' } },
      },
    })

    reply.send({ month })
  })

  // PUT /months/:id/cells/:dayNumber — Update a specific day cell
  fastify.put(
    '/months/:id/cells/:dayNumber',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { id, dayNumber } = request.params as { id: string; dayNumber: string }
      const day = parseInt(dayNumber)
      if (isNaN(day) || day < 1 || day > 31) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Invalid day number' })
      }

      const parsed = updateCellSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: parsed.error.issues.map((i) => i.message).join(', '),
        })
      }

      // Verify ownership
      const month = await prisma.calendarMonth.findFirst({
        where: { id },
        include: { project: { select: { userId: true } } },
      })
      if (!month || month.project.userId !== request.user!.id) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Month not found' })
      }

      // Upsert the day cell
      const cell = await prisma.dayCell.upsert({
        where: { monthId_dayNumber: { monthId: id, dayNumber: day } },
        create: {
          monthId: id,
          dayNumber: day,
          bgColor: parsed.data.bgColor ?? null,
          contentJson: parsed.data.contentJson ?? undefined,
        },
        update: {
          bgColor: parsed.data.bgColor ?? null,
          contentJson: parsed.data.contentJson ?? undefined,
        },
      })

      reply.send({ cell })
    }
  )

  // GET /months/:id/cells — Get all day cells for a month
  fastify.get('/months/:id/cells', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    // Verify ownership
    const month = await prisma.calendarMonth.findFirst({
      where: { id },
      include: { project: { select: { userId: true } } },
    })
    if (!month || month.project.userId !== request.user!.id) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Month not found' })
    }

    const cells = await prisma.dayCell.findMany({
      where: { monthId: id },
      orderBy: { dayNumber: 'asc' },
    })

    reply.send({ cells })
  })
}

export default monthRoutes
