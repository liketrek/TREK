/**
 * The trip card the assistant plans with: built from the raw answers of the
 * trip tools (tolerating broken ones), rendered with the ids the model needs,
 * and the turn context around it (today in the user's zone, their units).
 */
import {
  buildTripCard,
  categoriesFrom,
  languageName,
  renderTripCard,
  todayIn,
  tripMemoryOf,
  turnContext,
} from '../../../../src/nest/assistant/assistant-context';

import { describe, expect, it } from 'vitest';

const SUMMARY = {
  trip: { id: 1, title: 'Kyoto in June', start_date: '2026-06-11', end_date: '2026-06-12', currency: 'JPY' },
  members: {
    owner: { id: 7, username: 'mia', email: 'mia@example.test' },
    collaborators: [{ id: 8, username: 'jon' }],
  },
  days: [
    {
      id: 31,
      day_number: 1,
      date: '2026-06-11',
      title: 'Arrival',
      assignments: [{ id: 301, place: { id: 12, name: 'Nishiki Market', lat: 35.005, lng: 135.764 } }],
      notes: [{ id: 41, text: 'Pick up rail pass', time: '09:00', icon: '🎫', color: null }],
    },
    { id: 32, day_number: 2, date: '2026-06-12', title: null, assignments: [], notes: [] },
  ],
  packing: { items: [{ id: 51, name: 'Umbrella', category: 'Gear', quantity: 1, weight_grams: 300 }] },
};
const PLACES = {
  places: [
    { id: 12, name: 'Nishiki Market', address: 'Nakagyo Ward' },
    { id: 14, name: 'Fushimi Inari', category_id: 3, price: 0 },
  ],
};

