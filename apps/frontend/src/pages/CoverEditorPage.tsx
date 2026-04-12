import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { PAGE_WIDTH, PAGE_HEIGHT } from '../lib/calendarTypes'
import CanvasEditor, { type CanvasEditorHandle } from '../components/CanvasEditor'
import CanvasToolbar from '../components/CanvasToolbar'
import LayersPanel from '../components/LayersPanel'
import ObjectPropertiesPanel from '../components/ObjectPropertiesPanel'
import AssetPickerModal from '../components/AssetPickerModal'
import StickerPickerModal from '../components/StickerPickerModal'
import BackgroundModal from '../components/BackgroundModal'

const AUTOSAVE_INTERVAL = 30_000

interface CoverData {
  id: string
  coverJson: unknown
  backCoverJson: unknown
  name: string
  year: number
}

export default function CoverEditorPage() {
  const { projectId, type } = useParams<{ projectId: string; type: string }>()
  const navigate = useNavigate()
  const isFront = type !== 'back'
  const label = isFront ? 'Portada' : 'Contraportada'

  const [coverData, setCoverData] = useState<CoverData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [dirty, setDirty] = useState(false)

  const canvasEditorRef = useRef<CanvasEditorHandle>(null)
  const canvasJsonRef = useRef<object | null>(null)
  const [selectedObject, setSelectedObject] = useState<import('fabric').FabricObject | null>(null)
  const [canvasRefreshKey, setCanvasRefreshKey] = useState(0)
  const [showAssetPicker, setShowAssetPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [showBackgroundModal, setShowBackgroundModal] = useState(false)
  const [bgAssetMode, setBgAssetMode] = useState(false)

  const dirtyRef = useRef(false)

  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty])

  // Fetch cover data
  useEffect(() => {
    const fetchCover = async () => {
      try {
        const { data } = await api.get(`/projects/${projectId}/covers`)
        setCoverData(data.project)
        const json = isFront ? data.project.coverJson : data.project.backCoverJson
        if (json) canvasJsonRef.current = json as object
      } catch {
        setError('No se pudo cargar')
      } finally {
        setLoading(false)
      }
    }
    fetchCover()
  }, [projectId, isFront])

  // Save function
  const save = useCallback(async () => {
    if (!projectId || !dirtyRef.current) return
    setSaving(true)
    try {
      const canvasJson = canvasEditorRef.current?.toJSON() ?? canvasJsonRef.current
      const body = isFront ? { coverJson: canvasJson } : { backCoverJson: canvasJson }
      await api.put(`/projects/${projectId}/covers`, body)
      setLastSaved(new Date())
      setDirty(false)
    } catch {
      setError('Error al guardar')
    } finally {
      setSaving(false)
    }
  }, [projectId, isFront])

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
      if (dirtyRef.current && projectId) {
        const canvasJson = canvasEditorRef.current?.toJSON() ?? canvasJsonRef.current
        const body = isFront ? { coverJson: canvasJson } : { backCoverJson: canvasJson }
        api.put(`/projects/${projectId}/covers`, body).catch(() => {})
      }
    }
  }, [projectId, isFront])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error && !coverData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-4">
        <p className="text-neutral-600">{error}</p>
        <Link to={`/projects/${projectId}`} className="text-primary-600 hover:underline">
          Volver al proyecto
        </Link>
      </div>
    )
  }

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
              onClick={() =>
                navigate(`/projects/${projectId}/cover/${isFront ? 'back' : 'front'}`, {
                  replace: true,
                })
              }
              className="text-neutral-400 hover:text-neutral-700 transition-colors"
              title={isFront ? 'Ir a contraportada' : 'Ir a portada'}
            >
              {isFront ? '▶' : '◀'}
            </button>
            <h1 className="text-lg font-bold text-neutral-900">
              {label} — {coverData?.name}
            </h1>
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

      {/* Canvas toolbar */}
      <div className="bg-white border-b border-neutral-200 px-4 py-1.5 flex items-center gap-2 shrink-0">
        <span className="text-xs font-medium text-neutral-500 mr-2">
          {isFront ? '📖 Portada' : '📘 Contraportada'}
        </span>
        <div className="flex-1">
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
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 min-h-0">
        {/* Page area */}
        <div className="flex-1 overflow-auto p-6 bg-neutral-100">
          <div className="mx-auto" style={{ width: PAGE_WIDTH }}>
            <div className="relative shadow-lg" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}>
              <CanvasEditor
                ref={canvasEditorRef}
                width={PAGE_WIDTH}
                height={PAGE_HEIGHT}
                initialJson={canvasJsonRef.current}
                onModified={handleCanvasModified}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 bg-white border-l border-neutral-200 overflow-y-auto p-4 shrink-0">
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
        </div>
      </div>

      {/* Modals */}
      <AssetPickerModal
        isOpen={showAssetPicker}
        onClose={() => {
          setShowAssetPicker(false)
          setBgAssetMode(false)
        }}
        onSelect={handleAssetSelect}
      />

      {showStickerPicker && (
        <StickerPickerModal
          onSelect={(emoji) => {
            handleStickerSelect(emoji)
            setShowStickerPicker(false)
          }}
          onClose={() => setShowStickerPicker(false)}
        />
      )}

      {showBackgroundModal && (
        <BackgroundModal
          editorRef={canvasEditorRef}
          onClose={() => setShowBackgroundModal(false)}
          onPickAsset={() => {
            setBgAssetMode(true)
            setShowAssetPicker(true)
            setShowBackgroundModal(false)
          }}
        />
      )}
    </div>
  )
}
