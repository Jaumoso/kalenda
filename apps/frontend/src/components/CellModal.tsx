import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, CalendarDays, Image, X, Smile, Palette, Cake, Heart, Pin } from 'lucide-react'
import type { DayCell, Holiday, CalEvent } from '../lib/calendarTypes'
import { getMonthNames } from '../lib/calendarTypes'
import ColorPicker from './ColorPicker'
import AssetPickerModal from './AssetPickerModal'
import StickerPickerModal from './StickerPickerModal'
import api from '../lib/api'

interface Props {
  dayNumber: number
  month: number
  year: number
  cell: DayCell | null
  holidays: Holiday[]
  events: CalEvent[]
  saint: string | null
  onSave: (data: {
    bgColor: string | null
    contentJson: {
      text?: string
      emoji?: string
      imageAssetId?: string
      imageFilename?: string
      stickerAssetId?: string
      stickerFilename?: string
      stickerX?: number
      stickerY?: number
      stickerSize?: number
    } | null
  }) => void
  onEventsChanged: () => void
  onClose: () => void
}

export default function CellModal({
  dayNumber,
  month,
  year,
  cell,
  holidays,
  events,
  saint,
  onSave,
  onEventsChanged,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const [bgColor, setBgColor] = useState(cell?.bgColor || '')
  const [text, setText] = useState(cell?.contentJson?.text || '')
  const [emoji, setEmoji] = useState(cell?.contentJson?.emoji || '')
  const [imageAssetId, setImageAssetId] = useState(cell?.contentJson?.imageAssetId || '')
  const [imageFilename, setImageFilename] = useState(cell?.contentJson?.imageFilename || '')
  const [stickerAssetId, setStickerAssetId] = useState(cell?.contentJson?.stickerAssetId || '')
  const [stickerFilename, setStickerFilename] = useState(cell?.contentJson?.stickerFilename || '')
  const [stickerX, setStickerX] = useState(cell?.contentJson?.stickerX ?? 50)
  const [stickerY, setStickerY] = useState(cell?.contentJson?.stickerY ?? 50)
  const [stickerSize, setStickerSize] = useState(cell?.contentJson?.stickerSize ?? 60)
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [newEventName, setNewEventName] = useState('')
  const [newEventType, setNewEventType] = useState<'BIRTHDAY' | 'ANNIVERSARY' | 'CUSTOM'>('CUSTOM')
  const [savingEvent, setSavingEvent] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [showStickerAssetPicker, setShowStickerAssetPicker] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSave = () => {
    const contentJson: {
      text?: string
      emoji?: string
      imageAssetId?: string
      imageFilename?: string
      stickerAssetId?: string
      stickerFilename?: string
      stickerX?: number
      stickerY?: number
      stickerSize?: number
    } = {}
    if (text.trim()) contentJson.text = text.trim()
    if (emoji.trim()) contentJson.emoji = emoji.trim()
    if (imageAssetId) {
      contentJson.imageAssetId = imageAssetId
      contentJson.imageFilename = imageFilename
    }
    if (stickerAssetId) {
      contentJson.stickerAssetId = stickerAssetId
      contentJson.stickerFilename = stickerFilename
      contentJson.stickerX = stickerX
      contentJson.stickerY = stickerY
      contentJson.stickerSize = stickerSize
    }

    onSave({
      bgColor: bgColor || null,
      contentJson: Object.keys(contentJson).length > 0 ? contentJson : null,
    })
  }

  const handleClearBg = () => setBgColor('')

  const handleAddQuickEvent = async () => {
    if (!newEventName.trim()) return
    setSavingEvent(true)
    try {
      await api.post('/events', {
        name: newEventName.trim(),
        day: dayNumber,
        month,
        type: newEventType,
        isRecurring: true,
      })
      setNewEventName('')
      setShowNewEvent(false)
      onEventsChanged()
    } catch {
      // ignore
    } finally {
      setSavingEvent(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      await api.delete(`/events/${id}`)
      onEventsChanged()
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">
          {t('cell.dayTitle', { day: dayNumber, month: getMonthNames()[month - 1], year })}
        </h2>
        {saint && <p className="text-xs text-neutral-400 mb-1">{saint}</p>}
        <hr className="my-3 border-neutral-200" />

        {/* Holidays */}
        {holidays.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-red-600 mb-1">
              <Building2 size={14} className="inline mr-1" />
              {t('cell.holidays')}
            </h3>
            {holidays.map((h) => (
              <div key={h.id} className="text-xs bg-red-50 text-red-700 rounded px-2 py-1 mb-1">
                {h.nameEs}
                {h.scope === 'AUTONOMY' && (
                  <span className="text-red-400 ml-1">({h.autonomyCode})</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Events */}
        {events.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-neutral-700 mb-1">
              <CalendarDays size={14} className="inline mr-1" />
              {t('cell.events')}
            </h3>
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between text-xs rounded px-2 py-1 mb-1"
                style={{ backgroundColor: ev.color + '15' }}
              >
                <span style={{ color: ev.color }}>
                  {ev.icon || '•'} {ev.name}
                  {ev.isRecurring && (
                    <span className="text-neutral-400 ml-1">{t('cell.yearly')}</span>
                  )}
                </span>
                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="text-neutral-400 hover:text-red-500 ml-2"
                  title={t('cell.deleteEvent')}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Quick add event */}
        <div className="mb-4">
          {showNewEvent ? (
            <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
              <input
                type="text"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder={t('cell.eventName')}
                className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                autoFocus
                maxLength={100}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuickEvent()}
              />
              <div className="flex gap-1">
                {[
                  { v: 'BIRTHDAY' as const, l: <Cake size={14} /> },
                  { v: 'ANNIVERSARY' as const, l: <Heart size={14} /> },
                  { v: 'CUSTOM' as const, l: <Pin size={14} /> },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setNewEventType(opt.v)}
                    className={`px-2 py-0.5 text-xs rounded border ${
                      newEventType === opt.v
                        ? 'bg-primary-50 border-primary-300'
                        : 'border-neutral-200'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => setShowNewEvent(false)}
                  className="text-xs text-neutral-500 px-2 py-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddQuickEvent}
                  disabled={savingEvent || !newEventName.trim()}
                  className="text-xs bg-primary-600 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  {savingEvent ? '...' : t('common.add')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewEvent(true)}
              className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
            >
              {t('cell.addEventForDay')}
            </button>
          )}
        </div>

        <hr className="my-3 border-neutral-200" />

        {/* Cell image */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">
            <Image size={14} className="inline mr-1" />
            {t('cell.cellImage')}
          </h3>
          {imageFilename ? (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
                <img
                  src={`/uploads/${imageFilename}`}
                  alt="Imagen de celda"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => {
                  setImageAssetId('')
                  setImageFilename('')
                }}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                <X size={12} className="inline mr-1" />
                {t('cell.removeImage')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowImagePicker(true)}
              className="w-full px-3 py-2 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              {t('cell.selectFromLibrary')}
            </button>
          )}
        </div>

        {/* Sticker / Emoji */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">{t('cell.stickerEmoji')}</h3>
          <div className="flex items-center gap-2">
            {/* Emoji display */}
            {emoji && (
              <div className="flex items-center gap-1 px-2 py-1 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-2xl">{emoji}</span>
                <button
                  onClick={() => setEmoji('')}
                  className="text-xs text-neutral-400 hover:text-red-500 ml-1"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {/* Sticker asset display */}
            {stickerFilename && (
              <div className="flex items-center gap-1 px-2 py-1 bg-neutral-50 rounded-lg border border-neutral-200">
                <img
                  src={`/uploads/${stickerFilename}`}
                  alt="Sticker"
                  className="w-8 h-8 object-contain"
                />
                <button
                  onClick={() => {
                    setStickerAssetId('')
                    setStickerFilename('')
                  }}
                  className="text-xs text-neutral-400 hover:text-red-500 ml-1"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <button
              onClick={() => setShowStickerPicker(true)}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
            >
              <Smile size={14} className="inline mr-1" />
              {t('cell.emojiButton')}
            </button>
            <button
              onClick={() => setShowStickerAssetPicker(true)}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
            >
              <Palette size={14} className="inline mr-1" />
              {t('cell.stickerButton')}
            </button>
          </div>

          {/* Sticker position/size controls with live preview */}
          {stickerFilename && (
            <div className="mt-3 bg-neutral-50 rounded-lg p-3 space-y-3">
              {/* Live preview box */}
              <div
                className="relative w-full aspect-square border border-neutral-300 rounded bg-white overflow-hidden"
                style={{ maxHeight: 120 }}
              >
                <img
                  src={`/uploads/${stickerFilename}`}
                  alt=""
                  className="absolute object-contain pointer-events-none"
                  style={{
                    left: `${stickerX}%`,
                    top: `${stickerY}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${stickerSize}%`,
                    height: `${stickerSize}%`,
                  }}
                />
                {/* crosshair guides */}
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className="absolute top-0 bottom-0 w-px bg-primary-300/40"
                    style={{ left: `${stickerX}%` }}
                  />
                  <div
                    className="absolute left-0 right-0 h-px bg-primary-300/40"
                    style={{ top: `${stickerY}%` }}
                  />
                </div>
              </div>

              {/* Sliders */}
              <div>
                <div className="flex justify-between text-xs text-neutral-500 mb-0.5">
                  <span>{t('cell.stickerPosX')}</span>
                  <span className="tabular-nums">{stickerX}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={stickerX}
                  onChange={(e) => setStickerX(Number(e.target.value))}
                  className="w-full h-1.5 accent-primary-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-500 mb-0.5">
                  <span>{t('cell.stickerPosY')}</span>
                  <span className="tabular-nums">{stickerY}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={stickerY}
                  onChange={(e) => setStickerY(Number(e.target.value))}
                  className="w-full h-1.5 accent-primary-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-500 mb-0.5">
                  <span>{t('cell.stickerSizeLabel')}</span>
                  <span className="tabular-nums">{stickerSize}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={stickerSize}
                  onChange={(e) => setStickerSize(Number(e.target.value))}
                  className="w-full h-1.5 accent-primary-600"
                />
              </div>
            </div>
          )}
        </div>

        <hr className="my-3 border-neutral-200" />

        {/* Background color */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">{t('cell.bgColor')}</h3>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <ColorPicker color={bgColor || '#FFFFFF'} onChange={setBgColor} />
            </div>
            <button
              onClick={handleClearBg}
              className="text-xs text-neutral-500 hover:text-red-500 px-2 py-1 border border-neutral-300 rounded transition-colors"
            >
              {t('cell.clear')}
            </button>
          </div>
        </div>

        {/* Text */}
        <div className="mb-6">
          <label className="text-sm font-medium text-neutral-700 block mb-1">
            {t('cell.text')}
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('cell.textPlaceholder')}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            maxLength={60}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-300 rounded-md transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            {t('common.save')}
          </button>
        </div>
      </div>

      {/* Asset pickers */}
      <AssetPickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(asset) => {
          setImageAssetId(asset.id)
          setImageFilename(asset.filename)
          setShowImagePicker(false)
        }}
        assetType="IMAGE"
        title={t('cell.selectImageTitle')}
      />
      <AssetPickerModal
        isOpen={showStickerAssetPicker}
        onClose={() => setShowStickerAssetPicker(false)}
        onSelect={(asset) => {
          setStickerAssetId(asset.id)
          setStickerFilename(asset.filename)
          setShowStickerAssetPicker(false)
        }}
        assetType="STICKER"
        title={t('cell.selectStickerTitle')}
      />
      <StickerPickerModal
        isOpen={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelect={(em) => {
          setEmoji(em)
          setShowStickerPicker(false)
        }}
      />
    </div>
  )
}
