import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Canvas as FabricCanvas } from 'fabric'
import CalendarGrid from '../components/CalendarGrid'
import DraggableMiniCalendar from '../components/DraggableMiniCalendar'
import MiniCalendar from '../components/MiniCalendar'
import EventCountdown from '../components/EventCountdown'
import type { GridConfig, DayCell, Holiday, CalEvent, Saint } from '../lib/calendarTypes'
import {
  DEFAULT_PRINT_CONFIG,
  getBleedPixels,
  getGridConfigForPaper,
  getPaperDimensions,
  type PaperSize,
  type PrintConfig,
} from '../lib/calendarTypes'

// Import all fonts so they render correctly in Puppeteer
import '../components/FontSelector'

interface MonthRenderData {
  month: {
    id: string
    month: number
    year: number
    projectId: string
    canvasTopJson: unknown
    gridConfigJson: GridConfig | null
    isCustomized: boolean
    project: {
      userId: string
      weekStartsOn: string
      name: string
      year: number
      autonomyCode: string | null
      paperSize: PaperSize
      highlightedEvent: CalEvent | null
    }
    dayCells: DayCell[]
  }
  holidays: Holiday[]
  events: CalEvent[]
  saints: Saint[]
}

declare global {
  interface Window {
    __RENDER_READY__?: boolean
  }
}

export default function RenderMonthPage() {
  const { monthId } = useParams<{ monthId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
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

  const [data, setData] = useState<MonthRenderData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)
  const paperDimensions = getPaperDimensions(data?.month.project.paperSize)
  const bleedPx = getBleedPixels(printConfig)
  const outputWidth = paperDimensions.widthPx + bleedPx * 2
  const outputHeight = paperDimensions.heightPx + bleedPx * 2

  // Fetch render data
  useEffect(() => {
    if (!monthId || !token) return

    axios
      .get(`/api/render-data/${monthId}?token=${encodeURIComponent(token)}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load')
        window.__RENDER_READY__ = true // Signal ready even on error
      })
  }, [monthId, token])

  // Initialize Fabric.js canvas when data is loaded
  useEffect(() => {
    if (!data || !canvasElRef.current) return

    const canvas = new FabricCanvas(canvasElRef.current, {
      width: outputWidth,
      height: outputHeight,
      selection: false,
      interactive: false,
      renderOnAddRemove: true,
    })
    fabricRef.current = canvas

    if (data.month.canvasTopJson) {
      canvas
        .loadFromJSON(data.month.canvasTopJson)
        .then(() => {
          canvas.renderAll()
          // Wait for all images to load
          waitForImages(canvas).then(() => {
            window.__RENDER_READY__ = true
          })
        })
        .catch(() => {
          canvas.renderAll()
          window.__RENDER_READY__ = true
        })
    } else {
      canvas.renderAll()
      window.__RENDER_READY__ = true
    }

    return () => {
      canvas.dispose()
    }
  }, [data])

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

  if (!data) {
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
        <p style={{ color: '#999' }}>Loading...</p>
      </div>
    )
  }

  const gridConfig = getGridConfigForPaper(data.month.gridConfigJson, data.month.project.paperSize)
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
      {/* Fabric.js canvas — full page background + art objects */}
      <canvas
        ref={canvasElRef}
        style={{ position: 'absolute', top: bleedPx, left: bleedPx, zIndex: 1 }}
      />

      <EventCountdown
        event={data.month.project.highlightedEvent}
        projectYear={data.month.year}
        className="absolute left-16 top-6 z-[3] w-[calc(100%-8rem)]"
      />

      {/* Calendar Grid overlay */}
      <div
        style={{
          position: 'absolute',
          left: gridConfig.gridX + bleedPx,
          top: gridConfig.gridY + bleedPx,
          width: gridConfig.gridWidth,
          height: gridConfig.gridHeight,
          opacity: gridConfig.gridOverlayOpacity / 100,
          zIndex: 2,
        }}
      >
        <CalendarGrid
          year={data.month.year}
          month={data.month.month}
          weekStartsOn={data.month.project.weekStartsOn}
          gridConfig={gridConfig}
          dayCells={data.month.dayCells || []}
          holidays={data.holidays || []}
          events={data.events || []}
          saints={data.saints || []}
          onCellClick={() => {}}
        />
      </div>
      <DraggableMiniCalendar
        x={gridConfig.miniCalendarX}
        y={gridConfig.miniCalendarY}
        width={gridConfig.miniCalendarWidth}
        height={gridConfig.miniCalendarHeight}
        gridRect={{
          x: gridConfig.gridX,
          y: gridConfig.gridY,
          width: gridConfig.gridWidth,
          height: gridConfig.gridHeight,
        }}
        active={false}
        onLayoutChange={() => {}}
      >
        <MiniCalendar
          year={data.month.year}
          month={data.month.month}
          weekStartsOn={data.month.project.weekStartsOn}
          config={gridConfig}
        />
      </DraggableMiniCalendar>
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
  const stroke = '#111'
  const common = { position: 'absolute' as const, backgroundColor: stroke }
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

/**
 * Wait for all Fabric.js image objects to finish loading.
 */
function waitForImages(canvas: FabricCanvas): Promise<void> {
  return new Promise((resolve) => {
    const objects = canvas.getObjects()
    const imageObjects = objects.filter((obj) => obj.type === 'image')

    if (imageObjects.length === 0) {
      resolve()
      return
    }

    // Give images time to render (Fabric.js loads them during JSON parse)
    // We'll use a simple timeout + check approach
    let checks = 0
    const maxChecks = 20

    const check = () => {
      checks++
      canvas.renderAll()
      if (checks >= maxChecks) {
        resolve()
        return
      }
      setTimeout(check, 200)
    }

    // Start checking after a short initial delay
    setTimeout(check, 500)
  })
}
