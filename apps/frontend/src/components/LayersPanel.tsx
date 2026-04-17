import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type * as fabric from 'fabric'
import type { CanvasEditorHandle } from './CanvasEditor'
import {
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Image,
  Square,
  Circle,
  Diamond,
} from 'lucide-react'

interface LayersPanelProps {
  editorRef: React.RefObject<CanvasEditorHandle | null>
  selectedObject: fabric.FabricObject | null
  refreshKey: number
}

export default function LayersPanel({ editorRef, selectedObject, refreshKey }: LayersPanelProps) {
  const { t } = useTranslation()
  const [objects, setObjects] = useState<fabric.FabricObject[]>([])
  const dragItemRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    setObjects([...editor.getObjects()].reverse())
  }, [editorRef, selectedObject, refreshKey])

  const handleDragStart = (index: number) => {
    dragItemRef.current = index
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragItemRef.current === null) return
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (targetIndex: number) => {
    const sourceIndex = dragItemRef.current
    dragItemRef.current = null
    setDragOverIndex(null)
    if (sourceIndex === null || sourceIndex === targetIndex) return

    const editor = editorRef.current
    if (!editor) return

    // objects is reversed (top layer first), canvas uses bottom-first indexing
    const obj = objects[sourceIndex]
    const totalObjects = objects.length
    // Convert reversed panel index to canvas index
    const newCanvasIndex = totalObjects - 1 - targetIndex
    editor.moveObjectTo(obj, newCanvasIndex)
    setObjects([...editor.getObjects()].reverse())
  }

  const handleDragEnd = () => {
    dragItemRef.current = null
    setDragOverIndex(null)
  }

  if (objects.length === 0) {
    return <div className="text-xs text-neutral-400 text-center py-4">{t('layers.noElements')}</div>
  }

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
        {t('layers.title')}
      </h3>
      {objects.map((obj, i) => {
        const isActive = selectedObject === obj
        const name = getObjectName(obj, objects.length - i, t)
        const isDragOver = dragOverIndex === i && dragItemRef.current !== i
        return (
          <div
            key={`layer-${objects.length - i}`}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            onClick={() => editorRef.current?.selectObject(obj)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') editorRef.current?.selectObject(obj)
            }}
            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors cursor-grab active:cursor-grabbing
              ${isActive ? 'bg-primary-100 text-primary-800' : 'hover:bg-neutral-100 text-neutral-700'}
              ${isDragOver ? 'border-t-2 border-primary-400' : 'border-t-2 border-transparent'}`}
          >
            <span className="text-neutral-300 cursor-grab select-none">
              <GripVertical size={14} className="text-neutral-300" />
            </span>
            <span className="text-sm flex items-center">{getObjectIcon(obj)}</span>
            {editingIndex === i ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => {
                  if (editingName.trim()) {
                    ;(obj as fabric.FabricObject & { customName?: string }).customName =
                      editingName.trim()
                  }
                  setEditingIndex(null)
                  setObjects([...editorRef.current!.getObjects()].reverse())
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') setEditingIndex(null)
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="flex-1 min-w-0 text-xs px-1 py-0 border border-primary-300 rounded outline-none bg-white"
              />
            ) : (
              <span
                className="truncate flex-1"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setEditingIndex(i)
                  setEditingName(name)
                }}
                title={t('layers.doubleClickRename')}
              >
                {name}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                const locked = !isObjectLocked(obj)
                setObjectLocked(obj, locked)
                editorRef.current?.getCanvas()?.renderAll()
                setObjects([...editorRef.current!.getObjects()].reverse())
              }}
              className="text-neutral-400 hover:text-neutral-600"
              title={isObjectLocked(obj) ? t('layers.unlock') : t('layers.lock')}
            >
              {isObjectLocked(obj) ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                obj.set('visible', !obj.visible)
                editorRef.current?.getCanvas()?.renderAll()
                setObjects([...editorRef.current!.getObjects()].reverse())
              }}
              className="text-neutral-400 hover:text-neutral-600"
              title={obj.visible !== false ? t('layers.hide') : t('layers.show')}
            >
              {obj.visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function getObjectName(
  obj: fabric.FabricObject,
  layerNum: number,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const custom = (obj as fabric.FabricObject & { customName?: string }).customName
  if (custom) return custom
  if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
    const text = (obj as fabric.IText).text || ''
    return text.length > 20 ? text.slice(0, 20) + '...' : text || t('layers.text', { n: layerNum })
  }
  if (obj.type === 'image') return t('layers.image', { n: layerNum })
  if (obj.type === 'rect') return t('layers.rectangle', { n: layerNum })
  if (obj.type === 'circle') return t('layers.circle', { n: layerNum })
  return t('layers.element', { n: layerNum })
}

function getObjectIcon(obj: fabric.FabricObject): React.ReactNode {
  if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')
    return <Type size={14} />
  if (obj.type === 'image') return <Image size={14} />
  if (obj.type === 'rect') return <Square size={14} />
  if (obj.type === 'circle') return <Circle size={14} />
  return <Diamond size={14} />
}

function isObjectLocked(obj: fabric.FabricObject): boolean {
  return !!obj.lockMovementX && !!obj.lockMovementY
}

function setObjectLocked(obj: fabric.FabricObject, locked: boolean): void {
  obj.set({
    lockMovementX: locked,
    lockMovementY: locked,
    lockRotation: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    hasControls: !locked,
    selectable: !locked,
    evented: !locked,
  })
}
