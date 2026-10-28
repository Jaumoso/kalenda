import { PDFDocument, rgb } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'
import { getSecret } from '../config.js'
import { isExportCancellable } from './exportStatus.js'
import {
  DEFAULT_PRINT_CONFIG,
  PAPER_DIMENSIONS,
  getPrintGeometry,
  type PaperSize,
  type PrintConfig,
} from '@kalenda/shared'
import { getSafeExportJobId } from './exportPath.js'

const EXPORTS_DIR = process.env.EXPORT_PATH || path.join(process.cwd(), 'exports')
const PUPPETEER_URL = process.env.PUPPETEER_URL || 'http://localhost:4000'

interface RenderToken {
  monthId: string
  month: number
  token: string
}

interface RenderOptions {
  format: 'PDF' | 'PNG'
  dpi: number
  bindingGuide: boolean
  filename: string
  projectId: string
  coverToken: string
  paperSize: PaperSize
  printConfig: PrintConfig
  monthId?: string
}

const jwtSecret = getSecret('JWT_SECRET', 'dev-jwt-secret')
const activeExports = new Map<string, AbortController>()

async function ensureExportsDir() {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true })
  }
}

export async function renderProject(
  jobId: string,
  renderTokens: RenderToken[],
  options: RenderOptions
) {
  await ensureExportsDir()

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const scaleFactor = options.dpi / 96
  const paper = PAPER_DIMENSIONS[options.paperSize]
  const printConfig = options.printConfig
  const geometry = getPrintGeometry(printConfig, paper)
  const outputWidth = geometry.outputWidthPx
  const outputHeight = geometry.outputHeightPx
  const controller = new AbortController()
  activeExports.set(jobId, controller)

  try {
    const currentJob = await prisma.exportJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    })
    if (!currentJob || currentJob.status === 'CANCELLED') return

    // Update job status to PROCESSING
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        progress: 0,
        currentPage: 0,
        filePath: null,
        fileSize: null,
        error: null,
      },
    })

    const pngPaths: string[] = []
    const jobDir = path.join(EXPORTS_DIR, jobId)
    fs.mkdirSync(jobDir, { recursive: true })

    const totalPages = options.monthId ? 1 : renderTokens.length + 2

    // Helper to capture a single page via the Puppeteer service
    async function capturePage(url: string, pngPath: string, pageNum: number) {
      if (controller.signal.aborted) throw new Error('Export cancelled')
      await prisma.exportJob.update({
        where: { id: jobId },
        data: { currentPage: pageNum, progress: Math.round(((pageNum - 1) / totalPages) * 100) },
      })

      const res = await fetch(`${PUPPETEER_URL}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          width: outputWidth,
          height: outputHeight,
          deviceScaleFactor: scaleFactor,
          captureId: `${jobId}-${pageNum}`,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Puppeteer capture failed (${res.status}): ${body}`)
      }

      const buffer = Buffer.from(await res.arrayBuffer())
      if (controller.signal.aborted) throw new Error('Export cancelled')
      fs.writeFileSync(pngPath, buffer)
      pngPaths.push(pngPath)
    }

    if (options.monthId) {
      const selected = renderTokens.find((token) => token.monthId === options.monthId)
      if (!selected) throw new Error('Selected month is unavailable')
      const url = `${frontendUrl}/render/${selected.monthId}?token=${encodeURIComponent(selected.token)}${renderConfigQuery(printConfig)}`
      await capturePage(url, path.join(jobDir, `${String(selected.month).padStart(2, '0')}.png`), 1)
    } else {
      // 1. Front cover
      const coverUrl = `${frontendUrl}/render-cover/${options.projectId}?token=${encodeURIComponent(options.coverToken)}&type=front${renderConfigQuery(printConfig)}`
      await capturePage(coverUrl, path.join(jobDir, '00-cover.png'), 1)

      // 2. Calendar months
      for (let i = 0; i < renderTokens.length; i++) {
        const { monthId, month, token } = renderTokens[i]
        const url = `${frontendUrl}/render/${monthId}?token=${encodeURIComponent(token)}${renderConfigQuery(printConfig)}`
        await capturePage(url, path.join(jobDir, `${String(month).padStart(2, '0')}.png`), i + 2)
      }

      // 3. Back cover
      const backCoverUrl = `${frontendUrl}/render-cover/${options.projectId}?token=${encodeURIComponent(options.coverToken)}&type=back${renderConfigQuery(printConfig)}`
      await capturePage(backCoverUrl, path.join(jobDir, '99-backcover.png'), totalPages)
    }
    let finalPath: string
    let fileSize: number

    if (options.format === 'PDF') {
      finalPath = path.join(jobDir, `${options.filename}.pdf`)
      await assemblePDF(pngPaths, finalPath, options.bindingGuide, options.paperSize, printConfig)
      fileSize = fs.statSync(finalPath).size

      // Clean up individual PNGs after PDF assembly
      for (const p of pngPaths) {
        try {
          fs.unlinkSync(p)
        } catch {
          /* ignore */
        }
      }
    } else if (options.monthId) {
      finalPath = path.join(jobDir, `${options.filename}.png`)
      fs.copyFileSync(pngPaths[0], finalPath)
      fileSize = fs.statSync(finalPath).size
      fs.unlinkSync(pngPaths[0])
    } else {
      // PNG format: create a ZIP of all PNGs
      finalPath = path.join(jobDir, `${options.filename}.zip`)
      await createZip(pngPaths, finalPath, options.filename)
      fileSize = fs.statSync(finalPath).size
    }

    // Update job as completed
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        currentPage: totalPages,
        filePath: finalPath,
        fileSize,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (controller.signal.aborted || message === 'Export cancelled') {
      await cleanupExportFiles(jobId)
      return
    }
    console.error(`Export job ${jobId} failed:`, message)

    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: message,
      },
    })
  } finally {
    activeExports.delete(jobId)
  }
}

