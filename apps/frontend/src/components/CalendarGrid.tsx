import type { GridConfig, DayCell, DayPosition } from '../lib/calendarTypes'
import {
  DEFAULT_GRID_CONFIG,
  getDaysInMonth,
  getFirstDayOfWeek,
  isWeekend,
  WEEKDAY_HEADERS_MON,
  WEEKDAY_HEADERS_SUN,
} from '../lib/calendarTypes'

interface Props {
  year: number
  month: number // 1-12
  weekStartsOn: string
  gridConfig: GridConfig
  dayCells: DayCell[]
  onCellClick: (dayNumber: number) => void
}

const POSITION_CLASSES: Record<DayPosition, string> = {
  'top-left': 'items-start justify-start',
  'top-center': 'items-start justify-center',
  'top-right': 'items-start justify-end',
  'middle-left': 'items-center justify-start',
  'middle-center': 'items-center justify-center',
  'middle-right': 'items-center justify-end',
  'bottom-left': 'items-end justify-start',
  'bottom-center': 'items-end justify-center',
  'bottom-right': 'items-end justify-end',
}

export default function CalendarGrid({
  year,
  month,
  weekStartsOn,
  gridConfig,
  dayCells,
  onCellClick,
}: Props) {
  const config = { ...DEFAULT_GRID_CONFIG, ...gridConfig }
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month, weekStartsOn)
  const weekdays = weekStartsOn === 'monday' ? WEEKDAY_HEADERS_MON : WEEKDAY_HEADERS_SUN
  const cellMap = new Map(dayCells.map((c) => [c.dayNumber, c]))

  const totalCells = firstDay + daysInMonth
  const rows = Math.ceil(totalCells / 7)

  const borderStyle =
    config.borderStyle === 'none'
      ? undefined
      : `${config.borderWidth}px ${config.borderStyle} ${config.borderColor}`

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: config.bgColor,
        opacity: config.bgOpacity / 100,
      }}
    >
      {/* Weekday headers */}
      <div className="grid grid-cols-7" style={{ borderBottom: borderStyle }}>
        {weekdays.map((day, i) => (
          <div
            key={i}
            className="text-center py-2 select-none"
            style={{
              fontFamily: config.headerFontFamily,
              fontSize: `${config.headerFontSize}px`,
              color: config.headerFontColor,
              backgroundColor: config.headerBgColor,
              borderRight: i < 6 ? borderStyle : undefined,
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="grid grid-cols-7"
          style={{ borderBottom: row < rows - 1 ? borderStyle : undefined }}
        >
          {Array.from({ length: 7 }, (_, col) => {
            const cellIndex = row * 7 + col
            const dayNumber = cellIndex - firstDay + 1
            const isValid = dayNumber >= 1 && dayNumber <= daysInMonth
            const weekend = isValid && isWeekend(dayNumber, year, month)
            const cell = isValid ? cellMap.get(dayNumber) : undefined

            const cellBg = cell?.bgColor || (weekend ? config.weekendBgColor : undefined)

            return (
              <div
                key={col}
                className={`relative min-h-[3.5rem] p-1 flex ${POSITION_CLASSES[config.dayPosition]} transition-colors ${
                  isValid ? 'cursor-pointer hover:bg-primary-50/50' : ''
                }`}
                style={{
                  backgroundColor: cellBg || undefined,
                  borderRight: col < 6 ? borderStyle : undefined,
                }}
                onClick={() => isValid && onCellClick(dayNumber)}
              >
                {isValid && (
                  <>
                    <span
                      className="select-none leading-none z-10"
                      style={{
                        fontFamily: config.dayFontFamily,
                        fontSize: `${config.dayFontSize}px`,
                        color: config.dayFontColor,
                        fontWeight: config.dayFontWeight,
                      }}
                    >
                      {dayNumber}
                    </span>
                    {cell?.contentJson?.text && (
                      <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[9px] text-neutral-500 truncate leading-tight">
                        {cell.contentJson.text}
                      </span>
                    )}
                    {cell?.contentJson?.emoji && (
                      <span className="absolute top-0.5 left-0.5 text-xs">
                        {cell.contentJson.emoji}
                      </span>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
