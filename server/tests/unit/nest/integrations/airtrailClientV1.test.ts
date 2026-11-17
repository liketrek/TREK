import { buildSavePayload } from '../../../../src/nest/integrations/airtrail-sync.helpers';
import {
  fromAirtrailV1Flight,
  toAirtrailV1FlightInput,
  type AirtrailV1Airport,
} from '../../../../src/nest/integrations/airtrail-v1';
import {
  AirtrailAuthError,
  AirtrailClient,
  AirtrailRequestError,
  AirtrailScopeError,
  type AirtrailCreds,
  type AirtrailSavePayload,
} from '../../../../src/nest/integrations/airtrail.client';
import { canonicalHash } from '../../../../src/nest/integrations/airtrail.mapper';
import { safeFetch } from '../../../../src/utils/ssrfGuard';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../../src/utils/ssrfGuard', () => ({
  checkSsrf: vi.fn(async () => ({ allowed: true, isPrivate: false })),
  safeFetch: vi.fn(),
}));

const fetchMock = vi.mocked(safeFetch);
const creds: AirtrailCreds = { baseUrl: 'https://at.example', apiKey: 'k', allowInsecureTls: false };

type Route = (url: URL, init: RequestInit) => Response | undefined;
let routes: Route[];
let calls: { method: string; url: URL; body: unknown }[];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function on(method: string, path: string, answer: (url: URL, body: unknown) => Response) {
  routes.push((url, init) =>
    (init.method ?? 'GET') === method && url.pathname === path
      ? answer(url, init.body ? JSON.parse(String(init.body)) : undefined)
      : undefined,
  );
}

function present<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected a value');
  return value;
}

const DISCOVERY = { api: { version: 'v1', minimumSupportedVersion: 'v1' }, instance: { version: '3.14.0' } };

const LAX: AirtrailV1Airport = {
  id: 11,
  icao: 'KLAX',
  iata: 'LAX',
  name: 'Los Angeles International Airport',
  latitude: 33.94,
  longitude: -118.41,
  timezone: 'America/Los_Angeles',
  country: 'US',
};
const MEL: AirtrailV1Airport = {
  id: 22,
  icao: 'YMML',
  iata: 'MEL',
  name: 'Melbourne Airport',
  latitude: -37.67,
  longitude: 144.84,
  timezone: 'Australia/Melbourne',
  country: 'AU',
};
const QANTAS = { id: 7, name: 'Qantas', icao: 'QFA', iata: 'QF', iconPath: null };

function v1Flight(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    date: '2026-10-04',
    datePrecision: 'day',
    departure: '2026-10-05T05:00:00.000+00:00',
    arrival: '2026-10-05T20:30:00.000+00:00',
    departureScheduled: '2026-10-05T05:00:00.000+00:00',
    arrivalScheduled: '2026-10-05T20:30:00.000+00:00',
    takeoffScheduled: null,
    takeoffActual: '2026-10-05T05:21:00.000+00:00',
    landingScheduled: null,
    landingActual: null,
    duration: 55800,
    departureTerminal: 'B',
    departureGate: '148',
    arrivalTerminal: null,
    arrivalGate: null,
    flightNumber: 'QF94',
    aircraftReg: null,
    note: null,
    from: LAX,
    to: MEL,
    airline: QANTAS,
    aircraft: null,
    passengers: [
      {
        id: 5,
        user: { id: 'u-self', username: 'aaron', displayName: 'Aaron' },
        guestName: null,
        seat: 'aisle',
        seatNumber: '4D',
        seatClass: 'business',
        flightReason: 'business',
      },
    ],
    track: null,
    ...overrides,
  };
}

function v1Instance() {
  on('GET', '/api/v1', () => json(DISCOVERY));
  on('GET', '/api/v1/airports', (url) => {
    const q = url.searchParams.get('query')?.toUpperCase();
    return json({ data: [LAX, MEL].filter((a) => a.iata === q || a.icao === q), page: { nextCursor: null } });
  });
  on('GET', '/api/v1/airlines', (url) => {
    const q = url.searchParams.get('query')?.toUpperCase();
    return json({ data: [QANTAS].filter((a) => a.iata === q || a.icao === q), page: { nextCursor: null } });
  });
  on('GET', '/api/v1/me', () => json({ data: { id: 'u-self', username: 'aaron' } }));
}

