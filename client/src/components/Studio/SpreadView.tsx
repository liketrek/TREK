import type { CSSProperties } from 'react'
import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import { FONT_STACKS, photoSrc } from './bookRender'

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
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const FILTERS: Record<string, string | undefined> = {
  none: undefined,
  bw: 'grayscale(1) contrast(1.05)',
  warm: 'saturate(1.1) sepia(0.16)',
}

export function ElementView({
  el, big, print = false, dropLabel = '',
}: { el: BookElement; big: boolean; print?: boolean; dropLabel?: string }) {
  if (el.kind === 'photo') {
    // An empty frame is a template's promise: it says where a picture goes
    // before anyone has chosen which.
    if (el.photoId == null) {
      // In the printed book it is nothing at all — a hatch and an instruction on
      // a page someone paid to have bound would be a defect, and an unfilled
      // frame has nothing to contribute either.
      if (print) return null

      // The label is sized in millimetres so it scales with the zoom exactly as
      // the page does, and it steps aside on a frame too small to hold it.
      const side = Math.min(el.frame.w, el.frame.h)
      const fs = Math.max(2.4, Math.min(4.6, side * 0.085))
      const roomy = side > 22 && el.frame.w > 34

      return (
        <div
          style={{
            ...frameStyle(el),
            borderRadius: el.radius ? `${el.radius}mm` : undefined,
            background:
              'repeating-linear-gradient(45deg, rgba(0,0,0,.045) 0 6px, rgba(0,0,0,.02) 6px 12px)',
            border: '1px dashed rgba(0,0,0,.16)',
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
                fontSize: `${fs}mm`,
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
    }
    return (
      <div style={{ ...frameStyle(el), overflow: 'hidden', borderRadius: el.radius ? `${el.radius}mm` : undefined }}>
        <img
          src={photoSrc(el.photoId, big)}
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
      </div>
    )
  }

  if (el.kind === 'shape') {
    const fill = el.fill ?? 'transparent'
    const background = el.gradient === 'none' || !el.fill
      ? fill
      : `linear-gradient(${el.gradient === 'up' ? 'to top' : 'to bottom'},`
        + ` ${hexToRgba(el.fill, 0)} 0%,`
        + ` ${hexToRgba(el.fill, 0.55)} 46%,`
        + ` ${hexToRgba(el.fill, 1)} 100%)`
    return (
      <div
        style={{
          ...frameStyle(el),
          background,
          border: el.stroke ? `${el.strokeWidth}mm solid ${el.stroke}` : undefined,
          // A stroke has to sit inside the frame, or the drawn shape would be
          // wider than the box the editor snapped and the print would not match.
          boxSizing: 'border-box',
          borderRadius: el.shape === 'ellipse' ? '50%' : el.radius ? `${el.radius}mm` : undefined,
          // A triangle is a clip, not a border trick: the old CSS border hack
          // cannot take a fill gradient or a stroke, and its size does not follow
          // the frame the way everything else here does.
          clipPath: el.shape === 'triangle' ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : undefined,
        }}
      />
    )
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
  big = false,
  showGuides = false,
  print = false,
  dropLabel = '',
}: {
  spread: BookSpread
  page: BookPageSetup
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
        background: spread.background ?? '#ffffff',
        overflow: 'hidden',
      }}
    >
      {spread.elements.map(el => (
        <ElementView key={el.id} el={el} big={big} print={print} dropLabel={dropLabel} />
      ))}

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
