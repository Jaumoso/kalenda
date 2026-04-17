import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'

interface Props {
  monthId: string
  onClose: () => void
  onSaved: () => void
}

export default function SaveAsTemplateModal({ monthId, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)
    try {
      await api.post(`/templates/from-month/${monthId}`, { name: name.trim() })
      onSaved()
    } catch {
      setError(t('saveTemplate.errorSaving'))
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-5">
        <h2 className="text-base font-semibold text-neutral-900 mb-3">{t('saveTemplate.title')}</h2>
        <p className="text-xs text-neutral-500 mb-4">{t('saveTemplate.description')}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="tplName" className="block text-sm font-medium text-neutral-700 mb-1">
              {t('saveTemplate.nameLabel')}
            </label>
            <input
              id="tplName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('saveTemplate.namePlaceholder')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              autoFocus
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary text-sm">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
