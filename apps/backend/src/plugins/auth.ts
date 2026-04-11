import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import jwt from 'jsonwebtoken'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email: string
      name: string
      role: 'USER' | 'ADMIN'
    }
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    generateTokens: (user: { id: string; email: string; name: string; role: string }) => {
      accessToken: string
      refreshToken: string
    }
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // JWT secret
  const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production'

  // Authentication middleware
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.cookies.token

      if (!token) {
        return reply.code(401).send({ error: 'No token provided' })
      }

      const decoded = jwt.verify(token, jwtSecret) as {
        id: string
        email: string
        name: string
        role: 'USER' | 'ADMIN'
      }
      request.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      }
    } catch (error) {
      fastify.log.debug('Authentication failed: %s', (error as Error).message)
      return reply.code(401).send({ error: 'Invalid token' })
    }
  })

  // Admin only middleware
  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' })
    }
  })

  // Helper to generate tokens
  fastify.decorate(
    'generateTokens',
    (user: { id: string; email: string; name: string; role: string }) => {
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        jwtSecret,
        { expiresIn: '15m' }
      )

      const refreshToken = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '7d' })

      return { accessToken, refreshToken }
    }
  )
}

export default fp(authPlugin, {
  name: 'auth',
})
