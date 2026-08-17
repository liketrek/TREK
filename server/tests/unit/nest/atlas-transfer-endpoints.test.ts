/**
 * The layover pairing behind #1535. Pure, so it gets its own file and no DB: the
 * whole question is which two reservation_endpoints rows describe one plane change
 * spread over two bookings, and every case below is a shape the AirTrail import
 * really produces (timed legs, date-only legs, a leg whose booking clock belongs
 * to the other airport).
 */
import { describe, it, expect } from 'vitest';

import {
  MAX_CLOCKLESS_DAY_GAP,
  MAX_LAYOVER_MS,
  transferEndpointIds,
  type FlightEndpointRow,
} from '../../../src/nest/atlas/transfer-endpoints';

interface Airport {
  code: string | null;
  lat: number;
  lng: number;
}

const BRU: Airport = { code: 'BRU', lat: 50.9014, lng: 4.4844 };
const HEL: Airport = { code: 'HEL', lat: 60.3172, lng: 24.9633 };
const JFK: Airport = { code: 'JFK', lat: 40.6413, lng: -73.7781 };

/** Brussels' other airport, 45 km from BRU: the one a cheap return lands at. */
const CRL: Airport = { code: 'CRL', lat: 50.4592, lng: 4.4538 };
/** Amsterdam, 170 km from Brussels, which is two cities and not one. */
const AMS: Airport = { code: 'AMS', lat: 52.3105, lng: 4.7683 };
const FRA: Airport = { code: 'FRA', lat: 50.0379, lng: 8.5622 };

/** Same airport as HEL, but geocoded instead of imported, so no IATA code. */
const HEL_NO_CODE: Airport = { code: null, lat: 60.3174, lng: 24.9629 };

interface Clock {
  date?: string | null;
  time?: string | null;
  /** The booking's own reservation_time/_end_time, which is all a date-only leg has. */
  fallback?: string | null;
}

let nextId = 0;

function endpoint(
  reservationId: number,
  role: 'from' | 'to' | 'stop',
  at: Airport,
  clock: Clock = {},
  tripId = 1,
): FlightEndpointRow {
  return {
    id: ++nextId,
    reservation_id: reservationId,
    trip_id: tripId,
    role,
    code: at.code,
    lat: at.lat,
    lng: at.lng,
    local_date: clock.date ?? null,
    local_time: clock.time ?? null,
    fallback_time: clock.fallback ?? null,
  };
}

/**
 * BRU → HEL as one booking and HEL → JFK as the next, which is what the importer
 * writes when the two legs never chained. `arrival`/`departure` are the clocks at
 * the hub, the only ones the pairing looks at.
 */
function splitChain(arrival: Clock, departure: Clock, hub: Airport = HEL, hubAgain: Airport = hub) {
  const rows = [
    endpoint(1, 'from', BRU, { date: '2026-08-01', time: '07:00' }),
    endpoint(1, 'to', hub, arrival),
    endpoint(2, 'from', hubAgain, departure),
    endpoint(2, 'to', JFK, { date: departure.date ?? '2026-08-01', time: '15:00' }),
  ];
  return { rows, hubIds: [rows[1].id, rows[2].id].sort((a, b) => a - b) };
}

const ids = (found: Set<number>) => [...found].sort((a, b) => a - b);

