import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '../prisma.js'

const userRoutes: FastifyPluginAsync = async (fastify) => {
  const createUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    password: z.string().min(6),
    role: z.enum(['USER', 'ADMIN']).optional().default('USER'),
  })

  const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    language: z.string().min(2).max(5).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).optional(),
  })

  // GET /users — List all users [ADMIN]
  fastify.get(
    '/users',
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (_request, reply) => {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          language: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      reply.send({ users })
    }
  )

  // POST /users — Create user [ADMIN]
  fastify.post(
    '/users',
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request, reply) => {
      const parsed = createUserSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Invalid input' })
      }
      const { email, name, password, role } = parsed.data

      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return reply
          .code(409)
          .send({ error: 'EMAIL_ALREADY_EXISTS', message: 'User already exists' })
      }

      const hashedPassword = await bcrypt.hash(password, 12)

      const user = await prisma.user.create({
        data: { email, name, password: hashedPassword, role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          language: true,
          createdAt: true,
        },
      })

      reply.code(201).send({ user })
    }
  )

  // PATCH /users/:id — Update user [ADMIN or self]
  fastify.patch('/users/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateUserSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Invalid input' })
    }
    const body = parsed.data

    // Only admin or the user themselves can update
    if (request.user!.role !== 'ADMIN' && request.user!.id !== id) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Not allowed' })
    }

    // If changing password, verify current password
    if (body.newPassword) {
      if (!body.currentPassword) {
        return reply
          .code(400)
          .send({ error: 'VALIDATION_ERROR', message: 'Current password required' })
      }

      const existingUser = await prisma.user.findUnique({ where: { id } })
      if (!existingUser) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'User not found' })
      }

      const isValid = await bcrypt.compare(body.currentPassword, existingUser.password)
      if (!isValid) {
        return reply
          .code(403)
          .send({ error: 'WRONG_CURRENT_PASSWORD', message: 'Current password is incorrect' })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (body.name) updateData.name = body.name
    if (body.language) updateData.language = body.language
    if (body.newPassword) updateData.password = await bcrypt.hash(body.newPassword, 12)

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        language: true,
        isActive: true,
      },
    })

    reply.send({ user })
  })

  const statusSchema = z.object({ active: z.boolean() })
  const roleSchema = z.object({ role: z.enum(['USER', 'ADMIN']) })

  // PATCH /users/:id/status — Activate/deactivate user [ADMIN]
  fastify.patch(
    '/users/:id/status',
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const parsed = statusSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Invalid input' })
      }
      const { active } = parsed.data

      // Prevent admin from deactivating themselves
      if (request.user!.id === id) {
        return reply
          .code(400)
          .send({ error: 'VALIDATION_ERROR', message: 'Cannot change your own status' })
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: active },
      })

      reply.send({ ok: true })
    }
  )

  // PATCH /users/:id/role — Change user role [ADMIN]
  fastify.patch(
    '/users/:id/role',
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const parsed = roleSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Invalid input' })
      }
      const { role } = parsed.data

      // Prevent admin from changing their own role
      if (request.user!.id === id) {
        return reply
          .code(400)
          .send({ error: 'VALIDATION_ERROR', message: 'Cannot change your own role' })
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      })

      reply.send({ user })
    }
  )

  // DELETE /users/:id — Delete user [ADMIN]
  fastify.delete(
    '/users/:id',
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      // Prevent admin from deleting themselves
      if (request.user!.id === id) {
        return reply
          .code(400)
          .send({ error: 'VALIDATION_ERROR', message: 'Cannot delete yourself' })
      }

      await prisma.user.delete({ where: { id } })

      reply.code(204).send()
    }
  )
}

export default userRoutes
