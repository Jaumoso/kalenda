import { useCallback, useRef, useState, type ReactNode } from 'react'
import { PAGE_HEIGHT, PAGE_WIDTH } from '../lib/calendarTypes'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface Props {
  x: number
  y: number
  width: number
  height: number
  gridRect: Rect
  active: boolean
  onLayoutChange: (rect: Rect) => void
  children: ReactNode
}

type DragMode = null | 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const HANDLE_SIZE = 8
const MIN_WIDTH = 120
const MIN_HEIGHT = 50
const GAP = 8

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

export function constrainRectOutsideGrid(rect: Rect, gridRect: Rect): Rect {
  const bounded = {
    ...rect,
    width: Math.min(rect.width, PAGE_WIDTH),
    height: Math.min(rect.height, PAGE_HEIGHT),
  }
  bounded.x = Math.max(0, Math.min(PAGE_WIDTH - bounded.width, bounded.x))
  bounded.y = Math.max(0, Math.min(PAGE_HEIGHT - bounded.height, bounded.y))

  if (!overlaps(bounded, gridRect)) return bounded

  const candidates = [
    { ...bounded, y: gridRect.y - bounded.height - GAP },
    { ...bounded, y: gridRect.y + gridRect.height + GAP },
    { ...bounded, x: gridRect.x - bounded.width - GAP },
    { ...bounded, x: gridRect.x + gridRect.width + GAP },
  ]
    .map((candidate) => ({
      ...candidate,
      x: Math.max(0, Math.min(PAGE_WIDTH - candidate.width, candidate.x)),
      y: Math.max(0, Math.min(PAGE_HEIGHT - candidate.height, candidate.y)),
    }))
    .filter((candidate) => !overlaps(candidate, gridRect))
    .sort(
      (a, b) =>
        Math.abs(a.x - rect.x) +
        Math.abs(a.y - rect.y) -
        (Math.abs(b.x - rect.x) + Math.abs(b.y - rect.y))
    )

  return candidates[0] ?? bounded
}

export default function DraggableMiniCalendar({
  x,
  y,
  width,
  height,
  gridRect,
  active,
  onLayoutChange,
  children,
}: Props) {
  const dragRef = useRef<{
    mode: DragMode
    startMouseX: number
    startMouseY: number
    startRect: Rect
  } | null>(null)
  const [dragging, setDragging] = useState(false)

  const updateRect = useCallback(
    (mode: DragMode, dx: number, dy: number, start: Rect) => {
      const next = { ...start }

      switch (mode) {
        case 'move':
          next.x += dx
          next.y += dy
          break
        case 'n':
          next.y += dy
          next.height -= dy
          break
        case 's':
          next.height += dy
          break
        case 'w':
          next.x += dx
          next.width -= dx
          break
        case 'e':
          next.width += dx
          break
        case 'nw':
          next.x += dx
          next.y += dy
          next.width -= dx
          next.height -= dy
          break
        case 'ne':
          next.y += dy
          next.width += dx
          next.height -= dy
          break
        case 'sw':
          next.x += dx
          next.width -= dx
          next.height += dy
          break
        case 'se':
          next.width += dx
          next.height += dy
          break
      }

      if (next.width < MIN_WIDTH) {
        if (mode?.includes('w')) next.x = start.x + start.width - MIN_WIDTH
        next.width = MIN_WIDTH
      }
      if (next.height < MIN_HEIGHT) {
        if (mode?.includes('n')) next.y = start.y + start.height - MIN_HEIGHT
        next.height = MIN_HEIGHT
      }

      onLayoutChange(constrainRectOutsideGrid(next, gridRect))
    },
    [gridRect, onLayoutChange]
  )

  const onPointerDown = useCallback(
    (mode: DragMode) => (event: React.PointerEvent) => {
      if (!active) return
      event.preventDefault()
      event.stopPropagation()
      dragRef.current = {
        mode,
        startMouseX: event.clientX,
        startMouseY: event.clientY,
        startRect: { x, y, width, height },
      }
      setDragging(true)

      const onMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current
        if (!drag) return
        updateRect(
          drag.mode,
          moveEvent.clientX - drag.startMouseX,
          moveEvent.clientY - drag.startMouseY,
          drag.startRect
        )
      }

      const onUp = () => {
        dragRef.current = null
        setDragging(false)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [active, height, updateRect, width, x, y]
  )

  const handleStyle = (
    cursor: string,
    top?: number,
    left?: number,
    right?: number,
    bottom?: number
  ): React.CSSProperties => ({
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    background: active ? '#3B82F6' : 'transparent',
    border: active ? '1px solid #fff' : 'none',
    borderRadius: 2,
    cursor: active ? cursor : 'default',
    top,
    left,
    right,
    bottom,
    transform: 'translate(-50%, -50%)',
    zIndex: 20,
  })

  return (
    <div
      className="absolute"
      data-testid="draggable-mini-calendar"
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex: active ? 12 : 3,
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      <div className="w-full h-full">{children}</div>

      {active && (
        <>
          <div
            className={`absolute inset-0 border-2 ${
              dragging ? 'border-blue-500' : 'border-blue-400/60'
            } rounded-lg`}
            style={{ cursor: 'move', zIndex: 15 }}
            onPointerDown={onPointerDown('move')}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: HANDLE_SIZE,
              right: HANDLE_SIZE,
              height: HANDLE_SIZE,
              cursor: 'n-resize',
              zIndex: 20,
            }}
            onPointerDown={onPointerDown('n')}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: HANDLE_SIZE,
              right: HANDLE_SIZE,
              height: HANDLE_SIZE,
              cursor: 's-resize',
              zIndex: 20,
            }}
            onPointerDown={onPointerDown('s')}
          />
          <div
            style={{
              position: 'absolute',
              top: HANDLE_SIZE,
              bottom: HANDLE_SIZE,
              left: 0,
              width: HANDLE_SIZE,
              cursor: 'w-resize',
              zIndex: 20,
            }}
            onPointerDown={onPointerDown('w')}
          />
          <div
            style={{
              position: 'absolute',
              top: HANDLE_SIZE,
              bottom: HANDLE_SIZE,
              right: 0,
              width: HANDLE_SIZE,
              cursor: 'e-resize',
              zIndex: 20,
            }}
            onPointerDown={onPointerDown('e')}
          />
          <div style={handleStyle('nw-resize', 0, 0)} onPointerDown={onPointerDown('nw')} />
          <div
            style={handleStyle('ne-resize', 0, undefined, -HANDLE_SIZE / 2)}
            onPointerDown={onPointerDown('ne')}
          />
          <div
            style={handleStyle('sw-resize', undefined, 0, undefined, -HANDLE_SIZE / 2)}
            onPointerDown={onPointerDown('sw')}
          />
          <div
            style={handleStyle(
              'se-resize',
              undefined,
              undefined,
              -HANDLE_SIZE / 2,
              -HANDLE_SIZE / 2
            )}
            onPointerDown={onPointerDown('se')}
          />
        </>
      )}
    </div>
  )
}
