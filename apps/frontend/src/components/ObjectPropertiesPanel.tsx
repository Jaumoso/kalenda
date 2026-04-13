import { useState, useEffect, useCallback } from 'react'
import type * as fabric from 'fabric'
import type { CanvasEditorHandle } from './CanvasEditor'

interface ObjectPropertiesPanelProps {
  editorRef: React.RefObject<CanvasEditorHandle | null>
  selectedObject: fabric.FabricObject | null
  onModified: () => void
}

export default function ObjectPropertiesPanel({
  editorRef,
  selectedObject,
  onModified,
}: ObjectPropertiesPanelProps) {
  const [props, setProps] = useState<Record<string, unknown>>({})

  const readProps = useCallback(() => {
    if (!selectedObject) {
      setProps({})
      return
    }
    setProps({
      left: Math.round(selectedObject.left ?? 0),
      top: Math.round(selectedObject.top ?? 0),
      scaleX: +(selectedObject.scaleX ?? 1).toFixed(2),
      scaleY: +(selectedObject.scaleY ?? 1).toFixed(2),
      angle: Math.round(selectedObject.angle ?? 0),
      opacity: +(selectedObject.opacity ?? 1).toFixed(2),
      // Image filters
      ...(selectedObject.type === 'image'
        ? {
            brightness: getFilterValue(
              selectedObject as fabric.FabricImage,
              'Brightness',
              'brightness',
              0
            ),
            contrast: getFilterValue(
              selectedObject as fabric.FabricImage,
              'Contrast',
              'contrast',
              0
            ),
          }
        : {}),
      // Text props
      ...(isTextObject(selectedObject)
        ? {
            fontSize: (selectedObject as fabric.IText).fontSize,
            fontFamily: (selectedObject as fabric.IText).fontFamily,
            fill: (selectedObject as fabric.IText).fill,
            fontWeight: (selectedObject as fabric.IText).fontWeight,
            fontStyle: (selectedObject as fabric.IText).fontStyle,
          }
        : {}),
    })
  }, [selectedObject])

  useEffect(() => {
    readProps()
  }, [readProps])

  const updateProp = (key: string, value: unknown) => {
    if (!selectedObject) return
    const canvas = editorRef.current?.getCanvas()
    if (!canvas) return

    if (key === 'brightness' || key === 'contrast') {
      updateImageFilter(selectedObject as fabric.FabricImage, key, value as number, canvas)
    } else {
      selectedObject.set(key as keyof fabric.FabricObject, value as never)
      canvas.renderAll()
    }
    setProps((p) => ({ ...p, [key]: value }))
    onModified()
  }

  if (!selectedObject) {
    return (
      <div className="text-xs text-neutral-400 text-center py-4">
        Selecciona un elemento para ver sus propiedades
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        Propiedades
      </h3>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="X"
          value={props.left as number}
          onChange={(v) => updateProp('left', v)}
        />
        <NumberField label="Y" value={props.top as number} onChange={(v) => updateProp('top', v)} />
      </div>

      {/* Scale */}
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Ancho %"
          value={Math.round((props.scaleX as number) * 100)}
          onChange={(v) => {
            const scale = v / 100
            updateProp('scaleX', scale)
            updateProp('scaleY', scale)
          }}
          min={5}
          max={500}
        />
        <NumberField
          label="Ángulo"
          value={props.angle as number}
          onChange={(v) => updateProp('angle', v)}
          min={0}
          max={360}
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="text-xs text-neutral-500">Opacidad</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={(props.opacity as number) ?? 1}
          onChange={(e) => updateProp('opacity', parseFloat(e.target.value))}
          className="w-full mt-1"
        />
        <span className="text-xs text-neutral-400">
          {Math.round(((props.opacity as number) ?? 1) * 100)}%
        </span>
      </div>

      {/* Image filters */}
      {selectedObject.type === 'image' && (
        <>
          <div>
            <label className="text-xs text-neutral-500">Brillo</label>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={(props.brightness as number) ?? 0}
              onChange={(e) => updateProp('brightness', parseFloat(e.target.value))}
              className="w-full mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Contraste</label>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={(props.contrast as number) ?? 0}
              onChange={(e) => updateProp('contrast', parseFloat(e.target.value))}
              className="w-full mt-1"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <FilterButton
              label="Grises"
              onClick={() =>
                toggleGrayscale(
                  selectedObject as fabric.FabricImage,
                  editorRef.current?.getCanvas()!,
                  onModified
                )
              }
            />
            <FilterButton
              label="Sepia"
              onClick={() =>
                toggleSepia(
                  selectedObject as fabric.FabricImage,
                  editorRef.current?.getCanvas()!,
                  onModified
                )
              }
            />
          </div>
        </>
      )}

      {/* Text properties */}
      {isTextObject(selectedObject) && (
        <>
          <div>
            <label className="text-xs text-neutral-500">Font size</label>
            <input
              type="number"
              value={props.fontSize as number}
              onChange={(e) => updateProp('fontSize', parseInt(e.target.value) || 12)}
              className="w-full mt-1 border border-neutral-200 rounded px-2 py-1 text-sm"
              min={8}
              max={200}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Text color</label>
            <input
              type="color"
              value={(props.fill as string) || '#000000'}
              onChange={(e) => updateProp('fill', e.target.value)}
              className="w-full h-8 mt-1 rounded border border-neutral-200 cursor-pointer"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() =>
                updateProp('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold')
              }
              className={`px-2 py-1 text-xs rounded border ${
                props.fontWeight === 'bold'
                  ? 'bg-primary-100 border-primary-300 text-primary-700'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() =>
                updateProp('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')
              }
              className={`px-2 py-1 text-xs rounded border ${
                props.fontStyle === 'italic'
                  ? 'bg-primary-100 border-primary-300 text-primary-700'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <em>I</em>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div>
      <label className="text-xs text-neutral-500">{label}</label>
      <input
        type="number"
        value={isNaN(value) ? 0 : value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        className="w-full mt-0.5 border border-neutral-200 rounded px-2 py-1 text-sm"
      />
    </div>
  )
}

function FilterButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 text-xs border border-neutral-200 rounded hover:bg-neutral-100 text-neutral-600 transition-colors"
    >
      {label}
    </button>
  )
}

function isTextObject(obj: fabric.FabricObject): boolean {
  return obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox'
}

function getFilterValue(
  img: fabric.FabricImage,
  filterType: string,
  prop: string,
  defaultVal: number
): number {
  const filters = img.filters || []
  const filter = filters.find(
    (f: unknown) => f && (f as Record<string, unknown>).type === filterType
  )
  if (filter) return (filter as unknown as Record<string, number>)[prop] ?? defaultVal
  return defaultVal
}

async function updateImageFilter(
  img: fabric.FabricImage,
  filterName: string,
  value: number,
  canvas: fabric.Canvas
) {
  const { filters: fabricFilters } = await import('fabric')
  if (!img.filters) img.filters = []

  const FilterClass =
    filterName === 'brightness' ? fabricFilters.Brightness : fabricFilters.Contrast

  const filterType = filterName === 'brightness' ? 'Brightness' : 'Contrast'

  const idx = img.filters.findIndex(
    (f: unknown) => f && (f as Record<string, unknown>).type === filterType
  )
  if (idx >= 0) {
    ;(img.filters[idx] as unknown as Record<string, unknown>)[filterName] = value
  } else {
    img.filters.push(new FilterClass({ [filterName]: value }))
  }
  img.applyFilters()
  canvas.renderAll()
}

async function toggleGrayscale(
  img: fabric.FabricImage,
  canvas: fabric.Canvas,
  onModified: () => void
) {
  const { filters: fabricFilters } = await import('fabric')
  if (!img.filters) img.filters = []
  const idx = img.filters.findIndex(
    (f: unknown) => f && (f as Record<string, unknown>).type === 'Grayscale'
  )
  if (idx >= 0) {
    img.filters.splice(idx, 1)
  } else {
    img.filters.push(new fabricFilters.Grayscale())
  }
  img.applyFilters()
  canvas.renderAll()
  onModified()
}

async function toggleSepia(img: fabric.FabricImage, canvas: fabric.Canvas, onModified: () => void) {
  const { filters: fabricFilters } = await import('fabric')
  if (!img.filters) img.filters = []
  // Sepia is implemented as a ColorMatrix in fabric.js — we use a custom approach
  const idx = img.filters.findIndex(
    (f: unknown) => f && (f as Record<string, unknown>).type === 'Sepia'
  )
  if (idx >= 0) {
    img.filters.splice(idx, 1)
  } else {
    img.filters.push(new fabricFilters.Sepia())
  }
  img.applyFilters()
  canvas.renderAll()
  onModified()
}
