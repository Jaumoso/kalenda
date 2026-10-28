import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CalEvent } from '../lib/calendarTypes'

interface Props {
  readonly events: readonly CalEvent[]
  readonly selectedIds: readonly string[]
  readonly onChange: (ids: string[]) => Promise<void>
}

export default function CountdownSettingsPanel({ events, selectedIds, onChange }: Props) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const selected = new Set(selectedIds)

  const toggle = async (id: string) => {
    const next = selected.has(id)
      ? selectedIds.filter((currentId) => currentId !== id)
      : [...selectedIds, id]
    setSaving(true)
    try {
      await onChange(next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border-t border-neutral-100 pt-4">
      <h2 className="text-sm font-semibold text-neutral-800">{t('countdown.settingsTitle')}</h2>
      <p className="mt-1 text-xs text-neutral-500">{t('countdown.settingsHint')}</p>
      <div className="mt-3 space-y-2">
        {events.length === 0 && (
          <p className="text-xs text-neutral-500">{t('countdown.noEvents')}</p>
        )}
        {events.map((event) => (
          <label key={event.id} className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={selected.has(event.id)}
              disabled={saving}
              onChange={() => toggle(event.id)}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="truncate">{event.name}</span>
          </label>
        ))}
      </div>
    </section>
  )
}
