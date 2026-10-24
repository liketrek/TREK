import type { BookDocument, BookSpread } from '@trek/shared';
import { bookPhotoElementSchema, bookShapeElementSchema } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_RECENT,
  RECENT_KEY,
  readRecent,
  spreadPhotoIds,
  withRecent,
} from '../../../src/components/Studio/paint/paletteModel';
import {
  kmeansPalette,
  photoSwatches,
  readPhotoPalette,
  samplePixels,
} from '../../../src/components/Studio/paint/photoPalette';
import { StudioPaletteProvider } from '../../../src/components/Studio/paint/StudioPalette';
import { AlphaSlider, Swatches } from '../../../src/components/Studio/StudioSwatches';
import { act, fireEvent, render } from '../../helpers/render';

/** The value, or a failed test saying it was missing. */
function need<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('expected a value');
  return value;
}

/**
 * The colours the swatch rows offer beyond the fixed inks: the book's own,
 * the photos', and what was picked lately, and the opacity slider under them.
 */

const frame = { x: 0, y: 0, w: 10, h: 10 };
const labels = { book: 'Book', photos: 'Photos', recent: 'Recent', opacity: 'Opacity' };

const spread = (over: Partial<BookSpread> = {}): BookSpread => ({
  id: 'sp1',
  role: 'inner',
  background: '#f4efe6',
  elements: [],
  parked: [],
  entryId: null,
  ...over,
});
const doc = (spreads: BookSpread[]): BookDocument => ({
  version: 1,
  title: 'T',
  page: {} as BookDocument['page'],
  spreads,
});

describe('the photo palette', () => {
  it('reads the opaque pixels only, every n-th one', () => {
    const data = [255, 0, 0, 255, 0, 255, 0, 0, 0, 0, 255, 255];
    expect(samplePixels(data)).toEqual([
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 0, b: 255 },
    ]);
    expect(samplePixels(data, 2)).toEqual([
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 0, b: 255 },
    ]);
  });

  it('clusters a picture into its colours, largest first, the same answer every time', () => {
    const red = Array.from({ length: 30 }, () => ({ r: 250, g: 10, b: 10 }));
    const blue = Array.from({ length: 10 }, () => ({ r: 10, g: 10, b: 240 }));
    const out = kmeansPalette([...red, ...blue], 2);
    expect(out.map((s) => s.hex)).toEqual(['#fa0a0a', '#0a0af0']);
    expect(out[0].share).toBeCloseTo(0.75);
    expect(kmeansPalette([...red, ...blue], 2)).toEqual(out);
    expect(kmeansPalette([], 3)).toEqual([]);
    // Asking for more clusters than the picture has colours gives the colours it has.
    expect(kmeansPalette(red, 5).map((s) => s.hex)).toEqual(['#fa0a0a']);
  });

  it('offers the shared colours of several photos, and one grey at most', () => {
    const swatches = photoSwatches([
      [
        { hex: '#808080', share: 0.5 },
        { hex: '#c2410c', share: 0.3 },
      ],
      [
        { hex: '#7f7f7f', share: 0.4 },
        { hex: '#202020', share: 0.3 },
        { hex: '#1e3a8a', share: 0.3 },
      ],
    ]);
    expect(swatches).toContain('#c2410c');
    expect(swatches).toContain('#1e3a8a');
    expect(swatches.filter((h) => h === '#808080' || h === '#7f7f7f' || h === '#202020').length).toBeLessThanOrEqual(1);
    expect(photoSwatches([], 6)).toEqual([]);
  });

  it('resolves empty, never rejects, for a picture that will not load or a read already called off', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(readPhotoPalette('/nope.jpg', ctrl.signal)).resolves.toEqual([]);

    const original = globalThis.Image;
    class FailingImage {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      decoding = '';
      set src(v: string) {
        if (v) queueMicrotask(() => this.onerror?.());
      }
    }
    globalThis.Image = FailingImage as unknown as typeof Image;
    try {
      await expect(readPhotoPalette('/broken.jpg')).resolves.toEqual([]);
    } finally {
      globalThis.Image = original;
    }
  });
});

