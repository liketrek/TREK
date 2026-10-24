import type { CSSProperties } from 'react'
import type {
  BookElement, BookIconElement, BookPageSetup, BookShapeElement, BookSpread,
} from '@trek/shared'
import { fontStack, nearestWeight } from './bookFonts'
import { iconComponent } from './iconLibrary'
import { PhotoView } from './PhotoView'
import { HOLED_SHAPES } from './shapes'
import { hasEdge, shapeOutline } from './shapeOutline'
import { LineView } from './LineView'
import { TravelElementView } from './TravelElements'
import { TextEffectsView } from './TextEffectsView'
import { hasTextEffects } from './textEffects'
import { PageNumbers } from './PageNumbers'
import { PaintedShapeView } from './paint/PaintedShape'
import { SpreadPaint } from './paint/paintRender'
import { usePaintId } from './paint/usePaintId'
import { StickerView } from './StickerView'

/**
 * One spread, drawn.
 *
 * This component is the whole reason Studio renders in DOM rather than on a
 * canvas: the *same* tree is what the print renderer will run in headless
 * Chromium. Edit mode adds handles and outlines on top; print mode is this and
 * nothing else. There is no second renderer to drift against.
 *
 * Everything is positioned in millimetres. CSS maps mm onto the PDF with a fixed
 * ratio, so what you see at `scale(0.4)` is the same box model the printer gets
 * at 1:1 — not an approximation of it.
 */

function frameStyle(el: BookElement): CSSProperties {
  return {
    position: 'absolute',
    left: `${el.frame.x}mm`,
    top: `${el.frame.y}mm`,
    width: `${el.frame.w}mm`,
    height: `${el.frame.h}mm`,
    opacity: el.opacity,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
  }
}

/** #rrggbb plus an alpha, for the fades a cover panel needs. */
function hexToRgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/**
 * A shape, drawn.
 *
 * Rectangles and ellipses stay `<div>`s — a box with a corner radius is exactly
 * what CSS is good at, and those two are what every document written before the
 * shape library existed contains. Everything else is an SVG path.
 *
 * The viewBox is in millimetres and the element is that many millimetres wide,
 * so one user unit is one millimetre and a stroke width means the same thing on
 * every side. The path is drawn into a box inset by half the stroke, which puts
 * the whole stroke inside the frame the editor snapped — the same thing
 * `box-sizing: border-box` does for the div case, and the reason a snapped edge
 * and a drawn edge line up.
 */
