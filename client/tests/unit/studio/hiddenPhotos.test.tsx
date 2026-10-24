import { bookPageSetupForPreset, bookPhotoElementSchema, type BookSpread } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { SpreadView } from '../../../src/components/Studio/SpreadView';
import { render } from '../../helpers/render';

/**
 * FE-STUDIO-HIDE-001 to FE-STUDIO-HIDE-002
 *
 * A page drawn for the assistant shows only the asking user's own photos
 * (journey-studio.md 3.4): a photo named as hidden is drawn as its empty
 * frame, which stays on the page even in print, so the page still shows
 * where a picture sits; an unfilled frame still vanishes in print; without
 * the list every photo is drawn as before.
 */

const page = bookPageSetupForPreset('square-210');

function photo(id: string, photoId: number | null, x: number) {
  return bookPhotoElementSchema.parse({ id, kind: 'photo', frame: { x, y: 10, w: 60, h: 40 }, photoId });
}

const spread: BookSpread = {
  id: 'sp-3',
  role: 'inner',
  background: null,
  elements: [photo('p-own', 7, 10), photo('p-theirs', 31, 100), photo('p-empty', null, 200)],
  parked: [],
  entryId: null,
};

/** The pictures the sheet shows. */
function pictures(container: HTMLElement): string[] {
  return [...container.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? '');
}

/** How many things the sheet draws. */
const drawnCount = (container: HTMLElement) => container.firstElementChild?.childElementCount ?? 0;

/** The spread holding one element alone. */
const alone = (index: number): BookSpread => ({ ...spread, elements: spread.elements.slice(index, index + 1) });

describe('SpreadView: photos left out', () => {
  it('FE-STUDIO-HIDE-001: a hidden photo is an empty frame, kept in print, while an unfilled frame is not', () => {
    const { container } = render(<SpreadView spread={spread} page={page} print hiddenPhotoIds={new Set([31])} />);
    expect(pictures(container)).toEqual(['/api/photos/7/thumbnail']);

    const hidden = render(<SpreadView spread={alone(1)} page={page} print hiddenPhotoIds={new Set([31])} />).container;
    const unfilled = render(<SpreadView spread={alone(2)} page={page} print />).container;
    expect(pictures(hidden)).toEqual([]);
    expect(drawnCount(hidden)).toBe(drawnCount(unfilled) + 1);
  });

  it('FE-STUDIO-HIDE-002: without the list every photo is drawn as before', () => {
    const { container } = render(<SpreadView spread={spread} page={page} print />);

    expect(pictures(container)).toEqual(['/api/photos/7/thumbnail', '/api/photos/31/thumbnail']);
  });
});
