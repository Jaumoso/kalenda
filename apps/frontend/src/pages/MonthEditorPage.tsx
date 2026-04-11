import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import type { GridConfig, DayCell, MonthData } from '../lib/calendarTypes'
import { DEFAULT_GRID_CONFIG, MONTH_NAMES } from '../lib/calendarTypes'
import CalendarGrid from '../components/CalendarGrid'
import GridPropertiesPanel from '../components/GridPropertiesPanel'
import CellModal from '../components/CellModal'

const AUTOSAVE_INTERVAL = 30_000 // 30 seconds

export default function MonthEditorPage() {
  const { projectId, monthId } = useParams<{ projectId: string; monthId: string }>()
  const navigate = useNavigate()

  const [monthData, setMonthData] = useState<MonthData | null>(null)
  const [gridConfig, setGridConfig] = useState<GridConfig>(DEFAULT_GRID_CONFIG)
  const [dayCells, setDayCells] = useState<DayCell[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [dirty, setDirty] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const dirtyRef = useRef(false)
  const gridConfigRef = useRef(gridConfig)

  // Keep refs in sync
  useEffect(() => {
    dirtyRef.current = dirty
    gridConfigRef.current = gridConfig
  }, [dirty, gridConfig])

  // Fetch month data
  useEffect(() => {
    const fetchMonth = async () => {
      try {
        const { data } = await api.get(`/months/${monthId}`)
        setMonthData(data.month)
        if (data.month.gridConfigJson) {
          setGridConfig({ ...DEFAULT_GRID_CONFIG, ...data.month.gridConfigJson })
        }
        setDayCells(data.month.dayCells || [])
      } catch {
        setError('No se pudo cargar el mes')
      } finally {
        setLoading(false)
      }
    }
    fetchMonth()
  }, [monthId])

  // Save function
  const save = useCallback(async () => {
    if (!monthId || !dirtyRef.current) return
    setSaving(true)
    try {
      await api.put(`/months/${monthId}`, {
        gridConfigJson: gridConfigRef.current,
      })
      setLastSaved(new Date())
      setDirty(false)
    } catch {
      setError('Error al guardar')
    } finally {
      setSaving(false)
    }
  }, [monthId])

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) save()
    }, AUTOSAVE_INTERVAL)
    return () => clearInterval(interval)
  }, [save])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (dirtyRef.current) {
        // Fire and forget
        api.put(`/months/${monthId}`, { gridConfigJson: gridConfigRef.current }).catch(() => {})
      }
    }
  }, [monthId])

  const handleGridConfigChange = (newConfig: GridConfig) => {
    setGridConfig(newConfig)
    setDirty(true)
  }

  const handleCellClick = (dayNumber: number) => {
    setSelectedDay(dayNumber)
  }

  const handleCellSave = async (data: {
    bgColor: string | null
    contentJson: { text?: string; emoji?: string } | null
  }) => {
    if (!monthId || selectedDay === null) return
    try {
      const { data: resp } = await api.put(`/months/${monthId}/cells/${selectedDay}`, data)
      setDayCells((prev) => {
        const idx = prev.findIndex((c) => c.dayNumber === selectedDay)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = resp.cell
          return next
        }
        return [...prev, resp.cell]
      })
      setSelectedDay(null)
    } catch {
      setError('Error al guardar la celda')
    }
  }

  // Navigate between months
  const handleNavigateMonth = async (direction: -1 | 1) => {
    if (!monthData) return
    // Save current if dirty
    if (dirty) await save()

    try {
      const { data } = await api.get(`/projects/${projectId}`)
      const months = data.project.months as Array<{ id: string; month: number }>
      const currentIdx = months.findIndex((m) => m.id === monthId)
      const targetIdx = currentIdx + direction
      if (targetIdx >= 0 && targetIdx < months.length) {
        navigate(`/projects/${projectId}/months/${months[targetIdx].id}`, { replace: true })
      }
    } catch {
      // ignore navigation error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error && !monthData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-4">
        <p className="text-neutral-600">{error}</p>
        <Link to={`/projects/${projectId}`} className="text-primary-600 hover:underline">
          Volver al proyecto
        </Link>
      </div>
    )
  }

  if (!monthData) return null

  const monthName = MONTH_NAMES[monthData.month - 1]
  const selectedCell =
    selectedDay !== null ? (dayCells.find((c) => c.dayNumber === selectedDay) ?? null) : null

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="bg-white border-b border-neutral-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to={`/projects/${projectId}`}
            className="text-neutral-400 hover:text-neutral-600 transition-colors text-sm"
          >
            ← Proyecto
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigateMonth(-1)}
              disabled={monthData.month === 1}
              className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30 transition-colors"
              title="Mes anterior"
            >
              ◀
            </button>
            <h1 className="text-lg font-bold text-neutral-900">
              {monthName} {monthData.year}
            </h1>
            <button
              onClick={() => handleNavigateMonth(1)}
              disabled={monthData.month === 12}
              className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30 transition-colors"
              title="Mes siguiente"
            >
              ▶
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500">{error}</span>}
          {lastSaved && (
            <span className="text-xs text-neutral-400">
              Guardado:{' '}
              {lastSaved.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {dirty && !saving && <span className="text-xs text-amber-500">Sin guardar</span>}
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="btn btn-primary text-sm disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-6 bg-neutral-100">
          {/* Top zone placeholder (Phase 6) */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-neutral-200/50 border-2 border-dashed border-neutral-300 rounded-lg p-8 mb-4 text-center">
              <p className="text-sm text-neutral-400">
                Zona superior — Editor de imagen (próximamente)
              </p>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <CalendarGrid
                year={monthData.year}
                month={monthData.month}
                weekStartsOn={monthData.project.weekStartsOn}
                gridConfig={gridConfig}
                dayCells={dayCells}
                onCellClick={handleCellClick}
              />
            </div>
          </div>
        </div>

        {/* Right panel — Properties */}
        <div className="w-72 bg-white border-l border-neutral-200 overflow-y-auto p-4 shrink-0">
          <GridPropertiesPanel config={gridConfig} onChange={handleGridConfigChange} />
        </div>
      </div>

      {/* Cell modal */}
      {selectedDay !== null && monthData && (
        <CellModal
          dayNumber={selectedDay}
          month={monthData.month}
          year={monthData.year}
          cell={selectedCell}
          onSave={handleCellSave}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}
