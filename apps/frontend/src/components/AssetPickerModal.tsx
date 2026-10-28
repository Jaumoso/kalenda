import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Folder, Upload } from 'lucide-react'
import api from '../lib/api'

interface Asset {
  id: string
  filename: string
  originalName: string
  mimeType: string
  thumbPath: string | null
  type: string
}

interface AssetFolder {
  id: string
  name: string
  parentId: string | null
}

interface AssetPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (asset: Asset) => void
  assetType?: 'IMAGE' | 'STICKER'
  title?: string
}

export default function AssetPickerModal({
  isOpen,
  onClose,
  onSelect,
  assetType = 'IMAGE',
  title,
}: AssetPickerModalProps) {
  const { t } = useTranslation()
  const [assets, setAssets] = useState<Asset[]>([])
  const [folders, setFolders] = useState<AssetFolder[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { type: assetType }
      if (currentFolder) params.folderId = currentFolder
      if (search) params.search = search
      const { data } = await api.get('/assets', { params })
      setAssets(data.assets)
      setFolders(data.folders || [])
      setError(null)
    } catch {
      setError(t('assetPicker.errorLoading'))
    } finally {
      setLoading(false)
    }
  }, [assetType, currentFolder, search, t])

  useEffect(() => {
    if (isOpen) fetchAssets()
  }, [isOpen, fetchAssets])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('files', file)
    if (currentFolder) formData.append('folderId', currentFolder)

    try {
      const { data } = await api.post('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploadedAsset = data.assets?.[0] as Asset | undefined
      if (!uploadedAsset) {
        throw new Error('Upload response did not contain an asset')
      }
      onSelect(uploadedAsset)
    } catch {
      setError(t('assetPicker.errorUploading'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl w-[700px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">
            {title ||
              (assetType === 'STICKER'
                ? t('assetPicker.selectSticker')
                : t('assetPicker.selectImage'))}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-xl">
            <X size={18} />
          </button>
        </div>

        {/* Search & folders */}
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center gap-3">
          <input
            type="text"
            placeholder={t('assetPicker.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-neutral-200 rounded-md px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          {assetType === 'IMAGE' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUpload(file)
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload size={15} />
                {uploading ? t('assetPicker.uploading') : t('assetPicker.upload')}
              </button>
            </>
          )}
          {currentFolder && (
            <button
              onClick={() => setCurrentFolder(null)}
              className="text-xs text-primary-600 hover:underline"
            >
              {t('assetPicker.allFolders')}
            </button>
          )}
        </div>

        {/* Folders row */}
        {!currentFolder && folders.length > 0 && (
          <div className="px-5 py-2 flex gap-2 flex-wrap border-b border-neutral-100">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setCurrentFolder(f.id)}
                className="px-3 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-700 transition-colors"
              >
                <Folder size={14} className="inline mr-1" />
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* Assets grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-sm">
              {error ? (
                <div className="space-y-2 text-red-600">
                  <p>{error}</p>
                  <button onClick={fetchAssets} className="text-primary-600 hover:underline">
                    {t('assetPicker.retry')}
                  </button>
                </div>
              ) : (
                t('assetPicker.noImages')
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => onSelect(asset)}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-500 transition-colors bg-neutral-100"
                >
                  <img
                    src={
                      asset.thumbPath
                        ? `/uploads/thumbs/${asset.thumbPath.split('/').pop()}`
                        : `/uploads/${asset.filename}`
                    }
                    alt={asset.originalName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.originalName}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
