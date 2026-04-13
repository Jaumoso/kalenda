import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().nullable().optional(),
})

const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().nullable().optional(),
})

const folderRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /folders — List user's folders (tree)
  fastify.get('/folders', { preHandler: fastify.authenticate }, async (request, reply) => {
    const folders = await prisma.assetFolder.findMany({
      where: { userId: request.user!.id },
      include: {
        _count: { select: { assets: true, children: true } },
      },
      orderBy: { name: 'asc' },
    })

    reply.send({ folders })
  })

  // POST /folders — Create folder
  fastify.post('/folders', { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = createFolderSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Invalid input' })
    }

    const { name, parentId } = parsed.data

    // Verify parent ownership
    if (parentId) {
      const parent = await prisma.assetFolder.findFirst({
        where: { id: parentId, userId: request.user!.id },
      })
      if (!parent) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Parent folder not found' })
      }
    }

    const folder = await prisma.assetFolder.create({
      data: {
        name,
        parentId: parentId ?? null,
        userId: request.user!.id,
      },
      include: {
        _count: { select: { assets: true, children: true } },
      },
    })

    reply.code(201).send({ folder })
  })

  // PATCH /folders/:id — Rename or move folder
  fastify.patch('/folders/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateFolderSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Invalid input' })
    }

    const folder = await prisma.assetFolder.findFirst({
      where: { id, userId: request.user!.id },
    })
    if (!folder) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Folder not found' })
    }

    // Prevent moving folder into itself
    if (parsed.data.parentId === id) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'No se puede mover una carpeta dentro de sí misma',
      })
    }

    const updated = await prisma.assetFolder.update({
      where: { id },
      data: parsed.data,
      include: {
        _count: { select: { assets: true, children: true } },
      },
    })

    reply.send({ folder: updated })
  })

  // DELETE /folders/:id — Delete folder (assets move to root)
  fastify.delete('/folders/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const folder = await prisma.assetFolder.findFirst({
      where: { id, userId: request.user!.id },
    })
    if (!folder) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Folder not found' })
    }

    // Move assets to root before deleting folder (onDelete: SetNull handles this)
    await prisma.assetFolder.delete({ where: { id } })

    reply.send({ ok: true })
  })
}

export default folderRoutes
