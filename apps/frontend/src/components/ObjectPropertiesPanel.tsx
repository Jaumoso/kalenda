import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import * as fabric from 'fabric'
import type { CanvasEditorHandle } from './CanvasEditor'
import { patchClipBorder } from './CanvasEditor'
import FontSelector from './FontSelector'
import ColorPicker from './ColorPicker'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Ban,
  Circle,
  Heart,
  Star,
  Hexagon,
  Sun,
} from 'lucide-react'

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
  const { t } = useTranslation()
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
            underline: (selectedObject as fabric.IText).underline,
            textAlign: (selectedObject as fabric.IText).textAlign,
            lineHeight: (selectedObject as fabric.IText).lineHeight,
            charSpacing: (selectedObject as fabric.IText).charSpacing,
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
    } else if (key === 'fontFamily' && isTextObject(selectedObject)) {
      // Font changes need special handling: wait for the font to be ready
      // before recalculating text dimensions
      const textObj = selectedObject as fabric.IText
      textObj.set('fontFamily', value as string)
      document.fonts.ready.then(() => {
        textObj.initDimensions()
        canvas.renderAll()
      })
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
        {t('objectProps.noSelection')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        {t('objectProps.title')}
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
          label={t('objectProps.widthPercent')}
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
          label={t('objectProps.angle')}
          value={props.angle as number}
          onChange={(v) => updateProp('angle', v)}
          min={0}
          max={360}
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="text-xs text-neutral-500">{t('objectProps.opacity')}</label>
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
            <label className="text-xs text-neutral-500">{t('objectProps.brightness')}</label>
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
            <label className="text-xs text-neutral-500">{t('objectProps.contrast')}</label>
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
              label={t('objectProps.grayscale')}
              onClick={() =>
                toggleGrayscale(
                  selectedObject as fabric.FabricImage,
                  editorRef.current?.getCanvas()!,
                  onModified
                )
              }
            />
            <FilterButton
              label={t('objectProps.sepia')}
              onClick={() =>
                toggleSepia(
                  selectedObject as fabric.FabricImage,
                  editorRef.current?.getCanvas()!,
                  onModified
                )
              }
            />
          </div>

          {/* Clip mask */}
          <div>
            <label className="text-xs text-neutral-500 block mb-1">
              {t('objectProps.clipMask')}
            </label>
            <div className="flex gap-1">
              {(
                [
                  ['none', <Ban size={14} key="none" />],
                  ['circle', <Circle size={14} key="circle" />],
                  ['heart', <Heart size={14} key="heart" />],
                  ['star', <Star size={14} key="star" />],
                  ['hexagon', <Hexagon size={14} key="hexagon" />],
                ] as [ClipMaskType, React.ReactNode][]
              ).map(([mask, icon]) => (
                <ToggleButton
                  key={mask}
                  active={getClipMaskType(selectedObject) === mask}
                  onClick={() => {
                    const canvas = editorRef.current?.getCanvas()
                    if (!canvas) return
                    applyClipMask(selectedObject, mask, canvas)
                    onModified()
                    readProps()
                  }}
                  title={t(`objectProps.mask${mask.charAt(0).toUpperCase() + mask.slice(1)}`)}
                >
                  {icon}
                </ToggleButton>
              ))}
            </div>
          </div>

          {/* Drop shadow */}
          <div>
            <label className="text-xs text-neutral-500 flex items-center gap-1.5 mb-1">
              <input
                type="checkbox"
                checked={!!selectedObject.shadow}
                onChange={(e) => {
                  const canvas = editorRef.current?.getCanvas()
                  if (!canvas) return
                  if (e.target.checked) {
                    selectedObject.shadow = new fabric.Shadow({
                      color: 'rgba(0,0,0,0.35)',
                      blur: 12,
                      offsetX: 4,
                      offsetY: 4,
                    })
                  } else {
                    selectedObject.shadow = null
                  }
                  selectedObject.dirty = true
                  canvas.renderAll()
                  onModified()
                  readProps()
                }}
                className="rounded"
              />
              <Sun size={12} />
              {t('objectProps.dropShadow')}
            </label>
            {selectedObject.shadow &&
              (() => {
                const shadow = selectedObject.shadow
                const updateShadow = (
                  key: 'blur' | 'offsetX' | 'offsetY' | 'color',
                  val: number | string
                ) => {
                  const canvas = editorRef.current?.getCanvas()
                  if (!canvas) return
                  Object.assign(shadow, { [key]: val })
                  selectedObject.dirty = true
                  canvas.renderAll()
                  onModified()
                  readProps()
                }
                return (
                  <div className="space-y-1.5 pl-1">
                    <div>
                      <label className="text-xs text-neutral-400">
                        {t('objectProps.shadowBlur')}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={60}
                        step={1}
                        value={shadow.blur ?? 12}
                        onChange={(e) => updateShadow('blur', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-neutral-400">{shadow.blur}px</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-neutral-400">
                          {t('objectProps.shadowOffsetX')}
                        </label>
                        <input
                          type="range"
                          min={-30}
                          max={30}
                          step={1}
                          value={shadow.offsetX ?? 4}
                          onChange={(e) => updateShadow('offsetX', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-neutral-400">{shadow.offsetX}px</span>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400">
                          {t('objectProps.shadowOffsetY')}
                        </label>
                        <input
                          type="range"
                          min={-30}
                          max={30}
                          step={1}
                          value={shadow.offsetY ?? 4}
                          onChange={(e) => updateShadow('offsetY', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-neutral-400">{shadow.offsetY}px</span>
                      </div>
                    </div>
                    <ColorPicker
                      label={t('objectProps.shadowColor')}
                      color={shadow.color ?? 'rgba(0,0,0,0.35)'}
                      onChange={(v) => updateShadow('color', v)}
                    />
                  </div>
                )
              })()}
          </div>

          {/* Image border / frame */}
          <div>
            <label className="text-xs text-neutral-500 block mb-1">{t('objectProps.border')}</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-neutral-400">{t('objectProps.borderWidth')}</label>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={1}
                  value={selectedObject.strokeWidth ?? 0}
                  onChange={(e) => {
                    const v = parseInt(e.target.value)
                    selectedObject.set('strokeWidth', v)
                    selectedObject.set('strokeUniform', true)
                    if (v > 0 && !selectedObject.stroke) {
                      selectedObject.set('stroke', '#ffffff')
                    }
                    editorRef.current?.getCanvas()?.renderAll()
                    onModified()
                    readProps()
                  }}
                  className="w-full mt-0.5"
                />
                <span className="text-xs text-neutral-400">
                  {selectedObject.strokeWidth ?? 0}px
                </span>
              </div>
              <ColorPicker
                label={t('objectProps.borderColor')}
                color={(selectedObject.stroke as string) || '#ffffff'}
                onChange={(v) => {
                  selectedObject.set('stroke', v)
                  editorRef.current?.getCanvas()?.renderAll()
                  onModified()
                  readProps()
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Text properties */}
      {isTextObject(selectedObject) && (
        <>
          {/* Font family */}
          <FontSelector
            label={t('objectProps.fontFamily')}
            value={(props.fontFamily as string) || 'Inter Variable'}
            onChange={(v) => updateProp('fontFamily', v)}
          />

          {/* Font size + color row */}
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label={t('objectProps.fontSize')}
              value={props.fontSize as number}
              onChange={(v) => updateProp('fontSize', v)}
              min={8}
              max={200}
            />
            <div className="flex flex-col">
              <ColorPicker
                label={t('objectProps.textColor')}
                color={(props.fill as string) || '#000000'}
                onChange={(v) => updateProp('fill', v)}
              />
            </div>
          </div>

          {/* Style toggles: Bold, Italic, Underline */}
          <div>
            <label className="text-xs text-neutral-500 block mb-1">{t('objectProps.style')}</label>
            <div className="flex gap-1">
              <ToggleButton
                active={props.fontWeight === 'bold'}
                onClick={() =>
                  updateProp('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold')
                }
                title={t('objectProps.bold')}
              >
                <Bold size={14} />
              </ToggleButton>
              <ToggleButton
                active={props.fontStyle === 'italic'}
                onClick={() =>
                  updateProp('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')
                }
                title={t('objectProps.italic')}
              >
                <Italic size={14} />
              </ToggleButton>
              <ToggleButton
                active={!!props.underline}
                onClick={() => updateProp('underline', !props.underline)}
                title={t('objectProps.underline')}
              >
                <Underline size={14} />
              </ToggleButton>
            </div>
          </div>

          {/* Text alignment */}
          <div>
            <label className="text-xs text-neutral-500 block mb-1">
              {t('objectProps.alignment')}
            </label>
            <div className="flex gap-1">
              <ToggleButton
                active={props.textAlign === 'left'}
                onClick={() => updateProp('textAlign', 'left')}
                title={t('objectProps.alignLeft')}
              >
                <AlignLeft size={14} />
              </ToggleButton>
              <ToggleButton
                active={props.textAlign === 'center'}
                onClick={() => updateProp('textAlign', 'center')}
                title={t('objectProps.alignCenter')}
              >
                <AlignCenter size={14} />
              </ToggleButton>
              <ToggleButton
                active={props.textAlign === 'right'}
                onClick={() => updateProp('textAlign', 'right')}
                title={t('objectProps.alignRight')}
              >
                <AlignRight size={14} />
              </ToggleButton>
            </div>
          </div>

          {/* Line height */}
          <div>
            <label className="text-xs text-neutral-500">{t('objectProps.lineHeight')}</label>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={(props.lineHeight as number) ?? 1.16}
              onChange={(e) => updateProp('lineHeight', parseFloat(e.target.value))}
              className="w-full mt-1"
            />
            <span className="text-xs text-neutral-400">
              {((props.lineHeight as number) ?? 1.16).toFixed(1)}
            </span>
          </div>

          {/* Letter spacing */}
          <div>
            <label className="text-xs text-neutral-500">{t('objectProps.charSpacing')}</label>
            <input
              type="range"
              min={-200}
              max={800}
              step={10}
              value={(props.charSpacing as number) ?? 0}
              onChange={(e) => updateProp('charSpacing', parseInt(e.target.value))}
              className="w-full mt-1"
            />
            <span className="text-xs text-neutral-400">{(props.charSpacing as number) ?? 0}</span>
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

function ToggleButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded border transition-colors ${
        active
          ? 'bg-primary-100 border-primary-300 text-primary-700'
          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
      }`}
    >
      {children}
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

// ── Clip mask types ──────────────────────────────────────────────────────────

type ClipMaskType = 'none' | 'circle' | 'heart' | 'star' | 'hexagon'

function getClipMaskType(obj: fabric.FabricObject): ClipMaskType {
  return (obj as fabric.FabricObject & { clipMaskType?: ClipMaskType }).clipMaskType || 'none'
}

function buildClipPath(type: ClipMaskType, w: number, h: number): fabric.FabricObject | undefined {
  const r = Math.min(w, h) / 2
  switch (type) {
    case 'circle':
      return new fabric.Circle({ radius: r, originX: 'center', originY: 'center' })
    case 'heart': {
      // Heart path in a 20×20 viewBox centred at (10,10), scaled to fit
      const s = (r * 2) / 20
      return new fabric.Path(
        'M 10,17 C 10,17 2,11 2,6.5 C 2,3.5 4.5,1 7,1 C 8.7,1 10,2.2 10,2.2 C 10,2.2 11.3,1 13,1 C 15.5,1 18,3.5 18,6.5 C 18,11 10,17 10,17 Z',
        { originX: 'center', originY: 'center', scaleX: s, scaleY: s, left: 0, top: 0 }
      )
    }
    case 'star': {
      const pts: { x: number; y: number }[] = []
      const outer = r,
        inner = r * 0.4
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * i) / 5 - Math.PI / 2
        const rad = i % 2 === 0 ? outer : inner
        pts.push({ x: rad * Math.cos(angle), y: rad * Math.sin(angle) })
      }
      return new fabric.Polygon(pts, { originX: 'center', originY: 'center' })
    }
    case 'hexagon': {
      const pts: { x: number; y: number }[] = []
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * i) / 3 - Math.PI / 6
        pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) })
      }
      return new fabric.Polygon(pts, { originX: 'center', originY: 'center' })
    }
    default:
      return undefined
  }
}

function applyClipMask(obj: fabric.FabricObject, type: ClipMaskType, canvas: fabric.Canvas) {
  const w = obj.width
  const h = obj.height
  obj.clipPath = buildClipPath(type, w, h)
  ;(obj as fabric.FabricObject & { clipMaskType?: ClipMaskType }).clipMaskType = type
  // Patch rendering so stroke/border draws outside the clip path
  if (type !== 'none') {
    patchClipBorder(obj)
  }
  obj.dirty = true
  canvas.renderAll()
}
