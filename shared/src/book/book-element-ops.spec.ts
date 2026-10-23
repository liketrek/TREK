import type { AutoEntry } from './auto/auto-types';
import { applyBookOps } from './book-ops';
import type { BookOpsContext } from './book-ops-core';
import type { BookPageOpInput } from './book-ops.schema';
import { blankBook } from './book-pages';
import type { BookTravelContext } from './book-travel';
import {
  bookPhotoElementSchema,
  bookSpreadSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookSpread,
} from './book.schema';
import type { JourneyStats } from './journey-stats.schema';

import { describe, expect, it } from 'vitest';

/**
 * The element operations of the book engine: every kind created at the size
 * the Studio's panels give it, restyled, arranged, aligned, distributed,
 * locked, duplicated, filled, copied, refreshed, and the grid and the auto
 * layout, with their refusals. The page is the default square book: 210 mm
 * pages, the fold at 210, 3 mm bleed, 5 mm safe margin.
 */

let seq = 0;
const newId = (p: string) => `${p}-n${++seq}`;

type Frame = { x: number; y: number; w: number; h: number };
type NewElement = Extract<BookPageOpInput, { op: 'add' }>['element'];

const photo = (id: string, photoId: number | null, frame: Frame = { x: 230, y: 20, w: 80, h: 60 }, over = {}) =>
  bookPhotoElementSchema.parse({ id, kind: 'photo', frame, photoId, ...over }) as BookElement;
const text = (id: string, words: string, frame: Frame = { x: 230, y: 120, w: 160, h: 40 }, over = {}) =>
  bookTextElementSchema.parse({ id, kind: 'text', frame, text: words, size: 10, ...over }) as BookElement;

function book(elements: BookElement[], over: Partial<BookSpread> = {}): BookDocument {
  const doc = blankBook({ title: 'Iceland', newId: (p) => `${p}-x` });
  const ids = ['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back'];
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: ids[i] as string }));
  spreads[2] = { ...(spreads[2] as BookSpread), elements, ...over };
  return { ...doc, spreads };
}

const inner = (doc: BookDocument) => doc.spreads[2] as BookSpread;
const find = (doc: BookDocument, id: string) => inner(doc).elements.find((e) => e.id === id);
const ids = (doc: BookDocument) => inner(doc).elements.map((e) => e.id);

type Point = JourneyStats['points'][number];
const pt = (label: string, lat: number, lng: number, country: string, entryId: number): Point => ({
  lat,
  lng,
  label,
  date: null,
  country,
  tripId: null,
  photoId: entryId === 7 ? 1 : null,
  entryId,
});

const stats: JourneyStats = {
  journeyId: 1,
  distance: 1_189_000,
  days: 14,
  steps: 2,
  photos: 3,
  places: 2,
  furthest: 400_000,
  countries: [
    { code: 'IS', name: 'Iceland', places: 1, firstVisit: '2026-06-02' },
    { code: 'NO', name: 'Norway', places: 1, firstVisit: '2026-06-09' },
  ],
  points: [pt('Reykjavik', 64.14, -21.94, 'IS', 7), pt('Bergen', 60.39, 5.32, 'NO', 8)],
  trips: [],
  excluded: [],
  start: '2026-06-02',
  end: '2026-06-15',
};

const entry: AutoEntry = {
  id: 7,
  title: 'Harbour',
  story: 'A long walk by the water.',
  location: 'Reykjavik',
  date: '2026-06-02',
  photos: [{ photoId: 1, width: 4000, height: 3000 }],
  lat: 64.14,
  lng: -21.94,
  country: 'IS',
  dayNumber: 1,
  dayCount: 14,
  mood: 'amazing',
  pros: ['Light'],
  cons: ['Wind'],
};

const travel: BookTravelContext = {
  locale: 'en',
  stats,
  path: [],
  entries: [entry],
  labels: { day: 'DAY', stations: 'S', summary: 'Sum', countries: 'C', distance: 'D', pros: 'Good', cons: 'Bad' },
};

const gallery = [
  { photoId: 1, caption: 'Harbour', width: 4000, height: 3000 },
  { photoId: 2, caption: null, width: 3000, height: 4000 },
];
const journey = { title: 'Iceland', subtitle: 'June', entries: [entry] };
const ctx: BookOpsContext = { photos: gallery, journey, travel };
const bare: BookOpsContext = { photos: gallery };

