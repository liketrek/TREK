import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Quote, Search, Square, X } from 'lucide-react'
import type { BookElement, BookPageSetup, BookShapeId } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'
import { FRAME_SHAPES, HOLED_SHAPES, SHAPE_GROUPS, SHAPE_PATHS } from './shapes'
import { GRIDS, defaultGridBox, gridElements } from './grids'
import { PanelHead } from './StudioPanelHead'
import { FEATURED_ICONS, iconComponent, iconLabel, searchIcons } from './iconLibrary'

/**
 * Everything you can add that does not come from the journey: type, shapes,
 * picture frames, photo grids and the icon set.
 *
 * Four tabs rather than four more entries on the rail. They are all the same
 * kind of answer to "what do I put on this page", and a rail long enough to
 * hold them separately stops being faster to hit than a word would be.
 */

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

/** How many icons the grid draws at a time. Two screens' worth at four across. */
const ICON_PAGE = 120

type FrameStyle = 'none' | 'polaroid' | 'white' | 'shadow' | 'film' | 'tape'

/**
 * A shape as a tile.
 *
 * The same path the page will draw, so what you pick is what you get. In frame
 * mode it is filled with a sky-and-hill gradient, which is Canva's trick and a
 * good one: an outline tells you the silhouette, but only something
 * photograph-shaped inside it says "a picture goes here".
 */
export function ShapeGlyph({ shape, photo = false }: { shape: BookShapeId; photo?: boolean }) {
  const gid = `sg-${photo ? 'p' : 's'}-${shape}`
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {photo && (
        <defs>
          {/* theme-lint-disable — a frame preview stands in for a photograph, not for UI chrome */}
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cfe8f7" />
            <stop offset="52%" stopColor="#e8f2f8" />
            <stop offset="53%" stopColor="#8fbf59" />
            <stop offset="100%" stopColor="#5d8f33" />
          </linearGradient>
        </defs>
      )}
      <path
        d={SHAPE_PATHS[shape]}
        fill={photo ? `url(#${gid})` : 'currentColor'}
        fillRule={HOLED_SHAPES.has(shape) ? 'evenodd' : undefined}
      />
    </svg>
  )
}

/** A miniature of what the decoration around a picture does. */
function FrameStyleGlyph({ style }: { style: FrameStyle }) {
  const pad = style === 'polaroid' ? 3 : style === 'white' ? 2 : style === 'film' ? 4 : 0
  const bottom = style === 'polaroid' ? 9 : pad
  return (
    <span
      className="st-frame-glyph"
      style={{
        // theme-lint-disable — a frame preview shows paper and film, not themed surfaces
        background: style === 'film' ? '#141414'
          : style === 'polaroid' || style === 'white' ? '#ffffff'
          : 'transparent',
        boxShadow: style === 'shadow' || style === 'polaroid' ? '0 2px 4px rgba(0,0,0,.35)' : undefined,
      }}
    >
      <span className="st-frame-glyph-photo" style={{ inset: `${pad}px ${pad}px ${bottom}px ${pad}px` }} />
      {/* Both strips, because both is what gets placed — a preview showing one
          made the second one look like a bug the first time it appeared. */}
      {style === 'tape' && <><em className="st-frame-glyph-tape" /><em className="st-frame-glyph-tape is-right" /></>}
    </span>
  )
}

function IconCell({ name, onPick }: { name: string; onPick: (name: string) => void }) {
  const Icon = iconComponent(name)
  return (
    <button type="button"
      className="st-shape-btn is-glyph"
      onClick={() => onPick(name)}
      aria-label={name}
      title={iconLabel(name)}
    >
      <Icon strokeWidth={1.7} />
    </button>
  )
}

