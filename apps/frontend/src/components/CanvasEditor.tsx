import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as fabric from 'fabric'

export interface CanvasEditorHandle {
  getCanvas: () => fabric.Canvas | null
  toJSON: () => object | null
  loadFromJSON: (json: object) => Promise<void>
  addImageFromURL: (url: string, name?: string) => Promise<void>
  addText: (text?: string) => void
  addSticker: (emoji: string) => void
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
  deleteSelected: () => void
  getObjects: () => fabric.FabricObject[]
  getActiveObject: () => fabric.FabricObject | null
  selectObject: (obj: fabric.FabricObject) => void
}

interface CanvasEditorProps {
  width?: number
  height?: number
  initialJson?: object | null
  onModified?: () => void
  onSelectionChange?: (obj: fabric.FabricObject | null) => void
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 450

const MAX_HISTORY = 50

const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(
  (
    { width = CANVAS_WIDTH, height = CANVAS_HEIGHT, initialJson, onModified, onSelectionChange },
    ref
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const fabricRef = useRef<fabric.Canvas | null>(null)
    const historyRef = useRef<string[]>([])
    const historyIndexRef = useRef(-1)
    const isLoadingRef = useRef(false)
    const initialLoadRef = useRef(false)
    const [zoom, setZoom] = useState(1)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    const saveHistory = useCallback(() => {
      if (isLoadingRef.current) return
      const canvas = fabricRef.current
      if (!canvas) return
      const json = JSON.stringify(canvas.toJSON())
      // Truncate forward history
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
        if (disposed) return
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

      // Load initial JSON if present
      if (initialJson && !initialLoadRef.current) {
        initialLoadRef.current = true
        isLoadingRef.current = true
        canvas.loadFromJSON(JSON.stringify(initialJson)).then(() => {
          if (disposed) return
          canvas.renderAll()
          isLoadingRef.current = false
          const jsonStr = JSON.stringify(canvas.toJSON())
          historyRef.current = [jsonStr]
          historyIndexRef.current = 0
          setCanUndo(false)
          setCanRedo(false)
        })
      } else {
        const jsonStr = JSON.stringify(canvas.toJSON())
        historyRef.current = [jsonStr]
        historyIndexRef.current = 0
      }

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
          return fabricRef.current.toJSON()
        },
        loadFromJSON: async (json: object) => {
          const canvas = fabricRef.current
          if (!canvas) return
          isLoadingRef.current = true
          await canvas.loadFromJSON(JSON.stringify(json))
          canvas.renderAll()
          isLoadingRef.current = false
          saveHistory()
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
      }),
      [zoom, canUndo, canRedo, saveHistory, loadHistoryState, onModified, onSelectionChange]
    )

    return (
      <div
        className="canvas-editor-wrapper overflow-auto border border-neutral-300 rounded-lg bg-neutral-200 flex items-center justify-center"
        style={{ minHeight: height + 40 }}
      >
        <div ref={wrapperRef} />
      </div>
    )
  }
)

CanvasEditor.displayName = 'CanvasEditor'

export default CanvasEditor