function ShapeView({ el }: { el: BookShapeElement }) {
  const fill = el.fill ?? 'transparent'
  // Per mounted copy: page mode draws a spread twice (paint/paintRender.tsx).
  const gradientId = usePaintId(`g-${el.id}`)
  const gradient = el.gradient !== 'none' && el.fill

  if ((el.shape === 'rect' || el.shape === 'ellipse') && !hasEdge(el, el.shape)) {
    const background = !gradient
      ? fill
      : `linear-gradient(${el.gradient === 'up' ? 'to top' : 'to bottom'},`
        + ` ${hexToRgba(el.fill!, 0)} 0%,`
        + ` ${hexToRgba(el.fill!, 0.55)} 46%,`
        + ` ${hexToRgba(el.fill!, 1)} 100%)`
    return (
      <div
        style={{
          ...frameStyle(el),
          background,
          border: el.stroke ? `${el.strokeWidth}mm ${el.strokeStyle} ${el.stroke}` : undefined,
          boxSizing: 'border-box',
          borderRadius: el.shape === 'ellipse' ? '50%' : el.radius ? `${el.radius}mm` : undefined,
        }}
      />
    )
  }

  const sw = el.stroke ? el.strokeWidth : 0
  const w = Math.max(0.01, el.frame.w - sw)
  const h = Math.max(0.01, el.frame.h - sw)
  const d = shapeOutline(el, w, h)

  // Proportional to the stroke, so a dashed outline keeps its rhythm whether it
  // is a hairline on a caption rule or a 2mm band around a cover panel.
  const dash = el.strokeStyle === 'dashed' ? `${sw * 3} ${sw * 2}`
    : el.strokeStyle === 'dotted' ? `${sw * 0.01} ${sw * 2}`
    : undefined

  return (
    <div style={frameStyle(el)}>
      <svg
        width={`${el.frame.w}mm`}
        height={`${el.frame.h}mm`}
        viewBox={`0 0 ${el.frame.w} ${el.frame.h}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1={el.gradient === 'up' ? '1' : '0'} x2="0" y2={el.gradient === 'up' ? '0' : '1'}>
              <stop offset="0%" stopColor={el.fill!} stopOpacity="0" />
              <stop offset="46%" stopColor={el.fill!} stopOpacity="0.55" />
              <stop offset="100%" stopColor={el.fill!} stopOpacity="1" />
            </linearGradient>
          </defs>
        )}
        <path
          d={d}
          transform={sw ? `translate(${sw / 2} ${sw / 2})` : undefined}
          fill={gradient ? `url(#${gradientId})` : fill}
          fillRule={HOLED_SHAPES.has(el.shape) ? 'evenodd' : undefined}
          stroke={el.stroke ?? undefined}
          strokeWidth={sw || undefined}
          strokeDasharray={dash}
          strokeLinecap={el.strokeStyle === 'dotted' ? 'round' : undefined}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/**
 * A lucide drawing, at the size the frame gives it.
 *
 * Kept proportional rather than stretched to the box. A shape is scaled by
 * moving its points and looks deliberate at any ratio; a stroked icon does not
 * — a stretched compass reads as a mistake — so it sits centred in whatever
 * rectangle it was given, which is also what the handles then appear to do.
 *
 * The stroke follows the drawing rather than staying a fixed width, because an
 * icon set 60mm across with a hairline is a diagram, not a mark. `lineWidth` is
 * the weight against lucide's own 24-unit grid, exactly as the icons are drawn.
 */
function IconView({ el }: { el: BookIconElement }) {
  const Icon = iconComponent(el.name)
  return (
    <div style={{ ...frameStyle(el), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon
        color={el.color}
        strokeWidth={el.lineWidth}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}

export function ElementView({
  el, big, print = false, dropLabel = '', hiddenPhotoIds,
}: {
  el: BookElement; big: boolean; print?: boolean; dropLabel?: string
  /** Photos drawn as empty frames instead of themselves. */
  hiddenPhotoIds?: ReadonlySet<number>
}) {
  if (el.kind === 'photo') {
    // A photo left out is drawn as its empty frame, kept even in print, so the
    // page still shows where a picture sits without showing the picture.
    if (el.photoId != null && hiddenPhotoIds?.has(el.photoId)) {
      return <PhotoView el={{ ...el, photoId: null }} big={big} print={false} dropLabel="" frameStyle={frameStyle(el)} />
    }
    return <PhotoView el={el} big={big} print={print} dropLabel={dropLabel} frameStyle={frameStyle(el)} />
  }

  if (el.kind === 'shape') {
    return el.paint ? <PaintedShapeView el={el} paint={el.paint} frameStyle={frameStyle(el)} /> : <ShapeView el={el} />
  }

  // Above the catch-all below, which routes everything that is not text into
  // the travel elements and draws null for anything they do not know.
  if (el.kind === 'icon') return <IconView el={el} />
  if (el.kind === 'sticker') return <StickerView el={el} frameStyle={frameStyle(el)} />
  if (el.kind === 'line') return <LineView el={el} frameStyle={frameStyle(el)} />

  if (el.kind !== 'text') {
    // map, stats, countries, badge — the elements drawn from the journey's own
    // figures. They live in their own file because they are a different kind of
    // drawing: type and vector graphics laid out from data, rather than one box
    // with one property set.
    return <TravelElementView el={el} frameStyle={frameStyle(el)} big={big} />
  }

  // Outlines, shadows, bands, curves and fills draw in their own file; a plain text stays here, as it always drew.
  if (hasTextEffects(el)) return <TextEffectsView el={el} frameStyle={frameStyle(el)} big={big} />

  return (
    <div
      style={{
        ...frameStyle(el),
        color: el.color,
        // pt, not px: the document speaks the print's language, and CSS knows
        // the conversion exactly.
        fontSize: `${el.size}pt`,
        fontFamily: fontStack(el.font),
        fontWeight: nearestWeight(el.font, el.weight),
        fontStyle: el.italic ? 'italic' : undefined,
        lineHeight: el.leading,
        letterSpacing: `${el.tracking}em`,
        textAlign: el.align,
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        hyphens: 'auto',
      }}
    >
      {el.text}
    </div>
  )
}

/**
 * The sheet. `mode="print"` is exactly what the renderer will produce; the
 * editor draws the same thing and layers its chrome above it.
 */
export function SpreadView({
  spread,
  page,
  folios = [],
  big = false,
  showGuides = false,
  print = false,
  dropLabel = '',
  hiddenPhotoIds,
}: {
  spread: BookSpread
  page: BookPageSetup
  /**
   * The page numbers this spread carries, from foliosOf. Only PageNumbers
   * needs them — a page number is the one thing on the page that is a
   * function of position in the book rather than of the spread itself, and
   * the caller is the one holding the book.
   */
  folios?: readonly number[]
  big?: boolean
  showGuides?: boolean
  /** The print renderer passes this: no guides, no placeholders, no chrome. */
  print?: boolean
  dropLabel?: string
  /**
   * Photos to leave out, drawn as empty frames: a page drawn for the
   * assistant shows only the asking user's own photos (journey-studio.md 3.4).
   */
  hiddenPhotoIds?: ReadonlySet<number>
}) {
  const isSingle = spread.role !== 'inner'
  const w = isSingle ? page.pageWidth : page.pageWidth * 2

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        // Under a paint the sheet is the paper, which a see-through paint lets show.
        background: (spread.backgroundPaint ? null : spread.background) ?? '#ffffff', // theme-lint-disable: paper, not app chrome
        /*
         * On screen the page ends at the trim, so anything past it is clipped.
         * In print it must not be: the bleed is the part that runs off the edge
         * and gets cut away, and clipping it here would leave a white hairline
         * along every edge of the finished book. The sheet does the clipping
         * instead — see BookSheetsView, whose window is trim plus bleed.
         */
        overflow: print ? 'visible' : 'hidden',
      }}
    >
      {spread.backgroundPaint && (
        <SpreadPaint paint={spread.backgroundPaint} width={w} height={page.pageHeight} bleed={page.bleed} idPrefix={spread.id} />
      )}

      {/* A hidden layer stays in the layers panel and off the page, here and in print. */}
      {spread.elements.filter(el => !el.hidden).map(el => (
        <ElementView
          key={el.id}
          el={el}
          big={big}
          print={print}
          dropLabel={dropLabel}
          hiddenPhotoIds={hiddenPhotoIds}
        />
      ))}

      <PageNumbers spread={spread} page={page} folios={folios} />

      {showGuides && (
        <>
          {/* Safe area, per page: on a spread the inner margin belongs to the
              gutter, so one box around the whole sheet would be a lie. */}
          {(isSingle ? [0] : [0, page.pageWidth]).map(offset => (
            <div
              key={offset}
              style={{
                position: 'absolute',
                left: `${offset + page.safe}mm`,
                top: `${page.safe}mm`,
                width: `${page.pageWidth - page.safe * 2}mm`,
                height: `${page.pageHeight - page.safe * 2}mm`,
                border: '1px dashed rgba(0,0,0,.14)',
                pointerEvents: 'none',
              }}
            />
          ))}
          <div
            aria-hidden
            style={{ position: 'absolute', inset: 0, width: `${w}mm`, pointerEvents: 'none' }}
          />
        </>
      )}
    </div>
  )
}


/**
 * The fold down the middle of an open book.
 *
 * Preview chrome, not content — which is why it lives outside `SpreadView`. A
 * printed book has a physical crease; a *printed* shadow down the gutter would
 * be a defect. So the editor and the page thumbnails draw this, and the renderer
 * never sees it.
 *
 * Two layers, because that is what makes paper read as curving rather than as a
 * grey stripe: the shadow ramps into the spine and darkens hard at the crease,
 * and just outside it a pale band lifts, the way the sheet catches light as it
 * comes back up out of the binding.
 */
export function SpreadFold({ page, scaled }: { page: BookPageSetup; scaled: number }) {
  // Wide on purpose: the lift has to ramp over a long distance to read as
  // paper curving. A narrow band reads as two painted stripes instead.
  const width = 52 * scaled
  const left = page.pageWidth * scaled - width / 2
  return (
    <div style={{ position: 'absolute', left, top: 0, width, bottom: 0, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg,'
            + ' rgba(255,255,255,0) 0%,'
            + ' rgba(255,255,255,.07) 12%,'
            + ' rgba(255,255,255,.17) 27%,'
            + ' rgba(255,255,255,.11) 37%,'
            + ' rgba(255,255,255,0) 43%,'
            + ' rgba(0,0,0,.035) 45.5%,'
            + ' rgba(0,0,0,.10) 48%,'
            + ' rgba(0,0,0,.18) 49.6%,'
            + ' rgba(0,0,0,.21) 50%,'
            + ' rgba(0,0,0,.18) 50.4%,'
            + ' rgba(0,0,0,.10) 52%,'
            + ' rgba(0,0,0,.035) 54.5%,'
            + ' rgba(255,255,255,0) 57%,'
            + ' rgba(255,255,255,.11) 63%,'
            + ' rgba(255,255,255,.17) 73%,'
            + ' rgba(255,255,255,.07) 88%,'
            + ' rgba(255,255,255,0) 100%)',
        }}
      />
      {/* The crease itself. Sub-pixel at small zoom, which is right — you should
          not see a hard line on a page shown at 15%. */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: Math.max(0.5, 0.35 * scaled),
          marginLeft: -Math.max(0.25, 0.175 * scaled),
          background: 'rgba(0,0,0,.16)',
        }}
      />
    </div>
  )
}