describe('recent colours', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('keeps each colour once, newest first, up to the limit', () => {
    let list: string[] = [];
    for (let i = 0; i < 12; i++) list = withRecent(list, `#00000${i % 10}`);
    expect(list).toHaveLength(MAX_RECENT);
    expect(withRecent(['#aaaaaa', '#bbbbbb'], '#BBBBBB')).toEqual(['#bbbbbb', '#aaaaaa']);
  });

  it('reads what storage holds, and an empty list from storage that is broken or refuses', () => {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(['#123456', 'red', 4]));
    expect(readRecent()).toEqual(['#123456']);
    window.localStorage.setItem(RECENT_KEY, '{oops');
    expect(readRecent()).toEqual([]);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readRecent()).toEqual([]);
  });

  it('remembers a picked colour and shows it as a row, where a fresh book shows the inks alone', () => {
    const { container } = render(
      <StudioPaletteProvider doc={doc([spread()])} spread={undefined} labels={labels}>
        <Swatches value="#111111" onPick={() => {}} />
      </StudioPaletteProvider>
    );
    // The book row: the page's own colour.
    expect(container.querySelector('[aria-label="Book"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Recent"]')).toBeNull();
    act(() => {
      fireEvent.click(need(container.querySelector('[aria-label="#0f766e"]')));
    });
    const recent = container.querySelector('[aria-label="Recent"]');
    expect(recent?.querySelector('[aria-label="#0f766e"]')).not.toBeNull();
    expect(JSON.parse(need(window.localStorage.getItem(RECENT_KEY)))).toEqual(['#0f766e']);
  });

  it('carries on without storage when writing is refused', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { container } = render(
      <StudioPaletteProvider doc={null} spread={undefined} labels={labels}>
        <Swatches value="#111111" onPick={() => {}} />
      </StudioPaletteProvider>
    );
    act(() => {
      fireEvent.click(need(container.querySelector('[aria-label="#9f1239"]')));
    });
    expect(container.querySelector('[aria-label="Recent"] [aria-label="#9f1239"]')).not.toBeNull();
  });
});

describe('the swatch rows', () => {
  it('lists the photos of a page, placed and parked, once each', () => {
    const p = (id: string, photoId: number | null) =>
      bookPhotoElementSchema.parse({ id, kind: 'photo', frame, photoId });
    const shape = bookShapeElementSchema.parse({ id: 's', kind: 'shape', frame });
    expect(
      spreadPhotoIds(spread({ elements: [p('a', 3), shape, p('b', null), p('c', 3)], parked: [p('d', 9)] }))
    ).toEqual([3, 9]);
    expect(spreadPhotoIds(undefined)).toEqual([]);
  });

  it('shows the fixed inks alone outside the book, and hides the rows when asked', () => {
    const { container, rerender } = render(<Swatches value="#111111" onPick={() => {}} />);
    expect(container.querySelectorAll('.st-swatch-row')).toHaveLength(0);
    rerender(
      <StudioPaletteProvider doc={doc([spread()])} spread={undefined} labels={labels}>
        <Swatches value="#111111" onPick={() => {}} rows={false} />
      </StudioPaletteProvider>
    );
    expect(container.querySelectorAll('.st-swatch-row')).toHaveLength(0);
  });

  it('remembers the colour the wheel stops on, not every one it passes', () => {
    const onPick = vi.fn();
    const { container } = render(
      <StudioPaletteProvider doc={null} spread={undefined} labels={labels}>
        <Swatches value="#111111" onPick={onPick} />
      </StudioPaletteProvider>
    );
    const wheel = need(container.querySelector('input[type="color"]'));
    fireEvent.change(wheel, { target: { value: '#123456' } });
    fireEvent.change(wheel, { target: { value: '#654321' } });
    expect(onPick).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[aria-label="Recent"]')).toBeNull();
    act(() => {
      fireEvent.blur(wheel);
    });
    expect(container.querySelectorAll('[aria-label="Recent"] .st-swatch')).toHaveLength(1);
  });
});

describe('the opacity slider', () => {
  it('reports while dragged and once more when let go', () => {
    const onChange = vi.fn();
    const { container } = render(<AlphaSlider color="#ff0000" value={0.5} onChange={onChange} label="Opacity" />);
    const range = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(range.value).toBe('50');
    expect(need(container.querySelector('.st-alpha-value')).textContent).toBe('50%');
    fireEvent.change(range, { target: { value: '30' } });
    expect(onChange).toHaveBeenLastCalledWith(0.3, false);
    fireEvent.pointerUp(range);
    expect(onChange).toHaveBeenLastCalledWith(0.3, true);
    // A key let go without a move since that commit is no change, so nothing more is reported.
    fireEvent.keyUp(range, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('sits under the swatches only when the caller takes an alpha', () => {
    const { container, rerender } = render(<Swatches value="#111111" onPick={() => {}} />);
    expect(container.querySelector('.st-alpha')).toBeNull();
    rerender(<Swatches value="#111111" onPick={() => {}} alpha={0.4} onAlpha={() => {}} />);
    expect((container.querySelector('.st-alpha input') as HTMLInputElement).value).toBe('40');
  });
});