export async function cancelExportJob(jobId: string): Promise<boolean> {
  const job = await prisma.exportJob.findUnique({ where: { id: jobId }, select: { status: true } })
  if (!job || !isExportCancellable(job.status)) return false
  await prisma.exportJob.update({
    where: { id: jobId },
    data: { status: 'CANCELLED', error: 'Export cancelled' },
  })
  const controller = activeExports.get(jobId)
  controller?.abort()
  void fetch(`${PUPPETEER_URL}/capture/${encodeURIComponent(jobId)}`, { method: 'DELETE' }).catch(
    () => undefined
  )
  await cleanupExportFiles(jobId)
  return true
}

async function cleanupExportFiles(jobId: string) {
  const safeJobId = getSafeExportJobId(jobId)
  if (!safeJobId) return
  const jobDir = path.join(EXPORTS_DIR, safeJobId)
  if (fs.existsSync(jobDir)) {
    fs.rmSync(jobDir, { recursive: true, force: true })
  }
}

export async function startExportJob(jobId: string): Promise<void> {
  const job = await prisma.exportJob.findUnique({
    where: { id: jobId },
    include: {
      project: {
        include: {
          months: { orderBy: { month: 'asc' } },
        },
      },
      month: true,
    },
  })

  if (!job) {
    throw new Error(`Export job ${jobId} not found`)
  }

  const renderTokens = job.project.months.map((month) => ({
    monthId: month.id,
    month: month.month,
    token: jwt.sign({ monthId: month.id, purpose: 'render' }, jwtSecret, { expiresIn: '5m' }),
  }))

  const coverToken = jwt.sign({ projectId: job.projectId, purpose: 'render-cover' }, jwtSecret, {
    expiresIn: '5m',
  })

  await renderProject(job.id, renderTokens, {
    format: job.format,
    dpi: job.dpi,
    bindingGuide: job.bindingGuide,
    filename: job.filename || `${job.project.name}-${job.project.year}`,
    projectId: job.projectId,
    coverToken,
    paperSize: job.project.paperSize as PaperSize,
    printConfig: {
      ...DEFAULT_PRINT_CONFIG,
      ...(job.printConfigJson as Partial<PrintConfig> | null | undefined),
    },
    monthId: job.monthId ?? undefined,
  })
}

export async function recoverInterruptedExports(log: (message: string) => void): Promise<void> {
  const jobs = await prisma.exportJob.findMany({
    where: {
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  for (const job of jobs) {
    log(`Recovering interrupted export job ${job.id}`)
    startExportJob(job.id).catch((error: unknown) => {
      log(
        `Unable to recover export job ${job.id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    })
  }
}

async function assemblePDF(
  pngPaths: string[],
  outputPath: string,
  bindingGuide: boolean,
  paperSize: PaperSize,
  printConfig: PrintConfig
) {
  const pdfDoc = await PDFDocument.create()
  const paper = PAPER_DIMENSIONS[paperSize]
  const geometry = getPrintGeometry(printConfig, paper)
  const marginPt = (geometry.contentOffsetPx / 96) * 72

  for (const pngPath of pngPaths) {
    const pngBytes = fs.readFileSync(pngPath)
    const pngImage = await pdfDoc.embedPng(pngBytes)

    const page = pdfDoc.addPage([paper.widthPt + marginPt * 2, paper.heightPt + marginPt * 2])

    // Draw the PNG scaled to fill the A4 page
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: paper.widthPt + marginPt * 2,
      height: paper.heightPt + marginPt * 2,
    })

    // Optional binding guide (center line)
    if (bindingGuide) {
      const centerX = (paper.widthPt + marginPt * 2) / 2
      page.drawLine({
        start: { x: centerX, y: 0 },
        end: { x: centerX, y: paper.heightPt + marginPt * 2 },
        thickness: 0.25,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.5,
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync(outputPath, pdfBytes)
}

function renderConfigQuery(config: PrintConfig): string {
  const params = new URLSearchParams({
    bleed: config.bleedEnabled ? String(config.bleedMm) : '0',
    cropMarks: String(config.cropMarks),
    cropMarkLength: String(config.cropMarkLengthMm),
    cropMarkOffset: String(config.cropMarkOffsetMm),
  })
  return `&${params.toString()}`
}

async function createZip(pngPaths: string[], outputPath: string, baseName: string) {
  const { execSync } = await import('child_process')
  const dir = path.dirname(pngPaths[0])

  // Rename PNGs to friendly names before zipping
  const renamedPaths: string[] = []
  for (const pngPath of pngPaths) {
    const monthNum = path.basename(pngPath, '.png')
    const friendlyName = baseName + '-' + monthNum + '.png'
    const newPath = path.join(dir, friendlyName)
    fs.copyFileSync(pngPath, newPath)
    renamedPaths.push(friendlyName)
  }

  const fileArgs = renamedPaths.map((f) => '"' + f + '"').join(' ')
  execSync('cd "' + dir + '" && zip -j "' + outputPath + '" ' + fileArgs, { timeout: 30000 })

  // Clean up renamed copies
  for (const f of renamedPaths) {
    try {
      fs.unlinkSync(path.join(dir, f))
    } catch {
      /* ignore */
    }
  }
  // Clean up original PNGs
  for (const p of pngPaths) {
    try {
      fs.unlinkSync(p)
    } catch {
      /* ignore */
    }
  }
}
