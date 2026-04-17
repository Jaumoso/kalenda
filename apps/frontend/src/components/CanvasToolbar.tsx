import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MousePointer2,
  ImagePlus,
  Type,
  Smile,
  Paintbrush,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  ChevronsDown,
  Undo2,
  Redo2,
  ZoomOut,
  ZoomIn,
  Scan,
  Trash2,
  Shapes,
  Square,
  Circle,
  Triangle,
  Minus,
} from 'lucide-react'
import type { CanvasEditorHandle } from './CanvasEditor'

interface CanvasToolbarProps {
  editorRef: React.RefObject<CanvasEditorHandle | null>
  onAddImage: () => void
  onAddSticker: () => void
  onBackgroundSettings: () => void
}

export default function CanvasToolbar({
  editorRef,
  onAddImage,
  onAddSticker,
  onBackgroundSettings,
}: CanvasToolbarProps) {
  const { t } = useTranslation()
  const editor = editorRef.current

  return (
    <div className="flex items-center gap-1 bg-surface rounded-lg border border-neutral-200 px-2 py-1.5 shadow-sm flex-wrap">
      {/* Selection / Move (default) */}
      <ToolButton
        title={t('toolbar.selectMove')}
        icon={<MousePointer2 size={16} />}
        onClick={() => {}}
        active
      />

      <Separator />

      {/* Add elements */}
      <ToolButton
        title={t('toolbar.addImage')}
        icon={<ImagePlus size={16} />}
        onClick={onAddImage}
      />
      <ToolButton
        title={t('toolbar.addText')}
        icon={<Type size={16} />}
        onClick={() => editor?.addText()}
      />
      <ToolButton
        title={t('toolbar.addSticker')}
        icon={<Smile size={16} />}
        onClick={onAddSticker}
      />
      <ShapesDropdown editor={editor} />

      <Separator />

      {/* Background */}
      <ToolButton
        title={t('toolbar.background')}
        icon={<Paintbrush size={16} />}
        onClick={onBackgroundSettings}
      />

      <Separator />

      {/* Layer controls */}
      <ToolButton
        title={t('toolbar.bringToFront')}
        icon={<ChevronsUp size={16} />}
        onClick={() => editor?.bringToFront()}
      />
      <ToolButton
        title={t('toolbar.bringForward')}
        icon={<ChevronUp size={16} />}
        onClick={() => editor?.bringForward()}
      />
      <ToolButton
        title={t('toolbar.sendBackward')}
        icon={<ChevronDown size={16} />}
        onClick={() => editor?.sendBackward()}
      />
      <ToolButton
        title={t('toolbar.sendToBack')}
        icon={<ChevronsDown size={16} />}
        onClick={() => editor?.sendToBack()}
      />

      <Separator />

      {/* Undo/Redo */}
      <ToolButton
        title={t('toolbar.undo')}
        icon={<Undo2 size={16} />}
        onClick={() => editor?.undo()}
        disabled={!editor?.canUndo}
      />
      <ToolButton
        title={t('toolbar.redo')}
        icon={<Redo2 size={16} />}
        onClick={() => editor?.redo()}
        disabled={!editor?.canRedo}
      />

      <Separator />

      {/* Zoom */}
      <ToolButton
        title={t('toolbar.zoomOut')}
        icon={<ZoomOut size={16} />}
        onClick={() => editor?.zoomOut()}
      />
      <span className="text-xs text-neutral-500 min-w-[3rem] text-center select-none">
        {Math.round((editor?.zoom ?? 1) * 100)}%
      </span>
      <ToolButton
        title={t('toolbar.zoomIn')}
        icon={<ZoomIn size={16} />}
        onClick={() => editor?.zoomIn()}
      />
      <ToolButton
        title={t('toolbar.zoomReset')}
        icon={<Scan size={16} />}
        onClick={() => editor?.zoomReset()}
      />

      <Separator />

      {/* Delete */}
      <ToolButton
        title={t('toolbar.deleteSelected')}
        icon={<Trash2 size={16} />}
        onClick={() => editor?.deleteSelected()}
        className="text-red-500 hover:!bg-red-50"
      />
    </div>
  )
}

function ToolButton({
  title,
  icon,
  onClick,
  disabled,
  active,
  className = '',
}: {
  title: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  className?: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors
        ${active ? 'bg-primary-100 text-primary-700' : 'hover:bg-neutral-100 text-neutral-700'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
    >
      {icon}
    </button>
  )
}

function Separator() {
  return <div className="w-px h-5 bg-neutral-200 mx-1" />
}

function ShapesDropdown({ editor }: { editor: CanvasEditorHandle | null }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const add = (shape: 'rect' | 'circle' | 'triangle' | 'line') => {
    editor?.addShape(shape)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        title={t('toolbar.addShape')}
        onClick={() => setOpen(!open)}
        className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors cursor-pointer
          ${open ? 'bg-primary-100 text-primary-700' : 'hover:bg-neutral-100 text-neutral-700'}`}
      >
        <Shapes size={16} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-surface border border-neutral-200 rounded-lg shadow-lg p-1 z-50 flex gap-1">
          <button
            title={t('toolbar.shapeRect')}
            onClick={() => add('rect')}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-700 cursor-pointer"
          >
            <Square size={16} />
          </button>
          <button
            title={t('toolbar.shapeCircle')}
            onClick={() => add('circle')}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-700 cursor-pointer"
          >
            <Circle size={16} />
          </button>
          <button
            title={t('toolbar.shapeTriangle')}
            onClick={() => add('triangle')}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-700 cursor-pointer"
          >
            <Triangle size={16} />
          </button>
          <button
            title={t('toolbar.shapeLine')}
            onClick={() => add('line')}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-700 cursor-pointer"
          >
            <Minus size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
