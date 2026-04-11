import { useState, useEffect } from 'react'
import type { DayCell } from '../lib/calendarTypes'
import { MONTH_NAMES } from '../lib/calendarTypes'
import ColorPicker from './ColorPicker'

interface Props {
  dayNumber: number
  month: number
  year: number
  cell: DayCell | null
  onSave: (data: {
    bgColor: string | null
    contentJson: { text?: string; emoji?: string } | null
  }) => void
  onClose: () => void
}

export default function CellModal({ dayNumber, month, year, cell, onSave, onClose }: Props) {
  const [bgColor, setBgColor] = useState(cell?.bgColor || '')
  const [text, setText] = useState(cell?.contentJson?.text || '')
  const [emoji, setEmoji] = useState(cell?.contentJson?.emoji || '')

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSave = () => {
    const contentJson: { text?: string; emoji?: string } = {}
    if (text.trim()) contentJson.text = text.trim()
    if (emoji.trim()) contentJson.emoji = emoji.trim()

    onSave({
      bgColor: bgColor || null,
      contentJson: Object.keys(contentJson).length > 0 ? contentJson : null,
    })
  }

  const handleClearBg = () => setBgColor('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">
          Día {dayNumber} — {MONTH_NAMES[month - 1]} {year}
        </h2>
        <hr className="my-3 border-neutral-200" />

        {/* Background color */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Color de fondo</h3>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <ColorPicker color={bgColor || '#FFFFFF'} onChange={setBgColor} />
            </div>
            <button
              onClick={handleClearBg}
              className="text-xs text-neutral-500 hover:text-red-500 px-2 py-1 border border-neutral-300 rounded transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Emoji */}
        <div className="mb-4">
          <label className="text-sm font-medium text-neutral-700 block mb-1">Emoji / Sticker</label>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🎂 🎉 ⭐"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            maxLength={4}
          />
        </div>

        {/* Text */}
        <div className="mb-6">
          <label className="text-sm font-medium text-neutral-700 block mb-1">Texto</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cumpleaños de Ana"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            maxLength={60}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-300 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
