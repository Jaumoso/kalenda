import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import sharp from 'sharp'
import { prisma } from '@/prisma.js'
import { fileURLToPath } from 'url'
import { rateLimitConfig } from '@/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads')
const THUMBS_DIR = path.join(UPLOADS_DIR, 'thumbs')

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const THUMB_SIZE = 300

const rateLimit = rateLimitConfig.strict

async function ensureDirs() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  await fs.mkdir(THUMBS_DIR, { recursive: true })
}

const assetRoutes: FastifyPluginAsync = async (fastify) => {
  await ensureDirs()

  // POST /assets/upload — Upload one or more files
  fastify.post(
    '/assets/upload',
    {
      preHandler: fastify.authenticate,
      config: {
        rateLimit,
      },
    },
    async (request, reply) => {
      const parts = request.parts()
      const uploaded: Array<{
        id: string
        filename: string
        originalName: string
        mimeType: string
        sizeBytes: number
        width: number | null
        height: number | null
        thumbPath: string | null
        type: string
      }> = []
      let folderId: string | null = null

      for await (const part of parts) {
        if (part.type === 'field' && part.fieldname === 'folderId') {
          folderId = (part.value as string) || null
          continue
        }

        if (part.type !== 'file') continue

        const { mimetype, filename: originalName } = part

        if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
          return reply.code(400).send({
            error: 'INVALID_FILE_TYPE',
            message: `Unsupported type: ${mimetype}`,
          })
        }

        // Read file into buffer
        const chunks: Buffer[] = []
        let totalSize = 0
        for await (const chunk of part.file) {
          totalSize += chunk.length
          if (totalSize > MAX_FILE_SIZE) {
            return reply.code(400).send({
              error: 'FILE_TOO_LARGE',
              message: 'El archivo supera el límite de 10MB',
            })
          }
          chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)

        // Generate unique filename
        const ext = path.extname(originalName).toLowerCase() || '.jpg'
        const uniqueName = `${crypto.randomUUID()}${ext}`
        const filePath = path.join(UPLOADS_DIR, uniqueName)

        // Get image metadata & save optimized
        let width: number | null = null
        let height: number | null = null
        let thumbName: string | null = null

        const isRasterImage = mimetype !== 'image/svg+xml'

        if (isRasterImage) {
          const metadata = await sharp(buffer).metadata()
          width = metadata.width ?? null
          height = metadata.height ?? null

          // Save optimized original
          await sharp(buffer)
            .rotate() // auto-rotate based on EXIF
            .toFile(filePath)

          // Generate thumbnail
          thumbName = `thumb_${uniqueName}`
          await sharp(buffer)
            .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(path.join(THUMBS_DIR, thumbName))
        } else {
          // SVG: save as-is
          await fs.writeFile(filePath, buffer)
        }

        // Verify folder ownership if specified
        if (folderId) {
          const folder = await prisma.assetFolder.findFirst({
            where: { id: folderId, userId: request.user!.id },
          })
          if (!folder) {
            // Clean up uploaded file
            await fs.unlink(filePath).catch(() => {})
            if (thumbName) await fs.unlink(path.join(THUMBS_DIR, thumbName)).catch(() => {})
            return reply.code(404).send({ error: 'NOT_FOUND', message: 'Folder not found' })
          }
        }

        const asset = await prisma.asset.create({
          data: {
            filename: uniqueName,
            originalName,
            mimeType: mimetype,
            sizeBytes: buffer.length,
            width,
            height,
            thumbPath: thumbName ? `thumbs/${thumbName}` : null,
            type: 'IMAGE',
            folderId,
            userId: request.user!.id,
          },
        })

        uploaded.push(asset)
      }

      if (uploaded.length === 0) {
        return reply.code(400).send({ error: 'NO_FILES', message: 'No files were uploaded' })
      }

      reply.code(201).send({ assets: uploaded })
    }
  )

  // GET /assets — List assets with optional filtering
  fastify.get(
    '/assets',
    {
      preHandler: fastify.authenticate,
      config: {
        rateLimit,
      },
    },
    async (request, reply) => {
      const query = request.query as {
        folderId?: string
        search?: string
        page?: string
        limit?: string
      }

      const page = Math.max(1, parseInt(query.page || '1'))
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50')))
      const skip = (page - 1) * limit

      const where: Record<string, unknown> = { userId: request.user!.id }

      if (query.folderId === 'null' || query.folderId === '') {
        where.folderId = null // Root level
      } else if (query.folderId) {
        where.folderId = query.folderId
      }

      if (query.search) {
        where.originalName = { contains: query.search, mode: 'insensitive' }
      }

      const [assets, total] = await Promise.all([
        prisma.asset.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.asset.count({ where }),
      ])

      reply.send({
        assets,
        total,
        page,
        limit,
        hasMore: skip + assets.length < total,
      })
    }
  )

  // DELETE /assets/:id
  fastify.delete(
    '/assets/:id',
    {
      preHandler: fastify.authenticate,
      config: {
        rateLimit,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const asset = await prisma.asset.findFirst({
        where: { id, userId: request.user!.id },
      })
      if (!asset) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Asset not found' })
      }

      // Delete files
      await fs.unlink(path.join(UPLOADS_DIR, asset.filename)).catch(() => {})
      if (asset.thumbPath) {
        await fs.unlink(path.join(UPLOADS_DIR, asset.thumbPath)).catch(() => {})
      }

      await prisma.asset.delete({ where: { id } })

      reply.send({ ok: true })
    }
  )

  // PATCH /assets/:id — Move to folder or rename
  fastify.patch(
    '/assets/:id',
    {
      preHandler: fastify.authenticate,
      config: {
        rateLimit,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const schema = z.object({
        folderId: z.string().nullable().optional(),
        originalName: z.string().min(1).max(200).optional(),
      })
      const parsed = schema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Invalid input' })
      }

      const asset = await prisma.asset.findFirst({
        where: { id, userId: request.user!.id },
      })
      if (!asset) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Asset not found' })
      }

      // Verify folder ownership
      if (parsed.data.folderId) {
        const folder = await prisma.assetFolder.findFirst({
          where: { id: parsed.data.folderId, userId: request.user!.id },
        })
        if (!folder) {
          return reply.code(404).send({ error: 'NOT_FOUND', message: 'Folder not found' })
        }
      }

      const updated = await prisma.asset.update({
        where: { id },
        data: parsed.data,
      })

      reply.send({ asset: updated })
    }
  )
}

export default assetRoutes
