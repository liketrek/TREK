/**
 * The road trip's read cards: corridor hits in driving order with the stops
 * they lie between, a charger as checked (never its source's address), the
 * connections of a transit search with each clock local to its stop, the
 * journey a held create_transit_journey adds, and the stops a Google Maps
 * link names once the user let the read fetch it.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import type { PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import { answerCardOf, appliedCardOf, changeCardOf } from '../../../../../../src/nest/assistant/cards/registry';
import {
  chargingAnswerCard,
  corridorAnswerCard,
  googleRouteCard,
  itineraryOf,
  transitAnswerCard,
} from '../../../../../../src/nest/assistant/cards/roadtrip/roadtrip-reads';
import {
  MAX_CARD_CHARS,
  type ChargingCard,
  type CorridorCard,
  type DayRouteCard,
  type TransitCard,
} from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

const card = buildTripCard(
  1,
  7,
  { trip: { title: 'Alps' }, days: [{ id: 31, day_number: 2, assignments: [] }] },
  { places: [{ id: 5, name: 'Ionity Holzkirchen', lat: 47.88, lng: 11.7 }] },
  null,
);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en', today: '2026-10-01', airport: () => null };
const input = (args: Record<string, unknown>, value: unknown) => ({
  toolCallId: 'call_7',
  args,
  value,
  card,
  today: '2026-10-01',
});

const poi = (name: string, lat: number, lng: number, extra: Record<string, unknown> = {}) => ({
  osm_id: `node/${name}`,
  name,
  lat,
  lng,
  category: 'charging',
  poi_type: 'charging_station',
  source: 'osm',
  ...extra,
});

describe('corridor card', () => {
  const value = {
    dayNumber: 2,
    complete: false,
    totalAreas: 9,
    nextOffset: 6,
    hits: [
      {
        poi: poi('Ionity', 47.88, 11.7, {
          brand: 'Ionity',
          charging: {
            sockets: [
              { type: 'type2', kw: 22, count: 2 },
              { type: 'ccs', kw: 350, count: 6 },
              { type: '', kw: 50, count: 1 },
            ],
          },
        }),
        alongKm: 31.44,
        distanceKm: 0.4234,
        between: ['Munich', 'Verona'],
      },
      { poi: poi('', 47.5, 11.3), alongKm: 80.06, distanceKm: 1.2, between: null },
      { poi: poi('Broken', Number.NaN, 11), alongKm: 90, distanceKm: 0.1, between: null },
    ],
  };

  it('ASTRT-010: lists the hits in driving order with their refs, distances, stops and strongest sockets', () => {
    const built = corridorAnswerCard(input({ dayNumber: 2, category: 'charging', widthKm: 3, offset: 0 }, value));
    expect(built).toMatchObject({
      kind: 'corridor',
      dayId: 31,
      dayNumber: 2,
      category: 'charging',
      widthKm: 3,
      more: 0,
      searched: { done: 6, total: 9 },
      partial: true,
    });
    const hits = (built as CorridorCard).hits;
    expect(hits.map((hit) => hit.ref)).toEqual(['call_7:0', 'call_7:1']);
    expect(hits[0]).toMatchObject({ name: 'Ionity', brand: 'Ionity', alongKm: 31.4, offKm: 0.42 });
    expect(hits[0].between).toEqual(['Munich', 'Verona']);
    expect(hits[0].sockets).toEqual([
      { type: 'ccs', kw: 350, count: 6 },
      { type: 'type2', kw: 22, count: 2 },
    ]);
    expect(hits[1]).toMatchObject({ name: null, between: null, sockets: [] });
  });

  it('ASTRT-011: a search with nothing found still draws, one with an unknown category does not', () => {
    const none = corridorAnswerCard(input({ dayNumber: 2, category: 'fuel' }, { ...value, hits: [], complete: true }));
    expect(none).toMatchObject({ hits: [], partial: false, widthKm: 5 });
    expect(corridorAnswerCard(input({ dayNumber: 2, category: 'museum' }, value))).toBeNull();
    const checked = answerCardOf('search_roadtrip_corridor', input({ dayNumber: 2, category: 'charging' }, value));
    expect(checked).not.toBeNull();
  });
});

describe('charging card', () => {
  const info = {
    checkedAt: '2026-10-01T09:38:12.345Z',
    status: 'ok',
    station: 'Ionity Holzkirchen Nord',
    source: 'MobiData BW',
    sourceUrl: 'https://example.org/feed',
    license: 'CC BY 4.0',
    updatedAt: '2026-10-01T09:30:00+02:00',
    stale: false,
    available: 4,
    total: 6,
    unknown: 0,
    tariffs: [
      {
        currency: 'EUR',
        updatedAt: '2026-09-01T00:00:00Z',
        components: [
          { kind: 'ENERGY', price: 0.69, taxIncluded: true, conditional: false, afterSeconds: null },
          { kind: 'ENERGY', price: 0.59, taxIncluded: true, conditional: false, afterSeconds: null },
          { kind: 'TIME', price: 0.1, taxIncluded: true, conditional: false, afterSeconds: 3600 },
        ],
      },
    ],
    pricesUnavailable: false,
  };

  it('ASTRT-012: a stop of the trip as checked, with the cheapest energy price and its source but no address', () => {
    const built = chargingAnswerCard(input({ placeId: 5 }, info)) as ChargingCard;
    expect(built).toMatchObject({
      kind: 'charging',
      placeId: 5,
      name: 'Ionity Holzkirchen',
      station: 'Ionity Holzkirchen Nord',
      lat: 47.88,
      lng: 11.7,
      available: 4,
      total: 6,
      checkedAt: '2026-10-01T09:38:12Z',
      updatedAt: '2026-10-01T07:30:00Z',
      energy: { amount: 0.59, currency: 'EUR' },
      otherPrices: 2,
      source: 'MobiData BW',
      license: 'CC BY 4.0',
    });
    expect(JSON.stringify(built)).not.toContain('example.org');
  });

  it('ASTRT-013: a charger found by its position, prices in two currencies, and an answer that is no charger', () => {
    const twoCurrencies = {
      ...info,
      stale: true,
      tariffs: [...info.tariffs, { ...info.tariffs[0], currency: 'CHF' }],
    };
    const built = chargingAnswerCard(input({ lat: 47.1, lng: 9.5, name: 'Supercharger Chur' }, twoCurrencies));
    expect(built).toMatchObject({ placeId: null, name: 'Supercharger Chur', lat: 47.1, energy: null, stale: true });
    expect(chargingAnswerCard(input({ placeId: 5 }, 'No reliable data'))).toBeNull();
    const found = answerCardOf('lookup_roadtrip_charging_info', input({ lat: 47.1, lng: 9.5, name: '' }, info));
    expect(found).not.toBeNull();
  });
});

const transitLeg = (from: string, fromTime: string, to: string, toTime: string) => ({
  mode: 'RAIL',
  from: { name: from, lat: 48.14, lng: 11.56, time: fromTime, scheduledTime: fromTime, track: '12' },
  to: { name: to, lat: 47.86, lng: 12.12, time: toTime, scheduledTime: toTime, track: null },
  duration: 2220,
  distance: null,
  headsign: 'Salzburg',
  line: 'RE 4',
  lineColor: '#f00',
  lineTextColor: 'white',
  agency: 'DB',
  intermediateStops: 3,
  geometry: 'abc',
  geometryPrecision: 5,
});

describe('transit cards', () => {
  it('ASTRT-014: reads every clock in the zone of its stop, whatever offset the provider wrote', () => {
    const itinerary = itineraryOf({
      startTime: '2026-10-01T06:04:00Z',
      endTime: '2026-10-01T08:41:00+02:00',
      duration: 2220,
      transfers: 0,
      walkSeconds: 0,
      legs: [transitLeg('Munich Hbf', '2026-10-01T06:04:00Z', 'Rosenheim', '2026-10-01T06:41:00Z')],
    });
    expect(itinerary).toMatchObject({ date: '2026-10-01', start: '08:04', end: '08:41', endDayOffset: 0 });
    expect(itinerary?.legs[0]).toMatchObject({
      from: { name: 'Munich Hbf', time: '08:04', track: '12' },
      to: { name: 'Rosenheim', time: '08:41', track: null },
      line: 'RE 4',
      lineColor: '#ff0000',
      lineTextColor: null,
      stops: 3,
    });
  });

  it('ASTRT-015: a night connection lands a day later, and one in New York keeps its own clock', () => {
    const night = itineraryOf({
      startTime: '2026-10-01T21:30:00Z',
      endTime: '2026-10-02T05:10:00Z',
      legs: [transitLeg('Munich Hbf', '2026-10-01T21:30:00Z', 'Rosenheim', '2026-10-02T05:10:00Z')],
    });
    expect(night).toMatchObject({ date: '2026-10-01', start: '23:30', end: '07:10', endDayOffset: 1 });
    const newYork = transitLeg('Penn Station', '2026-10-01T09:00:00-04:00', 'Newark', '2026-10-01T09:30:00-04:00');
    const east = itineraryOf({
      startTime: '2026-10-01T13:00:00Z',
      endTime: '2026-10-01T13:30:00Z',
      legs: [
        {
          ...newYork,
          from: { ...newYork.from, lat: 40.75, lng: -73.99 },
          to: { ...newYork.to, lat: 40.73, lng: -74.17 },
        },
      ],
    });
    expect(east).toMatchObject({ start: '09:00', end: '09:30' });
    expect(itineraryOf({ startTime: 'soon', endTime: 'later', legs: [] })).toBeNull();
  });

  it('ASTRT-016: a search lists four connections and counts the rest; the held journey shows its one', () => {
    const itinerary = {
      startTime: '2026-10-01T06:04:00Z',
      endTime: '2026-10-01T06:41:00Z',
      duration: 2220,
      transfers: 0,
      walkSeconds: 0,
      legs: [transitLeg('Munich Hbf', '2026-10-01T06:04:00Z', 'Rosenheim', '2026-10-01T06:41:00Z')],
    };
    const args = {
      from: { name: 'Munich', lat: 48.14, lng: 11.56 },
      to: { name: 'Rosenheim', lat: 47.86, lng: 12.12 },
    };
    const value = { itineraries: Array.from({ length: 6 }, () => itinerary), dropped: 1 };
    const search = transitAnswerCard(input(args, value)) as TransitCard;
    expect(search).toMatchObject({ from: 'Munich', to: 'Rosenheim', dayId: null, more: 2, dropped: 1 });
    expect(search.itineraries).toHaveLength(4);
    expect(answerCardOf('search_transit_routes', input(args, value))).not.toBeNull();
    expect(transitAnswerCard(input(args, { itineraries: [], dropped: 3 }))).toBeNull();
    const held = changeCardOf('create_transit_journey', ctx, { ...args, dayId: 31, itinerary }, null) as TransitCard;
    expect(held).toMatchObject({ kind: 'transit', dayId: 31, more: 0, dropped: 0 });
    expect(held.itineraries).toHaveLength(1);
    expect(JSON.stringify(held)).not.toContain('geometry');
  });

  it('ASTRT-018: long connections give way one by one until the card fits, the ones left out counted', () => {
    const long = (name: string) => `${name} ${'Hauptbahnhof Gleis Nord '.repeat(6)}`;
    const leg = {
      ...transitLeg(long('Munich'), '2026-10-01T06:04:00Z', long('Rosenheim'), '2026-10-01T06:41:00Z'),
      headsign: long('Salzburg'),
      agency: long('Bayerische Regiobahn'),
      line: 'RE 4 Express Nord',
    };
    const itinerary = {
      startTime: '2026-10-01T06:04:00Z',
      endTime: '2026-10-01T06:41:00Z',
      legs: Array.from({ length: 12 }, () => leg),
    };
    const args = { from: { name: 'Munich' }, to: { name: 'Rosenheim' } };
    const built = transitAnswerCard(input(args, { itineraries: Array.from({ length: 5 }, () => itinerary) }));
    expect(built).not.toBeNull();
    const card = built as TransitCard;
    expect(JSON.stringify(card).length).toBeLessThanOrEqual(MAX_CARD_CHARS);
    expect(card.itineraries.length).toBeLessThan(4);
    expect(card.itineraries.length).toBeGreaterThan(0);
    expect(card.more).toBe(5 - card.itineraries.length);
  });
});

describe('Google Maps route card', () => {
  it('ASTRT-017: the stops the link names once read, the ones without a position counted apart', () => {
    const result = {
      stops: [
        { name: 'Munich', lat: 48.137, lng: 11.575 },
        { name: 'My location', lat: null, lng: null },
        { name: 'Garmisch', lat: 47.49, lng: 11.09 },
      ],
    };
    const built = googleRouteCard(result) as DayRouteCard;
    expect(built.stops.map((stop) => [stop.name, stop.added])).toEqual([
      ['Munich', true],
      ['Garmisch', true],
    ]);
    expect(built.unresolved).toEqual(['My location']);
    expect(appliedCardOf('preview_google_maps_route', { args: {}, result, preview: null })).toMatchObject({
      kind: 'dayRoute',
      dayId: null,
    });
    expect(googleRouteCard({ stops: [] })).toBeNull();
  });
});
