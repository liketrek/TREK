import { type BookElement, type BookPageSetup, bookElementId, bookNewLine } from '@trek/shared';
import type { ReactNode } from 'react';

import { LinePaths } from './LineView';
import { Shelf } from './StudioPanelHead';
import { DIVIDER_PRESETS, LINE_PRESETS, type LinePreset as Preset, presetPoints } from './linePresets';
import { lineGeometry } from './lineRender';

/**
 * The drawn lines and dividers of the Elements panel: a straight rule, arrows,
 * dashes and dots, a curve, a wave, a zigzag, a line drawn by hand, a dotted
 * route, and the rules a title sits between.
 *
 * Each tile is drawn by the same geometry the page uses, so the tile is the
 * line you get. They arrive half a page wide on the right-hand page, where the
 * assistant's `add` puts them too, and their ends are moved on the canvas.
 */

/** A line as the page draws it, as a tile. */
function LineGlyph({ preset }: { preset: Preset }) {
  const W = 40;
  const H = 24;
  const el = bookNewLine(
    {
      ...preset.look,
      strokeWidth: Math.max(1.2, (preset.look.strokeWidth ?? 0.5) * 2.4),
      points: presetPoints(preset, 4, H / 2, W - 8),
    },
    { id: preset.id, frame: null, inner: false, page: { pageWidth: W, pageHeight: H } as BookPageSetup }
  );
  const g = lineGeometry(el, el.frame.w, el.frame.h, preset.id);
  return (
    <svg viewBox={`${-el.frame.x} ${-el.frame.y} ${W} ${H}`} width="100%" height="100%" aria-hidden>
      <LinePaths g={g} color="currentColor" width={el.strokeWidth} />
    </svg>
  );
}

export function StudioLineShelf({
  page,
  single,
  onAdd,
  t,
  lead,
}: {
  page: BookPageSetup;
  single: boolean;
  onAdd: (el: BookElement) => void;
  t: (k: string) => string;
  /** A tile before the drawn lines: the Elements panel puts its plain rule there. */
  lead?: ReactNode;
}) {
  const add = (preset: Preset) => {
    const origin = single ? 0 : page.pageWidth;
    const w = page.pageWidth * (preset.id.startsWith('divider') ? 0.4 : 0.5);
    const x = origin + (page.pageWidth - w) / 2;
    const points = presetPoints(preset, x, page.pageHeight / 2, w);
    onAdd(bookNewLine({ ...preset.look, points }, { id: bookElementId('l'), frame: null, inner: !single, page }));
  };
  const tiles = (list: readonly Preset[], first?: ReactNode) => (
    <div className="st-shape-grid">
      {first}
      {list.map((p) => {
        const label = t(`journey.studio.linePreset.${p.id}`);
        return (
          <button
            type="button"
            key={p.id}
            className="st-shape-btn is-glyph"
            onClick={() => add(p)}
            title={label}
            aria-label={label}
          >
            <LineGlyph preset={p} />
          </button>
        );
      })}
    </div>
  );
  return (
    <>
      <Shelf label={t('journey.studio.drawnLines')}>{tiles(LINE_PRESETS, lead)}</Shelf>
      <Shelf label={t('journey.studio.dividers')}>{tiles(DIVIDER_PRESETS)}</Shelf>
    </>
  );
}
