import { bookStickerLayerPaint, type BookStickerElement } from '@trek/shared';
import { bookSticker, type BookStickerDef } from '@trek/shared/stickers';
import type { CSSProperties } from 'react';

/**
 * A sticker, drawn: its layers as one inline SVG in the sticker's own box,
 * scaled to the frame by the viewBox, so every layer stays a vector path in
 * the print and in the page image the assistant reads.
 *
 * The drawing keeps its proportions inside whatever frame it is given (meet),
 * the way an icon does: a lemon stretched to twice its width stops being a
 * lemon. A flip mirrors the drawing inside the frame, so the frame, its
 * handles and its rotation stay where they were.
 *
 * A sticker this build's library does not hold draws nothing. Only a newer
 * book can carry one, and a book that is newer than this reader is opened
 * read-only (book-schema-rev.ts), so nothing is lost by not drawing it.
 */

/** The drawing alone, for the page, the panel's tiles and the inspector. */
export function StickerArt({
  def,
  colors = [],
  flipX = false,
}: {
  def: BookStickerDef;
  colors?: readonly string[];
  flipX?: boolean;
}) {
  const [w, h] = def.box;
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      style={{ display: 'block', overflow: 'visible', transform: flipX ? 'scaleX(-1)' : undefined }}
    >
      {def.layers.map((layer, i) => {
        const { color, opacity } = bookStickerLayerPaint(layer, def.slots, colors);
        const alpha = opacity < 1 ? opacity : undefined;
        return layer.w ? (
          <path
            // A sticker's layers never reorder: their place in the list is their identity.
            key={i}
            d={layer.d}
            fill="none"
            stroke={color}
            strokeOpacity={alpha}
            strokeWidth={layer.w}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path key={i} d={layer.d} fill={color} fillOpacity={alpha} fillRule={layer.eo ? 'evenodd' : undefined} />
        );
      })}
    </svg>
  );
}

/** A sticker element on the page, in its frame. */
export function StickerView({ el, frameStyle }: { el: BookStickerElement; frameStyle: CSSProperties }) {
  const def = bookSticker(el.stickerId);
  if (!def) return null;
  return (
    <div style={frameStyle}>
      <StickerArt def={def} colors={el.colors} flipX={el.flipX} />
    </div>
  );
}
