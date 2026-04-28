import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Folder, X, Image, ArrowUpLeft, Pencil } from 'lucide-react'
import api from '../lib/api'

interface Asset {
  id: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  thumbPath: string | null
  folderId: string | null
  createdAt: string
}

interface Folder {
  id: string
  name: string
  parentId: string | null
  _count: { assets: number; children: number }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function LibraryPage() {
  const { t } = useTranslation()
  const [assets, setAssets] = useState<Asset[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameFolderName, setRenameFolderName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFolders = useCallback(async () => {
    try {
      const { data } = await api.get('/folders')
      setFolders(data.folders)
    } catch {
      // silent
    }
  }, [])

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (currentFolderId) {
        params.folderId = currentFolderId
      } else {
        params.folderId = 'null'
      }
      if (search) params.search = search
      const { data } = await api.get('/assets', { params })
      setAssets(data.assets)
    } catch {
      setError(t('library.errorLoading'))
    } finally {
      setLoading(false)
    }
  }, [currentFolderId, search])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const uploadFiles = async (files: FileList | File[]) => {
    if (files.length === 0) return
    setUploading(true)
    setUploadProgress(0)
    setError(null)

    const formData = new FormData()
    if (currentFolderId) {
      formData.append('folderId', currentFolderId)
    }
    for (const file of Array.from(files)) {
      formData.append('files', file)
    }

    try {
      await api.post('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      fetchAssets()
      fetchFolders()
    } catch {
      setError(t('library.errorUploading'))
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    // Only handle file uploads here; internal drags are handled by folder drop targets
    if (e.dataTransfer.types.includes('application/x-kalenda-type')) return
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('library.deleteFile'))) return
    try {
      await api.delete(`/assets/${id}`)
      setAssets((prev) => prev.filter((a) => a.id !== id))
    } catch {
      setError(t('library.errorDeleting'))
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await api.post('/folders', {
        name: newFolderName.trim(),
        parentId: currentFolderId,
      })
      setNewFolderName('')
      setShowNewFolder(false)
      fetchFolders()
    } catch {
      setError(t('library.errorCreatingFolder'))
    }
  }

  const handleRenameFolder = async (id: string) => {
    const trimmed = renameFolderName.trim()
    if (!trimmed) return
    try {
      await api.patch(`/folders/${id}`, { name: trimmed })
      setRenamingFolderId(null)
      setRenameFolderName('')
      fetchFolders()
    } catch {
      setError(t('library.errorRenamingFolder'))
    }
  }

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(t('library.deleteFolder', { name }))) return
    try {
      await api.delete(`/folders/${id}`)
      if (currentFolderId === id) setCurrentFolderId(null)
      fetchFolders()
      fetchAssets()
    } catch {
      setError(t('library.errorDeletingFolder'))
    }
  }

  // --- Drag & drop to move assets/folders ---
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const DROP_ROOT = '__root__'
  const DROP_PARENT = '__parent__'

  const handleItemDragStart = (e: React.DragEvent, type: 'asset' | 'folder', id: string) => {
    e.dataTransfer.setData('application/x-kalenda-type', type)
    e.dataTransfer.setData('application/x-kalenda-id', id)
    e.dataTransfer.effectAllowed = 'move'
    setDragging(true)
  }

  const handleDragEnd = () => {
    setDragging(false)
    setDropTargetFolderId(null)
  }

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    // Only accept internal drags (not file uploads)
    if (e.dataTransfer.types.includes('application/x-kalenda-type')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDropTargetFolderId(folderId)
    }
  }

  const handleFolderDragLeave = () => {
    setDropTargetFolderId(null)
  }

  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    setDropTargetFolderId(null)
    setDragging(false)

    const type = e.dataTransfer.getData('application/x-kalenda-type')
    const id = e.dataTransfer.getData('application/x-kalenda-id')
    if (!type || !id) return

    // Resolve parent folder: go up one level from currentFolderId
    let resolvedTarget = targetFolderId
    if (targetFolderId === DROP_PARENT) {
      const currentFolder = folders.find((f) => f.id === currentFolderId)
      resolvedTarget = currentFolder?.parentId ?? null
    }

    // Prevent dropping a folder into itself
    if (type === 'folder' && id === resolvedTarget) return

    try {
      if (type === 'asset') {
        await api.patch(`/assets/${id}`, { folderId: resolvedTarget })
      } else if (type === 'folder') {
        await api.patch(`/folders/${id}`, { parentId: resolvedTarget })
      }
      fetchAssets()
      fetchFolders()
    } catch {
      setError(t('library.errorMoving'))
    }
  }

  // Build breadcrumb path
  const getBreadcrumb = (): Folder[] => {
    const path: Folder[] = []
    let id = currentFolderId
    while (id) {
      const folder = folders.find((f) => f.id === id)
      if (!folder) break
      path.unshift(folder)
      id = folder.parentId
    }
    return path
  }

  const currentSubfolders = folders.filter((f) => f.parentId === currentFolderId)
  const breadcrumb = getBreadcrumb()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{t('library.title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-md hover:bg-neutral-100 transition-colors"
          >
            {t('library.newFolder')}
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary">
            {t('library.uploadFiles')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            {t('common.close')}
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm mb-4">
        <button
          onClick={() => setCurrentFolderId(null)}
          onDragOver={(e) => handleFolderDragOver(e, DROP_ROOT)}
          onDragLeave={handleFolderDragLeave}
          onDrop={(e) => handleFolderDrop(e, null)}
          className={`hover:text-primary-600 transition-colors px-1 rounded ${
            dropTargetFolderId === DROP_ROOT ? 'bg-primary-100 ring-2 ring-primary-400' : ''
          } ${!currentFolderId ? 'font-semibold text-neutral-900' : 'text-neutral-500'}`}
        >
          {t('library.root')}
        </button>
        {breadcrumb.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            <span className="text-neutral-300">/</span>
            <button
              onClick={() => setCurrentFolderId(f.id)}
              onDragOver={(e) => handleFolderDragOver(e, f.id)}
              onDragLeave={handleFolderDragLeave}
              onDrop={(e) => handleFolderDrop(e, f.id)}
              className={`hover:text-primary-600 transition-colors px-1 rounded ${
                dropTargetFolderId === f.id ? 'bg-primary-100 ring-2 ring-primary-400' : ''
              } ${currentFolderId === f.id ? 'font-semibold text-neutral-900' : 'text-neutral-500'}`}
            >
              {f.name}
            </button>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('library.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      {/* New folder dialog */}
      {showNewFolder && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder={t('library.folderName')}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            autoFocus
          />
          <button onClick={handleCreateFolder} className="text-sm text-primary-600 hover:underline">
            {t('common.create')}
          </button>
          <button
            onClick={() => {
              setShowNewFolder(false)
              setNewFolderName('')
            }}
            className="text-sm text-neutral-500 hover:underline"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-sm text-neutral-600">{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Drop zone + content */}
      <div
        className={`min-h-[400px] rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver ? 'border-primary-400 bg-primary-50' : 'border-transparent'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          // Only show upload overlay for external file drops
          if (!e.dataTransfer.types.includes('application/x-kalenda-type')) {
            setDragOver(true)
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Move to parent drop bar (visible while dragging inside a folder) */}
        {currentFolderId && dragging && (
          <div
            onDragOver={(e) => handleFolderDragOver(e, DROP_PARENT)}
            onDragLeave={handleFolderDragLeave}
            onDrop={(e) => handleFolderDrop(e, DROP_PARENT)}
            className={`mb-4 flex items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium transition-colors ${
              dropTargetFolderId === DROP_PARENT
                ? 'border-primary-400 bg-primary-50 text-primary-700'
                : 'border-neutral-300 text-neutral-500'
            }`}
          >
            <ArrowUpLeft size={18} />
            {t('library.moveToParent')}
          </div>
        )}

        {/* Subfolders */}
        {currentSubfolders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-neutral-500 mb-2">{t('library.folders')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {currentSubfolders.map((folder) => (
                <div
                  key={folder.id}
                  draggable
                  onDragStart={(e) => handleItemDragStart(e, 'folder', folder.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                  onDragLeave={handleFolderDragLeave}
                  onDrop={(e) => handleFolderDrop(e, folder.id)}
                  className={`group bg-surface border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer relative ${
                    dropTargetFolderId === folder.id
                      ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-400'
                      : 'border-neutral-200'
                  }`}
                  onClick={() => {
                    if (renamingFolderId !== folder.id) setCurrentFolderId(folder.id)
                  }}
                >
                  <div className="text-2xl mb-1">
                    <Folder size={20} />
                  </div>
                  {renamingFolderId === folder.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleRenameFolder(folder.id)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    >
                      <input
                        type="text"
                        value={renameFolderName}
                        onChange={(e) => setRenameFolderName(e.target.value)}
                        onBlur={() => handleRenameFolder(folder.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setRenamingFolderId(null)
                            setRenameFolderName('')
                          }
                        }}
                        className="w-full px-1 py-0.5 text-sm border border-primary-400 rounded outline-none focus:ring-1 focus:ring-primary-500"
                        autoFocus
                      />
                    </form>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-neutral-800 truncate">{folder.name}</p>
                      <p className="text-xs text-neutral-400">
                        {folder._count.assets === 1
                          ? t('library.fileCount_one', { count: folder._count.assets })
                          : t('library.fileCount_other', { count: folder._count.assets })}
                      </p>
                    </>
                  )}
                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setRenamingFolderId(folder.id)
                        setRenameFolderName(folder.name)
                      }}
                      className="text-neutral-300 hover:text-primary-500 text-xs p-1"
                      title={t('library.renameFolder')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFolder(folder.id, folder.name)
                      }}
                      className="text-neutral-300 hover:text-red-500 text-xs p-1"
                      title={t('library.deleteThisFolder')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assets grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-neutral-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : assets.length === 0 && currentSubfolders.length === 0 ? (
          <div className="text-center py-16">
            <Image size={48} className="text-neutral-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-neutral-700 mb-2">
              {search ? t('library.noResults') : t('library.noFiles')}
            </h2>
            <p className="text-neutral-500 mb-4">
              {search ? t('library.noResultsHint') : t('library.noFilesHint')}
            </p>
          </div>
        ) : (
          <>
            {assets.length > 0 && (
              <>
                <h2 className="text-sm font-medium text-neutral-500 mb-2">
                  {t('library.files', { count: assets.length })}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={(e) => handleItemDragStart(e, 'asset', asset.id)}
                      onDragEnd={handleDragEnd}
                      className="group bg-surface border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative cursor-grab active:cursor-grabbing"
                    >
                      <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                        {asset.thumbPath ? (
                          <img
                            src={`/uploads/${asset.thumbPath}`}
                            alt={asset.originalName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <img
                            src={`/uploads/${asset.filename}`}
                            alt={asset.originalName}
                            className="w-full h-full object-contain p-2"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-neutral-700 truncate" title={asset.originalName}>
                          {asset.originalName}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {formatSize(asset.sizeBytes)}
                          {asset.width && asset.height && ` · ${asset.width}×${asset.height}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('common.delete')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {dragOver && (
          <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
            <div className="bg-primary-600/90 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-2xl">
              {t('library.dropToUpload')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
