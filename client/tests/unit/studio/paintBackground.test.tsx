import { act as hookAct, renderHook } from '@testing-library/react';
import type { BookDocument, BookElement, BookSpread } from '@trek/shared';
import { MAX_SPREAD_ELEMENTS, bookPageSetupSchema, bookShapeElementSchema, withSpreadPaint } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  backgroundCandidates,
  backgroundPhotoOf,
  backgroundToAll,
  bleedFrame,
  withBackgroundPhoto,
  withoutBackgroundPhoto,
} from '../../../src/components/Studio/paint/backgroundPhoto';
import { usePaintChannel } from '../../../src/components/Studio/paint/usePaintChannel';
import { StudioBackgroundSection } from '../../../src/components/Studio/StudioBackgroundSection';
import type { JourneySource } from '../../../src/components/Studio/StudioSidebar';
import { useStudioStore } from '../../../src/store/studioStore';
import { act, fireEvent, render } from '../../helpers/render';

/** The value, or a failed test saying it was missing. */
function need<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('expected a value');
  return value;
}

/**
 * The page background: its paint, the same background on every page, and a
 * photograph under the whole page; and the channel that makes a drag one undo.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });
const frame = { x: 20, y: 20, w: 40, h: 40 };
const shape = (id: string): BookElement => bookShapeElementSchema.parse({ id, kind: 'shape', frame }) as BookElement;

const spread = (id: string, over: Partial<BookSpread> = {}): BookSpread => ({
  id,
  role: 'inner',
  background: null,
  elements: [],
  parked: [],
  entryId: null,
  ...over,
});
const book = (spreads: BookSpread[]): BookDocument => ({ version: 1, title: 'T', page, spreads }) as BookDocument;
const stripes = {
  type: 'pattern' as const,
  pattern: 'stripes' as const,
  fg: '#112233',
  bg: '#ffeedd',
  scale: 1,
  angle: 45,
};

const source: JourneySource = {
  entries: [
    {
      id: 4,
      title: 'Porto',
      story: null,
      location: null,
      date: null,
      lat: null,
      lng: null,
      mood: null,
      weather: null,
      pros: [],
      cons: [],
      photoIds: [21, 22],
    },
  ],
  photos: [
    { photoId: 21, entryIds: [4] },
    { photoId: 30, entryIds: [] },
  ],
  photoEntries: {},
};

describe('a background photo', () => {
  it('covers the whole sheet, bleed included, on a spread and on a single page', () => {
    expect(bleedFrame(spread('a'), page)).toEqual({ x: -3, y: -3, w: 426, h: 216 });
    expect(bleedFrame(spread('c', { role: 'cover' }), page)).toEqual({ x: -3, y: -3, w: 216, h: 216 });
  });

  it('goes in at the back, locked, and replaces the one there was', () => {
    let n = 0;
    const newId = () => `bg${++n}`;
    const once = need(withBackgroundPhoto(spread('a', { elements: [shape('s1')] }), page, 12, newId));
    expect(once.elements.map((e) => e.id)).toEqual(['bg1', 's1']);
    expect(once.elements[0]).toMatchObject({
      kind: 'photo',
      photoId: 12,
      locked: true,
      fit: 'cover',
      frame: { x: -3, w: 426 },
    });
    expect(backgroundPhotoOf(once, page)?.photoId).toBe(12);

    const twice = need(withBackgroundPhoto(once, page, 13, newId));
    expect(twice.elements.map((e) => e.id)).toEqual(['bg1', 's1']);
    expect(backgroundPhotoOf(twice, page)?.photoId).toBe(13);

    expect(withoutBackgroundPhoto(twice, page).elements.map((e) => e.id)).toEqual(['s1']);
    const plain = spread('b', { elements: [shape('s1')] });
    expect(withoutBackgroundPhoto(plain, page)).toBe(plain);
  });

  it('is not a photo that only happens to be at the back: unlocked, turned or smaller does not count', () => {
    const placed = need(withBackgroundPhoto(spread('a'), page, 5, () => 'p'));
    const back = placed.elements[0] as Extract<BookElement, { kind: 'photo' }>;
    expect(backgroundPhotoOf({ ...placed, elements: [{ ...back, locked: false }] }, page)).toBeNull();
    expect(backgroundPhotoOf({ ...placed, elements: [{ ...back, rotation: 3 }] }, page)).toBeNull();
    expect(backgroundPhotoOf({ ...placed, elements: [{ ...back, frame }] }, page)).toBeNull();
    expect(backgroundPhotoOf({ ...placed, elements: [{ ...back, photoId: null }] }, page)).toBeNull();
    expect(backgroundPhotoOf(undefined, page)).toBeNull();
  });

  it('is refused on a full page', () => {
    const full = spread('a', { elements: Array.from({ length: MAX_SPREAD_ELEMENTS }, (_, i) => shape(`s${i}`)) });
    expect(withBackgroundPhoto(full, page, 1, () => 'x')).toBeNull();
  });

  it('is offered from the page first, then its entry, then the gallery, each once', () => {
    expect(backgroundCandidates([3, 4], [4, 5], [5, 6, 7], 4)).toEqual([3, 4, 5, 6]);
  });
});

describe('the same background on every page', () => {
  it('copies the paint and its colour to the pages of its kind, the covers to the covers', () => {
    const from = withSpreadPaint(spread('a'), stripes);
    const doc = book([
      spread('cv', { role: 'cover', background: '#202020' }),
      from,
      spread('b', { background: '#000000' }),
      spread('l', { role: 'last' }),
    ]);
    const out = backgroundToAll(doc, 1);
    expect(out.spreads[2]).toMatchObject({ backgroundPaint: stripes, background: '#ffeedd' });
    expect(out.spreads[3]).toMatchObject({ backgroundPaint: stripes });
    expect(out.spreads[0]).toBe(doc.spreads[0]);
    expect(backgroundToAll(doc, 9)).toBe(doc);

    const covers = backgroundToAll(doc, 0);
    expect(covers.spreads[2]).toBe(doc.spreads[2]);
    const paper = backgroundToAll(book([spread('a'), spread('b', { background: '#000000' })]), 0);
    expect(paper.spreads[1].background).toBeNull();
  });

  it("gives every page the source page's link to the theme, or takes theirs away when it was painted by hand", () => {
    const linked = book([
      spread('a', { background: '#f4efe6', backgroundToken: 'paper' }),
      spread('b', { background: '#000000', backgroundToken: 'accent' }),
      spread('c', { background: '#000000' }),
    ]);
    const following = backgroundToAll(linked, 0);
    expect(following.spreads[1]).toMatchObject({ background: '#f4efe6', backgroundToken: 'paper' });
    expect(following.spreads[2]).toMatchObject({ background: '#f4efe6', backgroundToken: 'paper' });

    const byHand = backgroundToAll(book([spread('a', { background: '#dbeafe' }), ...linked.spreads.slice(1)]), 0);
    expect(byHand.spreads[1]).toMatchObject({ background: '#dbeafe' });
    expect(byHand.spreads[1].backgroundToken).toBeUndefined();
    expect(byHand.spreads[2].backgroundToken).toBeUndefined();
  });
});

describe('the background section', () => {
  beforeEach(() => {
    useStudioStore.getState().load(book([spread('a', { entryId: 4, elements: [shape('s1')] }), spread('b')]));
  });
  const draw = () => render(<StudioBackgroundSection spreadIndex={0} page={page} source={source} t={(k) => k} />);
  const spreads = () => need(useStudioStore.getState().doc).spreads;

  it('paints the page, gives every page the same, and says so for a moment', () => {
    vi.useFakeTimers();
    try {
      const { container } = draw();
      fireEvent.click(
        need(
          [...container.querySelectorAll('.st-paint-tab')].find((b) => b.textContent === 'journey.studio.paint.solid')
        )
      );
      expect(spreads()[0].background).toBe('#111111');
      const apply = need(container.querySelector('.st-paint-apply'));
      fireEvent.click(apply);
      expect(spreads()[1].background).toBe('#111111');
      expect(apply.textContent).toBe('journey.studio.paint.appliedAll');
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(apply.textContent).toBe('journey.studio.paint.applyAll');
    } finally {
      vi.useRealTimers();
    }
  });

  it('takes the page off the theme colour it followed once a colour is picked by hand', () => {
    // A white paper is no colour of its own: the page follows the theme's paper with no background.
    useStudioStore.getState().load(book([spread('a', { backgroundToken: 'paper' })]));
    const { container } = draw();
    fireEvent.click(
      need([...container.querySelectorAll('.st-paint-tab')].find((b) => b.textContent === 'journey.studio.paint.solid'))
    );
    expect(spreads()[0].background).toBe('#111111');
    expect(spreads()[0].backgroundToken).toBeUndefined();
  });

  it('offers the entry and the gallery photos, lays one under the page, and takes it away again', () => {
    const { container } = draw();
    const thumbs = container.querySelectorAll('.st-bgphoto');
    expect(thumbs).toHaveLength(3);
    fireEvent.click(thumbs[1]);
    expect(backgroundPhotoOf(spreads()[0], page)?.photoId).toBe(22);
    expect(need(container.querySelector('.st-bgphoto[aria-pressed="true"] img')).getAttribute('src')).toContain('22');
    fireEvent.click(need(container.querySelector('.st-paint-apply.is-danger')));
    expect(backgroundPhotoOf(spreads()[0], page)).toBeNull();
    fireEvent.click(thumbs[0]);
    fireEvent.click(need(container.querySelector('.st-bgphoto[aria-pressed="true"]')));
    expect(spreads()[0].elements.map((e) => e.id)).toEqual(['s1']);
  });

  it('says how to get a photo when the journey has none', () => {
    const { container } = render(
      <StudioBackgroundSection
        spreadIndex={1}
        page={page}
        source={{ entries: [], photos: [], photoEntries: {} }}
        t={(k) => k}
      />
    );
    expect(container.querySelector('.st-bgphoto')).toBeNull();
    expect(container.textContent).toContain('journey.studio.paint.noPhotos');
  });

  it('draws nothing for a page that is not there', () => {
    const { container } = render(<StudioBackgroundSection spreadIndex={9} page={page} source={source} t={(k) => k} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('the paint channel', () => {
  beforeEach(() => {
    useStudioStore.getState().load(book([spread('a')]));
  });

  it('makes a drag one undo step, and a click one of its own', () => {
    const { result } = renderHook(() =>
      usePaintChannel((paint) => (doc) => ({
        ...doc,
        spreads: doc.spreads.map((sp) => withSpreadPaint(sp, paint)),
      }))
    );
    const store = useStudioStore.getState;

    hookAct(() => {
      result.current.live({ type: 'solid', color: '#111111', alpha: 0.2 });
      result.current.live({ type: 'solid', color: '#111111', alpha: 0.5 });
      result.current.commit({ type: 'solid', color: '#111111', alpha: 0.6 });
    });
    expect(need(store().doc).spreads[0].backgroundPaint).toEqual({ type: 'solid', color: '#111111', alpha: 0.6 });
    expect(store().past).toHaveLength(1);

    hookAct(() => {
      result.current.commit({ type: 'solid', color: '#222222' });
    });
    expect(need(store().doc).spreads[0].background).toBe('#222222');
    expect(store().past).toHaveLength(2);

    hookAct(() => {
      store().undo();
    });
    hookAct(() => {
      store().undo();
    });
    expect(need(store().doc).spreads[0].backgroundPaint).toBeUndefined();
    expect(need(store().doc).spreads[0].background).toBeNull();
  });
});
