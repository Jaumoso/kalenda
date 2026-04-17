import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'
import type { CalEvent } from '../lib/calendarTypes'

const EVENT_TYPES = [
  { value: 'BIRTHDAY', label: 'events.birthday', icon: '🎂' },
  { value: 'ANNIVERSARY', label: 'events.anniversary', icon: '💍' },
  { value: 'CUSTOM', label: 'events.custom', icon: '📌' },
] as const

export default function EventsPage() {
  const { t } = useTranslation()
  const monthNames = t('months', { returnObjects: true }) as string[]
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await api.get('/events')
      setEvents(data.events)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleDelete = async (id: string) => {
    if (!confirm(t('events.confirmDelete'))) return
    try {
      await api.delete(`/events/${id}`)
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch {
      // ignore
    }
  }

  const handleEdit = (event: CalEvent) => {
    setEditingEvent(event)
    setShowForm(true)
  }

  const handleFormDone = () => {
    setShowForm(false)
    setEditingEvent(null)
    fetchEvents()
  }

  const grouped = events.reduce(
    (acc, e) => {
      const key = e.month
      if (!acc[key]) acc[key] = []
      acc[key].push(e)
      return acc
    },
    {} as Record<number, CalEvent[]>
  )

  const typeIcon = (type: string) => EVENT_TYPES.find((t) => t.value === type)?.icon || '📌'

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('events.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('events.description')}</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null)
            setShowForm(true)
          }}
          className="btn btn-primary"
        >
          {t('events.newEvent')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-neutral-500">{t('events.noEvents')}</p>
          <p className="text-sm text-neutral-400">{t('events.noEventsHint')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from({ length: 12 }, (_, i) => i + 1)
            .filter((m) => grouped[m])
            .map((m) => (
              <div key={m}>
                <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  {monthNames[m - 1]}
                </h2>
                <div className="bg-surface rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                  {grouped[m]
                    .sort((a, b) => a.day - b.day)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                            style={{ backgroundColor: event.color + '20', color: event.color }}
                          >
                            {event.icon || typeIcon(event.type)}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{event.name}</p>
                            <p className="text-xs text-neutral-500">
                              {monthNames[event.month - 1]} {event.day}
                              {event.isRecurring
                                ? t('events.everyYear')
                                : event.year
                                  ? ` · ${event.year}`
                                  : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-1.5 text-neutral-400 hover:text-primary-600 rounded transition-colors text-sm"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 rounded transition-colors text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {showForm && (
        <EventForm
          event={editingEvent}
          onDone={handleFormDone}
          onClose={() => {
            setShowForm(false)
            setEditingEvent(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Event Form Modal ────────────────────────────────────────
function EventForm({
  event,
  onDone,
  onClose,
}: {
  event: CalEvent | null
  onDone: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const monthNames = t('months', { returnObjects: true }) as string[]
  const [name, setName] = useState(event?.name || '')
  const [day, setDay] = useState(event?.day || 1)
  const [month, setMonth] = useState(event?.month || 1)
  const [type, setType] = useState<'BIRTHDAY' | 'ANNIVERSARY' | 'CUSTOM'>(
    event?.type === 'SAINT' ? 'CUSTOM' : event?.type || 'BIRTHDAY'
  )
  const [color, setColor] = useState(event?.color || '#C8502A')
  const [icon, setIcon] = useState(event?.icon || '')
  const [isRecurring, setIsRecurring] = useState(event?.isRecurring ?? true)
  const [year, setYear] = useState<number | ''>(event?.year || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const DEFAULT_COLORS = ['#C8502A', '#2563EB', '#059669', '#7C3AED', '#DB2777', '#EA580C']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)

    const payload = {
      name: name.trim(),
      day,
      month,
      type,
      color,
      icon: icon || null,
      isRecurring,
      year: isRecurring ? null : year || null,
    }

    try {
      if (event) {
        await api.put(`/events/${event.id}`, payload)
      } else {
        await api.post('/events', payload)
      }
      onDone()
    } catch {
      setError(t('events.errorSaving'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-surface rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          {event ? t('events.editEvent') : t('events.newEventTitle')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('common.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('events.eventNamePlaceholder')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              autoFocus
              required
              maxLength={100}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('common.type')}
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: 'BIRTHDAY', label: t('events.typeBirthday') },
                  { value: 'ANNIVERSARY', label: t('events.typeAnniversary') },
                  { value: 'CUSTOM', label: t('events.typeOther') },
                ] as const
              ).map((tp) => (
                <button
                  key={tp.value}
                  type="button"
                  onClick={() => setType(tp.value)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    type === tp.value
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('common.day')}
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('common.month')}
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {monthNames.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="accent-primary-600"
            />
            <label htmlFor="recurring" className="text-sm text-neutral-700">
              {t('events.repeatsEveryYear')}
            </label>
          </div>

          {!isRecurring && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('common.year')}
              </label>
              <input
                type="number"
                min={2020}
                max={2050}
                value={year}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('common.color')}
            </label>
            <div className="flex gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    color === c ? 'border-neutral-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('events.iconLabel')}
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🎂"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              maxLength={4}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-300 rounded-md transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="btn btn-primary disabled:opacity-50"
            >
              {saving ? t('common.saving') : event ? t('common.save') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