export function StudioElementsPanel({ page, t }: { page: BookPageSetup; t: (k: string) => string }) {
  const [tab, setTab] = useState<'shapes' | 'frames' | 'grids' | 'icons'>('shapes')
  const [iconQuery, setIconQuery] = useState('')
  /*
   * How much of the library is on screen.
   *
   * Fourteen hundred icons is fourteen hundred React components, each a
   * forwardRef around several SVG nodes, and rendering them all costs about a
   * second of blocked main thread on the first click of the tab — for a grid
   * whose first two rows are all anybody sees. So it grows as it is scrolled,
   * and a search resets it: the results of a search are short, and starting
   * them part-drawn would be wrong.
   */
  const [iconLimit, setIconLimit] = useState(ICON_PAGE)
  const iconTail = useRef<HTMLDivElement>(null)
  const addElement = useStudioStore(s => s.addElement)
  const commit = useStudioStore(s => s.commit)
  const select = useStudioStore(s => s.select)
  const active = useStudioStore(s => s.activeSpread)
  const doc = useStudioStore(s => s.doc)
  const spread = doc?.spreads[active]
  const single = !!spread && spread.role !== 'inner'

  const centre = (w: number, h: number) => {
    const W = single ? page.pageWidth : page.pageWidth * 2
    return { x: (W - w) / 2, y: (page.pageHeight - h) / 2, w, h }
  }

  const addText = (size: number, weight: 400 | 500 | 600 | 700, sample: string, extra: Partial<BookElement> = {}) =>
    addElement(active, {
      id: uid('t'), kind: 'text', frame: centre(page.pageWidth * 0.7, size * 0.5 + 8),
      rotation: 0, opacity: 1, locked: false,
      text: sample, font: 'sans', size, weight, italic: false,
      align: 'left', leading: size > 16 ? 1.1 : 1.5, tracking: size > 16 ? -0.02 : 0,
      color: '#1a1a1a', binding: null, overridden: false, ...extra,
    } as BookElement)

  /**
   * Placed at a size that suits the shape rather than always as a square.
   *
   * A banner wants to be wide and a pin wants to be tall; dropping every shape
   * as one 60mm square means resizing each one before it is any use, which is
   * a tax on the most common action in the panel.
   */
  const addShape = (shape: BookShapeId, opts: { outline?: boolean } = {}) => {
    const side = Math.min(page.pageWidth, page.pageHeight) * 0.3
    const wide = shape.startsWith('banner') || shape === 'ticket' || shape === 'wave'
      || shape === 'arrow-right' || shape === 'arrow-left' || shape === 'arrow-both'
      || shape === 'capsule'
    const tall = shape === 'pin' || shape === 'drop' || shape === 'arrow-up' || shape === 'arrow-down'
    const isRule = shape === 'line'
    addElement(active, {
      id: uid('s'), kind: 'shape',
      frame: isRule
        ? centre(page.pageWidth * 0.5, 0.5)
        : centre(wide ? side * 1.7 : side, tall ? side * 1.35 : wide ? side * 0.55 : side),
      rotation: 0, opacity: 1, locked: false,
      // A rule is a shape too — a hairline box rather than its own element type,
      // so it moves, colours and snaps like everything else on the page.
      shape: isRule ? 'rect' : shape,
      fill: opts.outline ? null : '#141414',
      gradient: 'none',
      stroke: opts.outline ? '#141414' : null,
      strokeWidth: opts.outline ? 0.5 : 0,
      strokeStyle: 'solid',
      radius: 0,
    } as BookElement)
  }

  /**
   * An icon, placed as a square.
   *
   * Square because that is what it is: unlike a shape, an icon keeps its
   * proportions inside whatever frame it is given, so a rectangle would only
   * pad it with air on two sides.
   */
  const addIcon = (name: string) => {
    const side = Math.min(page.pageWidth, page.pageHeight) * 0.18
    addElement(active, {
      id: uid('i'), kind: 'icon', frame: centre(side, side),
      rotation: 0, opacity: 1, locked: false,
      name, color: '#111827', lineWidth: 2,
    } as BookElement)
  }

  /** An empty frame, cut to a shape and waiting for a picture. */
  const addFrame = (mask: BookShapeId | null, frameStyle: FrameStyle = 'none') => {
    const side = Math.min(page.pageWidth, page.pageHeight) * 0.45
    addElement(active, {
      id: uid('p'), kind: 'photo',
      // A Polaroid is taller than it is wide, because of the chin. Placing it
      // square would put the picture in a box the decoration then eats.
      frame: centre(side, frameStyle === 'polaroid' ? side * 1.16 : side),
      rotation: 0, opacity: 1, locked: false,
      photoId: null, fit: 'cover', focalX: 0.5, focalY: 0.5, radius: 0, filter: 'none',
      mask, frameStyle,
    } as BookElement)
  }

  const matchedIcons = useMemo(() => searchIcons(iconQuery), [iconQuery])
  const shownIcons = useMemo(() => matchedIcons.slice(0, iconLimit), [matchedIcons, iconLimit])

  /*
   * Grow the grid when its foot comes into view.
   *
   * An observer rather than a scroll handler: the panel is the scroller, the
   * foot is the thing that matters, and asking the browser to tell us when they
   * meet costs nothing per frame.
   */
  useEffect(() => {
    const tail = iconTail.current
    if (!tail) return
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) setIconLimit(n => n + ICON_PAGE)
    })
    io.observe(tail)
    return () => io.disconnect()
  }, [shownIcons.length, matchedIcons.length])

  return (
    <>
      <PanelHead label={t('journey.studio.elements')} />

      <div className="st-tabs">
        <button type="button" className={tab === 'shapes' ? 'is-on' : ''} onClick={() => setTab('shapes')}>
          {t('journey.studio.shapes')}
        </button>
        <button type="button" className={tab === 'frames' ? 'is-on' : ''} onClick={() => setTab('frames')}>
          {t('journey.studio.frames')}
        </button>
        <button type="button" className={tab === 'grids' ? 'is-on' : ''} onClick={() => setTab('grids')}>
          {t('journey.studio.grids')}
        </button>
        <button type="button" className={tab === 'icons' ? 'is-on' : ''} onClick={() => setTab('icons')}>
          {t('journey.studio.icons')}
        </button>
      </div>

      <div className="st-panel-scroll">
        {tab === 'shapes' && (
          <>
            <div className="st-section">
              <div className="st-section-label">{t('journey.studio.text')}</div>
              <div className="st-stack">
                <button type="button" className="st-tile" onClick={() => addText(30, 700, t('journey.studio.sampleHeading'))}>
                  <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {t('journey.studio.styleTitle')}
                  </span>
                </button>
                <button type="button" className="st-tile" onClick={() => addText(16, 600, t('journey.studio.sampleSubheading'))}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{t('journey.studio.styleSubtitle')}</span>
                </button>
                <button type="button" className="st-tile" onClick={() => addText(10, 400, t('journey.studio.sampleBody'))}>
                  <span style={{ fontSize: 12.5 }}>{t('journey.studio.styleBody')}</span>
                </button>
                <button type="button"
                  className="st-tile"
                  onClick={() => addText(7.5, 600, t('journey.studio.sampleCaption'), { tracking: 0.14, color: '#8a8578' })}
                >
                  <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    {t('journey.studio.styleCaption')}
                  </span>
                </button>
              </div>
            </div>

            <div className="st-section">
              <div className="st-section-label">{t('journey.studio.lines')}</div>
              <div className="st-shape-grid">
                <button type="button" className="st-shape-btn" onClick={() => addShape('line')} title={t('journey.studio.shapeKind.line')}>
                  <Minus size={20} strokeWidth={2} />
                </button>
                <button type="button"
                  className="st-shape-btn"
                  onClick={() => addShape('rect', { outline: true })}
                  title={t('journey.studio.shapeKind.outline')}
                >
                  <Square size={20} strokeWidth={1.1} style={{ opacity: .5 }} />
                </button>
                <button type="button"
                  className="st-shape-btn"
                  onClick={() => addText(46, 700, '“', { color: '#c9c2b4', leading: 0.9 })}
                  title={t('journey.studio.quoteMark')}
                >
                  <Quote size={20} strokeWidth={1.6} />
                </button>
              </div>
            </div>

            {SHAPE_GROUPS.map(group => (
              <div className="st-section" key={group.id}>
                <div className="st-section-label">{t(`journey.studio.shapeGroup.${group.id}`)}</div>
                <div className="st-shape-grid">
                  {group.shapes.map(shape => (
                    <button type="button"
                      key={shape}
                      className="st-shape-btn is-glyph"
                      onClick={() => addShape(shape)}
                      aria-label={shape}
                    >
                      <ShapeGlyph shape={shape} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'frames' && (
          <>
            <div className="st-section">
              <div className="st-section-label">{t('journey.studio.frameStyles')}</div>
              <div className="st-shape-grid">
                {([
                  ['none', 'plainFrame'],
                  ['polaroid', 'polaroidFrame'],
                  ['white', 'whiteFrame'],
                  ['shadow', 'shadowFrame'],
                  ['film', 'filmFrame'],
                  ['tape', 'tapeFrame'],
                ] as [FrameStyle, string][]).map(([style, key]) => (
                  <button type="button"
                    key={style}
                    className="st-shape-btn is-frame"
                    onClick={() => addFrame(null, style)}
                    title={t(`journey.studio.${key}`)}
                    aria-label={t(`journey.studio.${key}`)}
                  >
                    <FrameStyleGlyph style={style} />
                  </button>
                ))}
              </div>
            </div>

            <div className="st-section">
              <div className="st-section-label">{t('journey.studio.frameShapes')}</div>
              <div className="st-shape-grid">
                {FRAME_SHAPES.map(shape => (
                  <button type="button"
                    key={shape}
                    className="st-shape-btn is-glyph"
                    onClick={() => addFrame(shape === 'rect' ? null : shape)}
                    aria-label={shape}
                  >
                    <ShapeGlyph shape={shape} photo />
                  </button>
                ))}
              </div>
              <p className="st-hint" style={{ paddingTop: 8 }}>{t('journey.studio.frameHint')}</p>
            </div>
          </>
        )}

        {tab === 'grids' && (
          <div className="st-section">
            <div className="st-section-label">{t('journey.studio.grids')}</div>
            <div className="st-grid-grid">
              {GRIDS.map(grid => (
                <button
                  type="button"
                  key={grid.id}
                  className="st-grid-btn"
                  onClick={() => {
                    const els = gridElements(grid, defaultGridBox(page, single))
                    commit(d => ({
                      ...d,
                      spreads: d.spreads.map((sp, i) =>
                        (i !== active ? sp : { ...sp, elements: [...sp.elements, ...els] })),
                    }))
                    // Selected as a group, so the block can be moved or resized
                    // as one thing straight away rather than cell by cell.
                    select(els.map(e => e.id))
                  }}
                  aria-label={grid.id}
                  title={`${grid.cells.length}`}
                >
                  {/* The arrangement itself: "hero-two" means nothing until you
                      have seen it, and a diagram is faster to read than a name. */}
                  <span className="st-grid-preview">
                    {grid.cells.map((cell, i) => (
                      <span
                        key={i}
                        style={{
                          left: `${cell.x * 100}%`,
                          top: `${cell.y * 100}%`,
                          width: `${cell.w * 100}%`,
                          height: `${cell.h * 100}%`,
                        }}
                      />
                    ))}
                  </span>
                </button>
              ))}
            </div>
            <p className="st-hint" style={{ paddingTop: 8 }}>{t('journey.studio.gridHint')}</p>
          </div>
        )}

        {tab === 'icons' && (
          <div className="st-section">
            {/*
              The search sits inside the scroller rather than above the tab
              strip, unlike the Content panel's: that one filters both of its
              tabs, this one belongs to a single tab, and hanging it above the
              strip would make the strip move when you switch away from it.
            */}
            <div className="st-search" style={{ margin: '0 0 10px' }}>
              <Search size={14} />
              <input
                value={iconQuery}
                onChange={e => { setIconQuery(e.target.value); setIconLimit(ICON_PAGE) }}
                placeholder={t('journey.studio.searchIcons')}
                aria-label={t('journey.studio.searchIcons')}
                spellCheck={false}
              />
              {iconQuery && (
                <button type="button" onClick={() => { setIconQuery(''); setIconLimit(ICON_PAGE) }} aria-label={t('common.clear')}>
                  <X size={13} />
                </button>
              )}
            </div>
            {/* The shelf, until somebody searches. */}
            {!iconQuery && (
              <>
                <div className="st-section-label">{t('journey.studio.iconsForTravel')}</div>
                <div className="st-shape-grid" style={{ marginBottom: 14 }}>
                  {FEATURED_ICONS.map(name => (
                    <IconCell key={name} name={name} onPick={addIcon} />
                  ))}
                </div>
                <div className="st-section-label">{t('journey.studio.iconsAll')}</div>
              </>
            )}
            <div className="st-shape-grid">
              {shownIcons.map(name => (
                <IconCell key={name} name={name} onPick={addIcon} />
              ))}
            </div>
            {/* What the observer below watches for. */}
            {shownIcons.length < matchedIcons.length && <div ref={iconTail} style={{ height: 1 }} />}
            {!matchedIcons.length && (
              <p className="st-hint" style={{ paddingTop: 8 }}>{t('journey.studio.noMatches')}</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
