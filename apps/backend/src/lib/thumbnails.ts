import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const THUMBS_DIR = path.join(
  process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads'),
  'thumbs'
)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const PUPPETEER_URL = process.env.PUPPETEER_URL || 'http://localhost:4000'
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production'

// A4 at 96 DPI (matches frontend)
const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123
// Thumbnail dimensions (scaled down)
const THUMB_WIDTH = 240
const THUMB_HEIGHT = Math.round(THUMB_WIDTH * (PAGE_HEIGHT / PAGE_WIDTH))

// cuid format: starts with 'c', followed by alphanumeric chars (typically 25 total)
const CUID_RE = /^c[a-z0-9]{20,30}$/

function assertCuid(value: string, label: string): void {
  if (!CUID_RE.test(value)) {
    throw new Error(`Invalid ${label}: must be a valid cuid`)
  }
}

function ensureThumbsDir() {
  if (!fs.existsSync(THUMBS_DIR)) {
    fs.mkdirSync(THUMBS_DIR, { recursive: true })
  }
}

/**
 * Capture a screenshot via the external Puppeteer service.
 */
async function captureScreenshot(pageUrl: string): Promise<Buffer> {
  console.log(`[thumbnails] Capturing screenshot: ${pageUrl} via ${PUPPETEER_URL}/capture`)
  const res = await fetch(`${PUPPETEER_URL}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: pageUrl,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      deviceScaleFactor: 1,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Puppeteer capture failed (${res.status}): ${body}`)
  }

  const buf = Buffer.from(await res.arrayBuffer())
  console.log(`[thumbnails] Screenshot captured: ${buf.length} bytes`)
  return buf
}

/**
 * Generate a thumbnail for a calendar month by rendering
 * the full page via the Puppeteer service and scaling it down.
 */
export async function generateMonthThumbnail(monthId: string, userId: string): Promise<void> {
  assertCuid(monthId, 'monthId')
  ensureThumbsDir()

  const token = jwt.sign({ monthId, purpose: 'render' }, JWT_SECRET, { expiresIn: '2m' })
  const url = `${FRONTEND_URL}/render/${monthId}?token=${encodeURIComponent(token)}`

  const screenshot = await captureScreenshot(url)

  const outPath = path.join(THUMBS_DIR, `${monthId}.jpg`)
  await sharp(screenshot).resize(THUMB_WIDTH, THUMB_HEIGHT).jpeg({ quality: 80 }).toFile(outPath)
  console.log(`[thumbnails] Month thumbnail saved: ${outPath}`)
}

/**
 * Generate a thumbnail for a cover page.
 */
export async function generateCoverThumbnail(
  projectId: string,
  side: 'front' | 'back'
): Promise<void> {
  assertCuid(projectId, 'projectId')
  ensureThumbsDir()

  const token = jwt.sign({ projectId, purpose: 'render-cover' }, JWT_SECRET, { expiresIn: '2m' })
  const url = `${FRONTEND_URL}/render-cover/${projectId}?token=${encodeURIComponent(token)}&type=${side}`

  const screenshot = await captureScreenshot(url)

  const outPath = path.join(THUMBS_DIR, `cover-${projectId}-${side}.jpg`)
  await sharp(screenshot).resize(THUMB_WIDTH, THUMB_HEIGHT).jpeg({ quality: 80 }).toFile(outPath)
  console.log(`[thumbnails] Cover thumbnail saved: ${outPath}`)
}