describe('buildTripCard', () => {
  it('ASTCTX-030: knows the source ids of places and the bookings with their day', () => {
    const card = buildTripCard(
      1,
      7,
      {
        ...SUMMARY,
        reservations: [{ id: 71, title: 'Gion Corner', day_id: 31 }, { id: 72, day_id: null }, { title: 'no id' }],
      },
      { places: [{ id: 14, name: 'Fushimi Inari', google_place_id: 'ChIJf', osm_id: 'way:9' }] },
      null,
    );
    expect(card.places.get(14)).toMatchObject({ googlePlaceId: 'ChIJf', osmId: 'way:9' });
    expect(card.places.get(12)).toMatchObject({ googlePlaceId: null, osmId: null });
    expect([...card.reservations.entries()]).toEqual([
      [71, { title: 'Gion Corner', dayId: 31 }],
      [72, { title: '#72', dayId: null }],
    ]);
    expect(card.mentions).toEqual([]);
  });

  it('ASTCTX-031: names what the user mentioned that is in the trip, and nothing that is not or is in focus', () => {
    const summary = {
      ...SUMMARY,
      reservations: [
        { id: 71, title: 'Gion Corner', day_id: 31 },
        { id: 73, title: 'Bus' },
      ],
    };
    const card = buildTripCard(1, 7, summary, PLACES, { dayId: 32, placeIds: [12] }, [
      { kind: 'place', id: 14 },
      { kind: 'place', id: 12 },
      { kind: 'place', id: 999 },
      { kind: 'day', id: 31 },
      { kind: 'day', id: 32 },
      { kind: 'day', id: 99 },
      { kind: 'reservation', id: 71 },
      { kind: 'reservation', id: 73 },
      { kind: 'reservation', id: 98 },
    ]);
    const text = renderTripCard(card);
    expect(text).toContain(
      [
        'The user names these in the message (an "@" before a name points at one):',
        '- place 14: Fushimi Inari',
        '- day 31 (2026-06-11)',
        '- booking 71: Gion Corner (day 31)',
        '- booking 73: Bus',
        '',
        'Trip: Kyoto in June',
      ].join('\n'),
    );
    expect(text).not.toMatch(/place 999|day 99\b|booking 98/);
    const unknownOnly = buildTripCard(1, 7, SUMMARY, PLACES, null, [{ kind: 'place', id: 999 }]);
    expect(renderTripCard(unknownOnly)).not.toContain('The user names');
  });

  it('ASTCTX-032: reads the categories a list answers, and leaves the malformed ones out', () => {
    expect(
      categoriesFrom({
        categories: [
          { id: 1, name: 'Hotel', icon: '🏨' },
          { id: 2, name: 'Food' },
          { id: 'x', name: 'Bad' },
          { id: 3, name: '' },
        ],
      }),
    ).toEqual([
      { id: 1, name: 'Hotel', icon: '🏨' },
      { id: 2, name: 'Food', icon: null },
    ]);
    expect(categoriesFrom('Not allowed.')).toEqual([]);
  });

  it('ASTCTX-001: reads days, places, assignments, notes, packing and members', () => {
    const card = buildTripCard(1, 7, SUMMARY, PLACES, null);
    expect(card).toMatchObject({ tripId: 1, title: 'Kyoto in June', currency: 'JPY', startDate: '2026-06-11' });
    expect(card.days).toEqual([
      { id: 31, number: 1, date: '2026-06-11', title: 'Arrival', placeIds: [12] },
      { id: 32, number: 2, date: '2026-06-12', title: null, placeIds: [] },
    ]);
    expect(card.places.get(12)).toMatchObject({ name: 'Nishiki Market', address: 'Nakagyo Ward' });
    expect(card.places.get(14)).toMatchObject({ name: 'Fushimi Inari', categoryId: 3, price: 0 });
    expect(card.assignments.get(301)).toEqual({ dayId: 31, placeId: 12 });
    expect(card.notes.get(41)).toEqual({
      dayId: 31,
      text: 'Pick up rail pass',
      time: '09:00',
      icon: '🎫',
      color: null,
    });
    expect(card.packing.get(51)).toMatchObject({ name: 'Umbrella', weight: 300 });
    expect([...card.members.entries()]).toEqual([
      [7, { name: 'mia', avatarKey: null }],
      [8, { name: 'jon', avatarKey: null }],
    ]);
  });

  it('ASTCTX-003: knows who asks, the members by their stored pictures, and the answers it was built from', () => {
    const summary = {
      ...SUMMARY,
      members: {
        owner: { id: 7, username: 'mia', avatar_url: '/uploads/avatars/mia-1.png' },
        collaborators: [
          { id: 8, username: 'jon', avatar_url: 'https://lh3.example.test/jon.png' },
          { id: 9, username: 'ana', avatar_url: '/uploads/avatars/../../secret' },
        ],
      },
    };
    const card = buildTripCard(1, 8, summary, PLACES, null);
    expect(card.viewerId).toBe(8);
    expect(card.members.get(7)).toEqual({ name: 'mia', avatarKey: 'mia-1.png' });
    expect(card.members.get(8)).toEqual({ name: 'jon', avatarKey: null });
    expect(card.members.get(9)).toEqual({ name: 'ana', avatarKey: null });
    expect(card.sources).toEqual({ summary, places: PLACES });
  });

  it('ASTCTX-002: a tool that answered with an error leaves an emptier card, not a broken one', () => {
    const card = buildTripCard(5, 7, 'Trip not found or access denied.', null, null);
    expect(card).toMatchObject({ tripId: 5, title: '', days: [] });
    expect(card.places.size).toBe(0);
    expect(
      buildTripCard(5, 7, { days: [{ id: 'x' }, null, { id: 3, assignments: [{ id: 1 }] }] }, { places: 'no' }, null)
        .days,
    ).toEqual([{ id: 3, number: 1, date: null, title: null, placeIds: [] }]);
  });
});