beforeEach(() => {
  routes = [];
  calls = [];
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input, init = {}) => {
    const url = new URL(String(input));
    calls.push({ method: init.method ?? 'GET', url, body: init.body ? JSON.parse(String(init.body)) : undefined });
    for (const route of routes) {
      const answer = route(url, init);
      if (answer) return answer;
    }
    return new Response('<html>not found</html>', { status: 404 });
  });
});

describe('AirtrailClient picks the API the instance speaks', () => {
  it('reads every v1 page into the legacy shape, with no scope parameter', async () => {
    v1Instance();
    on('GET', '/api/v1/flights', (url) =>
      url.searchParams.get('cursor') === 'c2'
        ? json({ data: [v1Flight(2)], page: { nextCursor: null } })
        : json({ data: [v1Flight(1)], page: { nextCursor: 'c2' } }),
    );

    const flights = await new AirtrailClient().listFlights(creds);

    expect(flights.map((f) => f.id)).toEqual([1, 2]);
    expect(flights[0].from).toMatchObject({ iata: 'LAX', lat: 33.94, lon: -118.41, tz: 'America/Los_Angeles' });
    expect(flights[0].passengers?.[0]).toMatchObject({ userId: 'u-self', seatNumber: '4D', flightReason: 'business' });
    const lists = calls.filter((c) => c.url.pathname === '/api/v1/flights');
    expect(lists).toHaveLength(2);
    expect(lists.every((c) => c.url.searchParams.get('limit') === '100' && !c.url.searchParams.has('scope'))).toBe(
      true,
    );
  });

  it('uses the legacy routes when the instance has no /api/v1', async () => {
    on('GET', '/api/flight/list', () => json({ success: true, flights: [{ id: 9 }] }));

    const flights = await new AirtrailClient().listFlights(creds);

    expect(flights).toEqual([{ id: 9 }]);
    expect(calls.map((c) => c.url.pathname)).toEqual(['/api/v1', '/api/flight/list']);
  });

  it('asks once and keeps the answer for the next call', async () => {
    v1Instance();
    on('GET', '/api/v1/flights/3', () => json({ data: v1Flight(3) }));
    const client = new AirtrailClient();

    await client.getFlight(creds, 3);
    await client.getFlight(creds, 3);

    expect(calls.filter((c) => c.url.pathname === '/api/v1')).toHaveLength(1);
  });

  it('does not keep an answer that is not the discovery document, such as a login page', async () => {
    on('GET', '/api/v1', () => new Response('<html>sign in</html>', { status: 200 }));
    on('GET', '/api/flight/get/3', () => json({ success: true, flight: { id: 3 } }));
    const client = new AirtrailClient();

    expect(await client.getFlight(creds, 3)).toEqual({ id: 3 });
    await client.getFlight(creds, 3);

    expect(calls.filter((c) => c.url.pathname === '/api/v1')).toHaveLength(2);
  });

  it('gives a v1 flight the same sync hash as the legacy route gave it, so a switch re-syncs nothing', async () => {
    v1Instance();
    on('GET', '/api/v1/flights/1', () => json({ data: v1Flight(1) }));
    const fromV1 = present(await new AirtrailClient().getFlight(creds, 1));
    const airport = (a: AirtrailV1Airport) => ({
      id: a.id,
      icao: a.icao,
      iata: a.iata,
      name: a.name,
      lat: a.latitude,
      lon: a.longitude,
      tz: a.timezone,
      country: a.country,
    });
    const { passengers, ...rest } = v1Flight(1);
    const legacy = {
      ...rest,
      from: airport(LAX),
      to: airport(MEL),
      passengers: passengers.map(({ user, ...p }) => ({ ...p, flightId: 1, userId: user.id, user })),
    };

    expect(canonicalHash(fromV1)).toBe(canonicalHash(legacy as never));
  });

  it('answers null for a v1 flight that does not exist', async () => {
    v1Instance();
    on('GET', '/api/v1/flights/404', () => json({ error: { code: 'not_found', message: 'Flight not found' } }, 404));

    expect(await new AirtrailClient().getFlight(creds, 404)).toBeNull();
  });

  it('names the missing scope when v1 refuses the key, and does not call the key invalid', async () => {
    on('GET', '/api/v1', () => json(DISCOVERY));
    on('GET', '/api/v1/flights', () =>
      json({ error: { code: 'insufficient_scope', message: 'The credential requires flight.read.own' } }, 403),
    );

    const err = await new AirtrailClient().listFlights(creds).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AirtrailScopeError);
    expect(err).not.toBeInstanceOf(AirtrailAuthError);
    expect((err as AirtrailScopeError).scope).toBe('flight.read.own');
    expect((err as Error).message).toContain('lacks the scope flight.read.own');
  });

  it('gives the auth error when v1 refuses the key for a reason other than a scope', async () => {
    on('GET', '/api/v1', () => json(DISCOVERY));
    on('GET', '/api/v1/flights', () => json({ error: { code: 'unauthorized', message: 'Invalid API key' } }, 401));

    const err = await new AirtrailClient().listFlights(creds).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AirtrailAuthError);
  });

  it('stops at the hard page limit, and fails so that it does not give a part of the list', async () => {
    v1Instance();
    on('GET', '/api/v1/flights', (url) => {
      const n = Number(url.searchParams.get('cursor') ?? '0');
      return json({ data: [v1Flight(n + 1)], page: { nextCursor: String(n + 1) } });
    });

    const err = await new AirtrailClient().listFlights(creds).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AirtrailRequestError);
    expect((err as Error).message).toBe('AirTrail has more than 5000 flights');
    expect(calls.filter((c) => c.url.pathname === '/api/v1/flights')).toHaveLength(50);
  });

  it('sends every v1 request through the guarded fetch, with the timeout signal', async () => {
    v1Instance();
    on('GET', '/api/v1/flights', () => json({ data: [v1Flight(1)], page: { nextCursor: null } }));
    on('PUT', '/api/v1/flights/1', () => json({ data: v1Flight(1) }));
    const client = new AirtrailClient();

    await client.listFlights(creds);
    await client.saveFlight(creds, {
      id: 1,
      from: 'LAX',
      to: 'MEL',
      departure: '2026-10-04',
      seats: [],
      passengers: [{ userId: '<USER_ID>', guestName: null, seat: null, seatNumber: null, seatClass: null }],
    });

    const paths = calls.map((c) => c.url.pathname);
    expect(paths).toEqual(
      expect.arrayContaining(['/api/v1', '/api/v1/flights', '/api/v1/airports', '/api/v1/me', '/api/v1/flights/1']),
    );
    expect(fetchMock).toHaveBeenCalledTimes(calls.length);
    // The timeout signal on each request, and no override of the default response size cap.
    for (const [, init, options] of fetchMock.mock.calls) {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      expect(options).not.toHaveProperty('maxBytes');
    }
  });
});

