import type { BookFrame } from '@trek/shared';

import { HANDLES, HANDLE_POS, type HandleId } from './studioGestures';

/**
 * The selection chrome the sheet draws above the page for more than one
 * element: one box with the eight resize handles around all of them, dashed
 * when it is exactly one group, and the marquee while one is being drawn.
 * Screen pixels, like every outline on the sheet, so a line stays a hairline
 * at any zoom. The sheet is laid out in millimetres from its left edge in
 * every reading direction, which is why these sit at physical offsets.
 */

/** The rectangle of a frame on screen. */
const onScreen = (f: BookFrame, scaled: number) => ({
  left: f.x * scaled, // rtl-lint-disable: the sheet is measured from its left edge
  top: f.y * scaled,
  width: f.w * scaled,
  height: f.h * scaled,
});

/** The eight resize handles of a box, corners round and edges as short bars. */
export function ResizeHandles({ onResize }: { onResize: (e: React.PointerEvent, handle: HandleId) => void }) {
  return (
    <>
      {HANDLES.map((h) => {
        const kind = h.length === 2 ? 'is-corner' : h === 'n' || h === 's' ? 'is-h' : 'is-v';
        const at = HANDLE_POS[h];
        const place = { left: at.x, top: at.y, cursor: at.cursor }; // rtl-lint-disable: a corner of the box, not a side of the text
        return <span key={h} className={`st-handle ${kind}`} style={place} onPointerDown={(e) => onResize(e, h)} />;
      })}
    </>
  );
}

/** One box around a multi-selection, with handles that resize all of it (Shift keeps the proportions). */
export function SelectionBox({
  box,
  scaled,
  asGroup,
  handles,
  onResize,
}: {
  box: BookFrame;
  scaled: number;
  asGroup: boolean;
  handles: boolean;
  onResize: (e: React.PointerEvent, handle: HandleId) => void;
}) {
  return (
    <div className={`st-select-box ${asGroup ? 'is-group' : ''}`} style={onScreen(box, scaled)}>
      {handles && <ResizeHandles onResize={onResize} />}
    </div>
  );
}

/** The marquee being drawn. */
export function MarqueeRect({ rect, scaled }: { rect: BookFrame; scaled: number }) {
  return <div className="st-marquee" style={onScreen(rect, scaled)} />;
}