const run = (doc: BookDocument, ops: BookPageOpInput[], c: BookOpsContext = ctx) =>
  applyBookOps(doc, { spreadId: 'sp-in', ops }, { newId, ...c });

function ok(result: ReturnType<typeof applyBookOps>): BookDocument {
  if (!result.ok) throw new Error(`refused: ${result.error.code} ${result.error.message}`);
  expect(bookSpreadSchema.safeParse(inner(result.doc)).success).toBe(true);
  return result.doc;
}

const refusal = (result: ReturnType<typeof applyBookOps>) => (result.ok ? null : result.error.code);
const last = (doc: BookDocument) => inner(doc).elements[inner(doc).elements.length - 1] as BookElement;

const addTo = (element: NewElement, c: BookOpsContext) => run(book([]), [{ op: 'add', element }], c);
/** The element one `add` makes on an empty page. */
const added = (element: NewElement, c: BookOpsContext = ctx) => last(ok(addTo(element, c)));
/** The refusal one `add` gets on an empty page. */
const addRefusal = (element: NewElement, c: BookOpsContext = ctx) => refusal(addTo(element, c));

describe('add', () => {
  it('BOOKEL-001: adds a photo frame the size the panel gives it, centred on the right-hand page', () => {
    const page = book([], { parked: [photo('p-park', 2)] });
    const doc = ok(run(page, [{ op: 'add', element: { kind: 'photo', photoId: 2 } }]));
    expect(last(doc)).toMatchObject({ kind: 'photo', photoId: 2 });
    expect(last(doc).frame).toEqual({ x: 267.75, y: 57.75, w: 94.5, h: 94.5 });
    expect(inner(doc).parked).toEqual([]);
    const empty = added({ kind: 'photo', frameStyle: 'polaroid' });
    expect(empty).toMatchObject({ photoId: null, frameStyle: 'polaroid', frame: { w: 94.5, h: 109.62 } });
    expect(addRefusal({ kind: 'photo', photoId: 99 })).toBe('photo_not_in_gallery');
  });

  it('BOOKEL-002: adds a text in a preset, its words given or read from its binding', () => {
    const heading = added({ kind: 'text', preset: 'heading', text: 'Hi' });
    expect(heading).toMatchObject({ size: 30, weight: 700, leading: 1.1, tracking: -0.02, overridden: false });
    const caption = added({ kind: 'text', preset: 'caption', text: 'Note', italic: true });
    expect(caption).toMatchObject({ size: 7.5, weight: 600, tracking: 0.14, color: '#8a8578', italic: true });
    const bound = { source: 'journey.title' as const };
    const title = added({ kind: 'text', binding: bound });
    expect(title).toMatchObject({ text: 'Iceland', binding: bound, overridden: false });
    expect(added({ kind: 'text', binding: bound, text: 'Mine' })).toMatchObject({ text: 'Mine', overridden: true });
    expect(addRefusal({ kind: 'text', binding: { source: 'entry.date', entryId: 7 } })).toBe('text_required');
    expect(addRefusal({ kind: 'text' })).toBe('invalid_op');
    expect(addRefusal({ kind: 'text', binding: { source: 'entry.story' }, text: 'x' })).toBe('invalid_op');
    expect(addRefusal({ kind: 'text', binding: { source: 'photo.caption' }, text: 'x' })).toBe('invalid_op');
  });

  it('BOOKEL-003: adds a rule as a hairline, a banner wide, and any icon the Studio offers, by lucide name only', () => {
    expect(added({ kind: 'shape', shape: 'line' })).toMatchObject({ shape: 'rect', frame: { w: 105, h: 0.5 } });
    const banner = added({ kind: 'shape', shape: 'banner-ribbon', fill: null });
    expect(banner).toMatchObject({ fill: null, frame: { w: 107.1, h: 34.65 } });
    const icon = added({ kind: 'icon', name: 'Compass', color: '#c2410c' });
    expect(icon).toMatchObject({ name: 'Compass', color: '#c2410c', frame: { w: 37.8, h: 37.8 } });
    // Past the travel shelf: the whole library, its old names too, as the icon tab lists it.
    expect(added({ kind: 'icon', name: 'Pizza' })).toMatchObject({ kind: 'icon', name: 'Pizza' });
    expect(added({ kind: 'icon', name: 'AlertTriangle' })).toMatchObject({ name: 'AlertTriangle' });
    for (const name of ['NotAnIcon', 'PizzaIcon', 'pizza', 'Icon']) {
      expect(addRefusal({ kind: 'icon', name } as unknown as NewElement), name).toBe('invalid_op');
    }
  });

  it('BOOKEL-004: adds the travel kinds from the journey, and refuses them without its figures', () => {
    const map = added({ kind: 'map', scope: 'journey', style: 'dark' });
    expect(map).toMatchObject({ kind: 'map', style: 'dark', countries: ['IS', 'NO'] });
    const figures = added({ kind: 'stats', metrics: ['distance', 'days'] });
    expect(figures).toMatchObject({ kind: 'stats', metrics: ['distance', 'days'], values: { days: 14 } });
    expect(added({ kind: 'badge', variant: 'day', entryId: 7 })).toMatchObject({ text: 'DAY 1', style: 'chip' });
    expect(added({ kind: 'list', entryId: 7 })).toMatchObject({ kind: 'list', proLabel: 'Good', conLabel: 'Bad' });
    expect(addRefusal({ kind: 'badge', variant: 'mood', entryId: 7 })).toBe('text_required');
    const mood = added({ kind: 'badge', variant: 'mood', entryId: 7, text: 'Amazing' });
    expect(mood).toMatchObject({ code: 'amazing', text: 'Amazing' });
    expect(addRefusal({ kind: 'map', scope: 'journey' }, bare)).toBe('travel_unavailable');
    expect(addRefusal({ kind: 'badge', variant: 'day', entryId: 99 })).toBe('entry_not_found');
    expect(addRefusal({ kind: 'badge', variant: 'day', entryId: 7 }, bare)).toBe('travel_unavailable');
    expect(addRefusal({ kind: 'list', entryId: 7 }, bare)).toBe('travel_unavailable');
    expect(added({ kind: 'countries', codes: ['pt'] })).toMatchObject({ kind: 'countries', codes: ['PT'] });
  });

  it('BOOKEL-017: a flag or country mark asked for by its own code is labelled with that country', () => {
    // A flag sets the name beside the flag (sub); a country mark has it as its words, the outline beside them.
    expect(added({ kind: 'badge', variant: 'flag' })).toMatchObject({ code: 'IS', text: '', sub: 'Iceland' });
    const portugal = added({ kind: 'badge', variant: 'flag', code: 'PT' });
    expect(portugal).toMatchObject({ code: 'PT', text: '', sub: 'Portugal' });
    expect(added({ kind: 'badge', variant: 'country' })).toMatchObject({ code: 'IS', text: 'Iceland', sub: '' });
    const norway = added({ kind: 'badge', variant: 'country', entryId: 7, code: 'NO' });
    expect(norway).toMatchObject({ code: 'NO', text: 'Norway', sub: '' });
    expect(added({ kind: 'badge', variant: 'flag', code: 'PT', sub: 'Lisboa' })).toMatchObject({ sub: 'Lisboa' });
    const lisboa = added({ kind: 'badge', variant: 'country', code: 'PT', text: 'Lisboa' });
    expect(lisboa).toMatchObject({ code: 'PT', text: 'Lisboa', sub: '' });
    // Its own code names the country on a journey whose figures name none; without one there is nothing to show.
    const noCountries: BookOpsContext = { ...ctx, travel: { ...travel, stats: { ...stats, countries: [] } } };
    expect(added({ kind: 'badge', variant: 'flag', code: 'PT' }, noCountries)).toMatchObject({ sub: 'Portugal' });
    expect(addRefusal({ kind: 'badge', variant: 'flag' }, noCountries)).toBe('text_required');
    // Another mark's code is its own (a mood, the weather) and names no country.
    expect(added({ kind: 'badge', variant: 'mood', code: 'good', text: 'Good' })).toMatchObject({ sub: '' });
  });
});

