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
  getWeekdayHeaders,
  getMonthNames,
} from '../lib/calendarTypes'
import { getMoonEmoji, isNotableMoonPhase } from '../lib/moonPhase'

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

/** Map dayPosition to CSS grid area name */
const DAY_AREA: Record<DayPosition, string> = {
  'top-left': 'tl',
  'top-center': 'tc',
  'top-right': 'tr',
  'middle-left': 'ml',
  'middle-center': 'mc',
  'middle-right': 'mr',
  'bottom-left': 'bl',
  'bottom-center': 'bc',
  'bottom-right': 'br',
}

/** CSS grid-template-areas for the 3×3 cell layout */
const CELL_GRID_TEMPLATE = `"tl tc tr" "ml mc mr" "bl bc br"`

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
  const weekdays = getWeekdayHeaders(weekStartsOn, config.headerFormat)
  const monthNames = getMonthNames()
  const monthTitle = monthNames[month - 1] || ''
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

  const outerBorder =
    config.borderStyle === 'none'
      ? undefined
      : `${config.borderWidth}px ${config.borderStyle} ${config.borderColor}`

  const innerBorder =
    config.innerBorderStyle === 'none'
      ? undefined
      : `${config.innerBorderWidth}px ${config.innerBorderStyle} ${config.innerBorderColor}`

  // Table background applied per-section so the month title can be independently transparent
  const tableBg =
    config.bgOpacity === 0
      ? 'transparent'
      : config.bgOpacity < 100
        ? `color-mix(in srgb, ${config.bgColor} ${config.bgOpacity}%, transparent)`
        : config.bgColor

  return (
    <div
      className="overflow-hidden flex flex-col h-full"
      style={{
        borderRadius: `${config.borderRadius}px`,
        border: outerBorder,
      }}
    >
      {/* Month title (top) */}
      {config.monthTitleShow && config.monthTitlePosition === 'top' && (
        <div
          className="shrink-0 px-3 py-2 select-none"
          style={{
            fontFamily: config.monthTitleFontFamily,
            fontSize: `${config.monthTitleFontSize}px`,
            color: config.monthTitleFontColor,
            fontWeight: config.monthTitleFontWeight,
            textAlign: config.monthTitleAlign,
            textTransform: config.monthTitleUppercase ? 'uppercase' : 'none',
            backgroundColor:
              config.monthTitleBgOpacity === 0
                ? 'transparent'
                : config.monthTitleBgOpacity < 100
                  ? `color-mix(in srgb, ${config.monthTitleBgColor} ${config.monthTitleBgOpacity}%, transparent)`
                  : config.monthTitleBgColor,
          }}
        >
          {monthTitle}
        </div>
      )}

      {/* Weekday headers */}
      <div
        className="grid grid-cols-7 shrink-0"
        style={{ backgroundColor: tableBg, borderBottom: innerBorder }}
      >
        {weekdays.map((day, i) => (
          <div
            key={i}
            className="text-center py-2 select-none"
            style={{
              fontFamily: config.headerFontFamily,
              fontSize: `${config.headerFontSize}px`,
              color: config.headerFontColor,
              backgroundColor: config.headerBgColor,
              borderRight: i < 6 ? innerBorder : undefined,
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: tableBg }}>
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="grid grid-cols-7 flex-1"
            style={{ borderBottom: row < rows - 1 ? innerBorder : undefined }}
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
                  className={`relative transition-colors ${
                    isValid ? 'cursor-pointer hover:bg-primary-50/50' : ''
                  } overflow-hidden`}
                  style={{
                    backgroundColor: cellBg || undefined,
                    borderRight: col < 6 ? innerBorder : undefined,
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
                          className="absolute inset-0 w-full h-full object-cover z-0"
                        />
                      )}

                      {/* Sticker (absolute, configurable position & size) */}
                      {cell?.contentJson?.stickerFilename && (
                        <img
                          src={`/uploads/${cell.contentJson.stickerFilename}`}
                          alt=""
                          className="absolute object-contain z-10 pointer-events-none"
                          style={{
                            left: `${cell.contentJson.stickerX ?? 50}%`,
                            top: `${cell.contentJson.stickerY ?? 50}%`,
                            transform: 'translate(-50%, -50%)',
                            width: `${cell.contentJson.stickerSize ?? 60}%`,
                            height: `${cell.contentJson.stickerSize ?? 60}%`,
                          }}
                        />
                      )}

                      {/* 3×3 grid layout for text elements */}
                      <div
                        className="relative z-10 w-full h-full p-0.5"
                        style={{
                          display: 'grid',
                          gridTemplateAreas: CELL_GRID_TEMPLATE,
                          gridTemplateRows: 'auto 1fr auto',
                          gridTemplateColumns: 'auto 1fr auto',
                        }}
                      >
                        {/* TOP-LEFT: Moon phase */}
                        <span
                          className="select-none text-[10px] leading-none opacity-60"
                          style={{ gridArea: 'tl' }}
                        >
                          {config.showMoonPhase && isNotableMoonPhase(year, month, dayNumber)
                            ? getMoonEmoji(year, month, dayNumber)
                            : ''}
                        </span>

                        {/* TOP-CENTER: Saint name */}
                        <span
                          className="text-[7px] text-neutral-400 leading-tight text-center select-none overflow-hidden"
                          style={{ gridArea: 'tc', wordBreak: 'break-word' }}
                        >
                          {config.showSaints && saint ? saint : ''}
                        </span>

                        {/* TOP-RIGHT: Event dots (when holiday occupies bottom) */}
                        <span
                          className="flex items-start justify-end gap-px"
                          style={{ gridArea: 'tr' }}
                        >
                          {hasEvents && isHoliday && dayEvents
                            ? dayEvents
                                .slice(0, 3)
                                .map((ev) => (
                                  <span
                                    key={ev.id}
                                    className="w-1.5 h-1.5 rounded-full inline-block"
                                    style={{ backgroundColor: ev.color }}
                                    title={ev.name}
                                  />
                                ))
                            : null}
                        </span>

                        {/* DAY NUMBER: placed in configured position */}
                        <span
                          className="select-none leading-none"
                          style={{
                            gridArea: DAY_AREA[config.dayPosition],
                            fontFamily: config.dayFontFamily,
                            fontSize: `${config.dayFontSize}px`,
                            color: isHoliday ? '#DC2626' : config.dayFontColor,
                            fontWeight: isHoliday ? 'bold' : config.dayFontWeight,
                            textShadow: cell?.contentJson?.imageFilename
                              ? '0 0 3px rgba(255,255,255,0.8)'
                              : undefined,
                            textAlign: config.dayPosition.includes('left')
                              ? 'left'
                              : config.dayPosition.includes('right')
                                ? 'right'
                                : 'center',
                            alignSelf: config.dayPosition.startsWith('top')
                              ? 'start'
                              : config.dayPosition.startsWith('bottom')
                                ? 'end'
                                : 'center',
                          }}
                        >
                          {dayNumber}
                        </span>

                        {/* BOTTOM-LEFT: Holiday / Event / Cell text */}
                        <span
                          className="truncate leading-tight col-span-1"
                          style={{
                            gridArea: 'bl',
                            gridColumnEnd: 'br',
                            textShadow: cell?.contentJson?.imageFilename
                              ? '0 0 2px rgba(255,255,255,0.9)'
                              : undefined,
                          }}
                        >
                          {isHoliday && dayHolidays ? (
                            <span className="text-[8px] text-red-600 font-medium">
                              {dayHolidays[0].nameEs}
                            </span>
                          ) : hasEvents && dayEvents ? (
                            <span className="text-[8px]" style={{ color: dayEvents[0].color }}>
                              {dayEvents[0].icon || '•'} {dayEvents[0].name}
                            </span>
                          ) : cell?.contentJson?.text ? (
                            <span className="text-[9px] text-neutral-500">
                              {cell.contentJson.text}
                            </span>
                          ) : null}
                        </span>

                        {/* BOTTOM-RIGHT: Emoji */}
                        <span
                          className="text-xs text-right leading-none select-none"
                          style={{ gridArea: 'br', alignSelf: 'end' }}
                        >
                          {cell?.contentJson?.emoji || ''}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Month title (bottom) */}
      {config.monthTitleShow && config.monthTitlePosition === 'bottom' && (
        <div
          className="shrink-0 px-3 py-2 select-none"
          style={{
            fontFamily: config.monthTitleFontFamily,
            fontSize: `${config.monthTitleFontSize}px`,
            color: config.monthTitleFontColor,
            fontWeight: config.monthTitleFontWeight,
            textAlign: config.monthTitleAlign,
            textTransform: config.monthTitleUppercase ? 'uppercase' : 'none',
            backgroundColor:
              config.monthTitleBgOpacity === 0
                ? 'transparent'
                : config.monthTitleBgOpacity < 100
                  ? `color-mix(in srgb, ${config.monthTitleBgColor} ${config.monthTitleBgOpacity}%, transparent)`
                  : config.monthTitleBgColor,
          }}
        >
          {monthTitle}
        </div>
      )}
    </div>
  )
}
