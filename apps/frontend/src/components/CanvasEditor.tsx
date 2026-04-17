import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as fabric from 'fabric'
import { PAGE_WIDTH, PAGE_HEIGHT } from '../lib/calendarTypes'

// ── Clip-border rendering patch ──────────────────────────────────────────────
// Fabric.js clipPath clips the stroke too. This patch draws the border
// outline AFTER the clipped render so it remains visible on masked images.

type ClipMaskName = 'circle' | 'heart' | 'star' | 'hexagon'
type ObjWithClip = fabric.FabricObject & {
  clipMaskType?: string
  __clipBorderPatched?: boolean
}

/** Draw the outline matching a clip-mask shape (canvas 2D, centered at 0,0). */
function drawMaskBorder(
  ctx: CanvasRenderingContext2D,
  maskType: ClipMaskName,
  w: number,
  h: number,
  strokeWidth: number,
  strokeColor: string
) {
  const r = Math.min(w, h) / 2
  ctx.save()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = strokeWidth
  ctx.lineJoin = 'round'

  switch (maskType) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.stroke()
      break
    case 'heart': {
      const s = (r * 2) / 20
      const heart = new Path2D(
        'M 10,17 C 10,17 2,11 2,6.5 C 2,3.5 4.5,1 7,1 C 8.7,1 10,2.2 10,2.2 C 10,2.2 11.3,1 13,1 C 15.5,1 18,3.5 18,6.5 C 18,11 10,17 10,17 Z'
      )
      ctx.save()
      // Compensate lineWidth for the scale so stroke looks uniform
      ctx.lineWidth = strokeWidth / s
      ctx.scale(s, s)
      ctx.translate(-10, -9)
      ctx.stroke(heart)
      ctx.restore()
      break
    }
    case 'star': {
      const outer = r,
        inner = r * 0.4
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * i) / 5 - Math.PI / 2
        const rad = i % 2 === 0 ? outer : inner
        const x = rad * Math.cos(angle)
        const y = rad * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
      break
    }
    case 'hexagon': {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * i) / 3 - Math.PI / 6
        const x = r * Math.cos(angle)
        const y = r * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
      break
    }
  }
  ctx.restore()
}

/**
 * Patch an object so its stroke renders outside the clipPath.
 * Safe to call multiple times (idempotent).
 */
export function patchClipBorder(obj: fabric.FabricObject): void {
  const o = obj as ObjWithClip
  if (o.__clipBorderPatched) return
  o.__clipBorderPatched = true

  const origDrawObject = obj.drawObject.bind(obj)
  obj.drawObject = function (
    this: ObjWithClip,
    ctx: CanvasRenderingContext2D,
    forClipping: boolean | undefined,
    context: fabric.DrawContext
  ) {
    const maskType = this.clipMaskType
    const hasBorder =
      maskType && maskType !== 'none' && this.clipPath && this.strokeWidth && this.strokeWidth > 0

    if (!hasBorder || forClipping) {
      origDrawObject.call(this, ctx, forClipping, context)
      return
    }

    // Hide stroke → clipped render → restore → draw border outside clip
    const sw = this.strokeWidth
    const sc = this.stroke
    this.strokeWidth = 0
    origDrawObject.call(this, ctx, forClipping, context)
    this.strokeWidth = sw
    this.stroke = sc

    drawMaskBorder(ctx, maskType as ClipMaskName, this.width, this.height, sw, sc as string)
  }
}

/**
 * Normalize image `src` in canvas JSON to relative paths.
 * Fabric.js stores the resolved absolute URL (e.g. http://localhost:5173/uploads/file.jpg)
 * which breaks if the origin changes. Convert back to relative /uploads/… paths.
 */
function normalizeCanvasJson(json: Record<string, unknown>): Record<string, unknown> {
  const origin = window.location.origin
  const fixSrc = (obj: Record<string, unknown>) => {
    if (typeof obj.src === 'string' && obj.src.startsWith(origin)) {
      obj.src = obj.src.slice(origin.length)
    }
  }
  if (Array.isArray(json.objects)) {
    for (const obj of json.objects) {
      fixSrc(obj as Record<string, unknown>)
    }
  }
  if (json.backgroundImage && typeof json.backgroundImage === 'object') {
    fixSrc(json.backgroundImage as Record<string, unknown>)
  }
  return json
}

