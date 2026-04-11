import { HexColorPicker } from 'react-colorful'
import { useState, useRef, useEffect } from 'react'

interface Props {
  color: string
  onChange: (color: string) => void
  label?: string
}

export default function ColorPicker({ color, onChange, label }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      {label && <label className="text-xs text-neutral-500 block mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded border border-neutral-300 cursor-pointer shrink-0"
          style={{ backgroundColor: color }}
          title={color}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-xs px-2 py-1 border border-neutral-300 rounded focus:ring-1 focus:ring-primary-500 outline-none font-mono"
        />
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-xl border border-neutral-200">
          <HexColorPicker color={color} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
