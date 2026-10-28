import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { useThemeStore } from '../stores/themeStore'

interface StickerPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
}

export default function StickerPickerModal({ isOpen, onClose, onSelect }: StickerPickerModalProps) {
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)
  const colorScheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t('stickerPicker.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xl"
          >
            <X size={18} />
          </button>
        </div>
        <EmojiPicker
          onEmojiClick={(emojiData) => {
            onSelect(emojiData.emoji)
            onClose()
          }}
          width={352}
          height={420}
          lazyLoadEmojis
          colorScheme={colorScheme}
          previewConfig={{ showPreview: false }}
          searchLabel={t('stickerPicker.searchLabel')}
          labels={{
            searchPlaceholder: t('stickerPicker.search'),
            searchLabel: t('stickerPicker.searchLabel'),
            searchClear: t('stickerPicker.searchClear'),
            searchResultsNone: t('stickerPicker.searchResultsNone'),
            searchResultsOne: t('stickerPicker.searchResultsOne'),
            searchResultsMany: t('stickerPicker.searchResultsMany'),
            categoryNavigation: t('stickerPicker.categoryNavigation'),
            reactions: t('stickerPicker.reactions'),
            expandReactions: t('stickerPicker.expandReactions'),
            loading: t('stickerPicker.loading'),
            loadingError: t('stickerPicker.loadingError'),
            retryLoading: t('stickerPicker.retryLoading'),
            skinToneNeutral: t('stickerPicker.skinToneNeutral'),
            skinToneLight: t('stickerPicker.skinToneLight'),
            skinToneMediumLight: t('stickerPicker.skinToneMediumLight'),
            skinToneMedium: t('stickerPicker.skinToneMedium'),
            skinToneMediumDark: t('stickerPicker.skinToneMediumDark'),
            skinToneDark: t('stickerPicker.skinToneDark'),
          }}
        />
      </div>
    </div>
  )
}