describe('AirtrailClient keeps only a clear answer of the discovery probe', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps a 404 as the legacy API', async () => {
    on('GET', '/api/flight/get/3', () => json({ success: true, flight: { id: 3 } }));
    const client = new AirtrailClient();

    await client.getFlight(creds, 3);
    await client.getFlight(creds, 3);

    expect(calls.filter((c) => c.url.pathname === '/api/v1')).toHaveLength(1);
  });

  it('fails the call on a 5xx and asks again on the next call', async () => {
    let down = true;
    on('GET', '/api/v1', () => (down ? json({ message: 'bad gateway' }, 502) : json(DISCOVERY)));
    on('GET', '/api/v1/flights/3', () => json({ data: v1Flight(3) }));
    const client = new AirtrailClient();

    const err = await client.getFlight(creds, 3).catch((e: unknown) => e);
    down = false;
    const flight = await client.getFlight(creds, 3);

    expect((err as AirtrailRequestError).status).toBe(502);
    expect(flight?.id).toBe(3);
    expect(calls.filter((c) => c.url.pathname === '/api/flight/get/3')).toHaveLength(0);
  });

  it('fails the call on a timeout or a network error and asks again on the next call', async () => {
    v1Instance();
    on('GET', '/api/v1/flights/3', () => json({ data: v1Flight(3) }));
    const client = new AirtrailClient();
    fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    fetchMock.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));

    const timeout = await client.getFlight(creds, 3).catch((e: unknown) => e);
    const refused = await client.getFlight(creds, 3).catch((e: unknown) => e);
    const flight = await client.getFlight(creds, 3);

    expect(timeout).toBeInstanceOf(AirtrailRequestError);
    expect(refused).toBeInstanceOf(AirtrailRequestError);
    expect(flight?.id).toBe(3);
    expect(fetchMock.mock.calls.filter(([u]) => new URL(String(u)).pathname === '/api/v1')).toHaveLength(3);
  });

  it('asks the probe again on a 404 for a flight, so a stale answer does not look like a deleted flight', async () => {
    let upgraded = false;
    on('GET', '/api/v1', () => (upgraded ? json(DISCOVERY) : json({}, 404)));
    on('GET', '/api/v1/flights/3', () => json({ data: v1Flight(3) }));
    on('GET', '/api/flight/get/3', () => (upgraded ? json({}, 404) : json({ success: true, flight: { id: 3 } })));
    const client = new AirtrailClient();

    await client.getFlight(creds, 3);
    upgraded = true; // the next major AirTrail has no /api/flight/* routes
    const flight = await client.getFlight(creds, 3);

    expect(flight?.id).toBe(3);
    expect(calls.map((c) => c.url.pathname)).toEqual([
      '/api/v1',
      '/api/flight/get/3',
      '/api/flight/get/3',
      '/api/v1',
      '/api/v1/flights/3',
    ]);
  });

  it('answers null after the probe gives the same API again, because the flight is deleted', async () => {
    v1Instance();
    const client = new AirtrailClient();

    expect(await client.getFlight(creds, 404)).toBeNull();
    // The probe again, but no second read: the probe gave the same API.
    expect(calls.map((c) => c.url.pathname)).toEqual(['/api/v1', '/api/v1/flights/404', '/api/v1']);
  });

  it('uses the legacy route, and does not call the key invalid, when a proxy refuses the probe', async () => {
    on('GET', '/api/v1', () => new Response('Unauthorized', { status: 401 }));
    on('GET', '/api/flight/get/3', () => json({ success: true, flight: { id: 3 } }));
    const client = new AirtrailClient();

    expect(await client.getFlight(creds, 3)).toEqual({ id: 3 });
    await client.getFlight(creds, 3);

    expect(calls.filter((c) => c.url.pathname === '/api/v1')).toHaveLength(2);
  });

  it('keeps the answer for each AirTrail URL apart', async () => {
    on('GET', '/api/v1', (url) => (url.hostname === 'new.example' ? json(DISCOVERY) : json({}, 404)));
    on('GET', '/api/v1/flights/3', () => json({ data: v1Flight(3) }));
    on('GET', '/api/flight/get/3', () => json({ success: true, flight: { id: 3 } }));
    const client = new AirtrailClient();
    const old = { ...creds, baseUrl: 'https://old.example' };
    const fresh = { ...creds, baseUrl: 'https://new.example/' };

    await client.getFlight(creds, 3);
    await client.getFlight(old, 3);
    await client.getFlight(fresh, 3);
    await client.getFlight({ ...fresh, baseUrl: 'https://new.example/api' }, 3);

    const got = calls.filter((c) => c.url.pathname !== '/api/v1').map((c) => `${c.url.hostname}${c.url.pathname}`);
    expect(got).toEqual([
      'at.example/api/flight/get/3',
      'old.example/api/flight/get/3',
      'new.example/api/v1/flights/3',
      'new.example/api/v1/flights/3',
    ]);
    // One probe for each instance. A trailing slash or /api names the same instance.
    expect(calls.filter((c) => c.url.pathname === '/api/v1').map((c) => c.url.hostname)).toEqual([
      'at.example',
      'old.example',
      'new.example',
    ]);
  });

  it('asks again after ten minutes, and the flight keeps its sync hash when the instance moved to v1', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    let upgraded = false;
    on('GET', '/api/v1', () => (upgraded ? json(DISCOVERY) : json({}, 404)));
    on('GET', '/api/v1/flights/1', () => json({ data: v1Flight(1) }));
    const { passengers, ...rest } = v1Flight(1);
    const legacyFlight = {
      ...rest,
      from: {
        id: 11,
        icao: 'KLAX',
        iata: 'LAX',
        name: LAX.name,
        lat: 33.94,
        lon: -118.41,
        tz: LAX.timezone,
        country: 'US',
      },
      to: {
        id: 22,
        icao: 'YMML',
        iata: 'MEL',
        name: MEL.name,
        lat: -37.67,
        lon: 144.84,
        tz: MEL.timezone,
        country: 'AU',
      },
      passengers: passengers.map(({ user, ...p }) => ({ ...p, flightId: 1, userId: user.id, user })),
    };
    on('GET', '/api/flight/get/1', () => json({ success: true, flight: legacyFlight }));
    const client = new AirtrailClient();

    const before = present(await client.getFlight(creds, 1));
    upgraded = true;
    vi.advanceTimersByTime(9 * 60_000);
    await client.getFlight(creds, 1);
    vi.advanceTimersByTime(2 * 60_000);
    const after = present(await client.getFlight(creds, 1));

    expect(calls.map((c) => c.url.pathname)).toEqual([
      '/api/v1',
      '/api/flight/get/1',
      '/api/flight/get/1',
      '/api/v1',
      '/api/v1/flights/1',
    ]);
    expect(canonicalHash(after)).toBe(canonicalHash(before));
  });
});

