import { useId, useState } from 'react'
import { Frame, Minus, Quote, Shapes, Spline, Sparkles, Square, Sticker, Type, type LucideIcon } from 'lucide-react'
import type { BookElement, BookPageSetup, BookShapeId } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'
import { FRAME_SHAPES, HOLED_SHAPES, SHAPE_GROUPS, shapeName } from './shapes'
import {
  BOOK_GRIDS as GRIDS, MAX_SPREAD_ELEMENTS, bookElementId, bookShapeSize, bookGridElements as gridElements,
  defaultBookGridBox as defaultGridBox,
} from '@trek/shared'
import { shapeTile } from './shapeOutline'
import { StudioLineShelf } from './StudioLineShelf'
import { PanelHead, Shelf } from './StudioPanelHead'
import { StudioTabPanel, StudioTabs } from './StudioTabs'
import { StudioStickersPanel } from './StudioStickersPanel'
import { StudioIconShelf } from './sidebar/StudioIconShelf'
import { FRAME_STYLE_OPTIONS, type FrameStyle } from './studioOptions'
import { StudioTextStyles } from './StudioTextStyles'
import type { ShelfSource } from './textStylesModel'

/**
 * Everything you can add that does not come from the journey: type, shapes,
 * lines, picture frames and grids, the icon set and the stickers.
 *
 * One panel with six tabs rather than six entries on the rail. They are all
 * the same kind of answer to "what do I put on this page", and a rail long
 * enough to hold them separately stops being faster to hit than a word would
 * be. The stickers were a rail section of their own until the rebuild; they
 * are one more kind of thing to add, so they sit here beside the icons.
 */

// The book's own ids, the ones the layouts and the assistant mint (shared/src/book/book-ids.ts).
const uid = bookElementId

type Tab = 'text' | 'shapes' | 'lines' | 'frames' | 'icons' | 'stickers'

