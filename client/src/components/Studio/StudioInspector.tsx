import type { BookElement, BookPageNumbers, BookPageSetup, BookShapeId, JourneyStats } from '@trek/shared'
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDown, ArrowUp,
  ChevronsDown, ChevronsUp, Lock, Trash2, Unlock,
} from 'lucide-react'
import { useRef } from 'react'
import { useStudioStore } from '../../store/studioStore'
import { photoSrc } from './bookRender'
import { BOOK_FONTS, BOOK_FONT_ORDER, hasWeight, nearestWeight } from './bookFonts'
import { FRAME_SHAPES, SHAPE_GROUPS } from './shapes'
import { ShapeGlyph } from './StudioElementsPanel'
import { TravelInspector } from './StudioTravelInspector'
import { Swatches } from './StudioSwatches'

/**
 * Properties of whatever is selected.
 *
 * Deliberately narrow: it shows what the selected thing actually has, and
 * nothing else. A panel that lists every property of every element type with
 * most of them greyed out reads as a settings dialog, not as a tool.
 */

export function StudioInspector({
  spreadIndex,
  page,
  stats,
  setPageNumbers,
  t,
  locale,
}: {
  spreadIndex: number
  page: BookPageSetup
  setPageNumbers: (patch: Partial<BookPageNumbers>) => void
  /** Live journey figures, so a travel element can be brought up to date. */
  stats: JourneyStats | null
  t: (k: string) => string
  locale: string
}) {
  const doc = useStudioStore(s => s.doc)
  const selection = useStudioStore(s => s.selection)
  const update = useStudioStore(s => s.updateElement)
  const commit = useStudioStore(s => s.commit)
  const raise = useStudioStore(s => s.raise)
  const removeElements = useStudioStore(s => s.removeElements)

  const spread = doc?.spreads[spreadIndex]
  const sel = spread?.elements.filter(e => selection.includes(e.id)) ?? []

  if (!sel.length) {
    /*
     * Nothing selected, so this is where the *book's* own settings belong.
     * The panel was showing one line of hint text and nothing else, and page
     * numbers have nowhere else to go: they are not a property of any element,
     * because the number a page carries depends on where its spread sits.
     */
    const folios = page.pageNumbers
    return (
      <aside className="st-panel st-inspector">
        <div className="st-panel-head"><span>{t('journey.studio.document')}</span></div>
        <div className="st-panel-scroll">
          <Section label={t('journey.studio.pageNumbers')}>
            <div className="st-row">
              <button
                className={`st-chip ${folios.show ? 'is-on' : ''}`}
                onClick={() => setPageNumbers({ show: !folios.show })}
              >
                {t(folios.show ? 'journey.studio.pageNumbersOn' : 'journey.studio.pageNumbersOff')}
              </button>
            </div>

            {folios.show && (
              <>
                <div className="st-row" style={{ marginTop: 8 }}>
                  {(['outer', 'inner', 'centre'] as const).map(pos => (
                    <button
                      key={pos}
                      className={`st-chip ${folios.position === pos ? 'is-on' : ''}`}
                      onClick={() => setPageNumbers({ position: pos })}
                    >
                      {t(`journey.studio.folio.${pos}`)}
                    </button>
                  ))}
                </div>
                <div className="st-grid2" style={{ marginTop: 8 }}>
                  <Num
                    label={t('journey.studio.folioStart')}
                    value={folios.startAt}
                    min={0}
                    max={9999}
                    step={1}
                    onChange={v => setPageNumbers({ startAt: Math.round(v) })}
                  />
                  <Num
                    label="pt"
                    value={folios.size}
                    min={4}
                    max={48}
                    step={0.5}
                    onChange={v => setPageNumbers({ size: v })}
                  />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Num
                    label={t('journey.studio.folioMargin')}
                    value={folios.margin}
                    min={0}
                    max={60}
                    step={0.5}
                    onChange={v => setPageNumbers({ margin: v })}
                  />
                </div>
                {/*
                  Automatic first, and picking a colour is what turns it off —
                  no separate switch to find and no state where a chosen colour
                  is quietly ignored.
                */}
                <div className="st-row" style={{ marginTop: 8 }}>
                  <button
                    className={`st-chip ${folios.autoColor ? 'is-on' : ''}`}
                    onClick={() => setPageNumbers({ autoColor: true })}
                    aria-pressed={folios.autoColor}
                  >
                    {t('journey.studio.folioAuto')}
                  </button>
                </div>
                <div style={{ marginTop: 8, opacity: folios.autoColor ? 0.45 : 1 }}>
                  <Swatches
                    value={folios.color}
                    onPick={c => setPageNumbers({ color: c, autoColor: false })}
                  />
                </div>
              </>
            )}
          </Section>

          <p className="st-hint">{t('journey.studio.inspectorEmpty')}</p>
        </div>
      </aside>
    )
  }

  const el = sel[0]
  const one = sel.length === 1

  // A property edit is one undo step on its own; only drags open a gesture.
  const set = (patch: Partial<BookElement>) => commit(d => ({
    ...d,
    spreads: d.spreads.map((sp, i) => (i !== spreadIndex ? sp : {
      ...sp,
      elements: sp.elements.map(e => (selection.includes(e.id) ? ({ ...e, ...patch } as BookElement) : e)),
    })),
  }))

  const live = (patch: Partial<BookElement>) => update(spreadIndex, el.id, patch)

  return (
    <aside className="st-panel st-inspector">
      <div className="st-panel-head">
        <span>{one ? t(`journey.studio.kind.${el.kind}`) : t('journey.studio.multiple')}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{sel.length > 1 ? sel.length : ''}</span>
      </div>

      <div className="st-panel-scroll">
        {one && (
          <Section label={t('journey.studio.position')}>
            <div className="st-grid2">
              <Num label="X" value={el.frame.x} onChange={v => set({ frame: { ...el.frame, x: v } })} />
              <Num label="Y" value={el.frame.y} onChange={v => set({ frame: { ...el.frame, y: v } })} />
              <Num label={t('journey.studio.width')} value={el.frame.w} min={4} onChange={v => set({ frame: { ...el.frame, w: v } })} />
              <Num label={t('journey.studio.height')} value={el.frame.h} min={4} onChange={v => set({ frame: { ...el.frame, h: v } })} />
            </div>
          </Section>
        )}

        {el.kind === 'text' && (
          <>
            <Section label={t('journey.studio.text')}>
              <textarea
                className="st-input st-textarea"
                value={el.text}
                rows={5}
                onChange={e => live({ text: e.target.value, overridden: true })}
                onBlur={e => set({ text: e.target.value, overridden: true })}
              />
              {el.binding && !el.overridden && (
                <p className="st-hint" style={{ paddingTop: 6 }}>{t('journey.studio.boundHint')}</p>
              )}
            </Section>

            <Section label={t('journey.studio.typography')}>
              {/*
                Each family set in itself, because a list of names tells you
                nothing about a typeface — and grouped, because "which serif"
                is a different question from "serif or sans".
              */}
              <div className="st-fonts">
                {BOOK_FONT_ORDER.map(id => {
                  const font = BOOK_FONTS[id]
                  return (
                    <button
                      key={id}
                      className={`st-font ${el.font === id ? 'is-on' : ''}`}
                      style={{ fontFamily: font.stack }}
                      onClick={() => set({
                        font: id,
                        // A family that does not ship this weight would render a
                        // synthesised bold — a smeared regular in print — so the
                        // weight moves to the nearest one it really has.
                        weight: nearestWeight(id, el.weight) as typeof el.weight,
                      })}
                      title={font.name}
                    >
                      {font.name}
                    </button>
                  )
                })}
              </div>
              <div className="st-grid2" style={{ marginTop: 8 }}>
                <Num label="pt" value={el.size} min={4} max={200} step={0.5} onChange={v => set({ size: v })} />
                <Num label={t('journey.studio.leading')} value={el.leading} min={0.7} max={3} step={0.05} onChange={v => set({ leading: v })} />
              </div>
              <div className="st-row" style={{ marginTop: 8 }}>
                {([400, 500, 600, 700] as const).map(w => (
                  <button
                    key={w}
                    className={`st-chip ${el.weight === w ? 'is-on' : ''}`}
                    disabled={!hasWeight(el.font, w)}
                    title={hasWeight(el.font, w) ? undefined : t('journey.studio.weightMissing')}
                    onClick={() => set({ weight: w })}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <div className="st-row" style={{ marginTop: 8 }}>
                {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight], ['justify', AlignJustify]] as const).map(([a, Icon]) => (
                  <button key={a} className={`st-chip is-icon ${el.align === a ? 'is-on' : ''}`} onClick={() => set({ align: a })} aria-label={a}>
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </Section>

            <Section label={t('journey.studio.colour')}>
              <Swatches value={el.color} onPick={c => set({ color: c })} />
            </Section>
          </>
        )}

        {el.kind === 'photo' && (
          <>
            <Section label={t('journey.studio.crop')}>
              <div className="st-row">
                {(['cover', 'contain'] as const).map(f => (
                  <button key={f} className={`st-chip ${el.fit === f ? 'is-on' : ''}`} onClick={() => set({ fit: f })}>
                    {t(`journey.studio.fit.${f}`)}
                  </button>
                ))}
              </div>
              <FocalPad
                photoId={el.photoId}
                x={el.focalX}
                y={el.focalY}
                onDrag={(x, y) => live({ focalX: x, focalY: y })}
                onCommit={(x, y) => set({ focalX: x, focalY: y })}
                hint={t('journey.studio.focalHint')}
              />
            </Section>
            <Section label={t('journey.studio.look')}>
              <div className="st-row" style={{ flexWrap: 'wrap' }}>
                {(['none', 'bw', 'warm', 'cool', 'fade', 'contrast'] as const).map(f => (
                  <button key={f} className={`st-chip ${el.filter === f ? 'is-on' : ''}`} onClick={() => set({ filter: f })}>
                    {t(`journey.studio.filter.${f}`)}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                {/* A corner radius and a mask are the same idea at different
                    resolutions, so the radius steps aside once a shape is cut. */}
                <Num
                  label={t('journey.studio.radius')}
                  value={el.radius}
                  min={0}
                  max={60}
                  step={0.5}
                  onChange={v => set({ radius: v })}
                />
              </div>
            </Section>

            <Section label={t('journey.studio.frameStyle')}>
              <div className="st-row" style={{ flexWrap: 'wrap' }}>
                {([
                  ['none', 'plainFrame'],
                  ['polaroid', 'polaroidFrame'],
                  ['white', 'whiteFrame'],
                  ['shadow', 'shadowFrame'],
                  ['film', 'filmFrame'],
                  ['tape', 'tapeFrame'],
                ] as const).map(([style, key]) => (
                  <button
                    key={style}
                    className={`st-chip ${el.frameStyle === style ? 'is-on' : ''}`}
                    onClick={() => set({ frameStyle: style })}
                  >
                    {t(`journey.studio.${key}`)}
                  </button>
                ))}
              </div>
            </Section>

            <Section label={t('journey.studio.mask')}>
              <div className="st-mini-shapes">
                <button
                  className={`st-mini-shape ${el.mask ? '' : 'is-on'}`}
                  onClick={() => set({ mask: null })}
                  title={t('journey.studio.maskNone')}
                >
                  <span className="st-mini-none" />
                </button>
                {FRAME_SHAPES.filter(sh => sh !== 'rect').map(sh => (
                  <button
                    key={sh}
                    className={`st-mini-shape ${el.mask === sh ? 'is-on' : ''}`}
                    onClick={() => set({ mask: sh })}
                    aria-label={sh}
                  >
                    <ShapeGlyph shape={sh} />
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        {el.kind === 'shape' && (
          <>
            <Section label={t('journey.studio.shape')}>
              {/* Every shape, not just the two the element started as: swapping
                  a placed shape keeps its position, size and colour, which
                  deleting and re-adding would not. */}
              <div className="st-mini-shapes">
                {SHAPE_GROUPS.flatMap(g => g.shapes).map((sh: BookShapeId) => (
                  <button
                    key={sh}
                    className={`st-mini-shape ${el.shape === sh ? 'is-on' : ''}`}
                    onClick={() => set({ shape: sh })}
                    aria-label={sh}
                  >
                    <ShapeGlyph shape={sh} />
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <Swatches value={el.fill ?? '#111111'} onPick={c => set({ fill: c })} />
              </div>
            </Section>

            <Section label={t('journey.studio.strokeStyle')}>
              <div className="st-row">
                {([
                  ['solid', 'strokeSolid'],
                  ['dashed', 'strokeDashed'],
                  ['dotted', 'strokeDotted'],
                ] as const).map(([style, key]) => (
                  <button
                    key={style}
                    className={`st-chip ${el.strokeStyle === style ? 'is-on' : ''}`}
                    onClick={() => set({
                      strokeStyle: style,
                      // A stroke style with no stroke is invisible, so asking
                      // for dashes turns the outline on rather than doing
                      // nothing and looking broken.
                      ...(el.stroke ? {} : { stroke: el.fill ?? '#141414', strokeWidth: el.strokeWidth || 0.5 }),
                    })}
                  >
                    {t(`journey.studio.${key}`)}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <Num
                  label={t('journey.studio.strokeStyle')}
                  value={el.strokeWidth}
                  min={0}
                  max={20}
                  step={0.1}
                  onChange={v => set({ strokeWidth: v, ...(v > 0 && !el.stroke ? { stroke: '#141414' } : {}) })}
                />
              </div>
            </Section>
          </>
        )}

        <TravelInspector el={el} stats={stats} set={set} t={t} locale={locale} Section={Section} />

        <Section label={t('journey.studio.arrange')}>
          <div className="st-row">
            <button className="st-chip is-icon" onClick={() => raise(spreadIndex, el.id, 'front')} title={t('journey.studio.toFront')}>
              <ChevronsUp size={14} />
            </button>
            <button className="st-chip is-icon" onClick={() => raise(spreadIndex, el.id, 'up')} title={t('journey.studio.forward')}>
              <ArrowUp size={14} />
            </button>
            <button className="st-chip is-icon" onClick={() => raise(spreadIndex, el.id, 'down')} title={t('journey.studio.backward')}>
              <ArrowDown size={14} />
            </button>
            <button className="st-chip is-icon" onClick={() => raise(spreadIndex, el.id, 'back')} title={t('journey.studio.toBack')}>
              <ChevronsDown size={14} />
            </button>
          </div>
          <div className="st-row" style={{ marginTop: 8 }}>
            <button className="st-chip" onClick={() => set({ locked: !el.locked })}>
              {el.locked ? <Unlock size={13} /> : <Lock size={13} />}
              {t(el.locked ? 'journey.studio.unlock' : 'journey.studio.lock')}
            </button>
            <button className="st-chip is-danger" onClick={() => removeElements(spreadIndex, selection)}>
              <Trash2 size={13} />
              {t('journey.studio.delete')}
            </button>
          </div>
        </Section>

        <p className="st-hint" style={{ paddingTop: 4 }}>
          {t('journey.studio.pageHint')} {page.pageWidth} × {page.pageHeight} mm
        </p>
      </div>
    </aside>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="st-section">
      <div className="st-section-label">{label}</div>
      {children}
    </div>
  )
}

function Num({
  label, value, onChange, min, max, step = 0.5,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <label className="st-field">
      <span>{label}</span>
      <input
        className="st-input"
        type="number"
        value={Math.round(value * 100) / 100}
        step={step}
        min={min}
        max={max}
        onChange={e => {
          const v = Number(e.target.value)
          if (Number.isFinite(v)) onChange(v)
        }}
      />
    </label>
  )
}

/**
 * Where the picture is anchored inside its frame.
 *
 * Two sliders were the first draft and they were the wrong instrument: a focal
 * point is one position in a plane, not two unrelated numbers, and nobody can
 * predict what "X 0.62" does to a photograph. Dragging the point over the actual
 * image answers the question by showing it.
 */
function FocalPad({
  photoId, x, y, onDrag, onCommit, hint,
}: {
  photoId: number
  x: number
  y: number
  onDrag: (x: number, y: number) => void
  onCommit: (x: number, y: number) => void
  hint: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const last = useRef({ x, y })

  const from = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
    last.current = { x: nx, y: ny }
    return last.current
  }

  return (
    <div className="st-focal-wrap">
      <div
        className="st-focal"
        ref={box}
        onPointerDown={e => {
          (e.target as Element).setPointerCapture(e.pointerId)
          const p = from(e)
          onDrag(p.x, p.y)
        }}
        onPointerMove={e => {
          if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return
          const p = from(e)
          onDrag(p.x, p.y)
        }}
        onPointerUp={() => onCommit(last.current.x, last.current.y)}
      >
        <img src={photoSrc(photoId, false)} alt="" draggable={false} />
        <span className="st-focal-dot" style={{ left: `${x * 100}%`, top: `${y * 100}%` }} />
      </div>
      <p className="st-hint" style={{ padding: '6px 0 0' }}>{hint}</p>
    </div>
  )
}
