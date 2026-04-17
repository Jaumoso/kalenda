import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'

interface Template {
  id: string
  name: string
  isDefault: boolean
  configJson: {
    gridConfigJson?: Record<string, unknown>
    canvasTopJson?: unknown
  }
  createdAt: string
}

export default function TemplatesPage() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/templates')
      setTemplates(data.templates)
    } catch {
      setError(t('templates.errorLoading'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/templates/${id}`, { isDefault: true })
      setTemplates((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })))
    } catch {
      setError(t('templates.errorUpdating'))
    }
  }

  const handleRename = async (id: string) => {
    if (!editName.trim()) return
    try {
      await api.patch(`/templates/${id}`, { name: editName.trim() })
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, name: editName.trim() } : t)))
      setEditingId(null)
    } catch {
      setError(t('templates.errorRenaming'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('templates.confirmDelete'))) return
    try {
      await api.delete(`/templates/${id}`)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch {
      setError(t('templates.errorDeleting'))
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-48" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-neutral-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{t('templates.title')}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            {t('common.close')}
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">
            {t('templates.noTemplates')}
          </h2>
          <p className="text-neutral-500 text-sm">{t('templates.noTemplatesHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => {
            const gridConfig = tpl.configJson?.gridConfigJson
            const hasCanvas = !!tpl.configJson?.canvasTopJson
            const hasGrid = !!gridConfig

            return (
              <div
                key={tpl.id}
                className="bg-surface rounded-lg border border-neutral-200 p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  {editingId === tpl.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleRename(tpl.id)
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm border border-neutral-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500"
                        autoFocus
                      />
                      <button type="submit" className="text-xs text-primary-600 hover:underline">
                        {t('common.save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-xs text-neutral-500 hover:underline"
                      >
                        {t('common.cancel')}
                      </button>
                    </form>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-neutral-900 text-sm">{tpl.name}</h3>
                        {tpl.isDefault && (
                          <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-medium">
                            {t('templates.default')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-neutral-400">
                          {new Date(tpl.createdAt).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {hasGrid && (
                          <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">
                            Grid
                          </span>
                        )}
                        {hasCanvas && (
                          <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">
                            Canvas
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {editingId !== tpl.id && (
                  <div className="flex items-center gap-2 ml-4">
                    {!tpl.isDefault && (
                      <button
                        onClick={() => handleSetDefault(tpl.id)}
                        className="text-xs text-neutral-500 hover:text-primary-600 transition-colors"
                        title={t('templates.setDefault')}
                      >
                        {t('templates.default')}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingId(tpl.id)
                        setEditName(tpl.name)
                      }}
                      className="text-xs text-neutral-500 hover:text-primary-600 transition-colors"
                    >
                      {t('common.rename')}
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="text-xs text-neutral-500 hover:text-red-600 transition-colors"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
