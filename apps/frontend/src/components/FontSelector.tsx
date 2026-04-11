import '@fontsource-variable/playfair-display'
import '@fontsource-variable/inter'
import '@fontsource-variable/roboto'
import '@fontsource-variable/lora'
import '@fontsource-variable/montserrat'
import '@fontsource-variable/open-sans'
import '@fontsource-variable/raleway'
import '@fontsource-variable/source-sans-3'

export const FONTS = [
  { value: 'Inter Variable', label: 'Inter' },
  { value: 'Roboto Variable', label: 'Roboto' },
  { value: 'Open Sans Variable', label: 'Open Sans' },
  { value: 'Montserrat Variable', label: 'Montserrat' },
  { value: 'Raleway Variable', label: 'Raleway' },
  { value: 'Lora Variable', label: 'Lora' },
  { value: 'Playfair Display Variable', label: 'Playfair Display' },
  { value: 'Source Sans 3 Variable', label: 'Source Sans 3' },
] as const

interface Props {
  value: string
  onChange: (font: string) => void
  label?: string
}

export default function FontSelector({ value, onChange, label }: Props) {
  return (
    <div>
      {label && <label className="text-xs text-neutral-500 block mb-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-neutral-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-primary-500 outline-none"
        style={{ fontFamily: value }}
      >
        {FONTS.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
            {f.label}
          </option>
        ))}
      </select>
    </div>
  )
}