describe('style, lock, arrange', () => {
  const one = () => book([text('t-1', 'Hi')]);

  it('BOOKEL-005: restyles an element of its own kind, refuses another kind, a locked one and an empty set', () => {
    const doc = ok(run(one(), [{ op: 'style', elementId: 't-1', set: { kind: 'text', size: 14 } }]));
    expect(find(doc, 't-1')).toMatchObject({ size: 14 });
    const photoLook = { kind: 'photo' as const, fit: 'contain' as const };
    expect(refusal(run(one(), [{ op: 'style', elementId: 't-1', set: photoLook }]))).toBe('wrong_kind');
    const locked = book([text('t-1', 'Hi', undefined, { locked: true })]);
    const smaller = { kind: 'text' as const, size: 9 };
    expect(refusal(run(locked, [{ op: 'style', elementId: 't-1', set: smaller }]))).toBe('locked');
    expect(refusal(run(one(), [{ op: 'style', elementId: 't-1', set: { kind: 'text' } }]))).toBe('invalid_op');
  });

  it('BOOKEL-006: locks and unlocks, the one operation a locked element accepts', () => {
    const locked = ok(run(one(), [{ op: 'lock', elementIds: ['t-1'], locked: true }]));
    expect(find(locked, 't-1')?.locked).toBe(true);
    expect(refusal(run(locked, [{ op: 'frame', elementId: 't-1', x: 240 }]))).toBe('locked');
    const open = ok(run(locked, [{ op: 'lock', elementIds: ['t-1'], locked: false }]));
    expect(find(open, 't-1')?.locked).toBe(false);
  });

  it('BOOKEL-007: moves elements in the paint order, keeping their order among themselves', () => {
    const page = book([text('a', 'a'), text('b', 'b'), text('c', 'c'), text('d', 'd')]);
    type To = 'front' | 'back' | 'forward' | 'backward';
    const arranged = (elementIds: string[], to: To) => ids(ok(run(page, [{ op: 'arrange', elementIds, to }])));
    expect(arranged(['a', 'b'], 'front')).toEqual(['c', 'd', 'a', 'b']);
    expect(arranged(['d', 'c'], 'back')).toEqual(['c', 'd', 'a', 'b']);
    expect(arranged(['a', 'c'], 'forward')).toEqual(['b', 'a', 'd', 'c']);
    expect(arranged(['b', 'd'], 'backward')).toEqual(['b', 'a', 'd', 'c']);
  });
});

