import type { BookPageSetup, BookSpread } from '@trek/shared';

import { SpreadFold, SpreadView } from './SpreadView';

/** CSS pixels in a millimetre: the size SpreadView's millimetre boxes are drawn at before the scale. */
const PX_PER_MM = 96 / 25.4;

interface SpreadThumbProps {
  spread: BookSpread;
  page: BookPageSetup;
  /** The drawn width in CSS pixels; the height follows the page. */
  width: number;
  /** The page numbers the spread carries, from foliosOf; none where the caller holds no book around it. */
  folios?: readonly number[];
  /** The crease of an open book down a double spread. */
  fold?: boolean;
  /** The sheet's look: the page rail's `st-thumb-sheet`, a card's own classes. It must position its children. */
  className?: string;
  /** Pixels per millimetre the caller draws at; CSS's own unless the caller zooms. */
  pxPerMm?: number;
}

/**
 * One spread at a small size: the editor's own SpreadView under a scale()
 * rather than a second drawing of the page, so a thumbnail can never look
 * different from the sheet. The page rail draws each page with it, and the
 * Studio chat's page card draws a change before and after with it.
 *
 * A page is laid out in millimetres from its top left whatever the reading
 * direction, so the sheet is always drawn left to right.
 */
export function SpreadThumb({
  spread,
  page,
  width,
  folios,
  fold = false,
  className,
  pxPerMm = PX_PER_MM,
}: SpreadThumbProps) {
  const single = spread.role !== 'inner';
  const wMm = single ? page.pageWidth : page.pageWidth * 2;
  const scale = width / (wMm * pxPerMm);
  return (
    <div dir="ltr" className={className} style={{ width, height: page.pageHeight * pxPerMm * scale }}>
      <div
        style={{
          position: 'absolute',
          insetInlineStart: 0,
          top: 0,
          width: `${wMm}mm`,
          height: `${page.pageHeight}mm`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <SpreadView spread={spread} page={page} folios={folios} />
      </div>
      {fold && !single && <SpreadFold page={page} scaled={pxPerMm * scale} />}
    </div>
  );
}