/**
 * Load canvas from JSON with per-object error tolerance.
 * If an image fails to load, other objects are still restored.
 */
async function safeLoadFromJSON(canvas: fabric.Canvas, json: object): Promise<void> {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json
  const {
    objects = [],
    backgroundImage: bgImageData,
    overlayImage: overlayImageData,
    ...canvasProps
  } = parsed as Record<string, unknown> & {
    objects?: Record<string, unknown>[]
    backgroundImage?: unknown
    overlayImage?: unknown
  }

  // Load objects one-by-one so a single image failure doesn't kill everything
  const loaded: fabric.FabricObject[] = []
  for (const objData of objects) {
    try {
      const klass = fabric.classRegistry.getClass(objData.type as string)
      const instance = await (
        klass as { fromObject: (d: unknown) => Promise<fabric.FabricObject> }
      ).fromObject(objData)
      loaded.push(instance)
    } catch (err) {
      console.warn('[CanvasEditor] Failed to restore object, skipping:', objData.type, err)
    }
  }

  // Deserialize background/overlay images into real FabricImage instances
  const bgProps: Record<string, unknown> = {}
  const bgEntries: Array<[string, unknown]> = [
    ['backgroundImage', bgImageData],
    ['overlayImage', overlayImageData],
  ]
  for (const [key, data] of bgEntries) {
    if (data && typeof data === 'object') {
      try {
        const klass = fabric.classRegistry.getClass(
          (data as Record<string, unknown>).type as string
        )
        bgProps[key] = await (
          klass as { fromObject: (d: unknown) => Promise<fabric.FabricObject> }
        ).fromObject(data)
      } catch (err) {
        console.warn(`[CanvasEditor] Failed to restore ${key}, skipping:`, err)
      }
    }
  }

  const renderOnAddRemove = canvas.renderOnAddRemove
  canvas.renderOnAddRemove = false
  canvas.clear()
  if (loaded.length) canvas.add(...loaded)

  // Re-patch clip-border rendering for objects that have a mask
  for (const obj of loaded) {
    const o = obj as ObjWithClip
    if (o.clipMaskType && o.clipMaskType !== 'none') {
      patchClipBorder(obj)
    }
  }

  // Set canvas props WITHOUT backgroundImage/overlayImage (those were extracted above)
  canvas.set(canvasProps)
  // Set deserialized FabricImage instances for bg/overlay
  canvas.set(bgProps)
  canvas.renderOnAddRemove = renderOnAddRemove
  canvas.renderAll()
}

export interface CanvasEditorHandle {
  getCanvas: () => fabric.Canvas | null
  toJSON: () => object | null
  loadFromJSON: (json: object) => Promise<void>
  addImageFromURL: (url: string, name?: string) => Promise<void>
  addText: (text?: string) => void
  addSticker: (emoji: string) => void
  addShape: (shape: 'rect' | 'circle' | 'triangle' | 'line') => void
  setBackground: (type: 'color' | 'image', value: string) => Promise<void>
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  zoomIn: () => void
  zoomOut: () => void
  zoomReset: () => void
  zoom: number
  bringForward: () => void
  sendBackward: () => void
  bringToFront: () => void
  sendToBack: () => void
  moveObjectTo: (obj: fabric.FabricObject, newIndex: number) => void
  deleteSelected: () => void
  getObjects: () => fabric.FabricObject[]
  getActiveObject: () => fabric.FabricObject | null
  selectObject: (obj: fabric.FabricObject) => void
  toDataURL: (options?: {
    format?: 'jpeg' | 'png' | 'webp'
    quality?: number
    multiplier?: number
  }) => string | null
}

interface CanvasEditorProps {
  width?: number
  height?: number
  onModified?: () => void
  onSelectionChange?: (obj: fabric.FabricObject | null) => void
  onReady?: () => void
}

const CANVAS_WIDTH = PAGE_WIDTH
const CANVAS_HEIGHT = PAGE_HEIGHT

const MAX_HISTORY = 50

/** Serialize canvas including custom properties (customName, clipMaskType) */
const EXTRA_PROPS = ['customName', 'clipMaskType']
function canvasToJSON(canvas: fabric.Canvas) {
  // Fabric.js accepts propertiesToInclude at runtime; TS types don't declare it
  return (canvas as unknown as { toJSON: (p: string[]) => object }).toJSON(EXTRA_PROPS)
}

