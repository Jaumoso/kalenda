import { useState } from 'react'
import type { CanvasEditorHandle } from './CanvasEditor'

interface BackgroundModalProps {
  isOpen: boolean
  editorRef: React.RefObject<CanvasEditorHandle | null>
  onClose: () => void
  onOpenAssetPicker: () => void
}

export default function BackgroundModal({
  isOpen,
  editorRef,
  onClose,
  onOpenAssetPicker,
}: BackgroundModalProps) {
  const [color, setColor] = useState('#ffffff')
  const [gradientStart, setGradientStart] = useState('#ffffff')
  const [gradientEnd, setGradientEnd] = useState('#e2ddd6')

  if (!isOpen) return null

  const applyColor = () => {
    editorRef.current?.setBackground('color', color)
    onClose()
  }

  const applyGradient = () => {
    // For gradient, we create an SVG-based gradient as background
    const canvas = editorRef.current?.getCanvas()
    if (!canvas) return
    const w = canvas.width!
    const h = canvas.height!
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${gradientStart}"/>
          <stop offset="100%" stop-color="${gradientEnd}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    editorRef.current?.setBackground('image', url).then(() => URL.revokeObjectURL(url))
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div className="bg-white rounded-xl shadow-xl w-96 p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-neutral-900 mb-4">Fondo del canvas</h2>

        {/* Solid color */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-2">Color sólido</h3>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded border border-neutral-200 cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="border border-neutral-200 rounded px-2 py-1 text-sm w-24"
            />
            <button onClick={applyColor} className="btn btn-primary text-sm">
              Aplicar
            </button>
          </div>
        </div>

        {/* Gradient */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-2">Degradado</h3>
          <div className="flex items-center gap-2 mb-2">
            <div>
              <label className="text-[10px] text-neutral-400">Inicio</label>
              <input
                type="color"
                value={gradientStart}
                onChange={(e) => setGradientStart(e.target.value)}
                className="w-8 h-8 rounded border border-neutral-200 cursor-pointer block"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400">Fin</label>
              <input
                type="color"
                value={gradientEnd}
                onChange={(e) => setGradientEnd(e.target.value)}
                className="w-8 h-8 rounded border border-neutral-200 cursor-pointer block"
              />
            </div>
            <div
              className="flex-1 h-8 rounded border border-neutral-200"
              style={{ background: `linear-gradient(to bottom, ${gradientStart}, ${gradientEnd})` }}
            />
            <button onClick={applyGradient} className="btn btn-primary text-sm">
              Aplicar
            </button>
          </div>
        </div>

        {/* Image bg */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-2">Imagen de fondo</h3>
          <button
            onClick={() => {
              onClose()
              onOpenAssetPicker()
            }}
            className="btn btn-secondary text-sm w-full"
          >
            Seleccionar imagen de biblioteca
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-neutral-100">
          <button onClick={onClose} className="btn btn-secondary text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
