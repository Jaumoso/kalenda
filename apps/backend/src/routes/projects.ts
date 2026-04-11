import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  year: z.number().int().min(2020).max(2050),
  weekStartsOn: z.enum(['monday', 'sunday']).default('monday'),
  autonomyCode: z.string().max(10).optional(),
  templateId: z.string().optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  year: z.number().int().min(2020).max(2050).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED']).optional(),
  weekStartsOn: z.enum(['monday', 'sunday']).optional(),
  autonomyCode: z.string().max(10).nullable().optional(),
})

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /projects — List current user's projects
  fastify.get('/projects', { preHandler: fastify.authenticate }, async (request, reply) => {
    const projects = await prisma.project.findMany({
      where: { userId: request.user!.id },
      include: {
        months: {
          select: { id: true, month: true, isCustomized: true },
          orderBy: { month: 'asc' },
        },
        _count: { select: { months: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    reply.send({ projects })
  })

  // POST /projects — Create project + auto-generate 12 months
  fastify.post('/projects', { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = createProjectSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    const { name, year, weekStartsOn, autonomyCode, templateId } = parsed.data

    // Fetch template config if templateId provided
    let templateConfig: { gridConfigJson?: unknown; canvasTopJson?: unknown } | null = null
    if (templateId) {
      const template = await prisma.template.findFirst({
        where: { id: templateId, userId: request.user!.id },
      })
      if (template) {
        templateConfig = template.configJson as {
          gridConfigJson?: unknown
          canvasTopJson?: unknown
        }
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        year,
        weekStartsOn,
        autonomyCode,
        templateId: templateId || undefined,
        userId: request.user!.id,
        months: {
          createMany: {
            data: Array.from({ length: 12 }, (_, i) => ({
              month: i + 1,
              year,
              ...(templateConfig
                ? {
                    gridConfigJson: templateConfig.gridConfigJson ?? undefined,
                    canvasTopJson: templateConfig.canvasTopJson ?? undefined,
                  }
                : {}),
            })),
          },
        },
      },
      include: {
        months: {
          select: { id: true, month: true, isCustomized: true },
          orderBy: { month: 'asc' },
        },
      },
    })

    reply.code(201).send({ project })
  })

  // GET /projects/:id — Get project with months
  fastify.get('/projects/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const project = await prisma.project.findFirst({
      where: { id, userId: request.user!.id },
      include: {
        months: {
          select: {
            id: true,
            month: true,
            year: true,
            isCustomized: true,
            gridConfigJson: true,
            canvasTopJson: true,
            overlayJson: true,
          },
          orderBy: { month: 'asc' },
        },
      },
    })

    if (!project) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Project not found' })
    }

    reply.send({ project })
  })

  // PATCH /projects/:id — Update project
  fastify.patch('/projects/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateProjectSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: { id, userId: request.user!.id },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Project not found' })
    }

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
      include: {
        months: {
          select: { id: true, month: true, isCustomized: true },
          orderBy: { month: 'asc' },
        },
      },
    })

    reply.send({ project })
  })

  // DELETE /projects/:id — Delete project (cascade deletes months)
  fastify.delete('/projects/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const existing = await prisma.project.findFirst({
      where: { id, userId: request.user!.id },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Project not found' })
    }

    await prisma.project.delete({ where: { id } })

    reply.send({ ok: true })
  })

  // POST /projects/:id/duplicate — Duplicate project
  fastify.post(
    '/projects/:id/duplicate',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const source = await prisma.project.findFirst({
        where: { id, userId: request.user!.id },
        include: {
          months: true,
        },
      })

      if (!source) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Project not found' })
      }

      const duplicate = await prisma.project.create({
        data: {
          name: `${source.name} (copia)`,
          year: source.year,
          weekStartsOn: source.weekStartsOn,
          autonomyCode: source.autonomyCode,
          userId: request.user!.id,
          status: 'DRAFT',
          months: {
            createMany: {
              data: source.months.map((m) => ({
                month: m.month,
                year: m.year,
                canvasTopJson: m.canvasTopJson ?? undefined,
                gridConfigJson: m.gridConfigJson ?? undefined,
                overlayJson: m.overlayJson ?? undefined,
                isCustomized: m.isCustomized,
              })),
            },
          },
        },
        include: {
          months: {
            select: { id: true, month: true, isCustomized: true },
            orderBy: { month: 'asc' },
          },
        },
      })

      reply.code(201).send({ project: duplicate })
    }
  )
}

export default projectRoutes