describe('align, distribute', () => {
  const three = () =>
    book([
      text('a', 'a', { x: 230, y: 20, w: 40, h: 10 }),
      text('b', 'b', { x: 250, y: 60, w: 20, h: 10 }),
      text('c', 'c', { x: 300, y: 100, w: 60, h: 10 }),
    ]);
  const xs = (doc: BookDocument) => ['a', 'b', 'c'].map((id) => find(doc, id)?.frame.x);
  const ys = (doc: BookDocument) => ['a', 'b', 'c'].map((id) => find(doc, id)?.frame.y);

  it('BOOKEL-008: aligns to the selection, to the page and to its safe area', () => {
    const left = ok(run(three(), [{ op: 'align', elementIds: ['a', 'b', 'c'], edge: 'left' }]));
    expect(xs(left)).toEqual([230, 230, 230]);
    const right = ok(run(three(), [{ op: 'align', elementIds: ['b'], edge: 'right', to: 'page' }]));
    expect(find(right, 'b')?.frame.x).toBe(400);
    const safe = ok(run(three(), [{ op: 'align', elementIds: ['c'], edge: 'top', to: 'safe' }]));
    expect(find(safe, 'c')?.frame.y).toBe(5);
    const middle = ok(run(three(), [{ op: 'align', elementIds: ['a', 'c'], edge: 'middle' }]));
    expect(find(middle, 'a')?.frame.y).toBe(60);
  });

  it('BOOKEL-009: spaces three elements evenly or by a gap, and needs three different ones', () => {
    const even = ok(run(three(), [{ op: 'distribute', elementIds: ['a', 'b', 'c'], axis: 'horizontal' }]));
    expect(xs(even)).toEqual([230, 275, 300]);
    const gap = ok(run(three(), [{ op: 'distribute', elementIds: ['c', 'a', 'b'], axis: 'vertical', gap: 5 }]));
    expect(ys(gap)).toEqual([20, 35, 50]);
    const twice = run(three(), [{ op: 'distribute', elementIds: ['a', 'a', 'b'], axis: 'vertical' }]);
    expect(refusal(twice)).toBe('not_enough_elements');
  });
});

