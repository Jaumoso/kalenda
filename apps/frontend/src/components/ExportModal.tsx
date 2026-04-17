import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FileDown, FileText, Image, Loader2, RefreshCw, CheckCircle2, Download, XCircle } from 'lucide-react'
import api from '../lib/api'

interface ExportJob {
  id: string
  format: 'PDF' | 'PNG'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  totalPages: number
  currentPage: number
  filename: string | null
  fileSize: number | null
  error: string | null
}

interface Props {
  readonly projectId: string
  readonly projectName: string
  readonly projectYear: number
  readonly onClose: () => void
}

export default function ExportModal({ projectId, projectName, projectYear, onClose }: Props) {
  const { t } = useTranslation()
  const [format, setFormat] = useState<'PDF' | 'PNG'>('PDF')
  const [dpi, setDpi] = useState(300)
  const [bindingGuide, setBindingGuide] = useState(false)
  const [filename, setFilename] = useState(`${projectName}-${projectYear}`)
  const [job, setJob] = useState<ExportJob | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll job status
  useEffect(() => {
    if (!job || job.status === 'COMPLETED' || job.status === 'FAILED') {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/exports/${job.id}`)
        setJob(data.job)
      } catch {
        // ignore polling errors
      }
    }, 2000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [job?.id, job?.status])

  const handleStart = async () => {
    setStarting(true)
    setError(null)

    try {
      const { data } = await api.post('/exports', {
        projectId,
        format,
        dpi,
        bindingGuide,
        filename: filename.trim() || `${projectName}-${projectYear}`,
      })
      setJob(data.job)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(msg || t('exportModal.errorStarting'))
    } finally {
      setStarting(false)
    }
  }

  const handleDownload = () => {
    if (!job) return
    // Open download URL in new tab
    window.open(`/api/exports/${job.id}/download`, '_blank')
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isRunning = job && (job.status === 'PENDING' || job.status === 'PROCESSING')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900"><FileDown size={18} className="inline mr-2" />{t('exportModal.title')}</h2>
          <button
            onClick={onClose}
            disabled={!!isRunning}
            className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
          >
            <XCircle size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* If no job started yet, show options */}
          {!job && (
            <>
              {/* Format */}
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">
                  {t('exportModal.format')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormat('PDF')}
                    className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                      format === 'PDF'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <FileText size={16} className="inline mr-1" />{t('exportModal.pdfLabel')}
                    <br />
                    <span className="text-xs font-normal opacity-70">
                      {t('exportModal.pdfDesc')}
                    </span>
                  </button>
                  <button
                    onClick={() => setFormat('PNG')}
                    className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                      format === 'PNG'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <Image size={16} className="inline mr-1" />{t('exportModal.pngLabel')}
                    <br />
                    <span className="text-xs font-normal opacity-70">
                      {t('exportModal.pngDesc')}
                    </span>
                  </button>
                </div>
              </div>

              {/* DPI */}
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">
                  {t('exportModal.quality')}
                </p>
                <div className="flex gap-2">
                  {[150, 300, 600].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDpi(d)}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        dpi === d
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {d} DPI
                      {d === 150 && (
                        <span className="block text-[10px] opacity-70">
                          {t('exportModal.dpiDraft')}
                        </span>
                      )}
                      {d === 300 && (
                        <span className="block text-[10px] opacity-70">
                          {t('exportModal.dpiPrint')}
                        </span>
                      )}
                      {d === 600 && (
                        <span className="block text-[10px] opacity-70">
                          {t('exportModal.dpiHigh')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Binding guide */}
              {format === 'PDF' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bindingGuide}
                    onChange={(e) => setBindingGuide(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">{t('exportModal.bindingGuide')}</span>
                </label>
              )}

              {/* Filename */}
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-1">
                  {t('exportModal.filename')}
                </p>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="flex-1 text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder={t('exportModal.filenamePlaceholder')}
                  />
                  <span className="text-sm text-neutral-400">
                    .{format === 'PDF' ? 'pdf' : 'zip'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>
              )}
            </>
          )}

          {/* Job progress */}
          {job && (
            <div className="space-y-4">
              {/* Status */}
              <div className="text-center">
                {job.status === 'PENDING' && (
                  <p className="text-neutral-600"><Loader2 size={16} className="animate-spin inline mr-1" />{t('exportModal.preparing')}</p>
                )}
                {job.status === 'PROCESSING' && (
                  <>
                    <p className="text-neutral-600 mb-2">
                      <RefreshCw size={16} className="animate-spin inline mr-1" />{t('exportModal.rendering', {
                        current: job.currentPage,
                        total: job.totalPages,
                      })}
                    </p>
                    <div className="w-full bg-neutral-200 rounded-full h-3">
                      <div
                        className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">{job.progress}%</p>
                  </>
                )}
                {job.status === 'COMPLETED' && (
                  <div className="space-y-3">
                    <p className="text-green-600 font-medium"><CheckCircle2 size={16} className="inline mr-1 text-green-600" />{t('exportModal.completed')}</p>
                    {!!job.fileSize && (
                      <p className="text-xs text-neutral-400">
                        Size: {formatFileSize(job.fileSize)}
                      </p>
                    )}
                    <button onClick={handleDownload} className="btn btn-primary w-full">
                      <Download size={16} className="inline mr-1" />{job.format === 'PDF'
                        ? t('exportModal.downloadPdf')
                        : t('exportModal.downloadZip')}
                    </button>
                  </div>
                )}
                {job.status === 'FAILED' && (
                  <div className="space-y-2">
                    <p className="text-red-600 font-medium"><XCircle size={16} className="inline mr-1 text-red-600" />{t('exportModal.exportError')}</p>
                    <p className="text-xs text-red-500">{job.error}</p>
                    <button onClick={() => setJob(null)} className="btn btn-secondary text-sm">
                      {t('common.retry')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-neutral-200 bg-neutral-50">
          {!job && (
            <>
              <button onClick={onClose} className="btn btn-secondary text-sm">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleStart}
                disabled={starting}
                className="btn btn-primary text-sm disabled:opacity-50"
              >
                {starting ? t('exportModal.starting') : t('exportModal.exportFormat', { format })}
              </button>
            </>
          )}
          {job && (job.status === 'COMPLETED' || job.status === 'FAILED') && (
            <button onClick={onClose} className="btn btn-secondary text-sm">
              {t('common.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
