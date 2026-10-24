import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { BookDocument, BookTextElement } from '@trek/shared';
import { BOOK_LOCKUPS, MAX_SPREAD_ELEMENTS, bookPageSetupSchema, normalizeBookDocument } from '@trek/shared';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { useStudioStore } from '../../store/studioStore';
import { StudioElementsPanel } from './StudioElementsPanel';
import { StudioTextStyles } from './StudioTextStyles';

/**
 * The Text styles shelf: every lockup drawn with the book's own title, placed
 * on the open page with one click and selected as one set, its texts fitted.
 */

const t = (k: string) => k;
const page = bookPageSetupSchema.parse({});
const source = { entries: [{ date: '2025-08-12', lat: null, lng: null }], photos: [{ photoId: 3 }] };

const book = (): BookDocument =>
  normalizeBookDocument({
    version: 1,
    title: 'Porto',
    page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
    spreads: [{ id: 'sp1', role: 'inner', entryId: null, background: null, elements: [], parked: [] }],
  });

/* jsdom lays nothing out; the tiles measure themselves to scale the page drawing into them. */
const size = Object.getOwnPropertyDescriptors(HTMLElement.prototype);
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 120 });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 90 });
});
afterAll(() => {
  for (const key of ['offsetWidth', 'offsetHeight'] as const) {
    const was = size[key];
    if (was) Object.defineProperty(HTMLElement.prototype, key, was);
  }
});

beforeEach(() => {
  useStudioStore.getState().load(book());
});

const elements = () => useStudioStore.getState().doc?.spreads[0]?.elements ?? [];

describe('the Text styles shelf', () => {
  it('draws every lockup in its group, named, with the book title in it', () => {
    render(<StudioTextStyles page={page} source={source} t={t} />);
    for (const group of ['titles', 'badges', 'chapters', 'quotes']) {
      expect(screen.getByText(`journey.studio.lockupGroup.${group}`)).toBeTruthy();
    }
    for (const l of BOOK_LOCKUPS)
      expect(screen.getByRole('button', { name: `journey.studio.lockup.${l.id}` })).toBeTruthy();
    const poster = screen.getByRole('button', { name: 'journey.studio.lockup.poster-stack' });
    expect(poster.textContent).toContain('Porto');
    expect(poster.textContent).toContain('2025');
    expect(screen.getByText('journey.studio.textStylesHint')).toBeTruthy();
  });

  it('places a lockup on the open page in one undo step, selected as one set, every text fitted', () => {
    render(<StudioTextStyles page={page} source={source} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.lockup.circle-badge' }));
    const placed = elements();
    expect(placed.length).toBeGreaterThan(3);
    expect(useStudioStore.getState().selection).toEqual(placed.map((e) => e.id));
    const texts = placed.filter((e): e is BookTextElement => e.kind === 'text');
    expect(texts.map((e) => e.text)).toContain('Porto');
    expect(texts.every((e) => e.fit === 'shrink')).toBe(true);
    for (const e of placed) expect(e.frame.x).toBeGreaterThan(210);
    expect(useStudioStore.getState().canUndo()).toBe(true);
    useStudioStore.getState().undo();
    expect(elements()).toEqual([]);
  });

  it('places nothing on a page without room for the whole set, so the book stays saveable', () => {
    const shapes = Array.from({ length: MAX_SPREAD_ELEMENTS - 2 }, (_, i) => ({
      id: `s${i}`,
      kind: 'shape',
      frame: { x: 0, y: 0, w: 5, h: 5 },
    }));
    const crowded = book();
    useStudioStore
      .getState()
      .load(normalizeBookDocument({ ...crowded, spreads: crowded.spreads.map((sp) => ({ ...sp, elements: shapes })) }));
    render(<StudioTextStyles page={page} source={source} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.lockup.circle-badge' }));
    expect(elements()).toHaveLength(MAX_SPREAD_ELEMENTS - 2);
    expect(useStudioStore.getState().canUndo()).toBe(false);
    expect(useStudioStore.getState().selection).toEqual([]);
  });

  it('opens the Elements panel on the type tab, the plain styles above the lockups', () => {
    render(<StudioElementsPanel page={page} t={t} source={source} />);
    expect(screen.getByRole('tab', { name: 'journey.studio.text' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('button', { name: 'journey.studio.styleTitle' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'journey.studio.quoteMark' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'journey.studio.lockup.postmark' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'journey.studio.shapes' }));
    expect(screen.queryByRole('button', { name: 'journey.studio.lockup.postmark' })).toBeNull();
  });
});

describe('a fitted text in the Studio', () => {
  it('is solved again whenever the document changes, and grows back when its frame does', () => {
    render(<StudioTextStyles page={page} source={source} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.lockup.minimal-caps' }));
    const title = elements()[0] as BookTextElement;
    const chosen = title.fitMax ?? title.size;
    const store = useStudioStore.getState();
    store.setFrame(0, title.id, { ...title.frame, w: 8 });
    const squeezed = elements()[0] as BookTextElement;
    expect(squeezed.size).toBeLessThan(chosen);
    store.setFrame(0, title.id, title.frame);
    expect((elements()[0] as BookTextElement).size).toBe(title.size);
  });
});
