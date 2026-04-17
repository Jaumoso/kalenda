import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ClipboardList, FileDown, BookOpen, Book, ImageOff, Eye } from 'lucide-react'
import api from '../lib/api'
import ApplyTemplateModal from '../components/ApplyTemplateModal'
import ExportModal from '../components/ExportModal'
import PrintPreviewModal from '../components/PrintPreviewModal'

interface CalendarMonth {
  id: string
  month: number
  year: number
  isCustomized: boolean
}

interface Project {
  id: string
  name: string
  year: number
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  weekStartsOn: string
  templateId: string | null
  months: CalendarMonth[]
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'project.statusDraft' },
  { value: 'IN_PROGRESS', label: 'project.statusInProgress' },
  { value: 'COMPLETED', label: 'project.statusCompleted' },
]

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApplyTemplate, setShowApplyTemplate] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [thumbVersion, setThumbVersion] = useState(Date.now())

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/projects/${id}`)
        setProject(data.project)
        setThumbVersion(Date.now())
      } catch {
        setError(t('project.notFound'))
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [id])

  const handleStatusChange = async (status: string) => {
    if (!project) return
    try {
      const { data } = await api.patch(`/projects/${project.id}`, { status })
      setProject(data.project)
    } catch {
      setError(t('project.errorUpdatingStatus'))
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-64"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-56 bg-neutral-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-neutral-600 mb-4">{error || t('project.notFound')}</p>
        <Link to="/" className="text-primary-600 hover:underline">
          {t('project.backToDashboard')}
        </Link>
      </div>
    )
  }

  const monthNames = t('months', { returnObjects: true }) as string[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            title={t('project.goBack')}
          >
            <ArrowLeft size={16} className="inline mr-1" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{project.name}</h1>
            <p className="text-sm text-neutral-500">
              {project.year}
              {project.templateId && (
                <span className="ml-2 text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">
                  <ClipboardList size={14} className="inline mr-1" />
                  {t('project.withTemplate')}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPrintPreview(true)} className="btn btn-secondary text-sm">
            <Eye size={14} className="inline mr-1" />
            {t('project.printPreview')}
          </button>
          <button onClick={() => setShowExport(true)} className="btn btn-primary text-sm">
            <FileDown size={14} className="inline mr-1" />
            {t('project.export')}
          </button>
          <button onClick={() => setShowApplyTemplate(true)} className="btn btn-secondary text-sm">
            <ClipboardList size={14} className="inline mr-1" />
            {t('project.applyTemplate')}
          </button>
          <select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.label)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 12-month grid + covers */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Cover (front) */}
        <Link
          to={`/projects/${project.id}/cover/front`}
          className="bg-surface rounded-lg border border-dashed border-primary-300 p-4 hover:shadow-md transition-shadow flex flex-col min-h-[14rem]"
        >
          <h3 className="font-semibold text-primary-700 text-sm mb-2">{t('project.frontCover')}</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <img
              src={`/uploads/thumbs/cover-${project.id}-front.jpg?v=${thumbVersion}`}
              alt={t('project.frontCover')}
              className="w-full aspect-[3/4] object-cover rounded bg-neutral-100"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div
              className="hidden flex-col items-center justify-center text-neutral-400"
              style={{ aspectRatio: '3/4' }}
            >
              <BookOpen size={32} className="mb-2" />
              <span className="text-xs">{t('project.fullA4')}</span>
            </div>
          </div>
        </Link>

        {project.months.map((m) => {
          const thumbUrl = `/uploads/thumbs/${m.id}.jpg?v=${thumbVersion}`

          return (
            <Link
              key={m.id}
              to={`/projects/${project.id}/months/${m.id}`}
              className={`bg-surface rounded-lg border p-4 hover:shadow-md transition-shadow ${
                m.isCustomized ? 'border-primary-200' : 'border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-neutral-800 text-sm">
                  {monthNames[m.month - 1]}
                </h3>
                {m.isCustomized && (
                  <span
                    className="w-2 h-2 rounded-full bg-primary-500"
                    title={t('project.customized')}
                  />
                )}
              </div>
              {/* Month thumbnail */}
              {m.isCustomized ? (
                <img
                  src={thumbUrl}
                  alt={monthNames[m.month - 1]}
                  className="w-full aspect-[3/4] object-cover rounded bg-neutral-100"
                  onError={(e) => {
                    // Hide broken image and show placeholder
                    const target = e.currentTarget
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div
                className={`flex flex-col items-center justify-center text-neutral-400 ${m.isCustomized ? 'hidden' : ''}`}
                style={{ aspectRatio: '3/4' }}
              >
                <ImageOff size={32} className="mb-2" />
                <span className="text-xs">{t('project.noDesignYet')}</span>
              </div>
            </Link>
          )
        })}

        {/* Back cover */}
        <Link
          to={`/projects/${project.id}/cover/back`}
          className="bg-surface rounded-lg border border-dashed border-primary-300 p-4 hover:shadow-md transition-shadow flex flex-col min-h-[14rem]"
        >
          <h3 className="font-semibold text-primary-700 text-sm mb-2">{t('project.backCover')}</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <img
              src={`/uploads/thumbs/cover-${project.id}-back.jpg?v=${thumbVersion}`}
              alt={t('project.backCover')}
              className="w-full aspect-[3/4] object-cover rounded bg-neutral-100"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div
              className="hidden flex-col items-center justify-center text-neutral-400"
              style={{ aspectRatio: '3/4' }}
            >
              <Book size={32} className="mb-2" />
              <span className="text-xs">{t('project.fullA4')}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Apply template modal */}
      {showApplyTemplate && project && (
        <ApplyTemplateModal
          projectId={project.id}
          onClose={() => setShowApplyTemplate(false)}
          onApplied={() => {
            setShowApplyTemplate(false)
            // Refresh project data
            api
              .get(`/projects/${id}`)
              .then(({ data }) => setProject(data.project))
              .catch(() => {})
          }}
        />
      )}

      {/* Export modal */}
      {showExport && project && (
        <ExportModal
          projectId={project.id}
          projectName={project.name}
          projectYear={project.year}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Print preview modal */}
      {showPrintPreview && project && (
        <PrintPreviewModal
          projectId={project.id}
          projectName={project.name}
          projectYear={project.year}
          months={project.months}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  )
}