/** The tabs, three to a row: a word under each icon, so the longest of them keeps its cell. */
const TABS: readonly { id: Tab; icon: LucideIcon; labelKey: string }[] = [
  { id: 'text', icon: Type, labelKey: 'journey.studio.text' },
  { id: 'shapes', icon: Shapes, labelKey: 'journey.studio.shapes' },
  { id: 'lines', icon: Spline, labelKey: 'journey.studio.lines' },
  { id: 'frames', icon: Frame, labelKey: 'journey.studio.frames' },
  { id: 'icons', icon: Sparkles, labelKey: 'journey.studio.icons' },
  { id: 'stickers', icon: Sticker, labelKey: 'journey.studio.stickers' },
]

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
  const tile = shapeTile(shape)
  return (
    <svg viewBox={`0 0 ${tile.w} ${tile.h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden>
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
        d={tile.d}
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
      {/* Both strips, because both is what gets placed: a preview showing one
          made the second one look like a bug the first time it appeared. */}
      {style === 'tape' && <><em className="st-frame-glyph-tape" /><em className="st-frame-glyph-tape is-right" /></>}
    </span>
  )
}

/** A plain text style: size, weight, its sample words and anything else it sets. */
type AddText = (size: number, weight: 400 | 500 | 600 | 700, sample: string, extra?: Partial<BookElement>) => void

/**
 * What every tab places, and where: centred on the page that is open, across
 * both pages of a spread or on the one page of a cover.
 */
function useElementAdders(page: BookPageSetup) {
  const addElement = useStudioStore(s => s.addElement)
  const commit = useStudioStore(s => s.commit)
  const select = useStudioStore(s => s.select)
  const active = useStudioStore(s => s.activeSpread)
  const role = useStudioStore(s => s.doc?.spreads[s.activeSpread]?.role)
  const single = role !== undefined && role !== 'inner'

  const centre = (w: number, h: number) => {
    const W = single ? page.pageWidth : page.pageWidth * 2
    return { x: (W - w) / 2, y: (page.pageHeight - h) / 2, w, h }
  }

  const addText: AddText = (size, weight, sample, extra = {}) =>
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
    const own = bookShapeSize(shape, side)
    addElement(active, {
      id: uid('s'), kind: 'shape',
      frame: isRule
        ? centre(page.pageWidth * 0.5, 0.5)
        : own ? centre(own.w, own.h)
        : centre(wide ? side * 1.7 : side, tall ? side * 1.35 : wide ? side * 0.55 : side),
      rotation: 0, opacity: 1, locked: false,
      // A rule is a shape too: a hairline box rather than its own element type,
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
   * An icon, placed as a square. Unlike a shape, an icon keeps its proportions
   * inside whatever frame it is given, so a rectangle would only pad it with
   * air on two sides.
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

  /** A block of empty frames, selected as a group so it moves and resizes as one thing straight away. */
  const addGrid = (grid: (typeof GRIDS)[number]) => {
    const els = gridElements(grid, defaultGridBox(page, single))
    // The page's own cap, as a duplicate keeps it: frames that would make the book unsaveable are not added.
    const on = useStudioStore.getState().doc?.spreads[active]
    if (!on) return
    if (on.elements.length + els.length > MAX_SPREAD_ELEMENTS) {
      useStudioStore.getState().refuseFull()
      return
    }
    commit(d => ({
      ...d,
      spreads: d.spreads.map((sp, i) => (i !== active ? sp : { ...sp, elements: [...sp.elements, ...els] })),
    }))
    select(els.map(e => e.id))
  }

  return { active, single, addElement, addText, addShape, addIcon, addFrame, addGrid }
}

type Adders = ReturnType<typeof useElementAdders>

/** The type tab: the plain styles and the big quotation mark, then the lockups of the Text styles shelf. */
function TextTab({ page, source, t, addText }: {
  page: BookPageSetup
  source: ShelfSource
  t: (k: string) => string
  addText: AddText
}) {
  return (
    <>
      <Shelf label={t('journey.studio.text')}>
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
          {/* A mark of type rather than a shape: it sets in the face the rest of the page is set in. */}
          <button type="button"
            className="st-tile"
            onClick={() => addText(46, 700, '“', { color: '#c9c2b4', leading: 0.9 })}
          >
            <Quote size={16} strokeWidth={1.6} aria-hidden />
            <span>{t('journey.studio.quoteMark')}</span>
          </button>
        </div>
      </Shelf>

      <StudioTextStyles page={page} source={source} t={t} />
    </>
  )
}

/** Every shape by its group, the outline-only rectangle first among the basic ones. */
function ShapesTab({ addShape, t }: { addShape: Adders['addShape']; t: (k: string) => string }) {
  return (
    <>
      {SHAPE_GROUPS.map(group => (
        <Shelf key={group.id} label={t(`journey.studio.shapeGroup.${group.id}`)}>
          <div className="st-shape-grid">
            {group.id === 'basic' && (
              <button type="button"
                className="st-shape-btn"
                onClick={() => addShape('rect', { outline: true })}
                title={t('journey.studio.shapeKind.outline')}
                aria-label={t('journey.studio.shapeKind.outline')}
              >
                <Square size={20} strokeWidth={1.1} aria-hidden style={{ opacity: .5 }} />
              </button>
            )}
            {group.shapes.map(shape => (
              <button type="button"
                key={shape}
                className="st-shape-btn is-glyph"
                onClick={() => addShape(shape)}
                title={shapeName(shape, t)}
                aria-label={shapeName(shape, t)}
              >
                <ShapeGlyph shape={shape} />
              </button>
            ))}
          </div>
        </Shelf>
      ))}
    </>
  )
}

/** Empty frames in their styles and shapes, and the grids that lay several of them out at once. */
function FramesTab({ adders, t }: { adders: Adders; t: (k: string) => string }) {
  return (
    <>
      <Shelf label={t('journey.studio.frameStyles')}>
        <div className="st-shape-grid">
          {FRAME_STYLE_OPTIONS.map(({ value, labelKey }) => (
            <button type="button"
              key={value}
              className="st-shape-btn is-frame"
              onClick={() => adders.addFrame(null, value)}
              title={t(labelKey)}
              aria-label={t(labelKey)}
            >
              <FrameStyleGlyph style={value} />
            </button>
          ))}
        </div>
      </Shelf>

      <Shelf label={t('journey.studio.frameShapes')} hint={t('journey.studio.frameHint')}>
        <div className="st-shape-grid">
          {FRAME_SHAPES.map(shape => (
            <button type="button"
              key={shape}
              className="st-shape-btn is-glyph"
              onClick={() => adders.addFrame(shape === 'rect' ? null : shape)}
              title={shapeName(shape, t)}
              aria-label={shapeName(shape, t)}
            >
              <ShapeGlyph shape={shape} photo />
            </button>
          ))}
        </div>
      </Shelf>

      <Shelf label={t('journey.studio.grids')} hint={t('journey.studio.gridHint')}>
        <div className="st-grid-grid">
          {GRIDS.map(grid => (
            <button
              type="button"
              key={grid.id}
              className="st-grid-btn"
              onClick={() => adders.addGrid(grid)}
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
      </Shelf>
    </>
  )
}

export function StudioElementsPanel({ page, t, source }: {
  page: BookPageSetup
  t: (k: string) => string
  /** The journal, for the year and the point a lockup is filled with. */
  source: ShelfSource
}) {
  const [tab, setTab] = useState<Tab>('text')
  const tabsId = useId()
  const adders = useElementAdders(page)

  return (
    <>
      <PanelHead label={t('journey.studio.elements')} />

      <StudioTabs<Tab>
        idBase={tabsId}
        label={t('journey.studio.elements')}
        value={tab}
        onChange={setTab}
        columns={3}
        tabs={TABS.map(x => ({ id: x.id, icon: x.icon, label: t(x.labelKey) }))}
      />

      <StudioTabPanel idBase={tabsId} value={tab} className="st-tab-body">
        {/*
          The icons and the stickers carry a search of their own, which sits
          above their scrolling grid like the Content panel's above its own;
          the other tabs are short shelves and scroll as they are.
        */}
        {tab === 'icons' ? (
          <StudioIconShelf onPick={adders.addIcon} t={t} />
        ) : tab === 'stickers' ? (
          <StudioStickersPanel page={page} t={t} />
        ) : (
          <div className="st-panel-scroll">
            {tab === 'text' && <TextTab page={page} source={source} t={t} addText={adders.addText} />}
            {tab === 'shapes' && <ShapesTab addShape={adders.addShape} t={t} />}
            {tab === 'lines' && (
              <StudioLineShelf
                page={page}
                single={adders.single}
                onAdd={el => adders.addElement(adders.active, el)}
                t={t}
                lead={(
                  <button type="button"
                    className="st-shape-btn"
                    onClick={() => adders.addShape('line')}
                    title={t('journey.studio.shapeKind.line')}
                    aria-label={t('journey.studio.shapeKind.line')}
                  >
                    <Minus size={20} strokeWidth={2} aria-hidden />
                  </button>
                )}
              />
            )}
            {tab === 'frames' && <FramesTab adders={adders} t={t} />}
          </div>
        )}
      </StudioTabPanel>
    </>
  )
}