describe('duplicate, fill, copy', () => {
  it('BOOKEL-010: duplicates with new ids, 4 mm down and right unless told otherwise', () => {
    const doc = ok(run(book([text('t-1', 'Hi')]), [{ op: 'duplicate', elementIds: ['t-1'] }]));
    expect(last(doc)).toMatchObject({ kind: 'text', text: 'Hi', frame: { x: 234, y: 124 } });
    expect(last(doc).id).not.toBe('t-1');
    const moved = ok(run(book([text('t-1', 'Hi')]), [{ op: 'duplicate', elementIds: ['t-1'], dx: -10, dy: 0 }]));
    expect(last(moved).frame).toMatchObject({ x: 220, y: 120 });
  });

  it('BOOKEL-011: fills a page or the spread to the bleed, unturned, at the back, as the inspector does', () => {
    const page = book([text('t-1', 'Hi'), photo('p-1', 1, { x: 300, y: 50, w: 50, h: 40 }, { rotation: 8 })]);
    const filled = ok(run(page, [{ op: 'fill', elementId: 'p-1', scope: 'page' }]));
    const back = inner(filled).elements[0];
    expect(back).toMatchObject({ id: 'p-1', rotation: 0, frame: { x: 207, y: -3, w: 216, h: 216 } });
    const spread = ok(run(page, [{ op: 'fill', elementId: 'p-1', scope: 'spread' }]));
    expect(inner(spread).elements[0]?.frame).toEqual({ x: -3, y: -3, w: 426, h: 216 });
    expect(refusal(run(page, [{ op: 'fill', elementId: 't-1', scope: 'page' }]))).toBe('wrong_kind');
  });

  it('BOOKEL-012: copies elements of another page with new ids, photos checked against the gallery', () => {
    const doc = book([]);
    const cover = doc.spreads[0] as BookSpread;
    doc.spreads[0] = { ...cover, elements: [text('t-c', 'Cover', { x: 20, y: 20, w: 100, h: 10 })] };
    const copied = ok(run(doc, [{ op: 'copy_from', spreadId: 'sp-cover', elementIds: ['t-c'] }]));
    expect(last(copied)).toMatchObject({ text: 'Cover', frame: { x: 230 } });
    expect(last(copied).id).not.toBe('t-c');
    doc.spreads[0] = { ...cover, elements: [photo('p-c', 99)] };
    const stranger = run(doc, [{ op: 'copy_from', spreadId: 'sp-cover', elementIds: ['p-c'] }]);
    expect(refusal(stranger)).toBe('photo_not_in_gallery');
  });
});

describe('travel figures, grids and the auto layout', () => {
  it('BOOKEL-013: refreshes the travel figures of a page to the journey, and refuses without its figures', () => {
    const placed = ok(run(book([]), [{ op: 'add', element: { kind: 'stats', metrics: ['days'] } }]));
    const later = { ...ctx, travel: { ...travel, stats: { ...stats, days: 20 } } };
    const fresh = ok(run(placed, [{ op: 'refresh_travel' }], later));
    expect(last(fresh)).toMatchObject({ values: { days: 20 }, stale: false });
    expect(refusal(run(placed, [{ op: 'refresh_travel' }], bare))).toBe('travel_unavailable');
    const named = run(book([text('t-1', 'Hi')]), [{ op: 'refresh_travel', elementIds: ['t-1'] }]);
    expect(refusal(named)).toBe('wrong_kind');
  });

  it('BOOKEL-014: drops a photo grid in as empty frames over the safe area', () => {
    const doc = ok(run(book([]), [{ op: 'add_grid', grid: 'grid-4' }]));
    const frames = inner(doc).elements.filter((e) => e.kind === 'photo');
    expect(frames).toHaveLength(4);
    expect(frames.every((f) => f.kind === 'photo' && f.photoId === null)).toBe(true);
  });

  it('BOOKEL-015: lays a page out again from its entry, keeping its id, its locks and what it parked', () => {
    const kept = text('t-lock', 'Kept', undefined, { locked: true });
    const page = book([kept], { entryId: 7, parked: [photo('p-p', 2)] });
    const doc = ok(run(page, [{ op: 'layout', auto: true }]));
    expect(inner(doc).id).toBe('sp-in');
    expect(find(doc, 't-lock')).toBeDefined();
    expect(inner(doc).parked.map((e) => e.id)).toEqual(['p-p']);
    expect(inner(doc).elements.some((e) => e.kind === 'photo' && e.photoId === 1)).toBe(true);
    expect(refusal(run(book([]), [{ op: 'layout', auto: true }]))).toBe('layout_not_found');
    expect(refusal(run(page, [{ op: 'layout', auto: true }], bare))).toBe('travel_unavailable');
  });

  it('BOOKEL-016: sets a text in italics, with its own leading and tracking', () => {
    const op = { op: 'text' as const, elementId: 't-1', italic: true, leading: 2, tracking: 0.1 };
    const doc = ok(run(book([text('t-1', 'Hi')]), [op]));
    expect(find(doc, 't-1')).toMatchObject({ italic: true, leading: 2, tracking: 0.1 });
  });
});
