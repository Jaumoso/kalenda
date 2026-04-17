// Sans-serif (variable)
import '@fontsource-variable/inter'
import '@fontsource-variable/roboto'
import '@fontsource-variable/open-sans'
import '@fontsource-variable/montserrat'
import '@fontsource-variable/raleway'
import '@fontsource-variable/source-sans-3'
import '@fontsource-variable/nunito'
import '@fontsource-variable/oswald'
import '@fontsource-variable/quicksand'
import '@fontsource-variable/cabin'
import '@fontsource-variable/josefin-sans'
import '@fontsource-variable/rubik'
import '@fontsource-variable/work-sans'
import '@fontsource-variable/dm-sans'
// Serif (variable)
import '@fontsource-variable/playfair-display'
import '@fontsource-variable/lora'
import '@fontsource-variable/merriweather'
import '@fontsource-variable/bitter'
// Display & Decorative (static)
import '@fontsource/bebas-neue'
import '@fontsource/abril-fatface'
import '@fontsource/dm-serif-display'
import '@fontsource/comfortaa'
// Handwriting / Script (static)
import '@fontsource/pacifico'
import '@fontsource/dancing-script'
import '@fontsource/great-vibes'
import '@fontsource/satisfy'
import '@fontsource/permanent-marker'

interface FontEntry {
  value: string
  label: string
  category: 'sans' | 'serif' | 'display' | 'handwriting'
}

export const FONTS: readonly FontEntry[] = [
  // Sans-serif
  { value: 'Inter Variable', label: 'Inter', category: 'sans' },
  { value: 'Roboto Variable', label: 'Roboto', category: 'sans' },
  { value: 'Open Sans Variable', label: 'Open Sans', category: 'sans' },
  { value: 'Montserrat Variable', label: 'Montserrat', category: 'sans' },
  { value: 'Raleway Variable', label: 'Raleway', category: 'sans' },
  { value: 'Source Sans 3 Variable', label: 'Source Sans 3', category: 'sans' },
  { value: 'Nunito Variable', label: 'Nunito', category: 'sans' },
  { value: 'Oswald Variable', label: 'Oswald', category: 'sans' },
  { value: 'Quicksand Variable', label: 'Quicksand', category: 'sans' },
  { value: 'Cabin Variable', label: 'Cabin', category: 'sans' },
  { value: 'Josefin Sans Variable', label: 'Josefin Sans', category: 'sans' },
  { value: 'Rubik Variable', label: 'Rubik', category: 'sans' },
  { value: 'Work Sans Variable', label: 'Work Sans', category: 'sans' },
  { value: 'DM Sans Variable', label: 'DM Sans', category: 'sans' },
  // Serif
  { value: 'Playfair Display Variable', label: 'Playfair Display', category: 'serif' },
  { value: 'Lora Variable', label: 'Lora', category: 'serif' },
  { value: 'Merriweather Variable', label: 'Merriweather', category: 'serif' },
  { value: 'Bitter Variable', label: 'Bitter', category: 'serif' },
  { value: 'DM Serif Display', label: 'DM Serif Display', category: 'serif' },
  { value: 'Abril Fatface', label: 'Abril Fatface', category: 'serif' },
  // Display
  { value: 'Bebas Neue', label: 'Bebas Neue', category: 'display' },
  { value: 'Comfortaa', label: 'Comfortaa', category: 'display' },
  // Handwriting / Script
  { value: 'Pacifico', label: 'Pacifico', category: 'handwriting' },
  { value: 'Dancing Script', label: 'Dancing Script', category: 'handwriting' },
  { value: 'Great Vibes', label: 'Great Vibes', category: 'handwriting' },
  { value: 'Satisfy', label: 'Satisfy', category: 'handwriting' },
  { value: 'Permanent Marker', label: 'Permanent Marker', category: 'handwriting' },
] as const

const CATEGORY_LABELS: Record<FontEntry['category'], string> = {
  sans: 'Sans-serif',
  serif: 'Serif',
  display: 'Display',
  handwriting: 'Script / Manual',
}

interface Props {
  value: string
  onChange: (font: string) => void
  label?: string
}

export default function FontSelector({ value, onChange, label }: Props) {
  const categories = ['sans', 'serif', 'display', 'handwriting'] as const

  return (
    <div>
      {label && <label className="text-xs text-neutral-500 block mb-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-neutral-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-primary-500 outline-none"
        style={{ fontFamily: value }}
      >
        {categories.map((cat) => (
          <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
            {FONTS.filter((f) => f.category === cat).map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
