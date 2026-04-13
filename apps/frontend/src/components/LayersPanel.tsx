import { useState, useEffect } from 'react'
import type * as fabric from 'fabric'
import type { CanvasEditorHandle } from './CanvasEditor'

interface LayersPanelProps {
  editorRef: React.RefObject<CanvasEditorHandle | null>
  selectedObject: fabric.FabricObject | null
  refreshKey: number
}

export default function LayersPanel({ editorRef, selectedObject, refreshKey }: LayersPanelProps) {
  const [objects, setObjects] = useState<fabric.FabricObject[]>([])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    setObjects([...editor.getObjects()].reverse())
  }, [editorRef, selectedObject, refreshKey])

  if (objects.length === 0) {
    return (
      <div className="text-xs text-neutral-400 text-center py-4">No elements on the canvas</div>
    )
  }

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Capas</h3>
      {objects.map((obj, i) => {
        const isActive = selectedObject === obj
        const name = getObjectName(obj, objects.length - i)
        return (
          <div
            key={`layer-${objects.length - i}`}
            onClick={() => editorRef.current?.selectObject(obj)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') editorRef.current?.selectObject(obj)
            }}
            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors cursor-pointer
              ${isActive ? 'bg-primary-100 text-primary-800' : 'hover:bg-neutral-100 text-neutral-700'}`}
          >
            <span className="text-sm">{getObjectIcon(obj)}</span>
            <span className="truncate flex-1">{name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                obj.set('visible', !obj.visible)
                editorRef.current?.getCanvas()?.renderAll()
                setObjects([...editorRef.current!.getObjects()].reverse())
              }}
              className="text-neutral-400 hover:text-neutral-600"
              title={obj.visible !== false ? 'Ocultar' : 'Mostrar'}
            >
              {obj.visible !== false ? '👁' : '👁‍🗨'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function getObjectName(obj: fabric.FabricObject, layerNum: number): string {
  const custom = (obj as fabric.FabricObject & { customName?: string }).customName
  if (custom) return custom
  if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
    const text = (obj as fabric.IText).text || ''
    return text.length > 20 ? text.slice(0, 20) + '...' : text || `Text ${layerNum}`
  }
  if (obj.type === 'image') return `Image ${layerNum}`
  if (obj.type === 'rect') return `Rectangle ${layerNum}`
  if (obj.type === 'circle') return `Circle ${layerNum}`
  return `Element ${layerNum}`
}

function getObjectIcon(obj: fabric.FabricObject): string {
  if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') return '📝'
  if (obj.type === 'image') return '🖼️'
  if (obj.type === 'rect') return '⬜'
  if (obj.type === 'circle') return '⭕'
  return '◆'
}
