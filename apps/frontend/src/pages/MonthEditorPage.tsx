import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'
import type { GridConfig, DayCell, MonthData, Holiday, CalEvent, Saint } from '../lib/calendarTypes'
import { DEFAULT_GRID_CONFIG, PAGE_WIDTH, PAGE_HEIGHT } from '../lib/calendarTypes'
import CalendarGrid from '../components/CalendarGrid'
import GridPropertiesPanel from '../components/GridPropertiesPanel'
import CellModal from '../components/CellModal'
import CanvasEditor, { type CanvasEditorHandle } from '../components/CanvasEditor'
import CanvasToolbar from '../components/CanvasToolbar'
import LayersPanel from '../components/LayersPanel'
import ObjectPropertiesPanel from '../components/ObjectPropertiesPanel'
import AssetPickerModal from '../components/AssetPickerModal'
import StickerPickerModal from '../components/StickerPickerModal'
import BackgroundModal from '../components/BackgroundModal'
import DraggableGridOverlay from '../components/DraggableGridOverlay'
import SaveAsTemplateModal from '../components/SaveAsTemplateModal'

const AUTOSAVE_INTERVAL = 30_000 // 30 seconds

export default function MonthEditorPage() {
  const { projectId, monthId } = useParams<{ projectId: string; monthId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [monthData, setMonthData] = useState<MonthData | null>(null)
  const [gridConfig, setGridConfig] = useState<GridConfig>(DEFAULT_GRID_CONFIG)
  const [dayCells, setDayCells] = useState<DayCell[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [dirty, setDirty] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [events, setEvents] = useState<CalEvent[]>([])
  const [saints, setSaints] = useState<Saint[]>([])

  // Canvas state
  const canvasEditorRef = useRef<CanvasEditorHandle>(null)
  const canvasTopJsonRef = useRef<object | null>(null)
  const [editorMode, setEditorMode] = useState<'grid' | 'canvas'>('canvas')
  const [selectedObject, setSelectedObject] = useState<import('fabric').FabricObject | null>(null)
  const [canvasRefreshKey, setCanvasRefreshKey] = useState(0)
  const [showAssetPicker, setShowAssetPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [showBackgroundModal, setShowBackgroundModal] = useState(false)
  const [bgAssetMode, setBgAssetMode] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

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
        if (data.month.canvasTopJson) {
          canvasTopJsonRef.current = data.month.canvasTopJson as object
        }
        setDayCells(data.month.dayCells || [])
        setHolidays(data.holidays || [])
        setEvents(data.events || [])
        setSaints(data.saints || [])
      } catch {
        setError(t('editor.errorLoading'))
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
      const canvasJson = canvasEditorRef.current?.toJSON() ?? canvasTopJsonRef.current
      await api.put(`/months/${monthId}`, {
        gridConfigJson: gridConfigRef.current,
        canvasTopJson: canvasJson,
      })
      setLastSaved(new Date())
      setDirty(false)
    } catch {
      setError(t('editor.errorSaving'))
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
        const canvasJson = canvasEditorRef.current?.toJSON() ?? canvasTopJsonRef.current
        // Fire and forget
        api
          .put(`/months/${monthId}`, {
            gridConfigJson: gridConfigRef.current,
            canvasTopJson: canvasJson,
          })
          .catch(() => {})
      }
    }
  }, [monthId])

  const handleGridConfigChange = (newConfig: GridConfig) => {
    setGridConfig(newConfig)
    setDirty(true)
  }

  const handleGridLayoutChange = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      setGridConfig((prev) => ({
        ...prev,
        gridX: rect.x,
        gridY: rect.y,
        gridWidth: rect.width,
        gridHeight: rect.height,
      }))
      setDirty(true)
    },
    []
  )

  const handleCellClick = (dayNumber: number) => {
    setSelectedDay(dayNumber)
  }

  // Canvas handlers
  const handleCanvasModified = useCallback(() => {
    setDirty(true)
    setCanvasRefreshKey((k) => k + 1)
  }, [])

  const handleSelectionChange = useCallback((obj: import('fabric').FabricObject | null) => {
    setSelectedObject(obj)
  }, [])

  const handleAssetSelect = useCallback(
    (asset: { filename: string; originalName: string }) => {
      const url = `/uploads/${asset.filename}`
      if (bgAssetMode) {
        canvasEditorRef.current?.setBackground('image', url)
        setBgAssetMode(false)
      } else {
        canvasEditorRef.current?.addImageFromURL(url, asset.originalName)
      }
      setShowAssetPicker(false)
    },
    [bgAssetMode]
  )

  const handleStickerSelect = useCallback((emoji: string) => {
    canvasEditorRef.current?.addSticker(emoji)
  }, [])

  const refetchEvents = useCallback(async () => {
    if (!monthData) return
    try {
      const { data } = await api.get(`/events`, {
        params: { month: monthData.month, year: monthData.year },
      })
      setEvents(data.events)
    } catch {
      // ignore
    }
  }, [monthData])

  const handleCellSave = async (data: {
    bgColor: string | null
    contentJson: {
      text?: string
      emoji?: string
      imageAssetId?: string
      imageFilename?: string
      stickerAssetId?: string
      stickerFilename?: string
    } | null
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
      setError(t('editor.errorSavingCell'))
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
          {t('editor.backToProjectLink')}
        </Link>
      </div>
    )
  }

  if (!monthData) return null

  const monthNames = t('months', { returnObjects: true }) as string[]
  const monthName = monthNames[monthData.month - 1]
  const selectedCell =
    selectedDay !== null ? (dayCells.find((c) => c.dayNumber === selectedDay) ?? null) : null

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="bg-surface border-b border-neutral-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to={`/projects/${projectId}`}
            className="text-neutral-400 hover:text-neutral-600 transition-colors text-sm"
          >
            {t('editor.backToProject')}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigateMonth(-1)}
              disabled={monthData.month === 1}
              className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30 transition-colors"
              title={t('editor.previousMonth')}
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
              title={t('editor.nextMonth')}
            >
              ▶
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500">{error}</span>}
          {lastSaved && (
            <span className="text-xs text-neutral-400">
              {t('common.saved') + ' '}
              {lastSaved.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {dirty && !saving && (
            <span className="text-xs text-amber-500">{t('common.unsaved')}</span>
          )}
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="btn btn-primary text-sm disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <button
            onClick={() => setShowSaveTemplate(true)}
            className="btn btn-secondary text-sm"
            title={t('editor.saveTemplate')}
          >
            {t('editor.templateButton')}
          </button>
        </div>
      </div>

      {/* Mode toggle bar */}
      <div className="bg-surface border-b border-neutral-200 px-4 py-1.5 flex items-center gap-2 shrink-0">
        <button
          onClick={() => setEditorMode('canvas')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            editorMode === 'canvas'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          {t('editor.decoratePage')}
        </button>
        <button
          onClick={() => setEditorMode('grid')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            editorMode === 'grid'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          {t('editor.editGrid')}
        </button>

        {editorMode === 'canvas' && (
          <div className="ml-2 flex-1">
            <CanvasToolbar
              editorRef={canvasEditorRef}
              onAddImage={() => {
                setBgAssetMode(false)
                setShowAssetPicker(true)
              }}
              onAddSticker={() => setShowStickerPicker(true)}
              onBackgroundSettings={() => setShowBackgroundModal(true)}
            />
          </div>
        )}
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 min-h-0">
        {/* Page area */}
        <div className="flex-1 overflow-auto p-6 bg-neutral-100">
          <div className="mx-auto" style={{ width: PAGE_WIDTH }}>
            {/* Unified A4 page container */}
            <div className="relative shadow-lg" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}>
              {/* Fabric.js canvas — full page background + art objects */}
              <div
                className={`absolute inset-0 ${editorMode === 'canvas' ? '' : 'pointer-events-none'}`}
                style={{ zIndex: 1 }}
              >
                <CanvasEditor
                  ref={canvasEditorRef}
                  width={PAGE_WIDTH}
                  height={PAGE_HEIGHT}
                  initialJson={canvasTopJsonRef.current}
                  onModified={handleCanvasModified}
                  onSelectionChange={handleSelectionChange}
                />
              </div>

              {/* Calendar Grid overlay — draggable & resizable */}
              <DraggableGridOverlay
                x={gridConfig.gridX}
                y={gridConfig.gridY}
                width={gridConfig.gridWidth}
                height={gridConfig.gridHeight}
                opacity={gridConfig.gridOverlayOpacity}
                active={editorMode === 'grid'}
                onLayoutChange={handleGridLayoutChange}
              >
                <CalendarGrid
                  year={monthData.year}
                  month={monthData.month}
                  weekStartsOn={monthData.project.weekStartsOn}
                  gridConfig={gridConfig}
                  dayCells={dayCells}
                  holidays={holidays}
                  events={events}
                  saints={saints}
                  onCellClick={handleCellClick}
                />
              </DraggableGridOverlay>
            </div>
          </div>
        </div>

        {/* Right panel — Properties */}
        <div className="w-72 bg-surface border-l border-neutral-200 overflow-y-auto p-4 shrink-0">
          {editorMode === 'canvas' ? (
            <div className="space-y-6">
              <ObjectPropertiesPanel
                editorRef={canvasEditorRef}
                selectedObject={selectedObject}
                onModified={handleCanvasModified}
              />
              <div className="border-t border-neutral-100 pt-4">
                <LayersPanel
                  editorRef={canvasEditorRef}
                  selectedObject={selectedObject}
                  refreshKey={canvasRefreshKey}
                />
              </div>
            </div>
          ) : (
            <GridPropertiesPanel config={gridConfig} onChange={handleGridConfigChange} />
          )}
        </div>
      </div>

      {/* Cell modal */}
      {selectedDay !== null && monthData && (
        <CellModal
          dayNumber={selectedDay}
          month={monthData.month}
          year={monthData.year}
          cell={selectedCell}
          holidays={holidays.filter((h) => h.day === selectedDay)}
          events={events.filter((e) => e.day === selectedDay)}
          saint={saints.find((s) => s.day === selectedDay)?.name || null}
          onSave={handleCellSave}
          onEventsChanged={refetchEvents}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Asset picker modal */}
      <AssetPickerModal
        isOpen={showAssetPicker}
        onClose={() => {
          setShowAssetPicker(false)
          setBgAssetMode(false)
        }}
        onSelect={handleAssetSelect}
      />

      {/* Sticker picker modal */}
      <StickerPickerModal
        isOpen={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelect={handleStickerSelect}
      />

      {/* Background modal */}
      <BackgroundModal
        isOpen={showBackgroundModal}
        editorRef={canvasEditorRef}
        onClose={() => setShowBackgroundModal(false)}
        onOpenAssetPicker={() => {
          setBgAssetMode(true)
          setShowAssetPicker(true)
        }}
      />

      {/* Save as template modal */}
      {showSaveTemplate && monthId && (
        <SaveAsTemplateModal
          monthId={monthId}
          onClose={() => setShowSaveTemplate(false)}
          onSaved={() => setShowSaveTemplate(false)}
        />
      )}
    </div>
  )
}