/** An instance with no /api/v1: the probe gets the default 404 route. */
describe('AirtrailClient on the legacy routes', () => {
  const payload: AirtrailSavePayload = {
    id: 41,
    from: 'KLAX',
    to: 'YMML',
    departure: '2026-10-04',
    departureTime: '22:00',
    airline: 'QFA',
    seats: [{ userId: '<USER_ID>', guestName: null, seat: null, seatNumber: '3A', seatClass: null }],
    passengers: [{ userId: '<USER_ID>', guestName: null, seat: null, seatNumber: '3A', seatClass: null }],
  };

  it('reads one flight, and answers null for a flight that does not exist', async () => {
    on('GET', '/api/flight/get/3', () => json({ success: true, flight: { id: 3, flightNumber: 'QF94' } }));
    const client = new AirtrailClient();

    expect(await client.getFlight(creds, 3)).toEqual({ id: 3, flightNumber: 'QF94' });
    expect(await client.getFlight(creds, 4)).toBeNull();
  });

  it('lists the flights with no scope parameter', async () => {
    on('GET', '/api/flight/list', () => json({ success: true, flights: [{ id: 1 }, { id: 2 }] }));

    expect(await new AirtrailClient().listFlights(creds)).toEqual([{ id: 1 }, { id: 2 }]);
    const list = present(calls.find((c) => c.url.pathname === '/api/flight/list'));
    expect(list.url.search).toBe('');
  });

  it('sends the save payload unchanged, with codes and local times, and answers the id', async () => {
    on('POST', '/api/flight/save', () => json({ success: true, id: 41 }));

    expect(await new AirtrailClient().saveFlight(creds, payload)).toEqual({ id: 41 });
    const save = present(calls.find((c) => c.method === 'POST'));
    expect(save.body).toEqual(payload);
    // The legacy save needs no lookup and no profile read.
    expect(calls.map((c) => c.url.pathname)).toEqual(['/api/v1', '/api/flight/save']);
  });

  it('passes the save error message through', async () => {
    on('POST', '/api/flight/save', () => json({ success: false, message: 'Invalid airline' }, 400));

    const err = await new AirtrailClient().saveFlight(creds, payload).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AirtrailRequestError);
    expect((err as AirtrailRequestError).status).toBe(400);
    expect((err as Error).message).toBe('Invalid airline');
  });

  it('gives a refused key the auth error with the generic message', async () => {
    on('GET', '/api/flight/list', () => new Response('Unauthorized', { status: 401 }));

    const err = await new AirtrailClient().listFlights(creds).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AirtrailAuthError);
    expect((err as Error).message).toBe('AirTrail rejected the API key');
  });

  it('explains a page that is not JSON, such as a wrong URL', async () => {
    on('GET', '/api/flight/list', () => new Response('<html>app</html>', { status: 200 }));

    const err = await new AirtrailClient().listFlights(creds).catch((e: unknown) => e);

    expect((err as Error).message).toContain('AirTrail returned a non-JSON response');
  });
});

