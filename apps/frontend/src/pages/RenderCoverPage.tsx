import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Canvas as FabricCanvas } from 'fabric'
import {
  DEFAULT_PRINT_CONFIG,
  getBleedPixels,
  getPaperDimensions,
  type PaperSize,
  type PrintConfig,
} from '../lib/calendarTypes'

// Import all fonts so they render correctly in Puppeteer
import '../components/FontSelector'

declare global {
  interface Window {
    __RENDER_READY__?: boolean
  }
}

export default function RenderCoverPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const type = searchParams.get('type') || 'front'
  const printConfig: PrintConfig = {
    ...DEFAULT_PRINT_CONFIG,
    bleedEnabled: Number(searchParams.get('bleed') ?? 0) > 0,
    bleedMm: Number(searchParams.get('bleed') ?? DEFAULT_PRINT_CONFIG.bleedMm),
    cropMarks: searchParams.get('cropMarks') === 'true',
    cropMarkLengthMm: Number(
      searchParams.get('cropMarkLength') ?? DEFAULT_PRINT_CONFIG.cropMarkLengthMm
    ),
    cropMarkOffsetMm: Number(
      searchParams.get('cropMarkOffset') ?? DEFAULT_PRINT_CONFIG.cropMarkOffsetMm
    ),
  }

  const [canvasJson, setCanvasJson] = useState<unknown>(null)
  const [paperSize, setPaperSize] = useState<PaperSize>('A4')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const paperDimensions = getPaperDimensions(paperSize)
  const bleedPx = getBleedPixels(printConfig)
  const outputWidth = paperDimensions.widthPx + bleedPx * 2
  const outputHeight = paperDimensions.heightPx + bleedPx * 2

  useEffect(() => {
    if (!projectId || !token) return

    axios
      .get(`/api/render-data/cover/${projectId}?token=${encodeURIComponent(token)}&type=${type}`)
      .then((res) => {
        setCanvasJson(res.data.canvasJson)
        setPaperSize(res.data.project.paperSize ?? 'A4')
        setLoaded(true)
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load')
        window.__RENDER_READY__ = true
      })
  }, [projectId, token, type])

  useEffect(() => {
    if (!loaded || !canvasElRef.current) return

    const canvas = new FabricCanvas(canvasElRef.current, {
      width: outputWidth,
      height: outputHeight,
      selection: false,
      interactive: false,
      renderOnAddRemove: true,
    })

    if (canvasJson) {
      canvas
        .loadFromJSON(canvasJson)
        .then(() => {
          canvas.renderAll()
          waitForImages(canvas).then(() => {
            window.__RENDER_READY__ = true
          })
        })
        .catch(() => {
          canvas.renderAll()
          window.__RENDER_READY__ = true
        })
    } else {
      // Empty cover — white page
      canvas.renderAll()
      window.__RENDER_READY__ = true
    }

    return () => {
      canvas.dispose()
    }
  }, [loaded, canvasJson])

  if (error) {
    return (
      <div
        style={{
          width: outputWidth,
          height: outputHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        <p style={{ color: '#999' }}>Error: {error}</p>
      </div>
    )
  }

  return (
    <div
      style={{
        width: paperDimensions.widthPx,
        height: paperDimensions.heightPx,
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        backgroundColor: '#fff',
      }}
    >
      <canvas ref={canvasElRef} style={{ position: 'absolute', top: bleedPx, left: bleedPx }} />
      {printConfig.cropMarks && (
        <CropMarks
          bleedPx={bleedPx}
          width={paperDimensions.widthPx}
          height={paperDimensions.heightPx}
          length={(printConfig.cropMarkLengthMm / 25.4) * 96}
          offset={(printConfig.cropMarkOffsetMm / 25.4) * 96}
        />
      )}
    </div>
  )
}

function CropMarks({
  bleedPx,
  width,
  height,
  length,
  offset,
}: {
  bleedPx: number
  width: number
  height: number
  length: number
  offset: number
}) {
  const common = { position: 'absolute' as const, backgroundColor: '#111' }
  return (
    <>
      <div
        style={{
          ...common,
          left: bleedPx - offset - length,
          top: bleedPx,
          width: length,
          height: 1,
        }}
      />
      <div
        style={{
          ...common,
          left: bleedPx,
          top: bleedPx - offset - length,
          width: 1,
          height: length,
        }}
      />
      <div
        style={{
          ...common,
          left: bleedPx + width + offset,
          top: bleedPx,
          width: length,
          height: 1,
        }}
      />
      <div
        style={{
          ...common,
          left: bleedPx + width,
          top: bleedPx - offset - length,
          width: 1,
          height: length,
        }}
      />
      <div
        style={{
          ...common,
          left: bleedPx - offset - length,
          top: bleedPx + height,
          width: length,
          height: 1,
        }}
      />
      <div
        style={{
          ...common,
          left: bleedPx,
          top: bleedPx + height + offset,
          width: 1,
          height: length,
        }}
      />
      <div
        style={{
          ...common,
          left: bleedPx + width + offset,
          top: bleedPx + height,
          width: length,
          height: 1,
        }}
      />
      <div
        style={{
          ...common,
          left: bleedPx + width,
          top: bleedPx + height + offset,
          width: 1,
          height: length,
        }}
      />
    </>
  )
}

function waitForImages(canvas: FabricCanvas): Promise<void> {
  return new Promise((resolve) => {
    const imageObjects = canvas.getObjects().filter((obj) => obj.type === 'image')
    if (imageObjects.length === 0) {
      resolve()
      return
    }
    let checks = 0
    const check = () => {
      checks++
      canvas.renderAll()
      if (checks >= 20) {
        resolve()
        return
      }
      setTimeout(check, 200)
    }
    setTimeout(check, 500)
  })
}
