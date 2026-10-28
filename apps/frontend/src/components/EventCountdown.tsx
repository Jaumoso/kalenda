import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CSSProperties } from 'react'
import { getHighlightedEventCountdown } from '@kalenda/shared/countdown'
import type { RecurringEventInput } from '@kalenda/shared/recurrence'

interface Props {
  event?: RecurringEventInput | null
  events?: RecurringEventInput[]
  projectYear: number
  className?: string
  style?: CSSProperties
}

export default function EventCountdown({
  event,
  events,
  projectYear,
  className = '',
  style,
}: Props) {
  const { t, i18n } = useTranslation()
  const entries = useMemo(
    () =>
      (events ?? (event ? [event] : [])).map((currentEvent) => ({
        event: currentEvent,
        countdown: getHighlightedEventCountdown(currentEvent, projectYear),
      })),
    [event, events, projectYear]
  )

  return (
    <div data-testid="event-countdown-list" style={style} className={`space-y-2 ${className}`}>
      {entries.map(({ event: currentEvent, countdown }) => {
        const formattedDate = countdown.targetDate
          ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(
              new Date(`${countdown.targetDate}T00:00:00`)
            )
          : null
        return (
          <div
            key={currentEvent.id}
            data-testid="event-countdown"
            className="rounded-lg border border-primary-200 bg-primary-50/95 px-5 py-3 text-center shadow-sm"
          >
            {countdown.status === 'countdown' ? (
              <>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                  {t('countdown.label')}
                </div>
                <div className="mt-1 text-xl font-bold text-primary-950">
                  {countdown.daysRemaining === 0
                    ? t('countdown.today', { name: currentEvent.name })
                    : t('countdown.days', {
                        count: countdown.daysRemaining,
                        name: currentEvent.name,
                      })}
                </div>
                {formattedDate && (
                  <div className="mt-1 text-xs text-primary-700">{formattedDate}</div>
                )}
              </>
            ) : (
              <div className="text-sm text-primary-800">
                {t('countdown.expired', { name: currentEvent.name })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