const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(
  (
    { width = CANVAS_WIDTH, height = CANVAS_HEIGHT, onModified, onSelectionChange, onReady },
    ref
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const fabricRef = useRef<fabric.Canvas | null>(null)
    const historyRef = useRef<string[]>([])
    const historyIndexRef = useRef(-1)
    const isLoadingRef = useRef(false)
    const [zoom, setZoom] = useState(1)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    const saveHistory = useCallback(() => {
      if (isLoadingRef.current) return
      const canvas = fabricRef.current
      if (!canvas) return
      const json = JSON.stringify(canvasToJSON(canvas))
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
      historyRef.current.push(json)
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift()
      }
      historyIndexRef.current = historyRef.current.length - 1
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(false)
    }, [])

    const loadHistoryState = useCallback(async (index: number) => {
      const canvas = fabricRef.current
      if (!canvas) return
      const json = historyRef.current[index]
      if (!json) return
      isLoadingRef.current = true
      await canvas.loadFromJSON(json)
      canvas.renderAll()
      isLoadingRef.current = false
      historyIndexRef.current = index
      setCanUndo(index > 0)
      setCanRedo(index < historyRef.current.length - 1)
    }, [])

    // Initialize canvas
    useEffect(() => {
      const wrapper = wrapperRef.current
      if (!wrapper) return

      // Clear any leftover DOM from previous mount (React strict mode)
      while (wrapper.firstChild) {
        wrapper.removeChild(wrapper.firstChild)
      }

      // Create canvas element programmatically (Fabric.js wraps it and modifies the DOM)
      const canvasEl = document.createElement('canvas')
      canvasEl.width = width
      canvasEl.height = height
      wrapper.appendChild(canvasEl)

      let disposed = false
      const canvas = new fabric.Canvas(canvasEl, {
        width,
        height,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
      })
      fabricRef.current = canvas

      // Events
      const handleModified = () => {
        if (disposed || isLoadingRef.current) return
        saveHistory()
        onModified?.()
      }
      canvas.on('object:modified', handleModified)
      canvas.on('object:added', handleModified)
      canvas.on('object:removed', handleModified)

      canvas.on('selection:created', (e) => {
        if (disposed) return
        onSelectionChange?.(e.selected?.[0] ?? null)
      })
      canvas.on('selection:updated', (e) => {
        if (disposed) return
        onSelectionChange?.(e.selected?.[0] ?? null)
      })
      canvas.on('selection:cleared', () => {
        if (disposed) return
        onSelectionChange?.(null)
      })

      // Start with empty canvas — data will be loaded via loadFromJSON after fetch
      const jsonStr = JSON.stringify(canvasToJSON(canvas))
      historyRef.current = [jsonStr]
      historyIndexRef.current = 0

      // Notify parent that the canvas is ready to receive loadFromJSON calls
      onReady?.()

      return () => {
        disposed = true
        fabricRef.current = null
        // Patch methods to prevent async errors from Fabric.js internals (React strict mode)
        const noop = () => {}
        const noopCtx = { clearRect: noop }
        Object.assign(canvas, {
          clearContext: noop,
          getContext: () => noopCtx,
          cancelRequestedRender: noop,
        })
        try {
          canvas.dispose()
        } catch {
          /* Strict mode race */
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Don't handle shortcuts when typing in inputs
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        // Don't handle when editing text on canvas
        const canvas = fabricRef.current
        if (canvas) {
          const active = canvas.getActiveObject()
          if (
            active &&
            (active.type === 'i-text' || active.type === 'textbox') &&
            (active as fabric.IText).isEditing
          )
            return
        }

        if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          if (historyIndexRef.current > 0) {
            loadHistoryState(historyIndexRef.current - 1)
            onModified?.()
          }
        } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault()
          if (historyIndexRef.current < historyRef.current.length - 1) {
            loadHistoryState(historyIndexRef.current + 1)
            onModified?.()
          }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          if (!canvas) return
          const active = canvas.getActiveObjects()
          if (active.length) {
            e.preventDefault()
            active.forEach((obj) => canvas.remove(obj))
            canvas.discardActiveObject()
            canvas.renderAll()
          }
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [loadHistoryState, onModified])

    useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => fabricRef.current,
        toJSON: () => {
          if (!fabricRef.current) return null
          const json = canvasToJSON(fabricRef.current) as Record<string, unknown>
          return normalizeCanvasJson(json)
        },
        loadFromJSON: async (json: object) => {
          const canvas = fabricRef.current
          if (!canvas) return
          isLoadingRef.current = true
          canvas.discardActiveObject()
          await safeLoadFromJSON(canvas, json)
          isLoadingRef.current = false
          // Reset history for the newly loaded state
          try {
            const jsonStr = JSON.stringify(canvasToJSON(canvas))
            historyRef.current = [jsonStr]
            historyIndexRef.current = 0
          } catch (err) {
            console.warn('[CanvasEditor] Failed to snapshot history after load:', err)
            historyRef.current = []
            historyIndexRef.current = -1
          }
          setCanUndo(false)
          setCanRedo(false)
        },
        addImageFromURL: async (url: string, name?: string) => {
          const canvas = fabricRef.current
          if (!canvas) return
          const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
          // Scale to fit canvas if too large
          const maxW = canvas.width! * 0.6
          const maxH = canvas.height! * 0.6
          const scale = Math.min(maxW / img.width!, maxH / img.height!, 1)
          img.set({
            scaleX: scale,
            scaleY: scale,
            left: 50,
            top: 50,
          })
          if (name) {
            ;(img as fabric.FabricObject & { customName?: string }).customName = name
          }
          canvas.add(img)
          canvas.setActiveObject(img)
          canvas.renderAll()
        },
        addText: (text?: string) => {
          const canvas = fabricRef.current
          if (!canvas) return
          const textObj = new fabric.IText(text || 'Texto', {
            left: 100,
            top: 100,
            fontSize: 36,
            fontFamily: 'Inter Variable',
            fill: '#1A1A1A',
          })
          canvas.add(textObj)
          canvas.setActiveObject(textObj)
          canvas.renderAll()
        },
        addSticker: (emoji: string) => {
          const canvas = fabricRef.current
          if (!canvas) return
          const textObj = new fabric.IText(emoji, {
            left: 100,
            top: 100,
            fontSize: 64,
          })
          ;(textObj as fabric.FabricObject & { customName?: string }).customName =
            `Sticker: ${emoji}`
          canvas.add(textObj)
          canvas.setActiveObject(textObj)
          canvas.renderAll()
        },
        addShape: (shape: 'rect' | 'circle' | 'triangle' | 'line') => {
          const canvas = fabricRef.current
          if (!canvas) return
          let obj: fabric.FabricObject
          const common = { left: 100, top: 100, fill: '#3B82F6', stroke: '#1E40AF', strokeWidth: 2 }
          switch (shape) {
            case 'rect':
              obj = new fabric.Rect({ ...common, width: 150, height: 100, rx: 0, ry: 0 })
              ;(obj as fabric.FabricObject & { customName?: string }).customName = 'Rectangle'
              break
            case 'circle':
              obj = new fabric.Circle({ ...common, radius: 60 })
              ;(obj as fabric.FabricObject & { customName?: string }).customName = 'Circle'
              break
            case 'triangle':
              obj = new fabric.Triangle({ ...common, width: 120, height: 100 })
              ;(obj as fabric.FabricObject & { customName?: string }).customName = 'Triangle'
              break
            case 'line':
              obj = new fabric.Polyline(
                [
                  { x: 0, y: 0 },
                  { x: 200, y: 0 },
                ],
                {
                  left: 100,
                  top: 100,
                  stroke: '#1E40AF',
                  strokeWidth: 3,
                  fill: '',
                }
              )
              ;(obj as fabric.FabricObject & { customName?: string }).customName = 'Line'
              break
          }
          canvas.add(obj)
          canvas.setActiveObject(obj)
          canvas.renderAll()
        },
        setBackground: async (type: 'color' | 'image', value: string) => {
          const canvas = fabricRef.current
          if (!canvas) return
          if (type === 'color') {
            canvas.backgroundColor = value
            canvas.renderAll()
            saveHistory()
            onModified?.()
          } else {
            const img = await fabric.FabricImage.fromURL(value, { crossOrigin: 'anonymous' })
            const scaleX = canvas.width! / img.width!
            const scaleY = canvas.height! / img.height!
            img.set({ scaleX, scaleY })
            canvas.backgroundImage = img
            canvas.renderAll()
            saveHistory()
            onModified?.()
          }
        },
        undo: () => {
          if (historyIndexRef.current > 0) {
            loadHistoryState(historyIndexRef.current - 1)
            onModified?.()
          }
        },
        redo: () => {
          if (historyIndexRef.current < historyRef.current.length - 1) {
            loadHistoryState(historyIndexRef.current + 1)
            onModified?.()
          }
        },
        canUndo,
        canRedo,
        zoomIn: () => {
          const canvas = fabricRef.current
          if (!canvas) return
          const newZoom = Math.min(zoom * 1.2, 3)
          canvas.setZoom(newZoom)
          setZoom(newZoom)
        },
        zoomOut: () => {
          const canvas = fabricRef.current
          if (!canvas) return
          const newZoom = Math.max(zoom / 1.2, 0.3)
          canvas.setZoom(newZoom)
          setZoom(newZoom)
        },
        zoomReset: () => {
          const canvas = fabricRef.current
          if (!canvas) return
          canvas.setZoom(1)
          setZoom(1)
        },
        zoom,
        bringForward: () => {
          const canvas = fabricRef.current
          if (!canvas) return
          const obj = canvas.getActiveObject()
          if (obj) {
            canvas.bringObjectForward(obj)
            canvas.renderAll()
            saveHistory()
            onModified?.()
          }
        },
        sendBackward: () => {
          const canvas = fabricRef.current
          if (!canvas) return
          const obj = canvas.getActiveObject()
          if (obj) {
            canvas.sendObjectBackwards(obj)
            canvas.renderAll()
            saveHistory()
            onModified?.()
          }
        },
        bringToFront: () => {
          const canvas = fabricRef.current
          if (!canvas) return
          const obj = canvas.getActiveObject()
          if (obj) {
            canvas.bringObjectToFront(obj)
            canvas.renderAll()
            saveHistory()
            onModified?.()
          }
        },
        sendToBack: () => {
          const canvas = fabricRef.current
          if (!canvas) return
          const obj = canvas.getActiveObject()
          if (obj) {
            canvas.sendObjectToBack(obj)
            canvas.renderAll()
            saveHistory()
            onModified?.()
          }
        },
        moveObjectTo: (obj: fabric.FabricObject, newIndex: number) => {
          const canvas = fabricRef.current
          if (!canvas) return
          canvas.moveObjectTo(obj, newIndex)
          canvas.renderAll()
          saveHistory()
          onModified?.()
        },
        deleteSelected: () => {
          const canvas = fabricRef.current
          if (!canvas) return
          const active = canvas.getActiveObjects()
          if (active.length) {
            active.forEach((obj) => canvas.remove(obj))
            canvas.discardActiveObject()
            canvas.renderAll()
          }
        },
        getObjects: () => {
          return fabricRef.current?.getObjects() ?? []
        },
        getActiveObject: () => {
          return fabricRef.current?.getActiveObject() ?? null
        },
        selectObject: (obj: fabric.FabricObject) => {
          const canvas = fabricRef.current
          if (!canvas) return
          canvas.setActiveObject(obj)
          canvas.renderAll()
        },
        toDataURL: (options?: {
          format?: 'jpeg' | 'png' | 'webp'
          quality?: number
          multiplier?: number
        }) => {
          const canvas = fabricRef.current
          if (!canvas) return null
          // Temporarily deselect so selection handles don't appear in the thumbnail
          const active = canvas.getActiveObject()
          if (active) canvas.discardActiveObject()
          const dataUrl = canvas.toDataURL({
            format: options?.format ?? 'jpeg',
            quality: options?.quality ?? 0.7,
            multiplier: options?.multiplier ?? 0.2,
          })
          // Restore selection
          if (active) canvas.setActiveObject(active)
          return dataUrl
        },
      }),
      [zoom, canUndo, canRedo, saveHistory, loadHistoryState, onModified, onSelectionChange]
    )

    return (
      <div className="canvas-editor-wrapper" style={{ width, height }}>
        <div ref={wrapperRef} />
      </div>
    )
  }
)

CanvasEditor.displayName = 'CanvasEditor'

export default CanvasEditor
