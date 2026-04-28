/**
 * Puppeteer rendering service for Kalenda.
 * HTTP API that captures web pages as screenshots.
 * Used by the backend to render calendar months for PDF/PNG export.
 */

const http = require('http')
const puppeteer = require('puppeteer-core')

const PORT = parseInt(process.env.PORT || '4000')
const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'

let browser = null

async function getBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-web-security',
      ],
    })
  }
  return browser
}

async function capture(url, width, height, deviceScaleFactor) {
  const b = await getBrowser()
  const page = await b.newPage()

  // Log browser console messages for debugging
  page.on('console', (msg) => {
    console.log(`[browser:${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', (err) => {
    console.error(`[browser:error] ${err.message}`)
  })
  page.on('requestfailed', (req) => {
    console.error(`[browser:request-failed] ${req.url()} ${req.failure()?.errorText}`)
  })

  await page.setViewport({ width, height, deviceScaleFactor })
  console.log(`[capture] Navigating to: ${url}`)
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
  console.log('[capture] networkidle0 reached, waiting for __RENDER_READY__...')
  await page.waitForFunction('window.__RENDER_READY__ === true', { timeout: 30000 })

  // Small delay for final paint
  await new Promise((r) => setTimeout(r, 500))

  const screenshot = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width, height },
  })

  await page.close()
  return screenshot
}

const server = http.createServer(async (req, res) => {
  // CORS and health
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ status: 'ok' }))
  }

  if (req.method === 'POST' && req.url === '/capture') {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', async () => {
      try {
        const { url, width, height, deviceScaleFactor } = JSON.parse(body)
        if (!url || !width || !height) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ error: 'Missing url, width, or height' }))
        }

        const png = await capture(url, width, height, deviceScaleFactor || 1)
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': png.length,
        })
        res.end(png)
      } catch (err) {
        console.error('Capture error:', err.message)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
    return
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`Puppeteer service listening on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (browser) await browser.close()
  server.close(() => process.exit(0))
})
