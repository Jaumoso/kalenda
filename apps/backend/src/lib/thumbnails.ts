import puppeteer, { type Browser } from 'puppeteer'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const THUMBS_DIR = path.join(__dirname, '../../uploads/thumbs')
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
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

let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browser?.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    })
  }
  return browser
}

function ensureThumbsDir() {
  if (!fs.existsSync(THUMBS_DIR)) {
    fs.mkdirSync(THUMBS_DIR, { recursive: true })
  }
}

/**
 * Generate a thumbnail for a calendar month by rendering
 * the full page via Puppeteer and scaling it down.
 */
export async function generateMonthThumbnail(monthId: string, userId: string): Promise<void> {
  assertCuid(monthId, 'monthId')
  ensureThumbsDir()

  const token = jwt.sign({ monthId, purpose: 'render' }, JWT_SECRET, { expiresIn: '2m' })
  const url = `${FRONTEND_URL}/render/${monthId}?token=${encodeURIComponent(token)}`

  const b = await getBrowser()
  const page = await b.newPage()

  try {
    await page.setViewport({ width: PAGE_WIDTH, height: PAGE_HEIGHT, deviceScaleFactor: 1 })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    await page.waitForFunction('window.__RENDER_READY__ === true', { timeout: 15000 })
    await new Promise((r) => setTimeout(r, 300))

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT },
    })

    // Resize to thumbnail with sharp
    await sharp(screenshot)
      .resize(THUMB_WIDTH, THUMB_HEIGHT)
      .jpeg({ quality: 80 })
      .toFile(path.join(THUMBS_DIR, `${monthId}.jpg`))
  } finally {
    await page.close()
  }
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

  const b = await getBrowser()
  const page = await b.newPage()

  try {
    await page.setViewport({ width: PAGE_WIDTH, height: PAGE_HEIGHT, deviceScaleFactor: 1 })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    await page.waitForFunction('window.__RENDER_READY__ === true', { timeout: 15000 })
    await new Promise((r) => setTimeout(r, 300))

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT },
    })

    await sharp(screenshot)
      .resize(THUMB_WIDTH, THUMB_HEIGHT)
      .jpeg({ quality: 80 })
      .toFile(path.join(THUMBS_DIR, `cover-${projectId}-${side}.jpg`))
  } finally {
    await page.close()
  }
}
