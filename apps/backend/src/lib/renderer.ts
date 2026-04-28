import { PDFDocument, rgb } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { prisma } from '../prisma.js'

// A4 at 96 DPI (matches frontend)
const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

// A4 in points (72 DPI) for PDF
const A4_WIDTH_PT = 595.28
const A4_HEIGHT_PT = 841.89

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
}

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

  try {
    // Update job status to PROCESSING
    await prisma.exportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    })

    const pngPaths: string[] = []
    const jobDir = path.join(EXPORTS_DIR, jobId)
    fs.mkdirSync(jobDir, { recursive: true })

    const totalPages = renderTokens.length + 2 // +2 for covers

    // Helper to capture a single page via the Puppeteer service
    async function capturePage(url: string, pngPath: string, pageNum: number) {
      await prisma.exportJob.update({
        where: { id: jobId },
        data: { currentPage: pageNum, progress: Math.round(((pageNum - 1) / totalPages) * 100) },
      })

      const res = await fetch(`${PUPPETEER_URL}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          deviceScaleFactor: scaleFactor,
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Puppeteer capture failed (${res.status}): ${body}`)
      }

      const buffer = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(pngPath, buffer)
      pngPaths.push(pngPath)
    }

    // 1. Front cover
    const coverUrl = `${frontendUrl}/render-cover/${options.projectId}?token=${encodeURIComponent(options.coverToken)}&type=front`
    await capturePage(coverUrl, path.join(jobDir, '00-cover.png'), 1)

    // 2. Calendar months
    for (let i = 0; i < renderTokens.length; i++) {
      const { monthId, month, token } = renderTokens[i]
      const url = `${frontendUrl}/render/${monthId}?token=${encodeURIComponent(token)}`
      await capturePage(url, path.join(jobDir, `${String(month).padStart(2, '0')}.png`), i + 2)
    }

    // 3. Back cover
    const backCoverUrl = `${frontendUrl}/render-cover/${options.projectId}?token=${encodeURIComponent(options.coverToken)}&type=back`
    await capturePage(backCoverUrl, path.join(jobDir, '99-backcover.png'), totalPages)

    let finalPath: string
    let fileSize: number

    if (options.format === 'PDF') {
      finalPath = path.join(jobDir, `${options.filename}.pdf`)
      await assemblePDF(pngPaths, finalPath, options.bindingGuide)
      fileSize = fs.statSync(finalPath).size

      // Clean up individual PNGs after PDF assembly
      for (const p of pngPaths) {
        try {
          fs.unlinkSync(p)
        } catch {
          /* ignore */
        }
      }
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
    console.error(`Export job ${jobId} failed:`, message)

    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: message,
      },
    })
  }
}

async function assemblePDF(pngPaths: string[], outputPath: string, bindingGuide: boolean) {
  const pdfDoc = await PDFDocument.create()

  for (const pngPath of pngPaths) {
    const pngBytes = fs.readFileSync(pngPath)
    const pngImage = await pdfDoc.embedPng(pngBytes)

    const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT])

    // Draw the PNG scaled to fill the A4 page
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: A4_WIDTH_PT,
      height: A4_HEIGHT_PT,
    })

    // Optional binding guide (center line)
    if (bindingGuide) {
      const centerX = A4_WIDTH_PT / 2
      page.drawLine({
        start: { x: centerX, y: 0 },
        end: { x: centerX, y: A4_HEIGHT_PT },
        thickness: 0.25,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.5,
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync(outputPath, pdfBytes)
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
