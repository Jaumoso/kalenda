import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import api from '../lib/api'
import NewProjectModal from '../components/NewProjectModal'

interface ProjectMonth {
  id: string
  month: number
  isCustomized: boolean
}

interface Project {
  id: string
  name: string
  year: number
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  weekStartsOn: string
  createdAt: string
  updatedAt: string
  months: ProjectMonth[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'dashboard.statusDraft', color: 'bg-neutral-200 text-neutral-700' },
  IN_PROGRESS: { label: 'dashboard.statusInProgress', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'dashboard.statusCompleted', color: 'bg-green-100 text-green-700' },
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.projects)
    } catch {
      setError(t('dashboard.errorLoading'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/projects/${id}/duplicate`)
      fetchProjects()
    } catch {
      setError(t('dashboard.errorDuplicating'))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('dashboard.confirmDelete', { name }))) return
    try {
      await api.delete(`/projects/${id}`)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError(t('dashboard.errorDeleting'))
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-neutral-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{t('dashboard.title')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          {t('dashboard.newCalendar')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            {t('common.close')}
          </button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={48} className="text-neutral-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">
            {t('dashboard.noCalendars')}
          </h2>
          <p className="text-neutral-500 mb-6">{t('dashboard.noCalendarsDesc')}</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            {t('dashboard.createFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const customized = project.months.filter((m) => m.isCustomized).length
            const status = STATUS_LABELS[project.status]
            return (
              <div
                key={project.id}
                className="bg-surface rounded-lg border border-neutral-200 hover:shadow-md transition-shadow"
              >
                <Link to={`/projects/${project.id}`} className="block p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{project.name}</h3>
                      <p className="text-sm text-neutral-500">{project.year}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}
                    >
                      {t(status.label)}
                    </span>
                  </div>
                  {/* Mini month grid */}
                  <div className="grid grid-cols-6 gap-1 mb-3">
                    {project.months.map((m) => (
                      <div
                        key={m.id}
                        className={`h-5 rounded text-[10px] flex items-center justify-center font-medium ${
                          m.isCustomized
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                        title={new Date(project.year, m.month - 1).toLocaleString('en', {
                          month: 'short',
                        })}
                      >
                        {m.month}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400">
                    {t('dashboard.monthsCustomized', { count: customized })}
                  </p>
                </Link>
                <div className="border-t border-neutral-100 px-5 py-2 flex gap-2 justify-end">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDuplicate(project.id)
                    }}
                    className="text-xs text-neutral-500 hover:text-primary-600 transition-colors"
                    title={t('common.duplicate')}
                  >
                    {t('common.duplicate')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(project.id, project.name)
                    }}
                    className="text-xs text-neutral-500 hover:text-red-600 transition-colors"
                    title={t('common.delete')}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreate={() => {
            setShowModal(false)
            fetchProjects()
          }}
        />
      )}
    </div>
  )
}
