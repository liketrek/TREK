import type { BookElement, BookPageNumbers, BookPageSetup, BookShapeId, JourneyStats } from '@trek/shared'
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDown, ArrowUp,
  ChevronsDown, ChevronsUp, Copy, Italic, Lock, Trash2, Unlock,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useStudioStore } from '../../store/studioStore'
import { photoSrc } from './bookRender'
import { BOOK_FONTS, BOOK_FONT_ORDER, hasWeight, nearestWeight } from './bookFonts'
import { FRAME_SHAPES, SHAPE_GROUPS } from './shapes'
import { ShapeGlyph } from './StudioElementsPanel'
import { TravelInspector } from './StudioTravelInspector'
import { Swatches } from './StudioSwatches'
import { formatBookCoords } from './entryText'
import { iconComponent, iconLabel, searchIcons } from './iconLibrary'
import { Choice, Line, NumField, Section, Switch } from './StudioControls'
import type { JourneySource } from './StudioSidebar'

/** How many icons the swap grid offers at once. A search narrows it below this. */
const ICON_CHOICES = 60

/**
 * Properties of whatever is selected.
 *
 * ── What it shows, and in what order ─────────────────────────────────────
 *
 * Deliberately narrow: what the selected thing actually has, and nothing else.
 * A panel that lists every property of every element with most of them greyed
 * out reads as a settings dialog, not as a tool.
 *
 * The order is the same for every kind, because the panel is used by muscle
 * memory more than by reading: **what it says** first, then **how it looks**,
 * then **where it sits**, then **what is in front of what**. A photo's crop and
 * a mark's words are the same step in that sequence, so they sit in the same
 * place on the panel.
 *
 * The frame's numbers are folded away by default. They are the least-used group
 * in the panel — dragging is how anyone actually positions an element — and
 * four number fields left open at the top pushed everything worth looking at
 * below the fold.
 *
 * ── What is not here any more ────────────────────────────────────────────
 *
 * Duplicate, lock and delete are in the panel head rather than in a section of
 * their own: they act on the element rather than describing it, and a group
 * called "Arrange" that held two of those next to the stacking buttons was the
 * one group in the panel whose name did not say what was inside it.
 */

