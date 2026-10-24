// STTRV-001 to STTRV-009: the Travel panel places what the book engine's factories build, set in one of the newer
// looks, so a figure, a map, a country or a mark added by hand is the element the assistant's `add` adds in that look.
// Only the frame and the look are the panel's own.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BookDocument, BookElement, BookFrame, BookTravelContext, JourneyStats } from '@trek/shared';
import {
  BOOK_SATELLITE_TILES,
  bookBadgeValue,
  bookPageSetupSchema,
  bookThemeOf,
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

/** Open one of the panel's tabs by its name. */
const tab = (key: string) => fireEvent.click(screen.getByRole('tab', { name: key }));

describe('the Travel panel builds through the book engine', () => {
  it('STTRV-001: places a summary in the look of its card, with the figures the engine resolves', () => {
    open();

    fireEvent.click(card('journey.studio.statsLook.poster'));

    const engine = bookTravelStats(stats, {
      id: 'st',
      frame: ANY_FRAME,
      metrics: ['distance', 'days', 'countries', 'photos'],
    });
    expect(content(placed())).toEqual(content({ ...engine, look: 'poster' as const }));
  });

  it('STTRV-002: offers each figure on its own as a medal, an odometer and a sketch', () => {
    open();

    const days = screen.getAllByRole('button', { name: 'journey.studio.metric.days' });
    expect(days).toHaveLength(3);
    const looks = days.map((button) => {
      fireEvent.click(button);
      return placed() as { look?: string; metrics?: string[] };
    });
    expect(looks.map((el) => el.look)).toEqual(['medal', 'odometer', 'sketch']);
    expect(looks.every((el) => el.metrics?.join() === 'days')).toBe(true);
  });

  it('STTRV-003: places the journey map with its stops numbered, its ends marked or on the dark ground', () => {
    open();
    tab('journey.studio.travelMaps');

    fireEvent.click(card('journey.studio.pinNumbered'));
    const engine = bookTravelMap(travel, stats, { id: 'mp', frame: ANY_FRAME, scope: 'journey' });
    expect(content(placed())).toEqual(content({ ...engine, style: 'minimal' as const, pinStyle: 'numbered' as const }));
    expect(placed()).toMatchObject({ kind: 'map', source: 'vector', tripId: null, path: PATH });
    expect(placed().frame).toEqual(spreadCentre(bookTravelSize('map', page)));

    fireEvent.click(card('journey.studio.pinEnds'));
    expect(placed()).toMatchObject({ pinStyle: 'ends' });
    fireEvent.click(card('journey.studio.mapStyle.dark'));
    expect(placed()).toMatchObject({ style: 'dark', pinStyle: 'numbered' });
  });

  it('STTRV-004: places a map per trip of that trip alone, numbered, with no journey trail', () => {
    open();
    tab('journey.studio.travelMaps');

    fireEvent.click(card('June'));

    expect(placed()).toMatchObject({
      tripId: ICELAND,
      countries: ['IS'],
      path: [],
      pinStyle: 'numbered',
      points: [{ label: 'Reykjavík', photoId: 3 }, { label: 'Akureyri' }],
    });
  });

  it('STTRV-005: places the satellite map the engine places, with its tiles, its credit and a white line', () => {
    open();
    tab('journey.studio.travelMaps');

    fireEvent.click(screen.getAllByRole('button', { name: 'journey.studio.mapSourceSatellite' })[0] as HTMLElement);

    const engine = bookTravelMap(travel, stats, { id: 'mp', frame: ANY_FRAME, scope: 'journey', source: 'satellite' });
    expect(content(placed())).toEqual(content({ ...engine, style: 'minimal' as const }));
    expect(placed()).toMatchObject({ source: 'tiles', tileUrl: BOOK_SATELLITE_TILES, accent: '#ffffff' });
  });

  it('STTRV-006: places a map of one country with its stops alone, cut to its shape on a dark ground', () => {
    open();
    tab('journey.studio.travelMaps');

    fireEvent.click(screen.getAllByRole('button', { name: 'journey.studio.mapClipCountry' })[0] as HTMLElement);

    expect(placed()).toMatchObject({
      clip: 'country',
      style: 'dark',
      pinStyle: 'numbered',
      countries: ['IS'],
      path: [],
      points: [{ label: 'Reykjavík' }, { label: 'Akureyri' }],
    });
  });

  it('STTRV-007: offers every country in every look, each placing that country alone', () => {
    open();
    tab('journey.studio.countries');

    const looks = ['stamp', 'visa', 'postcard', 'flag', 'pin', 'label', 'sketch'] as const;
    for (const look of looks) {
      const [iceland] = screen.getAllByRole('button', { name: `journey.studio.countryLook.${look}` });
      fireEvent.click(iceland as HTMLElement);
      const engine = bookTravelCountries(travel, { id: 'co', frame: ANY_FRAME, codes: ['IS'] });
      expect(placed()).toMatchObject({ kind: 'countries', codes: engine.codes, names: engine.names, look });
    }
  });

  it('STTRV-008: places each mark in its style with the words the engine gives it', () => {
    open();
    tab('journey.studio.marks');

    const [stamp] = screen.getAllByRole('button', { name: 'journey.studio.dateMark' });
    fireEvent.click(stamp as HTMLElement);
    const value = bookBadgeValue(travel, 'date', null);
    if (!value) throw new Error('the engine has no date mark for this journey');
    expect(content(placed())).toEqual(
      content({ ...bookTravelBadge({ id: 'bd', frame: ANY_FRAME, variant: 'date', value }), style: 'stamp' as const })
    );

    const styles = screen.getAllByRole('button', { name: 'journey.studio.distanceMark' }).map((button) => {
      fireEvent.click(button);
      return (placed() as { style?: string }).style;
    });
    expect(styles).toEqual(['tag', 'pill', 'ribbon', 'sticker', 'patch', 'sketch']);
    expect(placed()).toMatchObject({ variant: 'distance', text: '4,000 km' });
  });

  it('STTRV-009: offers no date mark without a start, and the day where its word puts it', () => {
    open({ ...stats, start: null }, (k) => (k === 'journey.studio.day' ? '{day}日目' : k));
    tab('journey.studio.marks');

    expect(screen.queryAllByRole('button', { name: 'journey.studio.dateMark' })).toHaveLength(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'journey.studio.dayMark' })[0] as HTMLElement);
    expect(placed()).toMatchObject({ variant: 'day', text: '1日目', style: 'stamp' });
  });

  it("STTRV-010: dresses what it places in the book's theme, linked so it follows a change of theme", () => {
    const theme = bookThemeOf('nordic');
    useStudioStore.getState().load({
      version: 1,
      title: 'T',
      page,
      theme,
      spreads: [{ id: 's1', role: 'inner', background: null, elements: [], parked: [], entryId: null }],
    } as unknown as BookDocument);
    open();

    fireEvent.click(card('journey.studio.statsLook.tiles'));
    expect(placed()).toMatchObject({
      accent: theme.palette.accent,
      accentToken: 'accent',
      token: 'ink',
      fontRole: 'heading',
    });

    fireEvent.click(card('journey.studio.statsLook.note'));
    expect(placed()).toMatchObject({ fontRole: 'script' });
  });
});
