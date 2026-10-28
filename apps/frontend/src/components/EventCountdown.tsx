import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getHighlightedEventCountdown } from '@kalenda/shared/countdown'
import type { RecurringEventInput } from '@kalenda/shared/recurrence'

interface Props {
  event: RecurringEventInput | null | undefined
  projectYear: number
  className?: string
}

export default function EventCountdown({ event, projectYear, className = '' }: Props) {
  const { t, i18n } = useTranslation()
  const countdown = useMemo(
    () => getHighlightedEventCountdown(event, projectYear),
    [event, projectYear]
  )

  const formattedDate = countdown.targetDate
    ? new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'long',
      }).format(new Date(`${countdown.targetDate}T00:00:00`))
    : null

  return (
    <div
      data-testid="event-countdown"
      className={`rounded-lg border border-primary-200 bg-primary-50/95 px-5 py-3 text-center shadow-sm ${className}`}
    >
      {countdown.status === 'countdown' && event ? (
        <>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
            {t('countdown.label')}
          </div>
          <div className="mt-1 text-xl font-bold text-primary-950">
            {countdown.daysRemaining === 0
              ? t('countdown.today', { name: event.name })
              : t('countdown.days', { count: countdown.daysRemaining, name: event.name })}
          </div>
          {formattedDate && <div className="mt-1 text-xs text-primary-700">{formattedDate}</div>}
        </>
      ) : (
        <div className="text-sm text-primary-800">
          {countdown.status === 'missing'
            ? t('countdown.missing')
            : t('countdown.expired', { name: event?.name || '' })}
        </div>
      )}
    </div>
  )
}