describe('AirtrailClient writes a flight through v1', () => {
  it('turns the write-back payload into a PUT with ids, UTC instants and the AirTrail-owned fields', async () => {
    v1Instance();
    on('PUT', '/api/v1/flights/41', () => json({ data: v1Flight(41) }));
    on('GET', '/api/v1/flights/41', () => json({ data: v1Flight(41) }));
    const existing = present(await new AirtrailClient().getFlight(creds, 41));
    const reservation = {
      id: 1,
      external_id: '41',
      notes: 'Window if free',
      reservation_time: '2026-10-04T22:00',
      reservation_end_time: '2026-10-06T07:30',
      endpoints: [
        { role: 'from', code: 'LAX' },
        { role: 'to', code: 'MEL' },
      ],
      metadata: JSON.stringify({ seat: '3A', airline_code: 'QFA', flight_number: 'QF94' }),
    };
    const payload = present(buildSavePayload(reservation, existing));

    expect(await new AirtrailClient().saveFlight(creds, payload)).toEqual({});

    const put = present(calls.find((c) => c.method === 'PUT'));
    expect(put.url.pathname).toBe('/api/v1/flights/41');
    expect(put.body).toMatchObject({
      date: '2026-10-04',
      fromId: 11,
      toId: 22,
      airlineId: 7,
      aircraftId: null,
      // 22:00 in Los Angeles (UTC-7) and 07:30 in Melbourne (UTC+11).
      departure: '2026-10-05T05:00:00.000+00:00',
      departureScheduled: '2026-10-05T05:00:00.000+00:00',
      arrival: '2026-10-05T20:30:00.000+00:00',
      arrivalScheduled: '2026-10-05T20:30:00.000+00:00',
      duration: 55800,
      takeoffActual: '2026-10-05T05:21:00.000+00:00',
      departureTerminal: 'B',
      departureGate: '148',
      flightNumber: 'QF94',
      note: 'Window if free',
      passengers: [
        {
          userId: 'u-self',
          guestName: null,
          seat: 'aisle',
          seatNumber: '3A',
          seatClass: 'business',
          flightReason: 'business',
        },
      ],
    });
    expect(put.body).not.toHaveProperty('track');
    // The owner is named on the flight already, so the profile is not read.
    expect(calls.some((c) => c.url.pathname === '/api/v1/me')).toBe(false);
  });

  it('keeps the sync hash when a save changes no time, because AirTrail stores the time string as it gets it', async () => {
    v1Instance();
    on('GET', '/api/v1/flights/41', () => json({ data: v1Flight(41) }));
    on('PUT', '/api/v1/flights/41', () => json({ data: v1Flight(41) }));
    const existing = present(await new AirtrailClient().getFlight(creds, 41));
    const reservation = {
      id: 1,
      external_id: '41',
      reservation_time: '2026-10-04T22:00',
      reservation_end_time: '2026-10-06T07:30',
      endpoints: [
        { role: 'from', code: 'LAX' },
        { role: 'to', code: 'MEL' },
      ],
      metadata: JSON.stringify({ seat: '4D', airline_code: 'QFA', flight_number: 'QF94' }),
    };

    await new AirtrailClient().saveFlight(creds, present(buildSavePayload(reservation, existing)));

    const body = present(calls.find((c) => c.method === 'PUT')).body as Record<string, unknown>;
    const times = ['departure', 'arrival', 'departureScheduled', 'arrivalScheduled'];
    const stored = fromAirtrailV1Flight(v1Flight(41, Object.fromEntries(times.map((k) => [k, body[k]]))) as never);
    expect(times.map((k) => body[k])).toEqual(times.map((k) => (existing as unknown as Record<string, unknown>)[k]));
    expect(canonicalHash(stored)).toBe(canonicalHash(existing));
  });

  it('creates a flight for the key owner with POST and answers its id', async () => {
    v1Instance();
    on('POST', '/api/v1/flights', () => json({ data: { id: 77 } }, 201));

    const out = await new AirtrailClient().saveFlight(creds, {
      from: 'KLAX',
      to: 'MEL',
      departure: '2026-10-04',
      departureTime: '22:00',
      seats: [],
      passengers: [{ userId: '<USER_ID>', guestName: null, seat: null, seatNumber: null, seatClass: null }],
    });

    expect(out).toEqual({ id: 77 });
    const post = present(calls.find((c) => c.method === 'POST'));
    expect(post.body).toMatchObject({ fromId: 11, toId: 22, passengers: [{ userId: 'u-self' }] });
  });

  it('refuses an airline code that only an IATA code matches, as the legacy save did', async () => {
    v1Instance();

    const err = await new AirtrailClient()
      .saveFlight(creds, {
        from: 'LAX',
        to: 'MEL',
        departure: '2026-10-04',
        airline: 'QF',
        seats: [],
        passengers: [{ userId: 'u-self', guestName: null, seat: null, seatNumber: null, seatClass: null }],
      })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AirtrailRequestError);
    expect((err as AirtrailRequestError).status).toBe(400);
    expect((err as Error).message).toBe('Invalid airline: QF');
    expect(calls.some((c) => c.method === 'POST' || c.method === 'PUT')).toBe(false);
  });

  it('passes the v1 validation message through', async () => {
    v1Instance();
    on('POST', '/api/v1/flights', () =>
      json(
        {
          error: {
            code: 'validation_failed',
            message: 'Request validation failed',
            details: [{ path: ['flightNumber'] }],
          },
        },
        422,
      ),
    );

    const err = await new AirtrailClient()
      .saveFlight(creds, {
        from: 'LAX',
        to: 'MEL',
        departure: '2026-10-04',
        seats: [],
        passengers: [{ userId: 'u-self', guestName: null, seat: null, seatNumber: null, seatClass: null }],
      })
      .catch((e: unknown) => e);

    expect((err as AirtrailRequestError).status).toBe(422);
    expect((err as Error).message).toContain('Request validation failed');
    expect((err as Error).message).toContain('flightNumber');
  });
});

