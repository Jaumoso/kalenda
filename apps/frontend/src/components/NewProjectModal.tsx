import { useState, useEffect } from 'react'
import api from '../lib/api'

const AUTONOMY_CODES = [
  { code: 'AN', name: 'Andalucía' },
  { code: 'AR', name: 'Aragón' },
  { code: 'AS', name: 'Asturias' },
  { code: 'IB', name: 'Islas Baleares' },
  { code: 'CN', name: 'Canarias' },
  { code: 'CB', name: 'Cantabria' },
  { code: 'CL', name: 'Castilla y León' },
  { code: 'CM', name: 'Castilla-La Mancha' },
  { code: 'CT', name: 'Cataluña' },
  { code: 'VC', name: 'Comunidad Valenciana' },
  { code: 'EX', name: 'Extremadura' },
  { code: 'GA', name: 'Galicia' },
  { code: 'MD', name: 'Madrid' },
  { code: 'MC', name: 'Murcia' },
  { code: 'NC', name: 'Navarra' },
  { code: 'PV', name: 'País Vasco' },
  { code: 'RI', name: 'La Rioja' },
  { code: 'CE', name: 'Ceuta' },
  { code: 'ML', name: 'Melilla' },
]

interface TemplateOption {
  id: string
  name: string
  isDefault: boolean
}

interface Props {
  onClose: () => void
  onCreate: () => void
}

export default function NewProjectModal({ onClose, onCreate }: Props) {
  const currentYear = new Date().getFullYear()
  const [name, setName] = useState('')
  const [year, setYear] = useState(currentYear + 1)
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>('monday')
  const [autonomyCode, setAutonomyCode] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/templates')
      .then(({ data }) => {
        setTemplates(data.templates)
        const def = data.templates.find((t: TemplateOption) => t.isDefault)
        if (def) setTemplateId(def.id)
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      await api.post('/projects', {
        name: name.trim(),
        year,
        weekStartsOn,
        autonomyCode: autonomyCode || undefined,
        templateId: templateId || undefined,
      })
      onCreate()
    } catch {
      setError('Error creating project')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">New calendar</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g.: Family calendar 2027"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-neutral-700 mb-1">
              Year
            </label>
            <input
              id="year"
              type="number"
              min={2020}
              max={2050}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Week starts on
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="weekStartsOn"
                  value="monday"
                  checked={weekStartsOn === 'monday'}
                  onChange={() => setWeekStartsOn('monday')}
                  className="accent-primary-600"
                />
                Monday
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="weekStartsOn"
                  value="sunday"
                  checked={weekStartsOn === 'sunday'}
                  onChange={() => setWeekStartsOn('sunday')}
                  className="accent-primary-600"
                />
                Sunday
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Autonomous Community (holidays)
            </label>
            <select
              value={autonomyCode}
              onChange={(e) => setAutonomyCode(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">National holidays only</option>
              {AUTONOMY_CODES.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Base template
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.isDefault ? ' ⭐' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                The template will be applied to all 12 months when creating the project
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
