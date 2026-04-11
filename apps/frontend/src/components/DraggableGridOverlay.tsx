import { useRef, useCallback, useState, type ReactNode } from 'react'
import { PAGE_WIDTH, PAGE_HEIGHT } from '../lib/calendarTypes'

interface Props {
  x: number
  y: number
  width: number
  height: number
  opacity: number
  active: boolean // true when in grid-editing mode
  onLayoutChange: (rect: { x: number; y: number; width: number; height: number }) => void
  children: ReactNode
}

type DragMode = null | 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const HANDLE_SIZE = 8

export default function DraggableGridOverlay({
  x,
  y,
  width,
  height,
  opacity,
  active,
  onLayoutChange,
  children,
}: Props) {
  const dragRef = useRef<{
    mode: DragMode
    startMouseX: number
    startMouseY: number
    startX: number
    startY: number
    startW: number
    startH: number
  } | null>(null)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = useCallback(
    (mode: DragMode) => (e: React.PointerEvent) => {
      if (!active) return
      e.preventDefault()
      e.stopPropagation()
      dragRef.current = {
        mode,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: x,
        startY: y,
        startW: width,
        startH: height,
      }
      setDragging(true)

      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current
        if (!d) return
        const dx = ev.clientX - d.startMouseX
        const dy = ev.clientY - d.startMouseY

        let nx = d.startX
        let ny = d.startY
        let nw = d.startW
        let nh = d.startH

        switch (d.mode) {
          case 'move':
            nx = d.startX + dx
            ny = d.startY + dy
            break
          case 'n':
            ny = d.startY + dy
            nh = d.startH - dy
            break
          case 's':
            nh = d.startH + dy
            break
          case 'w':
            nx = d.startX + dx
            nw = d.startW - dx
            break
          case 'e':
            nw = d.startW + dx
            break
          case 'nw':
            nx = d.startX + dx
            ny = d.startY + dy
            nw = d.startW - dx
            nh = d.startH - dy
            break
          case 'ne':
            ny = d.startY + dy
            nw = d.startW + dx
            nh = d.startH - dy
            break
          case 'sw':
            nx = d.startX + dx
            nw = d.startW - dx
            nh = d.startH + dy
            break
          case 'se':
            nw = d.startW + dx
            nh = d.startH + dy
            break
        }

        // Enforce minimums
        if (nw < 100) {
          if (d.mode?.includes('w')) nx = d.startX + d.startW - 100
          nw = 100
        }
        if (nh < 50) {
          if (d.mode?.includes('n')) ny = d.startY + d.startH - 50
          nh = 50
        }

        onLayoutChange({
          x: Math.round(nx),
          y: Math.round(ny),
          width: Math.round(nw),
          height: Math.round(nh),
        })
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
    [active, x, y, width, height, onLayoutChange]
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
      style={{
        left: x,
        top: y,
        width,
        height,
        opacity: opacity / 100,
        zIndex: active ? 10 : 2,
        pointerEvents: 'auto',
      }}
    >
      {/* Content */}
      <div
        className="w-full h-full overflow-hidden"
        style={{ pointerEvents: active ? 'none' : 'auto' }}
      >
        {children}
      </div>

      {/* Interactive frame — only visible in grid mode */}
      {active && (
        <>
          {/* Move handle (entire border area) */}
          <div
            className={`absolute inset-0 border-2 ${dragging ? 'border-blue-500' : 'border-blue-400/60'} rounded-lg`}
            style={{ cursor: 'move', zIndex: 15 }}
            onPointerDown={onPointerDown('move')}
          />

          {/* Edge handles */}
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

          {/* Corner handles */}
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

          {/* Distance indicators */}
          {(() => {
            const distLeft = x
            const distRight = PAGE_WIDTH - x - width
            const distTop = y
            const distBottom = PAGE_HEIGHT - y - height
            const labelClass =
              'absolute text-[9px] font-mono text-blue-600 bg-white/80 px-1 rounded shadow-sm pointer-events-none whitespace-nowrap'
            const lineColor = '#93C5FD' // blue-300

            return (
              <>
                {/* Left distance */}
                {distLeft > 12 && (
                  <>
                    <svg
                      className="pointer-events-none"
                      style={{
                        position: 'absolute',
                        left: -distLeft,
                        top: '50%',
                        width: distLeft,
                        height: 1,
                        overflow: 'visible',
                      }}
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2={distLeft}
                        y2="0"
                        stroke={lineColor}
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                    </svg>
                    <span
                      className={labelClass}
                      style={{
                        left: -distLeft / 2,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {Math.round(distLeft)}
                    </span>
                  </>
                )}

                {/* Right distance */}
                {distRight > 12 && (
                  <>
                    <svg
                      className="pointer-events-none"
                      style={{
                        position: 'absolute',
                        right: -distRight,
                        top: '50%',
                        width: distRight,
                        height: 1,
                        overflow: 'visible',
                      }}
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2={distRight}
                        y2="0"
                        stroke={lineColor}
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                    </svg>
                    <span
                      className={labelClass}
                      style={{
                        right: -distRight / 2,
                        top: '50%',
                        transform: 'translate(50%, -50%)',
                      }}
                    >
                      {Math.round(distRight)}
                    </span>
                  </>
                )}

                {/* Top distance */}
                {distTop > 12 && (
                  <>
                    <svg
                      className="pointer-events-none"
                      style={{
                        position: 'absolute',
                        top: -distTop,
                        left: '50%',
                        width: 1,
                        height: distTop,
                        overflow: 'visible',
                      }}
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2={distTop}
                        stroke={lineColor}
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                    </svg>
                    <span
                      className={labelClass}
                      style={{ top: -distTop / 2, left: '50%', transform: 'translate(-50%, -50%)' }}
                    >
                      {Math.round(distTop)}
                    </span>
                  </>
                )}

                {/* Bottom distance */}
                {distBottom > 12 && (
                  <>
                    <svg
                      className="pointer-events-none"
                      style={{
                        position: 'absolute',
                        bottom: -distBottom,
                        left: '50%',
                        width: 1,
                        height: distBottom,
                        overflow: 'visible',
                      }}
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2={distBottom}
                        stroke={lineColor}
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                    </svg>
                    <span
                      className={labelClass}
                      style={{
                        bottom: -distBottom / 2,
                        left: '50%',
                        transform: 'translate(-50%, 50%)',
                      }}
                    >
                      {Math.round(distBottom)}
                    </span>
                  </>
                )}
              </>
            )
          })()}
        </>
      )}
    </div>
  )
}
