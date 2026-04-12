import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const updateCoverSchema = z.object({
  coverJson: z.any().optional(),
  backCoverJson: z.any().optional(),
})

const coverRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /projects/:id/covers — Get cover data
  fastify.get(
    '/projects/:id/covers',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const project = await prisma.project.findFirst({
        where: { id, userId: request.user!.id },
        select: { id: true, coverJson: true, backCoverJson: true, name: true, year: true },
      })

      if (!project) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Project not found' })
      }

      reply.send({ project })
    }
  )

  // PUT /projects/:id/covers — Save cover data
  fastify.put(
    '/projects/:id/covers',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const parsed = updateCoverSchema.safeParse(request.body)

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

      const data: Record<string, unknown> = {}
      if (parsed.data.coverJson !== undefined) data.coverJson = parsed.data.coverJson
      if (parsed.data.backCoverJson !== undefined) data.backCoverJson = parsed.data.backCoverJson

      const project = await prisma.project.update({
        where: { id },
        data,
        select: { id: true, coverJson: true, backCoverJson: true },
      })

      reply.send({ project })
    }
  )
}

export default coverRoutes