export function StudioInspector({
  spreadIndex,
  page,
  stats,
  source,
  setPageNumbers,
  t,
  locale,
}: {
  spreadIndex: number
  page: BookPageSetup
  setPageNumbers: (patch: Partial<BookPageNumbers>) => void
  /** Live journey figures, so a travel element can be brought up to date. */
  stats: JourneyStats | null
  /** The journal itself, so a bound mark can be re-set from it. */
  source: JourneySource
  t: (k: string) => string
  locale: string
}) {
  const [iconQuery, setIconQuery] = useState('')
  /*
   * A page of results, memoised because the inspector re-renders on every
   * pointer move of a drag and the library is fourteen hundred names long.
   */
  const iconChoices = useMemo(() => searchIcons(iconQuery).slice(0, ICON_CHOICES), [iconQuery])
  const doc = useStudioStore(s => s.doc)
  const selection = useStudioStore(s => s.selection)
  const update = useStudioStore(s => s.updateElement)
  const commit = useStudioStore(s => s.commit)
  const raise = useStudioStore(s => s.raise)
  const duplicate = useStudioStore(s => s.duplicate)
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
            <Switch
              label={t('journey.studio.pageNumbers')}
              on={folios.show}
              onToggle={() => setPageNumbers({ show: !folios.show })}
            />

            {folios.show && (
              <>
                <div style={{ marginTop: 10 }}>
                  <Line label={t('journey.studio.position')}>
                    <Choice
                      value={folios.position}
                      options={(['outer', 'inner', 'centre'] as const).map(pos => ({
                        value: pos, label: t(`journey.studio.folio.${pos}`),
                      }))}
                      onPick={position => setPageNumbers({ position })}
                    />
                  </Line>
                </div>
                <div className="st-grid2" style={{ marginTop: 10 }}>
                  <NumField
                    label={t('journey.studio.folioStart')}
                    value={folios.startAt}
                    min={0}
                    max={9999}
                    step={1}
                    onChange={v => setPageNumbers({ startAt: Math.round(v) })}
                  />
                  <NumField
                    label={t('journey.studio.size')}
                    value={folios.size}
                    min={4}
                    max={48}
                    step={0.5}
                    unit="pt"
                    onChange={v => setPageNumbers({ size: v })}
                  />
                </div>
                <div style={{ marginTop: 10 }}>
                  <NumField
                    label={t('journey.studio.folioMargin')}
                    value={folios.margin}
                    min={0}
                    max={60}
                    step={0.5}
                    unit="mm"
                    onChange={v => setPageNumbers({ margin: v })}
                  />
                </div>
                <div style={{ marginTop: 10 }}>
                  <Switch
                    label={t('journey.studio.folioAuto')}
                    on={folios.autoColor}
                    onToggle={() => setPageNumbers({ autoColor: !folios.autoColor })}
                  />
                </div>
                {/* Picking a colour is the other way to turn automatic off, so
                    the row stays reachable and simply reads as inactive. */}
                <div style={{ marginTop: 10, opacity: folios.autoColor ? 0.45 : 1 }}>
                  <Line label={t('journey.studio.colour')} wide>
                    <Swatches
                      value={folios.color}
                      onPick={c => setPageNumbers({ color: c, autoColor: false })}
                    />
                  </Line>
                </div>
              </>
            )}
          </Section>

          <p className="st-hint" style={{ paddingTop: 10 }}>
            {t('journey.studio.inspectorEmpty')}
          </p>
          <p className="st-hint" style={{ paddingTop: 6 }}>
            {t('journey.studio.pageHint')} {page.pageWidth} × {page.pageHeight} mm
          </p>
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
      {/*
        The head says what is selected and carries the three things you do TO
        it. It used to say only the kind, in the same small capitals as every
        section label below it, which left the panel with no top.
      */}
      <div className="st-panel-head st-inspector-head">
        <span className="st-what">
          {one ? t(`journey.studio.kind.${el.kind}`) : t('journey.studio.multiple')}
          {sel.length > 1 && <em>{sel.length}</em>}
        </span>
        <span className="st-head-acts">
          <button type="button"
            className="st-act"
            onClick={() => duplicate(spreadIndex, selection)}
            title={t('journey.studio.duplicate')}
            aria-label={t('journey.studio.duplicate')}
          >
            <Copy size={14} />
          </button>
          <button type="button"
            className={`st-act ${el.locked ? 'is-on' : ''}`}
            onClick={() => set({ locked: !el.locked })}
            title={t(el.locked ? 'journey.studio.unlock' : 'journey.studio.lock')}
            aria-label={t(el.locked ? 'journey.studio.unlock' : 'journey.studio.lock')}
            aria-pressed={el.locked}
          >
            {el.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <button type="button"
            className="st-act is-danger"
            onClick={() => removeElements(spreadIndex, selection)}
            title={t('journey.studio.delete')}
            aria-label={t('journey.studio.delete')}
          >
            <Trash2 size={14} />
          </button>
        </span>
      </div>

      <div className="st-panel-scroll">
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
              {/*
                How a point is set. Only a coordinate binding has the question,
                and answering it re-sets the words on the spot rather than at
                the next open — switching a notation and seeing nothing happen
                reads as a broken control. Deliberately not `overridden`:
                choosing a format is not writing the text.
              */}
              {el.binding?.source === 'entry.location' && el.binding.format && (
                <div style={{ marginTop: 10 }}>
                  <Line label={t('journey.studio.coordsMark')}>
                    <Choice
                      value={el.binding.format}
                      options={[
                        { value: 'dms' as const, label: t('journey.studio.coordsDms') },
                        { value: 'decimal' as const, label: t('journey.studio.coordsDecimal') },
                      ]}
                      onPick={f => {
                        const entry = source.entries.find(e => e.id === el.binding!.entryId)
                        const text = entry?.lat != null && entry.lng != null
                          ? formatBookCoords(entry.lat, entry.lng, f)
                          : el.text
                        set({ binding: { ...el.binding!, format: f }, text })
                      }}
                    />
                  </Line>
                </div>
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
                    <button type="button"
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
              <div style={{ marginTop: 10 }}>
                <Line label={t('journey.studio.weight')}>
                  <Choice
                    value={el.weight}
                    options={([400, 500, 600, 700] as const).map(w => ({
                      value: w,
                      label: String(w),
                      disabled: !hasWeight(el.font, w),
                      title: hasWeight(el.font, w) ? undefined : t('journey.studio.weightMissing'),
                    }))}
                    onPick={weight => set({ weight })}
                  />
                </Line>
                <Line label={t('journey.studio.align')}>
                  <div className="st-row">
                    {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight], ['justify', AlignJustify]] as const).map(([a, Icon]) => (
                      <button type="button"
                        key={a}
                        className={`st-chip is-icon ${el.align === a ? 'is-on' : ''}`}
                        onClick={() => set({ align: a })}
                        aria-label={a}
                      >
                        <Icon size={14} />
                      </button>
                    ))}
                    {/* Italic sits with the alignment because both are things
                        you do to a line rather than to a typeface. It had no
                        control at all before, though the renderer drew it. */}
                    <button type="button"
                      className={`st-chip is-icon ${el.italic ? 'is-on' : ''}`}
                      onClick={() => set({ italic: !el.italic })}
                      title={t('journey.studio.italic')}
                      aria-label={t('journey.studio.italic')}
                      aria-pressed={el.italic}
                    >
                      <Italic size={14} />
                    </button>
                  </div>
                </Line>
              </div>
              <div className="st-grid2" style={{ marginTop: 10 }}>
                <NumField label={t('journey.studio.size')} value={el.size} min={4} max={200} step={0.5} unit="pt" onChange={v => set({ size: v })} />
                <NumField label={t('journey.studio.leading')} value={el.leading} min={0.7} max={3} step={0.05} onChange={v => set({ leading: v })} />
              </div>
              <div style={{ marginTop: 10 }}>
                {/*
                  Letter spacing was rendered but had no control, so type the
                  layout had tracked out could be edited in every way except the
                  one that made it look like that.
                */}
                <NumField
                  label={t('journey.studio.tracking')}
                  value={el.tracking}
                  min={-0.2}
                  max={1}
                  step={0.01}
                  unit="em"
                  onChange={v => set({ tracking: v })}
                />
              </div>
            </Section>

            <Section label={t('journey.studio.colour')}>
              <Line label={t('journey.studio.text')} wide>
                <Swatches value={el.color} onPick={c => set({ color: c })} />
              </Line>
            </Section>
          </>
        )}

        {el.kind === 'photo' && (
          <>
            <Section label={t('journey.studio.crop')}>
              <Line label={t('journey.studio.crop')} wide>
                <Choice
                  value={el.fit}
                  options={(['cover', 'contain'] as const).map(f => ({
                    value: f, label: t(`journey.studio.fit.${f}`),
                  }))}
                  onPick={fit => set({ fit })}
                />
              </Line>
              {/*
                An empty frame has no picture to aim at, and asking for one by
                id produced a request for /api/photos/null/thumbnail and a
                broken image under a caption telling you to drag it.
              */}
              {el.photoId != null ? (
                <FocalPad
                  photoId={el.photoId}
                  x={el.focalX}
                  y={el.focalY}
                  onDrag={(x, y) => live({ focalX: x, focalY: y })}
                  onCommit={(x, y) => set({ focalX: x, focalY: y })}
                  hint={t('journey.studio.focalHint')}
                />
              ) : (
                <p className="st-hint" style={{ paddingTop: 8 }}>{t('journey.studio.emptyFrame')}</p>
              )}
            </Section>

            <Section label={t('journey.studio.look')}>
              <Line label={t('journey.studio.look')} wide>
                <Choice
                  value={el.filter}
                  options={(['none', 'bw', 'warm', 'cool', 'fade', 'contrast'] as const).map(f => ({
                    value: f, label: t(`journey.studio.filter.${f}`),
                  }))}
                  onPick={filter => set({ filter })}
                />
              </Line>
              <div style={{ marginTop: 10 }}>
                <Line label={t('journey.studio.frameStyle')} wide>
                  <Choice
                    value={el.frameStyle}
                    options={([
                      ['none', 'plainFrame'],
                      ['polaroid', 'polaroidFrame'],
                      ['white', 'whiteFrame'],
                      ['shadow', 'shadowFrame'],
                      ['film', 'filmFrame'],
                      ['tape', 'tapeFrame'],
                    ] as const).map(([style, key]) => ({ value: style, label: t(`journey.studio.${key}`) }))}
                    onPick={frameStyle => set({ frameStyle })}
                  />
                </Line>
              </div>
              {/* A corner radius and a mask are the same idea at different
                  resolutions, so the radius steps aside once a shape is cut.
                  It did not, and edited a property the renderer ignored. */}
              {(!el.mask || el.mask === 'rect') && (
                <div style={{ marginTop: 10 }}>
                  <NumField
                    label={t('journey.studio.radius')}
                    value={el.radius}
                    min={0}
                    max={60}
                    step={0.5}
                    unit="mm"
                    onChange={v => set({ radius: v })}
                  />
                </div>
              )}
            </Section>

            <Section label={t('journey.studio.mask')} defaultOpen={false}>
              <div className="st-mini-shapes">
                <button type="button"
                  className={`st-mini-shape ${el.mask ? '' : 'is-on'}`}
                  onClick={() => set({ mask: null })}
                  title={t('journey.studio.maskNone')}
                >
                  <span className="st-mini-none" />
                </button>
                {FRAME_SHAPES.filter(sh => sh !== 'rect').map(sh => (
                  <button type="button"
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
                  <button type="button"
                    key={sh}
                    className={`st-mini-shape ${el.shape === sh ? 'is-on' : ''}`}
                    onClick={() => set({ shape: sh })}
                    aria-label={sh}
                  >
                    <ShapeGlyph shape={sh} />
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                {/* A photo had a corner radius and a shape did not, although
                    both store the same field and the renderer draws both. */}
                <NumField
                  label={t('journey.studio.radius')}
                  value={el.radius}
                  min={0}
                  max={60}
                  step={0.5}
                  unit="mm"
                  onChange={v => set({ radius: v })}
                />
              </div>
            </Section>

            <Section label={t('journey.studio.colour')}>
              {/*
                Fill and stroke, both named. The panel used to show one
                unlabelled swatch row that wrote `fill`, so on an outline-only
                shape it lit up a colour that was not being drawn and there was
                no way to reach the line you could actually see.
              */}
              <Line label={t('journey.studio.fill')} wide>
                <Swatches value={el.fill ?? '#111111'} onPick={c => set({ fill: c })} />
              </Line>
              <Line label={t('journey.studio.stroke')} wide>
                <Swatches
                  value={el.stroke ?? '#141414'}
                  onPick={c => set({ stroke: c, strokeWidth: el.strokeWidth || 0.5 })}
                />
              </Line>
              <div style={{ marginTop: 10 }}>
                <Switch
                  label={t('journey.studio.fillOn')}
                  on={el.fill !== null}
                  onToggle={() => set({
                    // Turning the fill off on a shape with no stroke would make
                    // it invisible, so the outline comes on with it.
                    fill: el.fill === null ? '#111111' : null,
                    ...(el.fill !== null && !el.stroke ? { stroke: '#141414', strokeWidth: el.strokeWidth || 0.5 } : {}),
                  })}
                />
                <Switch
                  label={t('journey.studio.gradient')}
                  on={el.gradient !== 'none'}
                  onToggle={() => set({ gradient: el.gradient === 'none' ? 'down' : 'none' })}
                />
              </div>
              {el.gradient !== 'none' && (
                <div style={{ marginTop: 10 }}>
                  <Line label={t('journey.studio.gradient')}>
                    <Choice
                      value={el.gradient}
                      options={[
                        { value: 'down' as const, label: t('journey.studio.gradientDown') },
                        { value: 'up' as const, label: t('journey.studio.gradientUp') },
                      ]}
                      onPick={gradient => set({ gradient })}
                    />
                  </Line>
                </div>
              )}
            </Section>

            <Section label={t('journey.studio.strokeStyle')} defaultOpen={false}>
              <Line label={t('journey.studio.strokeStyle')} wide>
                <Choice
                  value={el.strokeStyle}
                  options={([
                    ['solid', 'strokeSolid'],
                    ['dashed', 'strokeDashed'],
                    ['dotted', 'strokeDotted'],
                  ] as const).map(([style, key]) => ({ value: style, label: t(`journey.studio.${key}`) }))}
                  onPick={strokeStyle => set({
                    strokeStyle,
                    // A stroke style with no stroke is invisible, so asking for
                    // dashes turns the outline on rather than doing nothing.
                    ...(el.stroke ? {} : { stroke: el.fill ?? '#141414', strokeWidth: el.strokeWidth || 0.5 }),
                  })}
                />
              </Line>
              <div style={{ marginTop: 10 }}>
                <NumField
                  label={t('journey.studio.strokeWidth')}
                  value={el.strokeWidth}
                  min={0}
                  max={20}
                  step={0.1}
                  unit="mm"
                  onChange={v => set({ strokeWidth: v, ...(v > 0 && !el.stroke ? { stroke: '#141414' } : {}) })}
                />
              </div>
            </Section>
          </>
        )}

        {el.kind === 'icon' && (
          <>
            <Section label={t('journey.studio.icon')}>
              {/*
                A search rather than the whole library: the picker in the panel
                can afford to grow as it is scrolled, but the inspector is a
                column beside a page and its job here is swapping one drawing
                for a near neighbour. Swapping keeps the position, size and
                colour that deleting and re-placing would lose.
              */}
              <input
                className="st-input"
                value={iconQuery}
                onChange={e => setIconQuery(e.target.value)}
                placeholder={t('journey.studio.searchIcons')}
                aria-label={t('journey.studio.searchIcons')}
                spellCheck={false}
              />
              <div className="st-mini-shapes" style={{ marginTop: 8 }}>
                {iconChoices.map(name => {
                  const Glyph = iconComponent(name)
                  return (
                    <button type="button"
                      key={name}
                      className={`st-mini-shape ${el.name === name ? 'is-on' : ''}`}
                      onClick={() => set({ name })}
                      aria-label={name}
                      title={iconLabel(name)}
                    >
                      <Glyph strokeWidth={1.7} />
                    </button>
                  )
                })}
              </div>
            </Section>

            <Section label={t('journey.studio.colour')}>
              <Line label={t('journey.studio.icon')} wide>
                <Swatches value={el.color} onPick={c => set({ color: c })} />
              </Line>
              <div style={{ marginTop: 10 }}>
                <NumField
                  label={t('journey.studio.lineWidth')}
                  value={el.lineWidth}
                  min={0.25}
                  max={4}
                  step={0.25}
                  onChange={v => set({ lineWidth: v })}
                />
              </div>
            </Section>
          </>
        )}

        <TravelInspector el={el} stats={stats} set={set} t={t} locale={locale} />

        {/*
          Where it sits, folded away.

          Everything in here can be done by dragging, which is how it is
          actually done; the numbers are for the one time in ten you need the
          same margin on two pages. Opacity and rotation live here too — both
          were painted by the renderer and neither had a control anywhere.
        */}
        {one && (
          <Section label={t('journey.studio.position')} defaultOpen={false}>
            <div className="st-grid2">
              <NumField label="X" value={el.frame.x} unit="mm" onChange={v => set({ frame: { ...el.frame, x: v } })} />
              <NumField label="Y" value={el.frame.y} unit="mm" onChange={v => set({ frame: { ...el.frame, y: v } })} />
              <NumField label={t('journey.studio.width')} value={el.frame.w} min={4} unit="mm" onChange={v => set({ frame: { ...el.frame, w: v } })} />
              <NumField label={t('journey.studio.height')} value={el.frame.h} min={4} unit="mm" onChange={v => set({ frame: { ...el.frame, h: v } })} />
            </div>
            <div className="st-grid2" style={{ marginTop: 10 }}>
              <NumField
                label={t('journey.studio.rotation')}
                value={el.rotation}
                min={-180}
                max={180}
                step={1}
                unit="°"
                onChange={v => set({ rotation: v })}
              />
              <NumField
                label={t('journey.studio.opacity')}
                value={Math.round(el.opacity * 100)}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={v => set({ opacity: Math.min(1, Math.max(0, v / 100)) })}
              />
            </div>
          </Section>
        )}

        <Section label={t('journey.studio.arrange')} defaultOpen={false}>
          <div className="st-row">
            <button type="button" className="st-chip is-icon" onClick={() => raise(spreadIndex, el.id, 'front')} title={t('journey.studio.toFront')}>
              <ChevronsUp size={14} />
            </button>
            <button type="button" className="st-chip is-icon" onClick={() => raise(spreadIndex, el.id, 'up')} title={t('journey.studio.forward')}>
              <ArrowUp size={14} />
            </button>
            <button type="button" className="st-chip is-icon" onClick={() => raise(spreadIndex, el.id, 'down')} title={t('journey.studio.backward')}>
              <ArrowDown size={14} />
            </button>
            <button type="button" className="st-chip is-icon" onClick={() => raise(spreadIndex, el.id, 'back')} title={t('journey.studio.toBack')}>
              <ChevronsDown size={14} />
            </button>
          </div>
        </Section>
      </div>
    </aside>
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