describe('transferEndpointIds', () => {
  it('keeps the 24 h window the importers use to merge the legs of one journey', () => {
    expect(MAX_LAYOVER_MS).toBe(24 * 3600 * 1000);
    expect(MAX_CLOCKLESS_DAY_GAP).toBe(1);
  });

  it('pairs an arrival and an onward departure at the same airport code', () => {
    const { rows, hubIds } = splitChain({ date: '2026-08-01', time: '09:30' }, { date: '2026-08-01', time: '11:00' });
    expect(ids(transferEndpointIds(rows))).toEqual(hubIds);
  });

  it('pairs on the coordinate when neither row carries a code', () => {
    const { rows, hubIds } = splitChain(
      { date: '2026-08-01', time: '09:30' },
      { date: '2026-08-01', time: '11:00' },
      HEL_NO_CODE,
    );
    expect(ids(transferEndpointIds(rows))).toEqual(hubIds);
  });

  it('pairs a coded row with an uncoded one at the same coordinate', () => {
    const { rows, hubIds } = splitChain(
      { date: '2026-08-01', time: '09:30' },
      { date: '2026-08-01', time: '11:00' },
      HEL,
      HEL_NO_CODE,
    );
    expect(ids(transferEndpointIds(rows))).toEqual(hubIds);
  });

  it('matches codes case-insensitively', () => {
    const { rows, hubIds } = splitChain(
      { date: '2026-08-01', time: '09:30' },
      { date: '2026-08-01', time: '11:00' },
      { code: 'hel', lat: 1, lng: 1 },
      { code: 'HEL', lat: 2, lng: 2 },
    );
    expect(ids(transferEndpointIds(rows))).toEqual(hubIds);
  });

  it('pairs a turnaround with no ground time at all and one of exactly 24 h', () => {
    for (const departure of [
      { date: '2026-08-01', time: '09:30' },
      { date: '2026-08-02', time: '09:30' },
    ]) {
      const { rows, hubIds } = splitChain({ date: '2026-08-01', time: '09:30' }, departure);
      expect(ids(transferEndpointIds(rows))).toEqual(hubIds);
    }
  });

  it('leaves a stay of 24 h and a minute, or a departure before the arrival, counted', () => {
    for (const departure of [
      { date: '2026-08-02', time: '09:31' },
      { date: '2026-08-01', time: '09:29' },
    ]) {
      const { rows } = splitChain({ date: '2026-08-01', time: '09:30' }, departure);
      expect(transferEndpointIds(rows).size).toBe(0);
    }
  });

  it('falls back to the calendar date when a leg has no clock, same day or the next', () => {
    for (const date of ['2026-08-01', '2026-08-02']) {
      const { rows, hubIds } = splitChain({ date: '2026-08-01' }, { date });
      expect(ids(transferEndpointIds(rows))).toEqual(hubIds);
    }
  });

  it('treats an unreadable clock as no clock and pairs on the date', () => {
    const { rows, hubIds } = splitChain({ date: '2026-08-01', time: 'midday' }, { date: '2026-08-01', time: '11:00' });
    expect(ids(transferEndpointIds(rows))).toEqual(hubIds);
  });

  it('keeps a hub the traveler left two days later', () => {
    const { rows } = splitChain({ date: '2026-08-01' }, { date: '2026-08-03' });
    expect(transferEndpointIds(rows).size).toBe(0);
  });

  it('keeps a hub whose onward departure has no date at all', () => {
    const { rows } = splitChain({ date: '2026-08-01', time: '09:30' }, {});
    expect(transferEndpointIds(rows).size).toBe(0);
  });

  it('reads the date out of the booking column but never its clock', () => {
    // A date-only AirTrail flight leaves the arrival endpoint without local parts, and
    // reservation_time holds the DEPARTURE airport's local clock, 22:00 in Brussels for
    // a flight that landed in Helsinki that morning. Using it as an arrival time would
    // make the onward 11:00 departure look like it left before the plane landed.
    const { rows, hubIds } = splitChain(
      { fallback: '2026-08-01T22:00' },
      { date: '2026-08-01', time: '11:00' },
    );
    expect(ids(transferEndpointIds(rows))).toEqual(hubIds);
  });

  it('never pairs the two ends of one booking', () => {
    const rows = [
      endpoint(1, 'from', BRU, { date: '2026-08-01', time: '07:00' }),
      endpoint(1, 'to', HEL, { date: '2026-08-01', time: '09:30' }),
    ];
    expect(transferEndpointIds(rows).size).toBe(0);
  });

  it('never pairs across two trips', () => {
    const rows = [
      endpoint(1, 'from', BRU, { date: '2026-08-01', time: '07:00' }),
      endpoint(1, 'to', HEL, { date: '2026-08-01', time: '09:30' }),
      endpoint(2, 'from', HEL, { date: '2026-08-01', time: '11:00' }, 2),
      endpoint(2, 'to', JFK, { date: '2026-08-01', time: '15:00' }, 2),
    ];
    expect(transferEndpointIds(rows).size).toBe(0);
  });

  it('never treats a same-day out-and-back as a connection', () => {
    // Flown out in the morning, back in the evening: the day was spent in Finland.
    const rows = [
      endpoint(1, 'from', BRU, { date: '2026-08-01', time: '07:00' }),
      endpoint(1, 'to', HEL, { date: '2026-08-01', time: '09:30' }),
      endpoint(2, 'from', HEL, { date: '2026-08-01', time: '18:00' }),
      endpoint(2, 'to', BRU, { date: '2026-08-01', time: '20:30' }),
    ];
    expect(transferEndpointIds(rows).size).toBe(0);
  });

  it("never treats an out-and-back into the city's other airport as a connection", () => {
    // Flown to Helsinki in the morning, back to Brussels in the evening, but the return
    // lands at Charleroi instead of Zaventem. The day was still spent in Finland, and
    // the airport keys alone can never see that the two ends are one city.
    const rows = [
      endpoint(1, 'from', BRU, { date: '2026-08-01', time: '07:00' }),
      endpoint(1, 'to', HEL, { date: '2026-08-01', time: '09:30' }),
      endpoint(2, 'from', HEL, { date: '2026-08-01', time: '18:00' }),
      endpoint(2, 'to', CRL, { date: '2026-08-01', time: '20:30' }),
    ];
    expect(transferEndpointIds(rows).size).toBe(0);
  });

  it('still pairs a hub between two airports that are their own cities', () => {
    // Amsterdam to Frankfurt to Brussels is a real connection, and AMS and BRU are
    // 170 km apart, so the radius that catches a sibling airport must not reach here.
    const rows = [
      endpoint(1, 'from', AMS, { date: '2026-08-01', time: '07:00' }),
      endpoint(1, 'to', FRA, { date: '2026-08-01', time: '08:15' }),
      endpoint(2, 'from', FRA, { date: '2026-08-01', time: '10:00' }),
      endpoint(2, 'to', BRU, { date: '2026-08-01', time: '11:05' }),
    ];
    expect(ids(transferEndpointIds(rows))).toEqual([rows[1].id, rows[2].id]);
  });

  it('keeps an overnight return through the sibling airport out of the pairing', () => {
    // Same shape a night away on business has: 22.5 h on the ground, home into Gatwick
    // instead of Heathrow. Still inside the 24 h window, so only the direction says no.
    const LHR: Airport = { code: 'LHR', lat: 51.47, lng: -0.4543 };
    const LGW: Airport = { code: 'LGW', lat: 51.1537, lng: -0.1821 };
    const rows = [
      endpoint(1, 'from', LHR, { date: '2026-08-01', time: '06:30' }),
      endpoint(1, 'to', HEL, { date: '2026-08-01', time: '09:30' }),
      endpoint(2, 'from', HEL, { date: '2026-08-02', time: '08:00' }),
      endpoint(2, 'to', LGW, { date: '2026-08-02', time: '09:45' }),
    ];
    expect(transferEndpointIds(rows).size).toBe(0);
  });

  it('pairs only inside one trip, even where the hub and the clocks would fit', () => {
    // Two journeys through Helsinki on one day. The second trip's arrival has no onward
    // leg of its own, and the first trip's departure two hours later must not become one.
    const rows = [
      endpoint(1, 'from', BRU, { date: '2026-08-01', time: '07:00' }),
      endpoint(1, 'to', HEL, { date: '2026-08-01', time: '09:30' }),
      endpoint(2, 'from', HEL, { date: '2026-08-01', time: '11:00' }),
      endpoint(2, 'to', JFK, { date: '2026-08-01', time: '15:00' }),
      endpoint(3, 'from', BRU, { date: '2026-08-01', time: '06:00' }, 2),
      endpoint(3, 'to', HEL, { date: '2026-08-01', time: '09:00' }, 2),
    ];

    expect(ids(transferEndpointIds(rows))).toEqual([rows[1].id, rows[2].id]);
  });

  it('pairs across midnight when only one of the two legs carries a clock', () => {
    // The scan looks ahead from the arrival's date, not from its instant, because a
    // date-only leg is anchored on midnight: landing at 23:50 and leaving on a flight
    // the next day is one connection, and so is a dateless landing left at 23:45.
    const lateArrival = splitChain({ date: '2026-08-01', time: '23:50' }, { date: '2026-08-02' });
    expect(ids(transferEndpointIds(lateArrival.rows))).toEqual(lateArrival.hubIds);

    const lateDeparture = splitChain({ date: '2026-08-01' }, { date: '2026-08-02', time: '23:45' });
    expect(ids(transferEndpointIds(lateDeparture.rows))).toEqual(lateDeparture.hubIds);
  });

  it('pairs nothing when neither side has a readable date', () => {
    for (const clock of [{}, { fallback: 'sometime in August' }, { date: '01/08/2026' }]) {
      const { rows } = splitChain(clock, clock);
      expect(transferEndpointIds(rows).size).toBe(0);
    }
  });

  it('pairs nothing when a date passes the shape check but is not a real date', () => {
    for (const time of [null, '09:30']) {
      const { rows } = splitChain({ date: '2026-13-45', time }, { date: '2026-13-45', time });
      expect(transferEndpointIds(rows).size).toBe(0);
    }
  });

  it('pairs an onward leg whose booking never got a second endpoint', () => {
    // A leg AirTrail has no coordinates for loses that endpoint, so the onward booking
    // has a 'from' and nothing else, which must not read as flying back to the origin.
    const rows = [
      endpoint(1, 'from', BRU, { date: '2026-08-01', time: '07:00' }),
      endpoint(1, 'to', HEL, { date: '2026-08-01', time: '09:30' }),
      endpoint(2, 'from', HEL, { date: '2026-08-01', time: '11:00' }),
    ];
    expect(ids(transferEndpointIds(rows))).toEqual([rows[1].id, rows[2].id]);
  });

  it('ignores a stop row rather than reading it as an arrival', () => {
    // The callers filter roles in SQL, but a 'stop' is already handled by #1486 and must
    // never become one half of a pair here.
    const rows = [
      endpoint(1, 'from', BRU, { date: '2026-08-01', time: '07:00' }),
      endpoint(1, 'stop', HEL, { date: '2026-08-01', time: '09:30' }),
      endpoint(2, 'from', HEL, { date: '2026-08-01', time: '11:00' }),
      endpoint(2, 'to', JFK, { date: '2026-08-01', time: '15:00' }),
    ];
    expect(transferEndpointIds(rows).size).toBe(0);
  });

  it('ignores a row that can be keyed neither by code nor by coordinate', () => {
    const { rows } = splitChain(
      { date: '2026-08-01', time: '09:30' },
      { date: '2026-08-01', time: '11:00' },
      { code: null, lat: NaN, lng: NaN },
    );
    expect(transferEndpointIds(rows).size).toBe(0);
  });

  it('has nothing to pair with a single endpoint', () => {
    expect(transferEndpointIds([endpoint(1, 'to', HEL, { date: '2026-08-01', time: '09:30' })]).size).toBe(0);
  });

  it('marks only the pair that matches when the same hub is used again later', () => {
    // Out via Helsinki on the 1st, home via Helsinki on the 8th, but that time with
    // three days in the city, so only the first pass is a plane change.
    const rows = [
      endpoint(1, 'from', BRU, { date: '2026-08-01', time: '07:00' }),
      endpoint(1, 'to', HEL, { date: '2026-08-01', time: '09:30' }),
      endpoint(2, 'from', HEL, { date: '2026-08-01', time: '11:00' }),
      endpoint(2, 'to', JFK, { date: '2026-08-01', time: '15:00' }),
      endpoint(3, 'from', JFK, { date: '2026-08-08', time: '01:00' }),
      endpoint(3, 'to', HEL, { date: '2026-08-08', time: '10:00' }),
      endpoint(4, 'from', HEL, { date: '2026-08-11', time: '12:00' }),
      endpoint(4, 'to', BRU, { date: '2026-08-11', time: '14:30' }),
    ];

    expect(ids(transferEndpointIds(rows))).toEqual([rows[1].id, rows[2].id]);
  });
});
