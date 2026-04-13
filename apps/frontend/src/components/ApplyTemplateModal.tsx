import { useState, useEffect } from 'react'
import api from '../lib/api'

interface Template {
  id: string
  name: string
  isDefault: boolean
  createdAt: string
}

interface Props {
  projectId: string
  onClose: () => void
  onApplied: () => void
}

export default function ApplyTemplateModal({ projectId, onClose, onApplied }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [forceAll, setForceAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ appliedTo: number; total: number } | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await api.get('/templates')
        setTemplates(data.templates)
        const def = data.templates.find((t: Template) => t.isDefault)
        if (def) setSelectedId(def.id)
      } catch {
        setError('Error al cargar plantillas')
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  const handleApply = async () => {
    if (!selectedId) return
    setApplying(true)
    setError(null)
    try {
      const { data } = await api.post(
        `/templates/${selectedId}/apply/${projectId}?force=${forceAll}`
      )
      setResult({ appliedTo: data.appliedTo, total: data.total })
      setTimeout(() => onApplied(), 1500)
    } catch {
      setError('Error al aplicar la plantilla')
      setApplying(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    try {
      await api.delete(`/templates/${id}`)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      if (selectedId === id) setSelectedId(null)
    } catch {
      setError('Error deleting')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-5">
        <h2 className="text-base font-semibold text-neutral-900 mb-1">
          📋 Apply template to project
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          Apply a saved template to the project months.
        </p>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : templates.length === 0 ? (
          <div className="py-6 text-center text-sm text-neutral-500">
            <p>No tienes plantillas guardadas.</p>
            <p className="text-xs mt-1">
              Edita un mes y usa "Guardar como plantilla" para crear una.
            </p>
          </div>
        ) : (
          <>
            {result ? (
              <div className="py-6 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm text-neutral-700">
                  Plantilla aplicada a {result.appliedTo} de {result.total} meses
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                        selectedId === t.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                      onClick={() => setSelectedId(t.id)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="template"
                          checked={selectedId === t.id}
                          onChange={() => setSelectedId(t.id)}
                          className="accent-primary-600"
                        />
                        <div>
                          <span className="text-sm font-medium text-neutral-800">{t.name}</span>
                          {t.isDefault && (
                            <span className="ml-2 text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
                              Por defecto
                            </span>
                          )}
                          <p className="text-[10px] text-neutral-400">
                            {new Date(t.createdAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(t.id)
                        }}
                        className="text-neutral-400 hover:text-red-500 text-xs transition-colors"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-xs text-neutral-600 mb-4">
                  <input
                    type="checkbox"
                    checked={forceAll}
                    onChange={(e) => setForceAll(e.target.checked)}
                    className="accent-primary-600"
                  />
                  Also apply to already customized months (overwrite)
                </label>
              </>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {!result && (
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={applying || !selectedId || templates.length === 0}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Apply to all months'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
