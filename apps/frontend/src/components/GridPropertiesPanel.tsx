import type { GridConfig, DayPosition } from '../lib/calendarTypes'
import { PAGE_WIDTH, PAGE_HEIGHT } from '../lib/calendarTypes'
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

      {/* Position & Size */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Position & size</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-neutral-500 block mb-0.5">X (px)</label>
            <input
              type="number"
              min={0}
              max={PAGE_WIDTH}
              value={config.gridX}
              onChange={(e) => update('gridX', Number(e.target.value))}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 block mb-0.5">Y (px)</label>
            <input
              type="number"
              min={0}
              max={PAGE_HEIGHT}
              value={config.gridY}
              onChange={(e) => update('gridY', Number(e.target.value))}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 block mb-0.5">Width (px)</label>
            <input
              type="number"
              min={100}
              max={PAGE_WIDTH}
              value={config.gridWidth}
              onChange={(e) => update('gridWidth', Number(e.target.value))}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 block mb-0.5">Height (px)</label>
            <input
              type="number"
              min={50}
              max={PAGE_HEIGHT}
              value={config.gridHeight}
              onChange={(e) => update('gridHeight', Number(e.target.value))}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </section>

      {/* Background */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Table background</h4>
        <ColorPicker label="Color" color={config.bgColor} onChange={(c) => update('bgColor', c)} />
        <div className="mt-2">
          <label className="text-xs text-neutral-500">
            Background opacity: {config.bgOpacity}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={config.bgOpacity}
            onChange={(e) => update('bgOpacity', Number(e.target.value))}
            className="w-full accent-primary-500"
          />
        </div>
        <div className="mt-2">
          <label className="text-xs text-neutral-500">
            General grid opacity: {config.gridOverlayOpacity}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={config.gridOverlayOpacity}
            onChange={(e) => update('gridOverlayOpacity', Number(e.target.value))}
            className="w-full accent-primary-500"
          />
          <p className="text-[10px] text-neutral-400 mt-0.5">
            Controls the transparency of the whole table over the page background
          </p>
        </div>
      </section>

      {/* Borders */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Borders</h4>
        <ColorPicker
          label="Color"
          color={config.borderColor}
          onChange={(c) => update('borderColor', c)}
        />
        <div className="mt-2 flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-neutral-500 block mb-1">Thickness</label>
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
            <label className="text-xs text-neutral-500 block mb-1">Style</label>
            <select
              value={config.borderStyle}
              onChange={(e) => update('borderStyle', e.target.value as GridConfig['borderStyle'])}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      </section>

      {/* Day numbers */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Day numbers</h4>
        <FontSelector
          label="Fuente"
          value={config.dayFontFamily}
          onChange={(f) => update('dayFontFamily', f)}
        />
        <div className="mt-2 flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-neutral-500 block mb-1">Size</label>
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
            <label className="text-xs text-neutral-500 block mb-1">Weight</label>
            <select
              value={config.dayFontWeight}
              onChange={(e) => update('dayFontWeight', e.target.value as 'normal' | 'bold')}
              className="w-full text-xs border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
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
          <label className="text-xs text-neutral-500 block mb-1">Number position</label>
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
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Weekend</h4>
        <ColorPicker
          label="Background color"
          color={config.weekendBgColor}
          onChange={(c) => update('weekendBgColor', c)}
        />
      </section>

      {/* Header */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Header (weekdays)</h4>
        <FontSelector
          label="Fuente"
          value={config.headerFontFamily}
          onChange={(f) => update('headerFontFamily', f)}
        />
        <div className="mt-2 flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-neutral-500 block mb-1">Size</label>
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

      {/* Holidays, events & saints */}
      <section>
        <h4 className="text-xs font-medium text-neutral-600 mb-2">Holidays & events</h4>
        <label className="flex items-center gap-2 text-xs text-neutral-700 mb-2">
          <input
            type="checkbox"
            checked={config.showHolidays}
            onChange={(e) => update('showHolidays', e.target.checked)}
            className="accent-primary-600"
          />
          Show holidays
        </label>
        {config.showHolidays && (
          <div className="mb-2 ml-5">
            <ColorPicker
              label="Holiday color"
              color={config.holidayBgColor}
              onChange={(c) => update('holidayBgColor', c)}
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-xs text-neutral-700 mb-2">
          <input
            type="checkbox"
            checked={config.showEvents}
            onChange={(e) => update('showEvents', e.target.checked)}
            className="accent-primary-600"
          />
          Show events
        </label>
        <label className="flex items-center gap-2 text-xs text-neutral-700">
          <input
            type="checkbox"
            checked={config.showSaints}
            onChange={(e) => update('showSaints', e.target.checked)}
            className="accent-primary-600"
          />
          Show name day
        </label>
      </section>
    </div>
  )
}
