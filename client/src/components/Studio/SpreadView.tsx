import type { CSSProperties } from 'react'
import type {
  BookElement, BookIconElement, BookPageSetup, BookPhotoElement, BookShapeElement, BookSpread,
} from '@trek/shared'
import { FONT_STACKS, photoSrc } from './bookRender'
import { iconComponent } from './iconLibrary'
import { HOLED_SHAPES, SHAPE_PATHS, scalePath, unitPath } from './shapes'
import { TravelElementView } from './TravelElements'
import { PageNumbers } from './PageNumbers'

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

/** Two decimals of a millimetre, matching what the document itself stores. */
const round2 = (n: number) => Math.round(n * 100) / 100

/** #rrggbb plus an alpha, for the fades a cover panel needs. */
function hexToRgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const FILTERS: Record<string, string | undefined> = {
  none: undefined,
  bw: 'grayscale(1) contrast(1.05)',
  warm: 'saturate(1.1) sepia(0.16)',
  cool: 'saturate(1.05) hue-rotate(-8deg) brightness(1.02)',
  // Faded, the way a print left in the light goes: lifted blacks, less colour.
  fade: 'saturate(0.72) contrast(0.88) brightness(1.08)',
  contrast: 'contrast(1.22) saturate(1.06)',
}

/**
 * How much of the frame the decoration around a picture eats, as a fraction of
 * the shorter side.
 *
 * A Polaroid's chin is the reason this is a table rather than one number: the
 * bottom border is roughly three times the others, and getting that ratio wrong
 * is the difference between a Polaroid and a photo with a white edge.
 */
