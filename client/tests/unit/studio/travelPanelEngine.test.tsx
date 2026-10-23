// STTRV-001 to STTRV-006 and STTRV-009: the Travel panel places what the book engine's factories build, so a figure,
// a map, a country or a mark added by hand is the element the assistant's `add` adds. Only the frame is the panel's
// own: centred across the spread rather than on the right-hand page.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BookDocument, BookElement, BookFrame, BookTravelContext, JourneyStats } from '@trek/shared';
import {
  BOOK_SATELLITE_TILES,
  bookBadgeValue,
  bookPageSetupSchema,
  bookTravelBadge,
  bookTravelCountries,
  bookTravelMap,
  bookTravelSize,
  bookTravelStats,
} from '@trek/shared';

import { StudioTravelPanel } from '../../../src/components/Studio/StudioTravelPanel';
import { useStudioStore } from '../../../src/store/studioStore';
import { fireEvent, render, screen } from '../../helpers/render';

// A placed map asks for its roads. The answer never comes, so every map stays as it was placed.
vi.mock('../../../src/components/Map/RouteCalculator', () => ({
  calculateRouteWithLegs: vi.fn(() => new Promise(() => {})),
}));

const ICELAND = 11;
const PORTUGAL = 22;

const page = bookPageSetupSchema.parse({ preset: 'square-210' });

/** A stop on the route, read from a trip's place rather than from an entry. */
const stop = (
  label: string,
  [lat, lng]: [number, number],
  country: string,
  tripId: number,
  date: string
): JourneyStats['points'][number] => ({
  lat,
  lng,
  label,
  date,
  country,
  tripId,
  photoId: null,
  entryId: null,
});

const stats: JourneyStats = {
  journeyId: 5,
  distance: 4_000_000,
  days: 21,
  steps: 6,
  photos: 40,
  places: 12,
  furthest: 3_000_000,
  countries: [
    { code: 'IS', name: 'Iceland', places: 2, firstVisit: '2026-06-02' },
    { code: 'PT', name: 'Portugal', places: 2, firstVisit: '2026-09-04' },
  ],
  points: [
    { ...stop('Reykjavík', [64.14, -21.94], 'IS', ICELAND, '2026-06-02'), photoId: 3 },
    stop('Akureyri', [65.68, -18.12], 'IS', ICELAND, '2026-06-06'),
    stop('Lisboa', [38.72, -9.14], 'PT', PORTUGAL, '2026-09-04'),
    stop('Porto', [41.15, -8.61], 'PT', PORTUGAL, '2026-09-08'),
  ],
  // Named apart from the countries, so a trip card and a country card never share a name.
  trips: [
    { id: ICELAND, title: 'June', start: '2026-06-02', end: '2026-06-14', points: 2 },
    { id: PORTUGAL, title: 'September', start: '2026-09-04', end: '2026-09-12', points: 2 },
  ],
  excluded: [],
  start: '2026-06-02',
  end: '2026-09-12',
};

/** The recorded way, as the hook hands it to the panel. */
const PATH: [number, number][][] = [
  [
    [64.14, -21.94],
    [65.68, -18.12],
  ],
  [
    [38.72, -9.14],
    [41.15, -8.61],
  ],
];

/** What the panel hands the factories: `t` answers with the key in this suite. */
const travel: BookTravelContext = {
  locale: 'en',
  stats,
  path: PATH,
  entries: [],
  labels: {
    day: 'journey.studio.day',
    stations: 'journey.studio.stations',
    summary: 'journey.studio.summary',
    countries: 'journey.studio.countries',
    distance: 'journey.studio.metric.distance',
    pros: 'journey.editor.pros',
    cons: 'journey.editor.cons',
  },
};

/** A size centred across the open spread, the panel's own placement. */
const spreadCentre = (size: { w: number; h: number }): BookFrame => ({
  x: (page.pageWidth * 2 - size.w) / 2,
  y: (page.pageHeight - size.h) / 2,
  w: size.w,
  h: size.h,
});

const ANY_FRAME: BookFrame = { x: 0, y: 0, w: 1, h: 1 };

/** An element apart from what the panel decides itself: the id it mints and where the frame goes. */
const content = (el: BookElement) => ({ ...el, id: '', frame: ANY_FRAME });

/** The panel on a journey, its words answered by `t`: the key itself unless a case says otherwise. */
function open(journey: JourneyStats = stats, t: (k: string) => string = (k) => k) {
  return render(
    <StudioTravelPanel
      page={page}
      stats={journey}
      path={PATH}
      t={t}
      locale="en"
      canEdit={false}
      onToggleStop={async () => true}
    />
  );
}

const card = (name: string) => screen.getByRole('button', { name });

/** The element the last click put on the page. */
function placed(): BookElement {
  const elements = useStudioStore.getState().doc?.spreads[0]?.elements ?? [];
  const last = elements[elements.length - 1];
  if (!last) throw new Error('nothing was placed');
  return last;
}

beforeEach(() => {
  useStudioStore.getState().load({
    version: 1,
    title: 'T',
    page,
    spreads: [{ id: 's1', role: 'inner', background: null, elements: [], parked: [], entryId: null }],
  } as unknown as BookDocument);
});

