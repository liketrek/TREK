import type { BookElement } from '@trek/shared'
import { useElementSize } from '../../hooks/useElementSize'
import { ElementView } from './SpreadView'

/**
 * A travel element, drawn small.
 *
 * The same component the page uses, at a smaller scale — not a second drawing
 * of it. This is the trick the page thumbnails already use, and it is worth
 * more here than anywhere else in Studio: these elements differ from each other
 * by *what they say*, not by their shape, so a generic icon of a map tells you
 * nothing about which of the four map styles you are about to place. Rendered
 * for real, with this journey's own figures, the tile answers the question the
 * label was only gesturing at.
 *
 * It also cannot drift. If the map gains a layer or the summary changes how it
 * sets a figure, the preview shows that on the same commit.
 *
 * ── Why the width is measured ─────────────────────────────────────────────
 *
 * The tile is a grid cell, so its width is the panel's minus padding, gaps, the
 * card's own border and whatever the scrollbar takes. Passing a guess in was
 * tried and was two pixels out, which `overflow: hidden` turned into a clipped
 * right edge. Measuring costs one ResizeObserver and cannot be wrong.
 */

/** CSS defines 1in as 96px and 25.4mm, so this factor is exact. */
const PX_PER_MM = 96 / 25.4

export function TravelPreview({ el, minHeight = 30, maxHeight = 90 }: {
  el: BookElement
  minHeight?: number
  maxHeight?: number
}) {
  const box = useElementSize<HTMLSpanElement>()
  const width = box.width

  /*
   * The tile takes the element's proportions rather than a fixed box.
   *
   * A stats panel is three times wider than it is tall and a country list is
   * taller than it is wide. Fitted into one shape, the wide ones would sit in a
   * thin band with empty tile above and below — and, worse, would be scaled
   * down to fit a height they did not need, which is what made the figures
   * unreadable. Following the element uses the full width for everything and
   * costs only a slightly uneven grid.
   */
  const drawnW = el.frame.w * PX_PER_MM
  const drawnH = el.frame.h * PX_PER_MM
  const height = Math.round(Math.min(maxHeight, Math.max(minHeight, (width * drawnH) / drawnW || minHeight)))
  const scale = width > 0 ? Math.min(width / drawnW, height / drawnH) : 0

  return (
    <span className="st-travel-preview" style={{ height }} ref={box.ref} aria-hidden>
      {scale > 0 && (
        <span
          style={{
            position: 'absolute',
            left: (width - drawnW * scale) / 2,
            top: (height - drawnH * scale) / 2,
            width: `${el.frame.w}mm`,
            height: `${el.frame.h}mm`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Drawn at the origin: the tile is the frame, so the element's own
              position on the spread is not part of what is being shown. */}
          <ElementView el={{ ...el, frame: { ...el.frame, x: 0, y: 0 } } as BookElement} big={false} />
        </span>
      )}
    </span>
  )
}
