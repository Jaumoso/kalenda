import { useTranslation } from 'react-i18next'
import {
  getAdjacentMonth,
  getDaysInMonth,
  getFirstDayOfWeek,
  getMonthNames,
  getWeekdayHeaders,
  type GridConfig,
} from '../lib/calendarTypes'

interface Props {
  year: number
  month: number
  weekStartsOn: string
  config: GridConfig
}

interface MonthProps {
  year: number
  month: number
  weekStartsOn: string
  config: GridConfig
}

function Month({ year, month, weekStartsOn, config }: MonthProps) {
  const { t } = useTranslation()
  const monthNames = getMonthNames()
  const weekdays = getWeekdayHeaders(weekStartsOn, 'short')
  const firstDay = getFirstDayOfWeek(year, month, weekStartsOn)
  const daysInMonth = getDaysInMonth(year, month)
  const title = `${monthNames[month - 1]} ${year}`

  return (
    <div className="min-w-0">
      <div
        className="truncate text-center font-semibold"
        title={title}
        style={{ color: config.headerFontColor, fontFamily: config.headerFontFamily }}
      >
        {monthNames[month - 1]}
      </div>
      <div
        className="grid grid-cols-7 text-center"
        aria-label={t('grid.miniCalendarMonth', { month: title })}
      >
        {weekdays.map((weekday, index) => (
          <span key={`${weekday}-${index}`} className="font-medium opacity-70">
            {weekday}
          </span>
        ))}
        {Array.from({ length: firstDay }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => (
          <span key={index + 1}>{index + 1}</span>
        ))}
      </div>
    </div>
  )
}

export default function MiniCalendar({ year, month, weekStartsOn, config }: Props) {
  const { t } = useTranslation()
  if (!config.miniCalendarShow) return null

  const previous = getAdjacentMonth(year, month, -1)
  const next = getAdjacentMonth(year, month, 1)
  const opacity =
    config.miniCalendarBgOpacity === 0
      ? 'transparent'
      : config.miniCalendarBgOpacity < 100
        ? `color-mix(in srgb, ${config.miniCalendarBgColor} ${config.miniCalendarBgOpacity}%, transparent)`
        : config.miniCalendarBgColor

  return (
    <div
      data-testid="mini-calendar"
      className="grid grid-cols-2 gap-2 rounded px-2 py-1 text-[8px] leading-tight shadow-sm"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: opacity,
        border:
          config.miniCalendarBorderWidth > 0
            ? `${config.miniCalendarBorderWidth}px solid ${config.miniCalendarBorderColor}`
            : undefined,
        color: config.dayFontColor,
        fontFamily: config.dayFontFamily,
        fontSize: config.miniCalendarFontSize,
      }}
      aria-label={t('grid.miniCalendarLabel')}
    >
      <Month {...previous} weekStartsOn={weekStartsOn} config={config} />
      <Month {...next} weekStartsOn={weekStartsOn} config={config} />
    </div>
  )
}
