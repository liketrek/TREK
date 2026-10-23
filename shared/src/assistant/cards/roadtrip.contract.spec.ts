import { ASSISTANT_CHANGE_VERB_KEYS, assistantAppliedSchema } from '../assistant.schema';
import { MAX_CARD_CHARS } from './card-parts';
import { chargingCardSchema } from './charging.card';
import { corridorCardSchema } from './corridor.card';
import { dayRouteCardSchema } from './day-route.card';
import { storedTrekCardSchema, trekCardSchema } from './index';
import { roadtripRulesCardSchema } from './roadtrip-rules.card';
import { ROADTRIP_CARD_DAYS_MAX, roadtripCardSchema, type RoadtripCardStop } from './roadtrip.card';
import { ROADTRIP_VERB_KEYS } from './roadtrip.contract';
import { transitCardSchema } from './transit.card';

import { describe, expect, it } from 'vitest';

const stop = (name: string, extra: Partial<RoadtripCardStop> = {}): RoadtripCardStop => ({
  placeId: 7,
  assignmentId: 70,
  name,
  lat: 48.13743,
  lng: 11.57549,
  stopType: null,
  time: null,
  leaveAt: null,
  dwellMinutes: 30,
  offRoadM: null,
  fillPercent: null,
  night: null,
  autoNight: null,
  bookend: null,
  carrier: null,
  arrival: '08:00',
  departure: '08:30',
  anchored: false,
  dayOffset: 0,
  late: [],
  findings: [],
  ...extra,
});

const day = (dayId: number) => ({
  dayId,
  dayNumber: dayId,
  date: '2026-10-01',
  title: null,
  distanceM: 152_000,
  durationS: 5880,
  stops: [stop('Munich'), stop('Verona', { placeId: 8, assignmentId: 80, arrival: '15:20', departure: null })],
  moreStops: 0,
  legs: [{ distanceM: 152_000, durationS: 5880, mode: 'driving' }],
  dayOver: null,
  avoidMissed: [],
  dryKm: null,
  lines: [
    [
      [48.13743, 11.57549],
      [45.43839, 10.99162],
    ],
  ],
});

const drive = {
  kind: 'roadtrip',
  complete: true,
  problem: null,
  previewKeys: [],
  vehicle: 'electric',
  defaultFill: 80,
  dayColors: true,
  distanceM: 152_000,
  durationS: 5880,
  stopCount: 2,
  chargingCount: 0,
  days: [day(1)],
  moreDays: 0,
  quietDays: 0,
  undatedRides: 0,
};

