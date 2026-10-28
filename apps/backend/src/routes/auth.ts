import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'
import { getSecret, isUserRegistrationEnabled, rateLimitConfig } from '@/config.js'

const loginRateLimit = rateLimitConfig.login
const authRateLimit = rateLimitConfig.strict
const jwtSecret = getSecret('JWT_SECRET', 'dev-jwt-secret')

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    rememberMe: z.boolean().optional(),
  })

  const registerSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    password: z.string().min(6),
  })

  // GET /auth/registration-status — Public registration configuration
  fastify.get(
    '/auth/registration-status',
    { config: { rateLimit: authRateLimit } },
    async (_request, reply) => {
      reply.send({ enabled: isUserRegistrationEnabled() })
    }
  )

  // POST /auth/register — Create a standard user when public registration is enabled
  fastify.post(
    '/auth/register',
    { config: { rateLimit: loginRateLimit } },
    async (request, reply) => {
      if (!isUserRegistrationEnabled()) {
        return reply
          .code(403)
          .send({ error: 'REGISTRATION_DISABLED', message: 'User registration is disabled' })
      }

      const parsed = registerSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'VALIDATION_ERROR', message: 'Invalid registration data' })
      }

      const { email, name, password } = parsed.data
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
      if (!admin) {
        return reply.code(503).send({
          error: 'ADMIN_NOT_CONFIGURED',
          message: 'The administrator account must be configured before registration',
        })
      }

      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return reply
          .code(409)
          .send({ error: 'EMAIL_ALREADY_EXISTS', message: 'User already exists' })
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: { email, name, password: hashedPassword, role: 'USER' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          language: true,
        },
      })

      reply.code(201).send({ user })
    }
  )

  // POST /auth/login — stricter rate limit (5 attempts per minute)
  fastify.post('/auth/login', { config: { rateLimit: loginRateLimit } }, async (request, reply) => {
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
  fastify.post(
    '/auth/logout',
    { config: { rateLimit: loginRateLimit } },
    async (_request, reply) => {
      reply
        .clearCookie('token', { path: '/' })
        .clearCookie('refreshToken', { path: '/api/auth/refresh' })
        .send({ ok: true })
    }
  )

  // POST /auth/refresh
  fastify.post(
    '/auth/refresh',
    {
      config: { rateLimit: loginRateLimit },
    },
    async (request, reply) => {
      const refreshToken = request.cookies.refreshToken

      if (!refreshToken) {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'No refresh token provided' })
      }

      try {
        const decoded = jwt.verify(refreshToken, jwtSecret) as { id: string }

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
    }
  )

  // GET /auth/me
  fastify.get(
    '/auth/me',
    { preHandler: fastify.authenticate, config: { rateLimit: authRateLimit } },
    async (request, reply) => {
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
    }
  )
}

export default authRoutes
