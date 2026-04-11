import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    rememberMe: z.boolean().optional(),
  })

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Invalid input' })
    }
    const { email, password, rememberMe } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user?.isActive) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'Invalid credentials' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'Invalid credentials' })
    }

    const { accessToken, refreshToken } = fastify.generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 15 * 60

    reply
      .setCookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge,
      })
      .setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth/refresh',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })
      .send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          language: user.language,
        },
      })
  })

  // POST /auth/logout
  fastify.post('/auth/logout', async (_request, reply) => {
    reply
      .clearCookie('token', { path: '/' })
      .clearCookie('refreshToken', { path: '/api/auth/refresh' })
      .send({ ok: true })
  })

  // POST /auth/refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken

    if (!refreshToken) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'No refresh token provided' })
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || 'your-jwt-secret-change-in-production'
      ) as { id: string }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } })

      if (!user?.isActive) {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid refresh token' })
      }

      const { accessToken, refreshToken: newRefreshToken } = fastify.generateTokens({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })

      reply
        .setCookie('token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60,
        })
        .setCookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/api/auth/refresh',
          maxAge: 30 * 24 * 60 * 60,
        })
        .send({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            language: user.language,
          },
        })
    } catch (error) {
      fastify.log.warn('Refresh token validation failed: %s', (error as Error).message)
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid refresh token' })
    }
  })

  // GET /auth/me
  fastify.get('/auth/me', { preHandler: fastify.authenticate }, async (request, reply) => {
    // Fetch full user data from DB (request.user only has JWT payload)
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        language: true,
        createdAt: true,
      },
    })

    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'User not found' })
    }

    reply.send({ user })
  })
}

export default authRoutes
