import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'stickerPicker.favorites',
    emojis: [
      '❤️',
      '⭐',
      '🎉',
      '🎂',
      '🎁',
      '🌸',
      '☀️',
      '🌙',
      '❄️',
      '🔥',
      '💫',
      '🎵',
      '📌',
      '✨',
      '💕',
      '🎀',
    ],
  },
  {
    name: 'stickerPicker.faces',
    emojis: ['😀', '😊', '😍', '🥰', '😎', '🤩', '😇', '🥳', '😘', '☺️', '🤗', '😄'],
  },
  {
    name: 'stickerPicker.animals',
    emojis: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸'],
  },
  {
    name: 'stickerPicker.nature',
    emojis: ['🌺', '🌻', '🌷', '🌹', '🌼', '🍀', '🌿', '🍂', '🍁', '🌴', '🌳', '🌵'],
  },
  {
    name: 'stickerPicker.food',
    emojis: ['🍎', '🍕', '🍰', '🎂', '☕', '🍷', '🍓', '🍒', '🍑', '🥂', '🧁', '🍫'],
  },
  {
    name: 'stickerPicker.objects',
    emojis: ['🎈', '🎁', '🎀', '🎊', '🏆', '🎯', '📸', '🎨', '✏️', '📅', '🔔', '💌'],
  },
  {
    name: 'stickerPicker.travel',
    emojis: ['✈️', '🚗', '⛵', '🏖️', '🗼', '🏰', '⛰️', '🌍', '🗺️', '🧳', '🏕️', '🎢'],
  },
  {
    name: 'stickerPicker.symbols',
    emojis: ['❤️', '💛', '💚', '💙', '💜', '🤍', '🖤', '🤎', '💗', '💝', '♻️', '☮️'],
  },
]

interface StickerPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
}

export default function StickerPickerModal({ isOpen, onClose, onSelect }: StickerPickerModalProps) {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState(0)
  const [search, setSearch] = useState('')

  if (!isOpen) return null

  const filteredEmojis = search
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : EMOJI_CATEGORIES[activeCategory].emojis

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl w-96 max-h-[60vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">{t('stickerPicker.title')}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-xl">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <input
            type="text"
            placeholder={t('stickerPicker.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-neutral-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="px-4 flex gap-1 flex-wrap pb-2">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  i === activeCategory
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                {t(cat.name)}
              </button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                onClick={() => {
                  onSelect(emoji)
                  onClose()
                }}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-neutral-100 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
