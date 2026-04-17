import { useTranslation } from 'react-i18next'
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
      <ToolButton title={t('toolbar.selectMove')} icon="↖" onClick={() => {}} active />

      <Separator />

      {/* Add elements */}
      <ToolButton title={t('toolbar.addImage')} icon="🖼️" onClick={onAddImage} />
      <ToolButton
        title={t('toolbar.addText')}
        icon="T"
        onClick={() => editor?.addText()}
        textStyle="font-bold text-base"
      />
      <ToolButton title={t('toolbar.addSticker')} icon="😀" onClick={onAddSticker} />

      <Separator />

      {/* Background */}
      <ToolButton title={t('toolbar.background')} icon="🎨" onClick={onBackgroundSettings} />

      <Separator />

      {/* Layer controls */}
      <ToolButton
        title={t('toolbar.bringToFront')}
        icon="⬆"
        onClick={() => editor?.bringToFront()}
      />
      <ToolButton
        title={t('toolbar.bringForward')}
        icon="↑"
        onClick={() => editor?.bringForward()}
      />
      <ToolButton
        title={t('toolbar.sendBackward')}
        icon="↓"
        onClick={() => editor?.sendBackward()}
      />
      <ToolButton title={t('toolbar.sendToBack')} icon="⬇" onClick={() => editor?.sendToBack()} />

      <Separator />

      {/* Undo/Redo */}
      <ToolButton
        title={t('toolbar.undo')}
        icon="↩"
        onClick={() => editor?.undo()}
        disabled={!editor?.canUndo}
      />
      <ToolButton
        title={t('toolbar.redo')}
        icon="↪"
        onClick={() => editor?.redo()}
        disabled={!editor?.canRedo}
      />

      <Separator />

      {/* Zoom */}
      <ToolButton title={t('toolbar.zoomOut')} icon="−" onClick={() => editor?.zoomOut()} />
      <span className="text-xs text-neutral-500 min-w-[3rem] text-center select-none">
        {Math.round((editor?.zoom ?? 1) * 100)}%
      </span>
      <ToolButton title={t('toolbar.zoomIn')} icon="+" onClick={() => editor?.zoomIn()} />
      <ToolButton title={t('toolbar.zoomReset')} icon="⊡" onClick={() => editor?.zoomReset()} />

      <Separator />

      {/* Delete */}
      <ToolButton
        title={t('toolbar.deleteSelected')}
        icon="🗑"
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
  textStyle = '',
}: {
  title: string
  icon: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  className?: string
  textStyle?: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors
        ${active ? 'bg-primary-100 text-primary-700' : 'hover:bg-neutral-100 text-neutral-700'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${className} ${textStyle}`}
    >
      {icon}
    </button>
  )
}

function Separator() {
  return <div className="w-px h-5 bg-neutral-200 mx-1" />
}
