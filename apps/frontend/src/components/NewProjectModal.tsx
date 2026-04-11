import { useState } from 'react'
import api from '../lib/api'

interface Props {
  onClose: () => void
  onCreate: () => void
}

export default function NewProjectModal({ onClose, onCreate }: Props) {
  const currentYear = new Date().getFullYear()
  const [name, setName] = useState('')
  const [year, setYear] = useState(currentYear + 1)
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>('monday')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      await api.post('/projects', { name: name.trim(), year, weekStartsOn })
      onCreate()
    } catch {
      setError('Error al crear el proyecto')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Nuevo calendario</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Calendario familiar 2027"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-neutral-700 mb-1">
              Año
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
              La semana empieza en
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
                Lunes
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
                Domingo
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear calendario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
