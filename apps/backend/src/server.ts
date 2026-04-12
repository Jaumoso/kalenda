import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyStatic from '@fastify/static'
import fastifyMultipart from '@fastify/multipart'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import authPlugin from './plugins/auth.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import projectRoutes from './routes/projects.js'
import assetRoutes from './routes/assets.js'
import folderRoutes from './routes/folders.js'
import monthRoutes from './routes/months.js'
import holidayRoutes from './routes/holidays.js'
import eventRoutes from './routes/events.js'
import templateRoutes from './routes/templates.js'
import renderRoutes from './routes/render.js'
import exportRoutes from './routes/exports.js'
import coverRoutes from './routes/covers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createServer() {
  const fastify = Fastify({
    logger: true,
  })

  // Register plugins
  await fastify.register(fastifyHelmet)
  await fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'default-secret-change-in-production',
  })
  await fastify.register(fastifyCors, {
    origin: process.env.NODE_ENV !== 'production',
    credentials: true,
  })

  // Register multipart for file uploads
  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  })

  // Register custom plugins
  await fastify.register(authPlugin)

  // Serve uploaded files (must be first static registration to own decorateReply)
  const uploadsDir = path.join(__dirname, '../uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  await fastify.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
  })

  // Serve static files (for production builds)
  const frontendDist = path.join(__dirname, '../../frontend/dist')
  if (fs.existsSync(frontendDist)) {
    await fastify.register(fastifyStatic, {
      root: frontendDist,
      prefix: '/',
      decorateReply: false,
    })
  }

  // API routes
  fastify.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Register auth routes
  await fastify.register(authRoutes, { prefix: '/api' })

  // Register user routes
  await fastify.register(userRoutes, { prefix: '/api' })

  // Register project routes
  await fastify.register(projectRoutes, { prefix: '/api' })

  // Register asset routes
  await fastify.register(assetRoutes, { prefix: '/api' })

  // Register folder routes
  await fastify.register(folderRoutes, { prefix: '/api' })

  // Register month routes
  await fastify.register(monthRoutes, { prefix: '/api' })

  // Register holiday routes
  await fastify.register(holidayRoutes, { prefix: '/api' })

  // Register event routes
  await fastify.register(eventRoutes, { prefix: '/api' })

  // Register template routes
  await fastify.register(templateRoutes, { prefix: '/api' })

  // Register render routes (public, token-authenticated for Puppeteer)
  await fastify.register(renderRoutes, { prefix: '/api' })

  // Register export routes
  await fastify.register(exportRoutes, { prefix: '/api' })

  // Register cover routes
  await fastify.register(coverRoutes, { prefix: '/api' })

  // Serve export files
  const exportsDir = process.env.EXPORT_PATH || path.join(__dirname, '../exports')
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true })

  // Catch-all handler for SPA (must be last)
  fastify.setNotFoundHandler(async (request, reply) => {
    if (request.raw.url?.startsWith('/api') || request.raw.url?.startsWith('/uploads')) {
      return reply.code(404).send({ error: 'Not Found' })
    }

    // Serve index.html for SPA routes (production only)
    const indexPath = path.join(frontendDist, 'index.html')
    if (fs.existsSync(indexPath)) {
      return reply.type('text/html').send(fs.readFileSync(indexPath))
    }

    return reply.code(404).send({ error: 'Not Found' })
  })

  return fastify
}

// Start server
async function start() {
  try {
    const fastify = await createServer()
    const port = parseInt(process.env.PORT || '3000')
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    console.log(`Server listening on http://${host}:${port}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

start()
