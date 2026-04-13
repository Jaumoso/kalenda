import { useState, useEffect, useCallback, useRef } from 'react'
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
      setError('Error loading assets')
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
    for (const file of Array.from(files)) {
      formData.append('files', file)
    }
    if (currentFolderId) {
      formData.append('folderId', currentFolderId)
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
      setError('Error uploading files')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return
    try {
      await api.delete(`/assets/${id}`)
      setAssets((prev) => prev.filter((a) => a.id !== id))
    } catch {
      setError('Error deleting')
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
      setError('Error creating folder')
    }
  }

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`Delete folder "${name}"? Files will be moved to root.`)) return
    try {
      await api.delete(`/folders/${id}`)
      if (currentFolderId === id) setCurrentFolderId(null)
      fetchFolders()
      fetchAssets()
    } catch {
      setError('Error deleting folder')
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
        <h1 className="text-2xl font-bold text-neutral-900">Library</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-md hover:bg-neutral-100 transition-colors"
          >
            New folder
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary">
            Upload files
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
            Close
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm mb-4">
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`hover:text-primary-600 transition-colors ${!currentFolderId ? 'font-semibold text-neutral-900' : 'text-neutral-500'}`}
        >
          Root
        </button>
        {breadcrumb.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            <span className="text-neutral-300">/</span>
            <button
              onClick={() => setCurrentFolderId(f.id)}
              className={`hover:text-primary-600 transition-colors ${currentFolderId === f.id ? 'font-semibold text-neutral-900' : 'text-neutral-500'}`}
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
          placeholder="Search by name..."
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
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            autoFocus
          />
          <button onClick={handleCreateFolder} className="text-sm text-primary-600 hover:underline">
            Create
          </button>
          <button
            onClick={() => {
              setShowNewFolder(false)
              setNewFolderName('')
            }}
            className="text-sm text-neutral-500 hover:underline"
          >
            Cancel
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
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Subfolders */}
        {currentSubfolders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-neutral-500 mb-2">Folders</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {currentSubfolders.map((folder) => (
                <div
                  key={folder.id}
                  className="group bg-white border border-neutral-200 rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer relative"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <div className="text-2xl mb-1">📁</div>
                  <p className="text-sm font-medium text-neutral-800 truncate">{folder.name}</p>
                  <p className="text-xs text-neutral-400">
                    {folder._count.assets} file{folder._count.assets !== 1 && 's'}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFolder(folder.id, folder.name)
                    }}
                    className="absolute top-1 right-1 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs p-1"
                    title="Delete folder"
                  >
                    ✕
                  </button>
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
            <div className="text-5xl mb-4">🖼️</div>
            <h2 className="text-lg font-semibold text-neutral-700 mb-2">
              {search ? 'No results' : 'No files here'}
            </h2>
            <p className="text-neutral-500 mb-4">
              {search
                ? 'Try a different search term.'
                : 'Drag images here or use the "Upload files" button.'}
            </p>
          </div>
        ) : (
          <>
            {assets.length > 0 && (
              <>
                <h2 className="text-sm font-medium text-neutral-500 mb-2">
                  Files ({assets.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative"
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
                        title="Delete"
                      >
                        ✕
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
              Drop files to upload
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