describe('road trip cards', () => {
  it('RTCARD-010: a drive with its days, stops and lines reads, and is one of the union', () => {
    expect(roadtripCardSchema.safeParse(drive).success).toBe(true);
    expect(trekCardSchema.safeParse(drive).success).toBe(true);
  });

  it('RTCARD-011: a drive past its bounds reads as no card instead of breaking the message', () => {
    const days = Array.from({ length: ROADTRIP_CARD_DAYS_MAX + 1 }, (_, index) => day(index + 1));
    expect(roadtripCardSchema.safeParse({ ...drive, days }).success).toBe(false);
    expect(storedTrekCardSchema.parse({ ...drive, days })).toBeNull();
    expect(storedTrekCardSchema.parse({ ...drive, days: [] })).toBeNull();
    const badClock = { ...drive, days: [{ ...day(1), stops: [stop('Munich', { arrival: '25:00' })] }] };
    expect(roadtripCardSchema.safeParse(badClock).success).toBe(false);
    const oneLinePoint = { ...drive, days: [{ ...day(1), lines: [[[48, 11]]] }] };
    expect(roadtripCardSchema.safeParse(oneLinePoint).success).toBe(false);
  });

  it('RTCARD-012: a terminal, a booked night and a day marker are stops of their own shape', () => {
    const terminal = stop('Munich Airport', {
      placeId: null,
      assignmentId: null,
      carrier: { reservationId: 4, type: 'flight', role: 'departure', title: 'LH 1840', code: 'MUC', at: '11:05' },
    });
    const night = stop('Hotel Adler', {
      assignmentId: null,
      stopType: 'hotel',
      bookend: {
        phase: 'evening',
        reservationId: null,
        checkingIn: true,
        checkingOut: false,
        checkIn: '15:00',
        checkOut: null,
      },
    });
    const marker = stop('Brenner', { autoNight: { phase: 'end', fromDayNumber: 1 } });
    const card = { ...drive, days: [{ ...day(1), stops: [terminal, night, marker], legs: [null, null] }] };
    expect(roadtripCardSchema.safeParse(card).success).toBe(true);
    const typeless = { ...terminal, carrier: { ...terminal.carrier, type: '' } };
    expect(roadtripCardSchema.safeParse({ ...drive, days: [{ ...day(1), stops: [typeless] }] }).success).toBe(false);
  });

  it('RTCARD-013: a corridor search, a charger, connections and a day route read, each within its bounds', () => {
    const corridor = {
      kind: 'corridor',
      dayId: 3,
      dayNumber: 2,
      category: 'charging',
      widthKm: 5,
      hits: [
        {
          ref: 'call_1:0',
          name: 'Ionity Holzkirchen',
          brand: 'Ionity',
          lat: 47.88,
          lng: 11.7,
          alongKm: 31.4,
          offKm: 0.42,
          between: ['Munich', 'Verona'],
          sockets: [{ type: 'ccs', kw: 350, count: 6 }],
        },
      ],
      more: 0,
      searched: { done: 6, total: 9 },
      partial: true,
    };
    expect(corridorCardSchema.safeParse(corridor).success).toBe(true);
    expect(corridorCardSchema.safeParse({ ...corridor, category: 'museum' }).success).toBe(false);

    const charging = {
      kind: 'charging',
      placeId: 7,
      name: 'Ionity Holzkirchen',
      station: null,
      lat: 47.88,
      lng: 11.7,
      status: 'ok',
      stale: false,
      available: 4,
      total: 6,
      checkedAt: '2026-10-01T09:38:00Z',
      updatedAt: null,
      energy: { amount: 0.59, currency: 'EUR' },
      otherPrices: 1,
      source: 'MobiData BW',
      license: 'CC BY 4.0',
    };
    expect(chargingCardSchema.safeParse(charging).success).toBe(true);
    expect(chargingCardSchema.safeParse({ ...charging, checkedAt: '2026-10-01 09:38' }).success).toBe(false);

    const leg = {
      mode: 'RAIL',
      line: 'RE 4',
      lineColor: '#ff0000',
      lineTextColor: null,
      from: { name: 'Munich Hbf', time: '08:04', track: '12' },
      to: { name: 'Rosenheim', time: '08:41', track: null },
      durationS: 2220,
      stops: 3,
      headsign: 'Salzburg',
      agency: null,
    };
    const itinerary = {
      date: '2026-10-01',
      start: '08:04',
      end: '08:41',
      endDayOffset: 0,
      durationS: 2220,
      transfers: 0,
      walkS: 0,
      legs: [leg],
    };
    const transit = { kind: 'transit', from: 'Munich', to: 'Rosenheim', dayId: null, more: 0, dropped: 0 };
    expect(transitCardSchema.safeParse({ ...transit, itineraries: [itinerary] }).success).toBe(true);
    const shortColour = { ...itinerary, legs: [{ ...leg, lineColor: '#f00' }] };
    expect(transitCardSchema.safeParse({ ...transit, itineraries: [shortColour] }).success).toBe(false);

    const route = {
      kind: 'dayRoute',
      dayId: 3,
      dayNumber: 2,
      stops: [{ placeId: 7, name: 'Munich', lat: 48.1, lng: 11.6, added: false }],
      vias: [{ lat: 47.5, lng: 11.2, after: 0, state: 'moved', from: [47.4, 11.1] }],
      afterName: 'Munich',
      track: null,
      unresolved: [],
    };
    expect(dayRouteCardSchema.safeParse(route).success).toBe(true);
    const lostVia = { ...route, vias: [{ ...route.vias[0], state: 'lost' }] };
    expect(dayRouteCardSchema.safeParse(lostVia).success).toBe(false);
  });

  it('RTCARD-014: the road trip adds its verbs and its applied entity to the shared enums', () => {
    for (const verb of ROADTRIP_VERB_KEYS) expect(ASSISTANT_CHANGE_VERB_KEYS).toContain(verb);
    const applied = { toolCallId: 'call_1', entity: 'roadtrip', ids: [5], dayId: 3, undoUntil: null };
    expect(assistantAppliedSchema.parse(applied).entity).toBe('roadtrip');
  });

  it('RTCARD-016: the rules a change sets read with their values as stored, and a key that is no setting does not', () => {
    const rules = {
      kind: 'roadtripRules',
      settings: [
        { key: 'roadtrip_day_start', before: '08:00', after: '09:30' },
        { key: 'roadtrip_hotel_bookends', before: null, after: true },
        { key: 'roadtrip_leg_minutes', before: 120, after: 0 },
      ],
      dayEnd: { dayId: 3, dayNumber: 2, mode: 'along', from: 'Garmisch', to: 'Innsbruck', percent: 40 },
    };
    expect(roadtripRulesCardSchema.safeParse(rules).success).toBe(true);
    expect(trekCardSchema.safeParse({ ...rules, dayEnd: null }).success).toBe(true);
    const foreign = { ...rules, settings: [{ key: 'endpoint_url', before: null, after: 'x' }] };
    expect(roadtripRulesCardSchema.safeParse(foreign).success).toBe(false);
    const auto = { ...rules, dayEnd: { ...rules.dayEnd, mode: 'never' } };
    expect(roadtripRulesCardSchema.safeParse(auto).success).toBe(false);
  });

  it('RTCARD-015: the fullest drive the bounds allow is a card the server can still check under the size cap', () => {
    // The bounds alone do not hold a drive under MAX_CARD_CHARS; the server's builder fits it.
    const days = Array.from({ length: ROADTRIP_CARD_DAYS_MAX }, (_, index) => day(index + 1));
    const full = { ...drive, days };
    expect(roadtripCardSchema.safeParse(full).success).toBe(true);
    expect(JSON.stringify(full).length).toBeLessThan(MAX_CARD_CHARS);
  });
});
