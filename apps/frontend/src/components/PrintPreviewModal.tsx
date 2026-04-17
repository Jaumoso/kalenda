import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronLeft, ChevronRight, Book, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { PAGE_WIDTH, PAGE_HEIGHT } from '../lib/calendarTypes'

interface CalendarMonth {
  id: string
  month: number
  year: number
  isCustomized: boolean
}

interface Props {
  readonly projectId: string
  readonly projectName: string
  readonly projectYear: number
  readonly months: CalendarMonth[]
  readonly onClose: () => void
}

interface PageInfo {
  label: string
  renderUrl: string
}

interface TokenData {
  monthTokens: { monthId: string; month: number; token: string }[]
  coverToken: string
}

function buildPages(
  data: TokenData,
  projectId: string,
  months: CalendarMonth[],
  monthNames: string[],
  t: (key: string) => string
): PageInfo[] {
  const sorted = months.slice().sort((a, b) => a.month - b.month)
  return [
    {
      label: t('project.frontCover'),
      renderUrl: `/render-cover/${projectId}?token=${encodeURIComponent(data.coverToken)}&type=front`,
    },
    ...sorted.map((m) => {
      const tok = data.monthTokens.find((mt) => mt.monthId === m.id)
      return {
        label: `${monthNames[m.month - 1]} ${m.year}`,
        renderUrl: `/render/${m.id}?token=${encodeURIComponent(tok?.token ?? '')}`,
      }
    }),
    {
      label: t('project.backCover'),
      renderUrl: `/render-cover/${projectId}?token=${encodeURIComponent(data.coverToken)}&type=back`,
    },
  ]
}

export default function PrintPreviewModal({
  projectId,
  projectName,
  projectYear,
  months,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const monthNames = t('months', { returnObjects: true }) as string[]

  const [pages, setPages] = useState<PageInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [iframeLoaded, setIframeLoaded] = useState<Set<number>>(new Set())

  // Fetch render tokens on mount
  useEffect(() => {
    api
      .get(`/preview-tokens/${projectId}`)
      .then(({ data }) => {
        setPages(buildPages(data, projectId, months, monthNames, t))
        setLoading(false)
      })
      .catch(() => {
        setError(t('printPreview.errorLoading'))
        setLoading(false)
      })
  }, [projectId])

  const page = pages[currentPage]
  const [paperScale, setPaperScale] = useState(0.5)

  const recalcScale = useCallback(() => {
    // Modal is max-h-[90vh], header ~60px, nav ~56px, padding ~32px, label ~32px = ~180px chrome
    const availH = window.innerHeight * 0.9 - 180
    const availW = Math.min(window.innerWidth - 64, 768 - 48) // modal max-w-3xl minus padding
    const scaleW = availW / PAGE_WIDTH
    const scaleH = availH / PAGE_HEIGHT
    setPaperScale(Math.min(scaleW, scaleH, 1))
  }, [])

  useEffect(() => {
    recalcScale()
    window.addEventListener('resize', recalcScale)
    return () => window.removeEventListener('resize', recalcScale)
  }, [recalcScale, loading])

  const goPrev = () => {
    setCurrentPage((p) => Math.max(0, p - 1))
  }
  const goNext = () => {
    setCurrentPage((p) => Math.min(pages.length - 1, p + 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <Book size={20} className="text-neutral-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">{t('printPreview.title')}</h2>
              <p className="text-sm text-neutral-400">
                {projectName} — {projectYear}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Page view — limit height so paper + label + padding all fit */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 overflow-hidden bg-neutral-900/50 min-h-0">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-neutral-400">
              <Loader2 size={32} className="animate-spin" />
              <span className="text-sm">{t('printPreview.loading')}</span>
            </div>
          )}

          {!loading && error && <div className="text-red-400 text-sm">{error}</div>}

          {!loading && !error && page && (
            <>
              {/* Paper simulation — iframe at real size, CSS-scaled to fit container */}
              <div
                className="relative bg-white shadow-[0_4px_40px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden flex-shrink-0"
                style={{
                  width: PAGE_WIDTH * paperScale,
                  height: PAGE_HEIGHT * paperScale,
                }}
              >
                {/* Loading spinner overlay */}
                {!iframeLoaded.has(currentPage) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <Loader2 size={24} className="animate-spin text-neutral-300" />
                  </div>
                )}
                <iframe
                  key={currentPage}
                  src={page.renderUrl}
                  title={page.label}
                  className="border-0 absolute top-0 left-0"
                  style={{
                    width: PAGE_WIDTH,
                    height: PAGE_HEIGHT,
                    transform: `scale(${paperScale})`,
                    transformOrigin: 'top left',
                  }}
                  onLoad={() => setIframeLoaded((prev) => new Set(prev).add(currentPage))}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>

              {/* Page label */}
              <p className="mt-4 text-sm text-neutral-300 font-medium">{page.label}</p>
            </>
          )}
        </div>

        {/* Navigation */}
        {pages.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-700">
            <button
              onClick={goPrev}
              disabled={currentPage === 0}
              className="flex items-center gap-1 text-sm text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              {t('printPreview.prev')}
            </button>

            {/* Page indicators */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">
                {currentPage + 1} / {pages.length}
              </span>
              <div className="hidden sm:flex items-center gap-1 ml-3">
                {pages.map((pg, i) => (
                  <button
                    key={pg.renderUrl}
                    onClick={() => setCurrentPage(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentPage ? 'bg-primary-400' : 'bg-neutral-600 hover:bg-neutral-400'
                    }`}
                    title={pg.label}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={goNext}
              disabled={currentPage === pages.length - 1}
              className="flex items-center gap-1 text-sm text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t('printPreview.next')}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