describe('toAirtrailV1FlightInput keeps the rules of the legacy save', () => {
  const refs = { from: LAX, to: MEL, airlineId: null, aircraftId: null, selfUserId: 'u-self' };
  const base = {
    from: 'LAX',
    to: 'MEL',
    departure: '2026-10-04',
    seats: [],
    passengers: [{ userId: 'u-self', guestName: null, seat: null, seatNumber: null, seatClass: null }],
  };

  it('gives no instant for a date without a time, and keeps the date', () => {
    const body = toAirtrailV1FlightInput(
      { ...base, departureTime: null, arrival: '2026-10-06', arrivalTime: null },
      refs,
    );
    expect(body).toMatchObject({ date: '2026-10-04', departure: null, arrival: null, duration: null });
  });

  it('puts an arrival time without an arrival date on the departure date', () => {
    const body = toAirtrailV1FlightInput({ ...base, departureTime: '06:00', arrivalTime: '23:00' }, refs);
    expect(body.arrival).toBe('2026-10-04T12:00:00.000+00:00');
  });

  it('keeps only the departure for a flight known to the month, at 10:00 UTC', () => {
    const body = toAirtrailV1FlightInput({ ...base, datePrecision: 'month', departureTime: '22:00' }, refs);
    expect(body).toMatchObject({ datePrecision: 'month', departure: '2026-10-04T10:00:00.000+00:00', arrival: null });
  });

  it('gives each passenger without a reason the flight-level reason', () => {
    const body = toAirtrailV1FlightInput({ ...base, flightReason: 'leisure' }, refs);
    expect(body.passengers).toEqual([expect.objectContaining({ flightReason: 'leisure' })]);
  });

  it('refuses a time the clock cannot show', () => {
    expect(() => toAirtrailV1FlightInput({ ...base, departureTime: '25:00' }, refs)).toThrow('Invalid departure time');
  });
});

