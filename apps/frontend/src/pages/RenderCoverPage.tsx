import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Canvas as FabricCanvas } from 'fabric'
import { PAGE_WIDTH, PAGE_HEIGHT } from '../lib/calendarTypes'

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

  const [canvasJson, setCanvasJson] = useState<unknown>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasElRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!projectId || !token) return

    axios
      .get(`/api/render-data/cover/${projectId}?token=${encodeURIComponent(token)}&type=${type}`)
      .then((res) => {
        setCanvasJson(res.data.canvasJson)
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
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
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
      <canvas ref={canvasElRef} style={{ position: 'absolute', top: 0, left: 0 }} />
    </div>
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
