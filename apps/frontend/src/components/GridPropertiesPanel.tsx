import type { GridConfig, DayPosition } from '../lib/calendarTypes'
import ColorPicker from './ColorPicker'
import FontSelector from './FontSelector'

interface Props {
  config: GridConfig
  onChange: (config: GridConfig) => void
}

const POSITIONS: { value: DayPosition; label: string }[] = [
  { value: 'top-left', label: '↖' },
  { value: 'top-center', label: '↑' },
  { value: 'top-right', label: '↗' },
  { value: 'middle-left', label: '←' },
  { value: 'middle-center', label: '·' },
  { value: 'middle-right', label: '→' },
  { value: 'bottom-left', label: '↙' },
  { value: 'bottom-center', label: '↓' },
  { value: 'bottom-right', label: '↘' },
]

export default function GridPropertiesPanel({ config, onChange }: Props) {
  const update = <K extends keyof GridConfig>(key: K, value: GridConfig[K]) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-5 text-sm">
      <h3 className="font-semibold text-neutral-800 text-xs uppercase tracking-wider">
        Grid del calendario
      </h3>

      {/* Background */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Fondo de tabla</h4>
        <ColorPicker label="Color" color={config.bgColor} onChange={(c) => update('bgColor', c)} />
        <div className="mt-2">
          <label className="text-xs text-neutral-500">Opacidad: {config.bgOpacity}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={config.bgOpacity}
            onChange={(e) => update('bgOpacity', Number(e.target.value))}
            className="w-full accent-primary-500"
          />
        </div>
      </section>

      {/* Borders */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Bordes</h4>
        <ColorPicker
          label="Color"
          color={config.borderColor}
          onChange={(c) => update('borderColor', c)}
        />
        <div className="mt-2 flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-neutral-500 block mb-1">Grosor</label>
            <select
              value={config.borderWidth}
              onChange={(e) => update('borderWidth', Number(e.target.value))}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            >
              {[0, 1, 2, 3].map((w) => (
                <option key={w} value={w}>
                  {w}px
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-neutral-500 block mb-1">Estilo</label>
            <select
              value={config.borderStyle}
              onChange={(e) => update('borderStyle', e.target.value as GridConfig['borderStyle'])}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="solid">Sólido</option>
              <option value="dashed">Discontinuo</option>
              <option value="dotted">Punteado</option>
              <option value="none">Ninguno</option>
            </select>
          </div>
        </div>
      </section>

      {/* Day numbers */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Números de días</h4>
        <FontSelector
          label="Fuente"
          value={config.dayFontFamily}
          onChange={(f) => update('dayFontFamily', f)}
        />
        <div className="mt-2 flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-neutral-500 block mb-1">Tamaño</label>
            <input
              type="number"
              min={8}
              max={72}
              value={config.dayFontSize}
              onChange={(e) => update('dayFontSize', Number(e.target.value))}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-neutral-500 block mb-1">Peso</label>
            <select
              value={config.dayFontWeight}
              onChange={(e) => update('dayFontWeight', e.target.value as 'normal' | 'bold')}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="normal">Normal</option>
              <option value="bold">Negrita</option>
            </select>
          </div>
        </div>
        <div className="mt-2">
          <ColorPicker
            label="Color"
            color={config.dayFontColor}
            onChange={(c) => update('dayFontColor', c)}
          />
        </div>

        {/* Position grid */}
        <div className="mt-3">
          <label className="text-xs text-neutral-500 block mb-1">Posición del número</label>
          <div className="grid grid-cols-3 gap-1 w-24">
            {POSITIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => update('dayPosition', p.value)}
                className={`w-8 h-8 text-sm rounded border flex items-center justify-center transition-colors ${
                  config.dayPosition === p.value
                    ? 'bg-primary-100 border-primary-400 text-primary-700'
                    : 'border-neutral-300 text-neutral-500 hover:bg-neutral-100'
                }`}
                title={p.value}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Weekend */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Fin de semana</h4>
        <ColorPicker
          label="Color de fondo"
          color={config.weekendBgColor}
          onChange={(c) => update('weekendBgColor', c)}
        />
      </section>

      {/* Header */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Cabecera (días de la semana)</h4>
        <FontSelector
          label="Fuente"
          value={config.headerFontFamily}
          onChange={(f) => update('headerFontFamily', f)}
        />
        <div className="mt-2 flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-neutral-500 block mb-1">Tamaño</label>
            <input
              type="number"
              min={8}
              max={72}
              value={config.headerFontSize}
              onChange={(e) => update('headerFontSize', Number(e.target.value))}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="mt-2">
          <ColorPicker
            label="Color texto"
            color={config.headerFontColor}
            onChange={(c) => update('headerFontColor', c)}
          />
        </div>
        <div className="mt-2">
          <ColorPicker
            label="Color fondo"
            color={config.headerBgColor}
            onChange={(c) => update('headerBgColor', c)}
          />
        </div>
      </section>
    </div>
  )
}
