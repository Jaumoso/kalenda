import { useTranslation } from 'react-i18next'
import type { PrintConfig } from '../lib/calendarTypes'

interface Props {
  readonly config: PrintConfig
  readonly onChange: (config: PrintConfig) => void
}

export default function PrintSettingsPanel({ config, onChange }: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<PrintConfig>) => onChange({ ...config, ...patch })

  return (
    <div className="rounded-lg border border-neutral-200 bg-surface p-4 space-y-3">
      <h2 className="text-sm font-semibold text-neutral-800">{t('printSettings.title')}</h2>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={config.bleedEnabled}
          onChange={(e) => update({ bleedEnabled: e.target.checked })}
          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        {t('printSettings.enableBleed')}
      </label>
      {config.bleedEnabled && (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-neutral-600">
            {t('printSettings.bleed')}
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={config.bleedMm}
              onChange={(e) => {
                const value = Number(e.target.value)
                update({ bleedMm: Number.isFinite(value) ? Math.min(10, Math.max(0, value)) : 0 })
              }}
              className="mt-1 w-full text-sm border border-neutral-300 rounded-md px-2 py-1.5"
            />
          </label>
          <label className="text-xs text-neutral-600">
            {t('printSettings.cropMarkLength')}
            <input
              type="number"
              min={1}
              max={30}
              value={config.cropMarkLengthMm}
              onChange={(e) => update({ cropMarkLengthMm: Number(e.target.value) })}
              className="mt-1 w-full text-sm border border-neutral-300 rounded-md px-2 py-1.5"
            />
          </label>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={config.cropMarks}
          disabled={!config.bleedEnabled}
          onChange={(e) => update({ cropMarks: e.target.checked })}
          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        {t('printSettings.cropMarks')}
      </label>
    </div>
  )
}