describe('toAirtrailV1FlightInput converts the local wall clock to UTC', () => {
  const SYD: AirtrailV1Airport = { ...MEL, id: 33, icao: 'YSSY', iata: 'SYD', timezone: 'Australia/Sydney' };
  const LHR: AirtrailV1Airport = { ...LAX, id: 44, icao: 'EGLL', iata: 'LHR', timezone: 'Europe/London' };
  const NOZONE: AirtrailV1Airport = { ...LAX, id: 55, timezone: null };
  const refs = (from: AirtrailV1Airport, to: AirtrailV1Airport) => ({
    from,
    to,
    airlineId: null,
    aircraftId: null,
    selfUserId: 'u-self',
  });
  const flight = (fields: Partial<AirtrailSavePayload> & { departure: string }): AirtrailSavePayload => ({
    from: 'X',
    to: 'Y',
    seats: [],
    passengers: [{ userId: 'u-self', guestName: null, seat: null, seatNumber: null, seatClass: null }],
    ...fields,
  });

  it('moves a late-evening departure west of UTC onto the next UTC day, and keeps the local date', () => {
    const body = toAirtrailV1FlightInput(flight({ departure: '2026-10-04', departureTime: '23:30' }), refs(LAX, MEL));
    expect(body).toMatchObject({ date: '2026-10-04', departure: '2026-10-05T06:30:00.000+00:00' });
  });

  it('moves an early-morning departure east of UTC onto the previous UTC day, and keeps the local date', () => {
    const body = toAirtrailV1FlightInput(flight({ departure: '2026-10-06', departureTime: '00:30' }), refs(MEL, LAX));
    expect(body).toMatchObject({ date: '2026-10-06', departure: '2026-10-05T13:30:00.000+00:00' });
  });

  it('puts each end in the zone of its own airport, across the date line', () => {
    // QF94: Oct 4 22:00 in Los Angeles (PDT, UTC-7), lands Oct 6 07:30 in Melbourne (AEDT, UTC+11).
    const body = toAirtrailV1FlightInput(
      flight({ departure: '2026-10-04', departureTime: '22:00', arrival: '2026-10-06', arrivalTime: '07:30' }),
      refs(LAX, MEL),
    );
    expect(body).toMatchObject({
      departure: '2026-10-05T05:00:00.000+00:00',
      arrival: '2026-10-05T20:30:00.000+00:00',
      duration: 15.5 * 3600,
    });
  });

  it('follows a daylight-saving change at the airport', () => {
    // Sydney moves to UTC+11 on 2026-10-04. Los Angeles moves back to UTC-8 on 2026-11-01.
    const before = toAirtrailV1FlightInput(flight({ departure: '2026-10-03', departureTime: '10:00' }), refs(SYD, LHR));
    const after = toAirtrailV1FlightInput(flight({ departure: '2026-10-05', departureTime: '10:00' }), refs(SYD, LHR));
    const pdt = toAirtrailV1FlightInput(flight({ departure: '2026-10-31', departureTime: '22:00' }), refs(LAX, LHR));
    const pst = toAirtrailV1FlightInput(flight({ departure: '2026-11-02', departureTime: '22:00' }), refs(LAX, LHR));
    expect(before.departure).toBe('2026-10-03T00:00:00.000+00:00');
    expect(after.departure).toBe('2026-10-04T23:00:00.000+00:00');
    expect(pdt.departure).toBe('2026-11-01T05:00:00.000+00:00');
    expect(pst.departure).toBe('2026-11-03T06:00:00.000+00:00');
  });

  it('converts the scheduled times in the same zones as the actual times', () => {
    const body = toAirtrailV1FlightInput(
      flight({
        departure: '2026-10-04',
        departureScheduled: '2026-10-04',
        departureScheduledTime: '23:45',
        arrivalScheduled: '2026-10-05',
        arrivalScheduledTime: '06:10',
      }),
      refs(LAX, LHR),
    );
    expect(body).toMatchObject({
      departureScheduled: '2026-10-05T06:45:00.000+00:00',
      arrivalScheduled: '2026-10-05T05:10:00.000+00:00',
    });
  });

  it('reads the time as UTC at an airport with no zone', () => {
    const body = toAirtrailV1FlightInput(
      flight({ departure: '2026-10-04', departureTime: '23:30' }),
      refs(NOZONE, MEL),
    );
    expect(body.departure).toBe('2026-10-04T23:30:00.000+00:00');
  });

  it('keeps the stored duration for an arrival before the departure', () => {
    const body = toAirtrailV1FlightInput(
      // `duration` is not a payload field; it passes through from the AirTrail flight.
      {
        ...flight({ departure: '2026-10-05', departureTime: '10:00', arrival: '2026-10-05', arrivalTime: '09:00' }),
        duration: 600,
      } as AirtrailSavePayload,
      refs(LHR, LHR),
    );
    expect(body.duration).toBe(600);
  });
});
