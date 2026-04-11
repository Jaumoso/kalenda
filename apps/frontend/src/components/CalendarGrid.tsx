import type {
  GridConfig,
  DayCell,
  DayPosition,
  Holiday,
  CalEvent,
  Saint,
} from '../lib/calendarTypes'
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
  holidays: Holiday[]
  events: CalEvent[]
  saints: Saint[]
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
  holidays,
  events,
  saints,
  onCellClick,
}: Props) {
  const config = { ...DEFAULT_GRID_CONFIG, ...gridConfig }
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month, weekStartsOn)
  const weekdays = weekStartsOn === 'monday' ? WEEKDAY_HEADERS_MON : WEEKDAY_HEADERS_SUN
  const cellMap = new Map(dayCells.map((c) => [c.dayNumber, c]))
  const holidayMap = new Map<number, Holiday[]>()
  const eventMap = new Map<number, CalEvent[]>()
  const saintMap = new Map<number, string>()

  for (const h of holidays) {
    const arr = holidayMap.get(h.day) || []
    arr.push(h)
    holidayMap.set(h.day, arr)
  }
  for (const e of events) {
    const arr = eventMap.get(e.day) || []
    arr.push(e)
    eventMap.set(e.day, arr)
  }
  for (const s of saints) {
    saintMap.set(s.day, s.name)
  }

  const totalCells = firstDay + daysInMonth
  const rows = Math.ceil(totalCells / 7)

  const borderStyle =
    config.borderStyle === 'none'
      ? undefined
      : `${config.borderWidth}px ${config.borderStyle} ${config.borderColor}`

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col h-full"
      style={{
        backgroundColor: config.bgColor,
        opacity: config.bgOpacity / 100,
      }}
    >
      {/* Weekday headers */}
      <div className="grid grid-cols-7 shrink-0" style={{ borderBottom: borderStyle }}>
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
      <div className="flex-1 flex flex-col">
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="grid grid-cols-7 flex-1"
            style={{ borderBottom: row < rows - 1 ? borderStyle : undefined }}
          >
            {Array.from({ length: 7 }, (_, col) => {
              const cellIndex = row * 7 + col
              const dayNumber = cellIndex - firstDay + 1
              const isValid = dayNumber >= 1 && dayNumber <= daysInMonth
              const weekend = isValid && isWeekend(dayNumber, year, month)
              const cell = isValid ? cellMap.get(dayNumber) : undefined
              const dayHolidays = isValid ? holidayMap.get(dayNumber) : undefined
              const dayEvents = isValid ? eventMap.get(dayNumber) : undefined
              const saint = isValid ? saintMap.get(dayNumber) : undefined

              const isHoliday = config.showHolidays && dayHolidays && dayHolidays.length > 0
              const hasEvents = config.showEvents && dayEvents && dayEvents.length > 0

              const cellBg =
                cell?.bgColor ||
                (isHoliday ? config.holidayBgColor : undefined) ||
                (weekend ? config.weekendBgColor : undefined)

              return (
                <div
                  key={col}
                  className={`relative p-1 flex ${POSITION_CLASSES[config.dayPosition]} transition-colors ${
                    isValid ? 'cursor-pointer hover:bg-primary-50/50' : ''
                  } overflow-hidden`}
                  style={{
                    backgroundColor: cellBg || undefined,
                    borderRight: col < 6 ? borderStyle : undefined,
                  }}
                  onClick={() => isValid && onCellClick(dayNumber)}
                >
                  {isValid && (
                    <>
                      {/* Cell background image */}
                      {cell?.contentJson?.imageFilename && (
                        <img
                          src={`/uploads/${cell.contentJson.imageFilename}`}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}

                      <span
                        className="select-none leading-none z-10"
                        style={{
                          fontFamily: config.dayFontFamily,
                          fontSize: `${config.dayFontSize}px`,
                          color: isHoliday ? '#DC2626' : config.dayFontColor,
                          fontWeight: isHoliday ? 'bold' : config.dayFontWeight,
                          textShadow: cell?.contentJson?.imageFilename
                            ? '0 0 3px rgba(255,255,255,0.8)'
                            : undefined,
                        }}
                      >
                        {dayNumber}
                      </span>

                      {/* Sticker asset from library */}
                      {cell?.contentJson?.stickerFilename && (
                        <img
                          src={`/uploads/${cell.contentJson.stickerFilename}`}
                          alt=""
                          className="absolute bottom-0.5 right-0.5 w-5 h-5 object-contain z-10"
                        />
                      )}

                      {/* Saint name */}
                      {config.showSaints && saint && (
                        <span className="absolute top-0.5 left-0.5 text-[7px] text-neutral-400 leading-tight max-w-[90%] truncate z-10">
                          {saint}
                        </span>
                      )}

                      {/* Holiday label */}
                      {isHoliday && dayHolidays && (
                        <span
                          className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] text-red-600 font-medium truncate leading-tight z-10"
                          style={{
                            textShadow: cell?.contentJson?.imageFilename
                              ? '0 0 2px rgba(255,255,255,0.9)'
                              : undefined,
                          }}
                        >
                          {dayHolidays[0].nameEs}
                        </span>
                      )}

                      {/* Events indicators */}
                      {hasEvents && !isHoliday && dayEvents && (
                        <span
                          className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] truncate leading-tight z-10"
                          style={{
                            color: dayEvents[0].color,
                            textShadow: cell?.contentJson?.imageFilename
                              ? '0 0 2px rgba(255,255,255,0.9)'
                              : undefined,
                          }}
                        >
                          {dayEvents[0].icon || '•'} {dayEvents[0].name}
                        </span>
                      )}

                      {/* Event dots when holiday takes bottom text */}
                      {hasEvents && isHoliday && dayEvents && (
                        <div className="absolute top-0.5 right-0.5 flex gap-0.5 z-10">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: ev.color }}
                              title={ev.name}
                            />
                          ))}
                        </div>
                      )}

                      {/* Cell text (when no holiday/event text shown) */}
                      {cell?.contentJson?.text && !isHoliday && !hasEvents && (
                        <span
                          className="absolute bottom-0.5 left-0.5 right-0.5 text-[9px] text-neutral-500 truncate leading-tight z-10"
                          style={{
                            textShadow: cell?.contentJson?.imageFilename
                              ? '0 0 2px rgba(255,255,255,0.9)'
                              : undefined,
                          }}
                        >
                          {cell.contentJson.text}
                        </span>
                      )}
                      {cell?.contentJson?.emoji && (
                        <span className="absolute top-0.5 left-0.5 text-xs z-10">
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
    </div>
  )
}
