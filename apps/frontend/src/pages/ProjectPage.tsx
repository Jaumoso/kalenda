import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'

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
  months: CalendarMonth[]
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completado' },
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number, weekStartsOn: string): number {
  const day = new Date(year, month - 1, 1).getDay() // 0=Sun
  if (weekStartsOn === 'monday') {
    return day === 0 ? 6 : day - 1 // 0=Mon
  }
  return day // 0=Sun
}

const WEEKDAY_HEADERS_MON = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const WEEKDAY_HEADERS_SUN = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/projects/${id}`)
        setProject(data.project)
      } catch {
        setError('Proyecto no encontrado')
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
      setError('Error al actualizar el estado')
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
        <p className="text-neutral-600 mb-4">{error || 'Proyecto no encontrado'}</p>
        <Link to="/" className="text-primary-600 hover:underline">
          Volver al dashboard
        </Link>
      </div>
    )
  }

  const weekdays = project.weekStartsOn === 'monday' ? WEEKDAY_HEADERS_MON : WEEKDAY_HEADERS_SUN

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            title="Volver"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{project.name}</h1>
            <p className="text-sm text-neutral-500">{project.year}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 12-month grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {project.months.map((m) => {
          const daysInMonth = getDaysInMonth(m.year, m.month)
          const firstDay = getFirstDayOfWeek(m.year, m.month, project.weekStartsOn)

          return (
            <Link
              key={m.id}
              to={`/projects/${project.id}/months/${m.id}`}
              className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
                m.isCustomized ? 'border-primary-200' : 'border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-neutral-800 text-sm">
                  {MONTH_NAMES[m.month - 1]}
                </h3>
                {m.isCustomized && (
                  <span className="w-2 h-2 rounded-full bg-primary-500" title="Personalizado" />
                )}
              </div>
              {/* Mini calendar */}
              <div className="grid grid-cols-7 gap-px text-[10px]">
                {weekdays.map((d) => (
                  <div key={d} className="text-center font-medium text-neutral-400 pb-1">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <div
                    key={i + 1}
                    className="text-center py-0.5 text-neutral-600 rounded hover:bg-primary-50"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
