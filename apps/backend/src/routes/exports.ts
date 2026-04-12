import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import { prisma } from '../prisma.js'
import { renderProject } from '../lib/renderer.js'

const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production'

const createExportSchema = z.object({
  projectId: z.string(),
  format: z.enum(['PDF', 'PNG']),
  dpi: z.number().min(72).max(600).default(300),
  bindingGuide: z.boolean().default(false),
  filename: z.string().optional(),
})

const exportRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /exports — Create a new export job
  fastify.post('/exports', { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = createExportSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    const { projectId, format, dpi, bindingGuide, filename } = parsed.data

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: request.user!.id },
      include: { months: { orderBy: { month: 'asc' } } },
    })

    if (!project) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Project not found' })
    }

    const exportFilename = filename || `${project.name}-${project.year}`

    const job = await prisma.exportJob.create({
      data: {
        projectId,
        userId: request.user!.id,
        format,
        dpi,
        bindingGuide,
        filename: exportFilename,
        totalPages: project.months.length + 2, // +2 for covers
      },
    })

    // Generate render tokens for each month (5 min expiry)
    const renderTokens = project.months.map((m) => ({
      monthId: m.id,
      month: m.month,
      token: jwt.sign({ monthId: m.id, purpose: 'render' }, jwtSecret, { expiresIn: '5m' }),
    }))

    // Generate cover render token
    const coverToken = jwt.sign(
      { projectId, purpose: 'render-cover' },
      jwtSecret,
      { expiresIn: '5m' }
    )

    // Start async rendering (fire and forget)
    renderProject(job.id, renderTokens, {
      format,
      dpi,
      bindingGuide,
      filename: exportFilename,
      projectId,
      coverToken,
    }).catch((err) => {
      fastify.log.error('Export render failed: %s', err.message)
    })

    reply.code(201).send({ job })
  })

  // GET /exports/:id — Check export job status
  fastify.get('/exports/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const job = await prisma.exportJob.findFirst({
      where: { id, userId: request.user!.id },
    })

    if (!job) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Export job not found' })
    }

    reply.send({ job })
  })

  // GET /exports/:id/download — Download the exported file
  fastify.get(
    '/exports/:id/download',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const job = await prisma.exportJob.findFirst({
        where: { id, userId: request.user!.id },
      })

      if (!job) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Export job not found' })
      }

      if (job.status !== 'COMPLETED' || !job.filePath) {
        return reply.code(400).send({ error: 'NOT_READY', message: 'Export not ready' })
      }

      const extension = job.format === 'PDF' ? 'pdf' : 'zip'
      const contentType = job.format === 'PDF' ? 'application/pdf' : 'application/zip'
      const downloadName = `${job.filename || 'calendar'}.${extension}`

      const fileStream = fs.createReadStream(job.filePath)
      return reply
        .header('Content-Type', contentType)
        .header('Content-Disposition', `attachment; filename="${downloadName}"`)
        .send(fileStream)
    }
  )

  // GET /exports — List export jobs for current user
  fastify.get('/exports', { preHandler: fastify.authenticate }, async (request, reply) => {
    const jobs = await prisma.exportJob.findMany({
      where: { userId: request.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    reply.send({ jobs })
  })

  // DELETE /exports/:id — Delete an export job and its file
  fastify.delete('/exports/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const job = await prisma.exportJob.findFirst({
      where: { id, userId: request.user!.id },
    })

    if (!job) {
      return reply.code(404).send({ error: 'NOT_FOUND' })
    }

    // Delete file if exists
    if (job.filePath) {
      const fs = await import('fs')
      try {
        fs.unlinkSync(job.filePath)
      } catch {
        // File may already be deleted
      }
    }

    await prisma.exportJob.delete({ where: { id } })
    reply.send({ success: true })
  })
}

export default exportRoutes