describe('renderTripCard', () => {
  it('ASTCTX-010: lists the days with their places and ids, the unscheduled places and the focus', () => {
    const text = renderTripCard(buildTripCard(1, 7, SUMMARY, PLACES, { dayId: 32, placeIds: [14, 999] }));
    expect(text).toContain('Trip: Kyoto in June');
    expect(text).toContain('Dates: 2026-06-11 to 2026-06-12');
    expect(text).toContain('31 | 2026-06-11 | Arrival | Nishiki Market (12)');
    expect(text).toContain('32 | 2026-06-12 |  | nothing planned');
    expect(text).toContain('Places not on a day yet: Fushimi Inari (14)');
    expect(text).toContain('- day 32 (2026-06-12)');
    expect(text).toContain('- place 14: Fushimi Inari');
    expect(text).not.toContain('999');
    expect(text).not.toContain('mia@example.test');
  });

  it('ASTCTX-011: a trip without days says so, and long lists are counted, not listed', () => {
    const many = { places: Array.from({ length: 205 }, (_, i) => ({ id: i + 1, name: `P${i + 1}` })) };
    const text = renderTripCard(buildTripCard(1, 7, { trip: { title: 'T' } }, many, null));
    expect(text).toContain('(no days yet)');
    expect(text).toContain('and 5 more');
  });

  it('ASTCTX-012: names where the trip is and the google ids it knows, so a lookup needs no search first', () => {
    const places = {
      places: [
        { id: 12, name: 'Nishiki Market', lat: 35.005, lng: 135.764, google_place_id: 'ChIJn' },
        { id: 14, name: 'Fushimi Inari', lat: 34.967, lng: 135.773 },
        { id: 15, name: 'Kansai Airport', lat: 34.434, lng: 135.244 },
      ],
    };
    const text = renderTripCard(buildTripCard(1, 7, SUMMARY, places, { placeIds: [12] }));
    expect(text).toContain('Around: 34.9670, 135.7640');
    expect(text).toContain('Nishiki Market (12, google ChIJn)');
    expect(text).toContain('- place 12: Nishiki Market (at 35.0050, 135.7640; google place id ChIJn)');
    expect(renderTripCard(buildTripCard(1, 7, SUMMARY, PLACES, null))).not.toContain('Around:');
  });

  it('ASTCTX-013: the part of the map on screen tells "here", a view of a whole country does not', () => {
    const view = { south: 35.6, west: 139.7, north: 35.72, east: 139.82 };
    const text = renderTripCard(buildTripCard(1, 7, SUMMARY, PLACES, { view }));
    expect(text).toContain(
      "The map on the user's screen shows south 35.6000, west 139.7000, north 35.7200, east 139.8200.",
    );
    expect(text).toContain('"here", "nearby" or "around" means this area');
    const country = { south: 30, west: 129, north: 45, east: 146 };
    expect(renderTripCard(buildTripCard(1, 7, SUMMARY, PLACES, { view: country }))).not.toContain('on the user');
  });
});

describe('the turn context', () => {
  it('ASTCTX-020: today is read in the user zone, and an unknown zone falls back to UTC', () => {
    const now = new Date('2026-06-11T23:30:00Z');
    expect(todayIn('Asia/Tokyo', now)).toBe('2026-06-12');
    expect(todayIn('America/Los_Angeles', now)).toBe('2026-06-11');
    expect(todayIn('Mars/Olympus', now)).toBe('2026-06-11');
  });

  it('ASTCTX-021: names the language to answer in', () => {
    expect(languageName('de')).toBe('German');
    expect(languageName('zh-TW')).toContain('Chinese');
    expect(languageName('!!')).toBe('!!');
  });

  it('ASTCTX-022: carries the date, the units the user prefers and the card', () => {
    const card = buildTripCard(1, 7, SUMMARY, PLACES, null);
    const context = turnContext(card, 'Asia/Tokyo', new Date('2026-06-11T23:30:00Z'), {
      temperature_unit: 'fahrenheit',
      distance_unit: 'metric',
      time_format: 'nonsense',
    });
    expect(context).toContain('Today is 2026-06-12 (time zone Asia/Tokyo).');
    expect(context).toContain('The user prefers temperatures in °F, distances in km.');
    expect(context).toContain('<trip_card>\nTrip: Kyoto in June');
    expect(turnContext(card, 'UTC', new Date(), {})).not.toContain('prefers');
  });

  it("ASTCTX-023: the trip notes of this trip come along as preferences, never another trip's", () => {
    const card = buildTripCard(1, 7, SUMMARY, PLACES, null);
    const prefs = { assistant_memory: { '1': '  Vegetarian, no museums. ', '2': 'Other trip' } };
    const context = turnContext(card, 'UTC', new Date(), prefs);
    expect(context).toContain('<trip_notes>\nVegetarian, no museums.\n</trip_notes>');
    expect(context).not.toContain('Other trip');
    expect(tripMemoryOf({ assistant_memory: { '1': 'x'.repeat(3000) } }, 1)).toHaveLength(2000);
    expect(tripMemoryOf({ assistant_memory: 'broken' }, 1)).toBeNull();
  });

  it('ASTCTX-024: cost estimates are asked for unless the user turned them off', () => {
    const card = buildTripCard(1, 7, SUMMARY, PLACES, null);
    expect(turnContext(card, 'UTC', new Date(), {})).toContain('create_budget_item');
    expect(turnContext(card, 'UTC', new Date(), { assistant_cost_estimates: false })).not.toContain(
      'create_budget_item',
    );
  });
});
