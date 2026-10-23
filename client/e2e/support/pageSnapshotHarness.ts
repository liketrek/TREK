import { bookPageSetupForPreset, bookShapeElementSchema, bookTextElementSchema, type BookSpread } from '@trek/shared';
import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { SpreadView } from '../../src/components/Studio/SpreadView';
import { sheetSizePx, snapshotSpread } from '../../src/components/Studio/pageSnapshot';

/**
 * Loaded by the page snapshot flows inside the running app, where the dev
 * server serves it as a module: draws a seeded spread with the editor's own
 * SpreadView and turns it into the JPEG the Studio sends the assistant, so a
 * real Chromium and a real WebKit prove the rasteriser works end to end. A map
 * tile from another server sits on the sheet and must be left out; the flow
 * names the tile and watches its server.
 */

export interface SeededSnapshot {
  type: string;
  bytes: number;
  /** The first bytes of the file: a JPEG starts FF D8 FF. */
  head: number[];
  width: number;
  height: number;
  /** The image decoded again, as the browser reads it. */
  decodedWidth: number;
  decodedHeight: number;
  drawnPhotoIds: number[];
}

function seededSpread(): BookSpread {
  return {
    id: 'sp-seeded',
    role: 'inner',
    background: '#f4efe6',
    elements: [
      bookShapeElementSchema.parse({ id: 'shape', kind: 'shape', frame: { x: 20, y: 20, w: 160, h: 90 } }),
      bookTextElementSchema.parse({
        id: 'title',
        kind: 'text',
        frame: { x: 230, y: 30, w: 160, h: 30 },
        text: 'Lisbon',
      }),
    ],
    parked: [],
    entryId: null,
  };
}

export async function snapshotSeededSpread(tileUrl: string): Promise<SeededSnapshot | null> {
  const page = bookPageSetupForPreset('square-210');
  const spread = seededSpread();
  const size = sheetSizePx(spread, page);
  // Off screen as the Studio's stage is; the sheet inside it is what is drawn.
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;top:0;inset-inline-start:-20000px';
  const sheet = document.createElement('div');
  sheet.style.cssText = `position:relative;width:${size.width}px;height:${size.height}px`;
  host.appendChild(sheet);
  document.body.appendChild(host);
  const root = createRoot(sheet);
  flushSync(() => root.render(createElement(SpreadView, { spread, page, print: true })));
  const tile = document.createElement('img');
  tile.src = tileUrl;
  sheet.firstElementChild?.appendChild(tile);
  try {
    const shot = await snapshotSpread(sheet, size, new Set());
    if (!shot) return null;
    const head = [...new Uint8Array(await shot.image.slice(0, 3).arrayBuffer())];
    const bitmap = await createImageBitmap(shot.image);
    return {
      type: shot.image.type,
      bytes: shot.image.size,
      head,
      width: shot.width,
      height: shot.height,
      decodedWidth: bitmap.width,
      decodedHeight: bitmap.height,
      drawnPhotoIds: shot.drawnPhotoIds,
    };
  } finally {
    root.unmount();
    host.remove();
  }
}