const FRAME_INSET: Record<string, { pad: number; bottom: number }> = {
  none: { pad: 0, bottom: 0 },
  polaroid: { pad: 0.055, bottom: 0.17 },
  white: { pad: 0.035, bottom: 0.035 },
  shadow: { pad: 0, bottom: 0 },
  film: { pad: 0.075, bottom: 0.075 },
  tape: { pad: 0, bottom: 0 },
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
  const gradientId = `g-${el.id}`
  const gradient = el.gradient !== 'none' && el.fill

  if (el.shape === 'rect' || el.shape === 'ellipse') {
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
  const d = scalePath(SHAPE_PATHS[el.shape], w, h)

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
 * A picture — possibly cut to a shape, possibly sitting in something.
 *
 * The mask and the decoration are independent on purpose: a heart in a Polaroid
 * is a silly thing to want and there is no reason to stop anyone wanting it, and
 * keeping them separate means neither has to know about the other.
 */
function PhotoView({ el, big, print, dropLabel }: {
  el: BookPhotoElement; big: boolean; print: boolean; dropLabel: string
}) {
  const deco = FRAME_INSET[el.frameStyle] ?? FRAME_INSET.none
  const side = Math.min(el.frame.w, el.frame.h)
  // Rounded to a hundredth of a millimetre — the same precision the document
  // stores. Without it a fraction of the frame lands in the CSS as
  // `10.200000000000001mm`, which is not wrong but is float noise in a
  // stylesheet that a person may well end up reading.
  const pad = round2(deco.pad * side)
  const bottom = round2(deco.bottom * side)
  const clipId = `c-${el.id}`
  const clipped = el.mask && el.mask !== 'rect'

  /*
   * An empty frame is a template's promise: it says where a picture goes before
   * anyone has chosen which — and it says it *in the frame it will wear*.
   *
   * This used to render on its own, ignoring frameStyle entirely, so a Polaroid
   * placeholder was an ordinary dashed rectangle until a photograph landed in
   * it and the chin appeared from nowhere. The two branches have been folded
   * together: the surround is drawn once, and only what goes inside it differs.
   */
  const empty = el.photoId == null

  // In the printed book an unfilled frame is nothing at all — a hatch and an
  // instruction on a page someone paid to have bound would be a defect.
  if (empty && print) return null

  // The label is sized in millimetres so it scales with the zoom exactly as the
  // page does, and it steps aside on a frame too small to hold it.
  const labelSize = Math.max(2.4, Math.min(4.6, side * 0.085))
  const roomy = side - pad * 2 > 22 && el.frame.w - pad * 2 > 34

  const hatch = (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        /*
         * Opaque, and that is the point.
         *
         * The hatch used to be laid over nothing, so an empty frame showed
         * whatever was behind it and every attempt to arrange a shape *under*
         * one looked like it had done nothing: the frame appeared to sit at the
         * bottom of the stack no matter where it was, right up until a
         * photograph landed in it and it suddenly covered things. A frame is a
         * promise that a picture goes here, and a picture is not see-through.
         */
        background:
          'repeating-linear-gradient(45deg, rgba(0,0,0,.055) 0 6px, rgba(0,0,0,.025) 6px 12px), #ffffff', // theme-lint-disable — paper, not app chrome
        // A dashed border would be cut in half lengthwise by the clip, so a
        // masked placeholder shows its shape through the hatch alone.
        border: clipped ? undefined : '1px dashed rgba(0,0,0,.16)',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2mm',
      }}
    >
      {roomy && dropLabel && (
        <span
          style={{
            fontFamily: FONT_STACKS.sans,
            fontSize: `${labelSize}mm`,
            fontWeight: 600,
            letterSpacing: '0.16em',
            lineHeight: 1.5,
            textAlign: 'center',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,.34)',
            whiteSpace: 'pre-line',
            userSelect: 'none',
          }}
        >
          {dropLabel}
        </span>
      )}
    </div>
  )

  const picture = (
    <div
      style={{
        position: 'absolute',
        left: `${pad}mm`,
        top: `${pad}mm`,
        right: `${pad}mm`,
        bottom: `${bottom || pad}mm`,
        overflow: 'hidden',
        borderRadius: !clipped && el.radius ? `${el.radius}mm` : undefined,
        clipPath: clipped ? `url(#${clipId})` : undefined,
      }}
    >
      {empty ? hatch : (
        <img
          src={photoSrc(el.photoId!, big)}
          alt=""
          draggable={false}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: el.fit,
            objectPosition: `${el.focalX * 100}% ${el.focalY * 100}%`,
            filter: FILTERS[el.filter],
            display: 'block',
          }}
        />
      )}
    </div>
  )

  return (
    <div
      style={{
        ...frameStyle(el),
        background: el.frameStyle === 'polaroid' || el.frameStyle === 'white' ? '#ffffff'
          : el.frameStyle === 'film' ? '#141414'
          : undefined,
        // A photograph lying on a page, rather than printed into it. Soft and
        // low: a hard shadow reads as a UI card, not as paper.
        boxShadow: el.frameStyle === 'shadow' || el.frameStyle === 'polaroid'
          ? '0 1.2mm 3mm rgba(0,0,0,.22)'
          : undefined,
      }}
    >
      {clipped && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={unitPath(SHAPE_PATHS[el.mask!])} />
            </clipPath>
          </defs>
        </svg>
      )}

      {picture}

      {/* Sprocket holes. Drawn as a repeating gradient rather than as elements
          so the count follows the width instead of being fixed at a size that
          only looks right on one frame. */}
      {el.frameStyle === 'film' && [0, 1].map(row => (
        <div
          key={row}
          style={{
            position: 'absolute',
            left: `${pad * 0.35}mm`,
            right: `${pad * 0.35}mm`,
            [row ? 'bottom' : 'top']: `${pad * 0.22}mm`,
            height: `${pad * 0.42}mm`,
            background: 'repeating-linear-gradient(90deg,'
              + ` #f4f4f4 0 ${pad * 0.5}mm, transparent ${pad * 0.5}mm ${pad * 1.1}mm)`,
          }}
        />
      ))}

      {/* Two strips of tape, held at an angle across opposite corners. */}
      {/*
        Two strips, one over each top corner, each centred *on* its corner so it
        overhangs the picture evenly on both sides — which is what a piece of
        tape does. Offsetting by a fraction of the strip instead left them
        sitting beside the corners rather than across them.
      */}
      {el.frameStyle === 'tape' && ([-1, 1] as const).map(dir => {
        const tapeW = side * 0.26
        const tapeH = side * 0.075
        return (
          <div
            key={dir}
            style={{
              position: 'absolute',
              [dir < 0 ? 'left' : 'right']: `${round2(-tapeW / 2)}mm`,
              top: `${round2(-tapeH / 2)}mm`,
              width: `${round2(tapeW)}mm`,
              height: `${round2(tapeH)}mm`,
              background: 'rgba(236,228,206,.82)',
              boxShadow: '0 .3mm .6mm rgba(0,0,0,.12)',
              // Away from the corner on each side: anticlockwise on the left,
              // clockwise on the right, so the pair reads as symmetric.
              transform: `rotate(${dir * 45}deg)`,
            }}
          />
        )
      })}
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
  el, big, print = false, dropLabel = '',
}: { el: BookElement; big: boolean; print?: boolean; dropLabel?: string }) {
  if (el.kind === 'photo') {
    return <PhotoView el={el} big={big} print={print} dropLabel={dropLabel} />
  }

  if (el.kind === 'shape') return <ShapeView el={el} />

  // Above the catch-all below, which routes everything that is not text into
  // the travel elements and draws null for anything they do not know.
  if (el.kind === 'icon') return <IconView el={el} />

  if (el.kind !== 'text') {
    // map, stats, countries, badge — the elements drawn from the journey's own
    // figures. They live in their own file because they are a different kind of
    // drawing: type and vector graphics laid out from data, rather than one box
    // with one property set.
    return <TravelElementView el={el} frameStyle={frameStyle(el)} big={big} />
  }

  return (
    <div
      style={{
        ...frameStyle(el),
        color: el.color,
        // pt, not px: the document speaks the print's language, and CSS knows
        // the conversion exactly.
        fontSize: `${el.size}pt`,
        fontFamily: FONT_STACKS[el.font],
        fontWeight: el.weight,
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
  spreadIndex = 0,
  big = false,
  showGuides = false,
  print = false,
  dropLabel = '',
}: {
  spread: BookSpread
  page: BookPageSetup
  /**
   * Where this spread sits in the book. Only the folios need it — a page
   * number is the one thing on the page that is a function of position rather
   * than of the document.
   */
  spreadIndex?: number
  big?: boolean
  showGuides?: boolean
  /** The print renderer passes this: no guides, no placeholders, no chrome. */
  print?: boolean
  dropLabel?: string
}) {
  const isSingle = spread.role !== 'inner'
  const w = isSingle ? page.pageWidth : page.pageWidth * 2

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: spread.background ?? '#ffffff', // theme-lint-disable — paper, not app chrome
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
      {spread.elements.map(el => (
        <ElementView key={el.id} el={el} big={big} print={print} dropLabel={dropLabel} />
      ))}

      <PageNumbers spread={spread} page={page} spreadIndex={spreadIndex} />

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
