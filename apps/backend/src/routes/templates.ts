import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  configJson: z.object({
    gridConfigJson: z.unknown().optional(),
    canvasTopJson: z.unknown().optional(),
  }),
  isDefault: z.boolean().optional(),
})

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  configJson: z
    .object({
      gridConfigJson: z.unknown().optional(),
      canvasTopJson: z.unknown().optional(),
    })
    .optional(),
  isDefault: z.boolean().optional(),
})

const templateRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /templates — List user's templates
  fastify.get('/templates', { preHandler: fastify.authenticate }, async (request, reply) => {
    const templates = await prisma.template.findMany({
      where: { userId: request.user!.id },
      orderBy: { createdAt: 'desc' },
    })
    reply.send({ templates })
  })

  // GET /templates/:id — Get a single template
  fastify.get('/templates/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const template = await prisma.template.findFirst({
      where: { id, userId: request.user!.id },
    })
    if (!template) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Template not found' })
    }
    reply.send({ template })
  })

  // POST /templates — Create a new template
  fastify.post('/templates', { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = createTemplateSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    const { name, configJson, isDefault } = parsed.data

    // If marking as default, unset other defaults
    if (isDefault) {
      await prisma.template.updateMany({
        where: { userId: request.user!.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const template = await prisma.template.create({
      data: {
        name,
        configJson: configJson as object,
        isDefault: isDefault ?? false,
        userId: request.user!.id,
      },
    })

    reply.code(201).send({ template })
  })

  // PATCH /templates/:id — Update a template
  fastify.patch('/templates/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateTemplateSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    const existing = await prisma.template.findFirst({
      where: { id, userId: request.user!.id },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Template not found' })
    }

    // If marking as default, unset other defaults
    if (parsed.data.isDefault) {
      await prisma.template.updateMany({
        where: { userId: request.user!.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) data.name = parsed.data.name
    if (parsed.data.configJson !== undefined) data.configJson = parsed.data.configJson as object
    if (parsed.data.isDefault !== undefined) data.isDefault = parsed.data.isDefault

    const template = await prisma.template.update({
      where: { id },
      data,
    })

    reply.send({ template })
  })

  // DELETE /templates/:id — Delete a template
  fastify.delete('/templates/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const existing = await prisma.template.findFirst({
      where: { id, userId: request.user!.id },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Template not found' })
    }

    // Unlink projects using this template
    await prisma.project.updateMany({
      where: { templateId: id },
      data: { templateId: null },
    })

    await prisma.template.delete({ where: { id } })
    reply.send({ ok: true })
  })

  // POST /templates/:id/apply/:projectId — Apply template to all months of a project
  fastify.post(
    '/templates/:id/apply/:projectId',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { id, projectId } = request.params as { id: string; projectId: string }

      const template = await prisma.template.findFirst({
        where: { id, userId: request.user!.id },
      })
      if (!template) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Template not found' })
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: request.user!.id },
        include: { months: true },
      })
      if (!project) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Project not found' })
      }

      const config = template.configJson as { gridConfigJson?: unknown; canvasTopJson?: unknown }

      // Apply to all non-customized months (or all if force=true)
      const force = (request.query as { force?: string }).force === 'true'

      const monthsToUpdate = force ? project.months : project.months.filter((m) => !m.isCustomized)

      await Promise.all(
        monthsToUpdate.map((m) =>
          prisma.calendarMonth.update({
            where: { id: m.id },
            data: {
              gridConfigJson: config.gridConfigJson ?? undefined,
              canvasTopJson: config.canvasTopJson ?? undefined,
            },
          })
        )
      )

      // Link template to project
      await prisma.project.update({
        where: { id: projectId },
        data: { templateId: id },
      })

      reply.send({
        ok: true,
        appliedTo: monthsToUpdate.length,
        total: project.months.length,
      })
    }
  )

  // POST /templates/from-month/:monthId — Create template from a month's current config
  fastify.post(
    '/templates/from-month/:monthId',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { monthId } = request.params as { monthId: string }
      const body = z.object({ name: z.string().min(1).max(100) }).safeParse(request.body)
      if (!body.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: body.error.issues.map((i) => i.message).join(', '),
        })
      }

      const month = await prisma.calendarMonth.findFirst({
        where: { id: monthId },
        include: { project: { select: { userId: true } } },
      })
      if (!month || month.project.userId !== request.user!.id) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Month not found' })
      }

      const template = await prisma.template.create({
        data: {
          name: body.data.name,
          configJson: {
            gridConfigJson: month.gridConfigJson ?? undefined,
            canvasTopJson: month.canvasTopJson ?? undefined,
          },
          userId: request.user!.id,
        },
      })

      reply.code(201).send({ template })
    }
  )
}

export default templateRoutes