describe('the Travel panel builds through the book engine', () => {
  it('STTRV-001: places a single figure as the engine builds it, centred across the spread', () => {
    open();

    fireEvent.click(card('journey.studio.metric.days'));

    const size = bookTravelSize('stats', page);
    expect(content(placed())).toEqual(
      content(bookTravelStats(stats, { id: 'st', frame: ANY_FRAME, metrics: ['days'] }))
    );
    expect(placed().frame).toEqual(spreadCentre(size));
  });

  it('STTRV-002: places a journey map with the recorded way, in the style of its card', () => {
    open();

    fireEvent.click(card('journey.studio.mapStyle.dark'));

    const engine = bookTravelMap(travel, stats, { id: 'mp', frame: ANY_FRAME, scope: 'journey' });
    expect(content(placed())).toEqual(content({ ...engine, style: 'dark' as const }));
    expect(placed()).toMatchObject({ kind: 'map', style: 'dark', source: 'vector', tripId: null, path: PATH });
    expect(placed().frame).toEqual(spreadCentre(bookTravelSize('map', page)));
  });

  it('STTRV-003: places a map per trip of that trip alone, with its own countries and no journey trail', () => {
    open();

    fireEvent.click(card('June'));

    const engine = bookTravelMap(travel, stats, { id: 'mp', frame: ANY_FRAME, scope: { tripId: ICELAND } });
    expect(content(placed())).toEqual(content(engine));
    expect(placed()).toMatchObject({
      tripId: ICELAND,
      countries: ['IS'],
      path: [],
      points: [{ label: 'Reykjavík', photoId: 3 }, { label: 'Akureyri' }],
    });
  });

  it('STTRV-004: places the satellite map the engine places, with its tiles, its credit and a white line', () => {
    open();

    fireEvent.click(card('journey.studio.mapSourceSatellite'));

    const engine = bookTravelMap(travel, stats, { id: 'mp', frame: ANY_FRAME, scope: 'journey', source: 'satellite' });
    expect(content(placed())).toEqual(content(engine));
    expect(placed()).toMatchObject({ source: 'tiles', tileUrl: BOOK_SATELLITE_TILES, accent: '#ffffff' });
  });

  it('STTRV-005: places each mark with the words, size and style the engine gives it', () => {
    open();

    const marks = [
      ['journey.studio.dateMark', 'date'],
      ['journey.studio.dayMark', 'day'],
      ['journey.studio.coordsMark', 'coords'],
      ['journey.studio.flagMark', 'flag'],
      ['journey.studio.distanceMark', 'distance'],
    ] as const;
    for (const [name, variant] of marks) {
      fireEvent.click(card(name));
      const value = bookBadgeValue(travel, variant, null);
      if (!value) throw new Error(`the engine has no ${variant} mark for this journey`);
      expect(content(placed())).toEqual(content(bookTravelBadge({ id: 'bd', frame: ANY_FRAME, variant, value })));
      expect(placed().frame).toEqual(spreadCentre(bookTravelSize('badge', page, { variant })));
    }
    // The last one, read back as words: the distance in an outline.
    expect(placed()).toMatchObject({ variant: 'distance', text: '4,000 km', style: 'outline' });
  });

  it('STTRV-006: offers no date mark without a start, and places a country and its mark by the name', () => {
    open({ ...stats, start: null });

    expect(screen.queryByRole('button', { name: 'journey.studio.dateMark' })).toBeNull();
    fireEvent.click(card('journey.studio.dayMark'));
    expect(placed()).toMatchObject({ variant: 'day', text: 'journey.studio.day 1', style: 'chip' });

    const [outline, mark] = screen.getAllByRole('button', { name: 'Iceland' });
    fireEvent.click(outline);
    expect(content(placed())).toEqual(
      content(bookTravelCountries(travel, { id: 'co', frame: ANY_FRAME, codes: ['IS'] }))
    );
    expect(placed()).toMatchObject({ codes: ['IS'], names: ['Iceland'] });

    fireEvent.click(mark);
    expect(placed()).toMatchObject({ kind: 'badge', variant: 'country', text: 'Iceland', sub: '', code: 'IS' });
  });

  it('STTRV-009: places a country mark as the engine makes one, and the day where its word puts it', () => {
    open(stats, (k) => (k === 'journey.studio.day' ? '{day}日目' : k));

    const [, mark] = screen.getAllByRole('button', { name: 'Iceland' });
    fireEvent.click(mark);
    const value = bookBadgeValue(travel, 'country', null);
    expect(value).toEqual({ text: 'Iceland', sub: '', code: 'IS' });
    if (!value) throw new Error('the engine has no country mark for this journey');
    const engine = bookTravelBadge({ id: 'bd', frame: ANY_FRAME, variant: 'country', value });
    expect(content(placed())).toEqual(content(engine));
    expect(placed().frame).toEqual(spreadCentre(bookTravelSize('badge', page, { variant: 'country' })));

    fireEvent.click(card('journey.studio.dayMark'));
    expect(placed()).toMatchObject({ variant: 'day', text: '1日目' });
  });
});
