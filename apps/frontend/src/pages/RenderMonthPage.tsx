import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Canvas as FabricCanvas } from 'fabric'
import CalendarGrid from '../components/CalendarGrid'
import type { GridConfig, DayCell, Holiday, CalEvent, Saint } from '../lib/calendarTypes'
import { DEFAULT_GRID_CONFIG, PAGE_WIDTH, PAGE_HEIGHT } from '../lib/calendarTypes'

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

  const [data, setData] = useState<MonthRenderData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)

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
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
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
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
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
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
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

  const gridConfig = { ...DEFAULT_GRID_CONFIG, ...(data.month.gridConfigJson || {}) }

  return (
    <div
      style={{
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        backgroundColor: '#fff',
      }}
    >
      {/* Fabric.js canvas — full page background + art objects */}
      <canvas ref={canvasElRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

      {/* Calendar Grid overlay */}
      <div
        style={{
          position: 'absolute',
          left: gridConfig.gridX,
          top: gridConfig.gridY,
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
    </div>
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
