/**
 * DawarichTracksService unit tests, DAWARICH-TRACKS-001 through
 * DAWARICH-TRACKS-053. The service is built with `new` and every collaborator
 * is a plain mock: no Nest container, no database, no socket. The helpers it
 * delegates the actual geometry to (`bucketPointsByDay`, `bucketTracksByDay`)
 * are the real ones, because what this service decides is *which* of them runs
 * and with which window, and stubbing them would assert nothing about that.
 *
 * Four things here are worth pinning, because losing any of them is invisible
 * until somebody's map is quietly wrong:
 *
 *  - **the early returns.** A trip the caller cannot read, a trip that does not
 *    exist, a trip with no dates, a user with no connection and a nonsense
 *    window all leave without touching Dawarich. Two of them return `null`
 *    (which the controller turns into a 404) and the rest return an *empty
 *    track* (which the map draws as "nothing recorded"), and the difference
 *    between those is the difference between "no such trip" and "you were not
 *    recording". A regression that swapped them would 404 a perfectly good trip;
 *  - **the tracks-then-points fallback.** `/tracks` is a background-job product,
 *    so a fresh import has points and no tracks, and an instance old enough has
 *    no `/tracks` at all. The `catch` around the tracks call is the whole reason
 *    the overlay works on both, but it must not grow to cover the points call
 *    as well, or a genuinely broken connection would report "nothing recorded"
 *    instead of an error nobody can act on;
 *  - **the cache key.** User, window and UTC offset all belong in it. Drop the
 *    offset and two readers either side of a timezone change see each other's
 *    day boundaries; drop the user and they see each other's *routes*, which is
 *    a leak rather than a glitch. What must NOT be in it is the wording: the key
 *    is built from the resolved instants, so the journal writing local time and
 *    the planner writing `Z` share one entry for one window. The TTL boundary
 *    and the 64-entry eviction are pinned for the same reason those constants
 *    exist: a day of geometry per entry adds up fast;
 *  - **the offset reaching the bucketing.** Points carry a Unix timestamp and no
 *    zone, so "which day was that" is answered by the offset the caller sent. A
 *    dropped argument silently regroups everybody onto UTC days, and the days
 *    either side of a midnight are stitched together rather than left with a gap,
 *    which is why `pointCount` reports what was drawn and not what the archive
 *    holds.
 *
 * Every timestamp is written with an explicit offset (`Z` or `+HH:MM`) so the
 * cases mean the same thing on a CI runner in UTC and on a laptop in Berlin,
 * and the clock is frozen for the whole file so `fetchedAt` is a value a test
 * can name rather than merely "some string".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { DawarichTracksService } from '../../../src/nest/integrations/dawarich-tracks.service';
import { DawarichError } from '../../../src/nest/integrations/dawarich.client';
import type {
  DawarichClient,
  DawarichCreds,
  DawarichSlimPoint,
  DawarichTrackFeature,
} from '../../../src/nest/integrations/dawarich.client';
import type { DawarichService } from '../../../src/nest/integrations/dawarich.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { DawarichCapabilities } from '@trek/shared';

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Frozen so `fetchedAt` is assertable. */
const NOW_ISO = '2026-05-10T08:30:00.000Z';

const USER = 7;

const CREDS: DawarichCreds = {
  baseUrl: 'https://dawarich.example',
  apiKey: 'secret-key',
  allowInsecureTls: false,
};

/** What `canAccessTrip` hands back for a trip the caller owns. */
const TRIP_ACCESS = { id: 5, user_id: USER, currency: 'EUR' };

const CAPABILITIES: DawarichCapabilities = {
  visits: true,
  tracks: true,
  points: true,
  locations: false,
  visitedCities: true,
  visitUpdatedAt: false,
  visitCountryCode: false,
  serverVersion: '1.14.5',
  probedAt: '2026-05-09T00:00:00.000Z',
};

/** The answer every "there is nothing to ask about" path shares. */
const EMPTY_TRACK = {
  days: [],
  source: 'tracks',
  fetchedAt: NOW_ISO,
  pointCount: 0,
  truncated: false,
};

/** Unix seconds: what a slim point carries instead of a zoned timestamp. */
const unix = (iso: string): number => Math.floor(Date.parse(iso) / 1000);

/**
 * Latitude and longitude go out as strings: that is what `/points?slim=true`
 * actually sends, and a reader that only handles numbers is the shape of bug
 * this fixture exists to keep out.
 */
const point = (lat: number, lng: number, iso: string): DawarichSlimPoint => ({
  latitude: String(lat),
  longitude: String(lng),
  timestamp: unix(iso),
});

/** One `/tracks` GeoJSON feature, two points wide so it survives simplification. */
function feature(
  props: Partial<NonNullable<DawarichTrackFeature['properties']>> = {},
  coordinates: unknown = [
    [13.0, 52.0],
    [13.4, 52.4],
  ],
): DawarichTrackFeature {
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates },
    properties: {
      start_at: '2026-05-01T10:00:00+02:00',
      end_at: '2026-05-01T12:00:00+02:00',
      dominant_mode: 'car',
      distance: 41_000,
      ...props,
    },
  };
}

interface Collaborators {
  /** `undefined` means the caller has no access to the trip. */
  access?: unknown;
  /** `undefined` means the trip row is gone. */
  trip?: { start_date: string | null; end_date: string | null };
  creds?: DawarichCreds | null;
  capabilities?: DawarichCapabilities | null;
}

function harness(over: Collaborators = {}) {
  const canAccessTrip = vi.fn().mockReturnValue('access' in over ? over.access : TRIP_ACCESS);
  const get = vi
    .fn()
    .mockReturnValue(
      'trip' in over ? over.trip : { start_date: '2026-05-01', end_date: '2026-05-03' },
    );
  const getCredentials = vi.fn().mockReturnValue('creds' in over ? over.creds : CREDS);
  const getCapabilities = vi.fn().mockReturnValue('capabilities' in over ? over.capabilities : null);
  const listTracks = vi.fn().mockResolvedValue({ features: [], truncated: false });
  const listPoints = vi.fn().mockResolvedValue({ points: [], truncated: false });

  const service = new DawarichTracksService(
    { canAccessTrip, get } as unknown as DatabaseService,
    { getCredentials, getCapabilities } as unknown as DawarichService,
    { listTracks, listPoints } as unknown as DawarichClient,
  );

  return { service, canAccessTrip, get, getCredentials, getCapabilities, listTracks, listPoints };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW_ISO));
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// forTrip: access, the trip row, and the window the trip's own dates imply
// ---------------------------------------------------------------------------

describe('DawarichTracksService.forTrip', () => {
  it('DAWARICH-TRACKS-001: a trip the caller cannot read is null, and Dawarich is never asked about it', async () => {
    const h = harness({ access: undefined });

    await expect(h.service.forTrip(USER, 5)).resolves.toBeNull();
    // The access check comes first on purpose: reading the trip row before it
    // would leak "this trip exists" through timing and through the query log.
    expect(h.get).not.toHaveBeenCalled();
    expect(h.getCredentials).not.toHaveBeenCalled();
    expect(h.listTracks).not.toHaveBeenCalled();
    expect(h.canAccessTrip).toHaveBeenCalledWith(5, USER);
  });

  it('DAWARICH-TRACKS-002: a trip row that is gone is the same null: a member of a deleted trip gets a 404, not a crash', async () => {
    const h = harness({ trip: undefined });

    await expect(h.service.forTrip(USER, 5)).resolves.toBeNull();
    expect(h.listTracks).not.toHaveBeenCalled();
  });

  it('DAWARICH-TRACKS-003: a trip with no dates is an empty track, not an error: there is no window to ask about', async () => {
    const h = harness({ trip: { start_date: null, end_date: null } });

    // An error here would read as "your Dawarich connection is broken", which is
    // a different and far more alarming claim than "this trip has no dates yet".
    await expect(h.service.forTrip(USER, 5)).resolves.toEqual(EMPTY_TRACK);
    expect(h.getCredentials).not.toHaveBeenCalled();
    expect(h.listTracks).not.toHaveBeenCalled();
  });

  it('DAWARICH-TRACKS-004: a from without any trip dates still has no end, so it is the empty track too', async () => {
    const h = harness({ trip: { start_date: null, end_date: null } });

    await expect(h.service.forTrip(USER, 5, '2026-05-01')).resolves.toEqual(EMPTY_TRACK);
    expect(h.listTracks).not.toHaveBeenCalled();
  });

  it("DAWARICH-TRACKS-005: the trip's own dates become a whole-days window, midnight to the last second", async () => {
    const h = harness({ trip: { start_date: '2026-05-01', end_date: '2026-05-03' } });

    await h.service.forTrip(USER, 5);

    expect(h.listTracks).toHaveBeenCalledWith(
      CREDS,
      new Date('2026-05-01T00:00:00Z'),
      new Date('2026-05-03T23:59:59Z'),
    );
  });

  it('DAWARICH-TRACKS-006: a trip with a start and no end is a single day, not an open-ended window', async () => {
    const h = harness({ trip: { start_date: '2026-05-01', end_date: null } });

    await h.service.forTrip(USER, 5);

    expect(h.listTracks).toHaveBeenCalledWith(
      CREDS,
      new Date('2026-05-01T00:00:00Z'),
      new Date('2026-05-01T23:59:59Z'),
    );
  });

  it('DAWARICH-TRACKS-007: from and to narrow the window, so the planner can ask for one day of a fortnight', async () => {
    const h = harness({ trip: { start_date: '2026-05-01', end_date: '2026-05-14' } });

    await h.service.forTrip(USER, 5, '2026-05-06', '2026-05-06');

    expect(h.listTracks).toHaveBeenCalledWith(
      CREDS,
      new Date('2026-05-06T00:00:00Z'),
      new Date('2026-05-06T23:59:59Z'),
    );
  });

  it('DAWARICH-TRACKS-008: a caller that sends no offset gets UTC days', async () => {
    const h = harness({ capabilities: { ...CAPABILITIES, tracks: false } });
    h.listPoints.mockResolvedValue({
      points: [point(52.0, 13.0, '2026-05-01T23:30:00Z'), point(52.1, 13.1, '2026-05-01T23:45:00Z')],
      truncated: false,
    });

    const track = await h.service.forTrip(USER, 5, '2026-05-01', '2026-05-01');

    expect(track?.days.map((day) => day.date)).toEqual(['2026-05-01']);
  });

  it("DAWARICH-TRACKS-009: the caller's offset decides the local day: half past eleven in Berlin is already tomorrow", async () => {
    const h = harness({ capabilities: { ...CAPABILITIES, tracks: false } });
    h.listPoints.mockResolvedValue({
      points: [point(52.0, 13.0, '2026-05-01T23:30:00Z'), point(52.1, 13.1, '2026-05-01T23:45:00Z')],
      truncated: false,
    });

    const track = await h.service.forTrip(USER, 5, '2026-05-01', '2026-05-01', 120);

    // The same two instants as the case above; only the reader's zone changed,
    // and that is the whole question the overlay answers.
    expect(track?.days.map((day) => day.date)).toEqual(['2026-05-02']);
  });

  it('DAWARICH-TRACKS-010: forTrip reads the entry forWindow filled: it is a window calculation, not a second path', async () => {
    const h = harness({ trip: { start_date: '2026-05-01', end_date: '2026-05-03' } });

    const direct = await h.service.forWindow(USER, '2026-05-01T00:00:00Z', '2026-05-03T23:59:59Z', 0);
    const viaTrip = await h.service.forTrip(USER, 5);

    // Identity, so this cannot pass on two equal-but-separate fetches: the map
    // and the trip planner ask the same question about the same trip seconds
    // apart, and a private cache on either side doubles every request.
    expect(viaTrip).toBe(direct);
    expect(h.listTracks).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// forWindow: the connection, the window, and the defaulted offset
// ---------------------------------------------------------------------------

describe('DawarichTracksService.forWindow', () => {
  it('DAWARICH-TRACKS-020: a user with no connection gets an empty track rather than a failed request', async () => {
    const h = harness({ creds: null });

    await expect(
      h.service.forWindow(USER, '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z'),
    ).resolves.toEqual(EMPTY_TRACK);
    expect(h.listTracks).not.toHaveBeenCalled();
    expect(h.listPoints).not.toHaveBeenCalled();
  });

  it.each([
    ['an unparseable from', 'yesterday', '2026-05-02T00:00:00Z'],
    ['an unparseable to', '2026-05-01T00:00:00Z', 'tomorrow'],
    ['an inverted window', '2026-05-02T00:00:00Z', '2026-05-01T00:00:00Z'],
    ['a zero-length window', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z'],
  ])('DAWARICH-TRACKS-021: %s is an empty track and no upstream call', async (_label, from, to) => {
    const h = harness();

    await expect(h.service.forWindow(USER, from, to)).resolves.toEqual(EMPTY_TRACK);
    expect(h.listTracks).not.toHaveBeenCalled();
    expect(h.listPoints).not.toHaveBeenCalled();
  });

  it('DAWARICH-TRACKS-022: with no offset argument the offset carried by `from` is used', async () => {
    const h = harness({ capabilities: { ...CAPABILITIES, tracks: false } });
    // Just after local midnight in Berlin, which is still the previous day in UTC.
    h.listPoints.mockResolvedValue({
      points: [point(52.0, 13.0, '2026-04-30T22:10:00Z'), point(52.1, 13.1, '2026-04-30T22:20:00Z')],
      truncated: false,
    });

    const defaulted = await h.service.forWindow(
      USER,
      '2026-05-01T00:00:00+02:00',
      '2026-05-02T00:00:00+02:00',
    );
    expect(defaulted.days.map((day) => day.date)).toEqual(['2026-05-01']);

    // The same window asked with an explicit zero groups the very same instants
    // onto the UTC day instead, which is what a caller silent about its zone means.
    const utc = await h.service.forWindow(
      USER,
      '2026-05-01T00:00:00+02:00',
      '2026-05-02T00:00:00+02:00',
      0,
    );
    expect(utc.days.map((day) => day.date)).toEqual(['2026-04-30']);
  });

  it('DAWARICH-TRACKS-023: the window reaches the client as instants, offset resolved', async () => {
    const h = harness();

    await h.service.forWindow(USER, '2026-05-01T00:00:00+02:00', '2026-05-02T00:00:00+02:00');

    expect(h.listTracks).toHaveBeenCalledWith(
      CREDS,
      new Date('2026-04-30T22:00:00Z'),
      new Date('2026-05-01T22:00:00Z'),
    );
  });
});

// ---------------------------------------------------------------------------
// The cache: key, TTL boundary, eviction, invalidation
// ---------------------------------------------------------------------------

describe('DawarichTracksService cache', () => {
  const FROM = '2026-05-01T00:00:00Z';
  const TO = '2026-05-02T00:00:00Z';

  it('DAWARICH-TRACKS-030: a repeat request inside the TTL is the same object and no second fetch', async () => {
    const h = harness();
    h.listTracks.mockResolvedValue({ features: [feature()], truncated: false });

    const first = await h.service.forWindow(USER, FROM, TO);
    const second = await h.service.forWindow(USER, FROM, TO);

    // Identity, not equality: panning the map must not rebuild a day of geometry.
    expect(second).toBe(first);
    expect(h.listTracks).toHaveBeenCalledTimes(1);
  });

  it('DAWARICH-TRACKS-031: the TTL is exclusive: one millisecond short still hits, sixty seconds exactly refetches', async () => {
    const h = harness();

    await h.service.forWindow(USER, FROM, TO);
    vi.advanceTimersByTime(59_999);
    await h.service.forWindow(USER, FROM, TO);
    expect(h.listTracks).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await h.service.forWindow(USER, FROM, TO);
    // A live recording has to visibly catch up, so the entry expires rather than
    // being refreshed in place.
    expect(h.listTracks).toHaveBeenCalledTimes(2);
  });

  it('DAWARICH-TRACKS-032: the offset is part of the key: the same window grouped two ways is two answers', async () => {
    const h = harness();

    await h.service.forWindow(USER, FROM, TO, 0);
    await h.service.forWindow(USER, FROM, TO, 120);

    expect(h.listTracks).toHaveBeenCalledTimes(2);
  });

  it("DAWARICH-TRACKS-033: the user is part of the key: nobody is served somebody else's route", async () => {
    const h = harness();

    await h.service.forWindow(1, FROM, TO, 0);
    await h.service.forWindow(2, FROM, TO, 0);

    expect(h.listTracks).toHaveBeenCalledTimes(2);
  });

  it('DAWARICH-TRACKS-034: the cache evicts oldest-first at 64 entries, so flipping through a year cannot pin every day in memory', async () => {
    const h = harness({ capabilities: { ...CAPABILITIES, tracks: false } });
    const window = (i: number): [string, string] => {
      const start = new Date(Date.UTC(2026, 0, 1) + i * 86_400_000);
      return [start.toISOString(), new Date(start.getTime() + 3_600_000).toISOString()];
    };

    for (let i = 0; i < 65; i++) {
      const [from, to] = window(i);
      await h.service.forWindow(USER, from, to, 0);
    }
    expect(h.listPoints).toHaveBeenCalledTimes(65);

    // Inserting the 65th pushed the 1st out.
    const [firstFrom, firstTo] = window(0);
    await h.service.forWindow(USER, firstFrom, firstTo, 0);
    expect(h.listPoints).toHaveBeenCalledTimes(66);

    // The newest entry survived that eviction: it is the oldest that goes, not
    // an arbitrary one.
    const [lastFrom, lastTo] = window(64);
    await h.service.forWindow(USER, lastFrom, lastTo, 0);
    expect(h.listPoints).toHaveBeenCalledTimes(66);
  });

  it("DAWARICH-TRACKS-035: forget drops the calling user, so a re-pointed connection does not draw the old instance's route", async () => {
    const h = harness();

    await h.service.forWindow(1, FROM, TO, 0);
    h.service.forget(1);
    await h.service.forWindow(1, FROM, TO, 0);

    expect(h.listTracks).toHaveBeenCalledTimes(2);
  });

  it('DAWARICH-TRACKS-036: forget matches the whole user segment: forgetting 1 leaves 12 cached', async () => {
    const h = harness();

    await h.service.forWindow(1, FROM, TO, 0);
    await h.service.forWindow(12, FROM, TO, 0);
    expect(h.listTracks).toHaveBeenCalledTimes(2);

    h.service.forget(1);

    // A prefix test without the separator would throw user 12 out as well, and
    // the symptom would be "the overlay reloads for no reason", never a failure.
    await h.service.forWindow(12, FROM, TO, 0);
    expect(h.listTracks).toHaveBeenCalledTimes(2);
  });

  it('DAWARICH-TRACKS-037: forget for a user with nothing cached leaves everything else alone', async () => {
    const h = harness();

    await h.service.forWindow(1, FROM, TO, 0);
    h.service.forget(99);
    await h.service.forWindow(1, FROM, TO, 0);

    expect(h.listTracks).toHaveBeenCalledTimes(1);
  });

  it('DAWARICH-TRACKS-038: the key is the resolved instant, not the string a caller happened to write', async () => {
    const h = harness();

    await h.service.forWindow(USER, FROM, TO, 0);
    // The same two moments, spelled in Berlin local time instead of UTC.
    await h.service.forWindow(USER, '2026-05-01T02:00:00+02:00', '2026-05-02T02:00:00+02:00', 0);

    // The journal sends what its entries carry and the planner sends `Z`. Keyed
    // on the raw text those are two entries for one window, which is both a
    // duplicate fetch and twice the memory for the same day of geometry.
    expect(h.listTracks).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// fetch: tracks first, points as the fallback
// ---------------------------------------------------------------------------

describe('DawarichTracksService source selection', () => {
  const FROM = '2026-05-01T00:00:00Z';
  const TO = '2026-05-02T00:00:00Z';

  it('DAWARICH-TRACKS-040: tracks answer with the mode and the measured distance, and points are never asked for', async () => {
    const h = harness({ capabilities: CAPABILITIES });
    h.listTracks.mockResolvedValue({ features: [feature()], truncated: false });

    const track = await h.service.forWindow(USER, FROM, TO, 0);

    expect(track).toEqual({
      days: [
        {
          date: '2026-05-01',
          segments: [
            {
              points: [
                [52.0, 13.0],
                [52.4, 13.4],
              ],
              mode: 'car',
              // The source's own zoned strings, not a normalised instant: the
              // times shown beside the line are the ones Dawarich shows.
              startedAt: '2026-05-01T10:00:00+02:00',
              endedAt: '2026-05-01T12:00:00+02:00',
              distanceMeters: 41_000,
            },
          ],
        },
      ],
      source: 'tracks',
      fetchedAt: NOW_ISO,
      pointCount: 2,
      truncated: false,
    });
    expect(h.listPoints).not.toHaveBeenCalled();
    expect(h.getCapabilities).toHaveBeenCalledWith(USER);
  });

  it('DAWARICH-TRACKS-041: a never-probed connection still tries tracks: unknown is not the same as unsupported', async () => {
    const h = harness({ capabilities: null });
    h.listTracks.mockResolvedValue({ features: [feature()], truncated: false });

    const track = await h.service.forWindow(USER, FROM, TO, 0);

    expect(track.source).toBe('tracks');
    expect(h.listTracks).toHaveBeenCalledTimes(1);
  });

  it('DAWARICH-TRACKS-042: a probe that said tracks: false skips the endpoint entirely', async () => {
    const h = harness({ capabilities: { ...CAPABILITIES, tracks: false } });
    h.listPoints.mockResolvedValue({
      points: [point(52.0, 13.0, '2026-05-01T10:00:00Z'), point(52.2, 13.2, '2026-05-01T10:10:00Z')],
      truncated: false,
    });

    const track = await h.service.forWindow(USER, FROM, TO, 0);

    // An instance without /tracks answers 404 to every call; asking anyway would
    // put a failed request in front of every single overlay open.
    expect(h.listTracks).not.toHaveBeenCalled();
    expect(track.source).toBe('points');
    expect(track.pointCount).toBe(2);
  });

  it('DAWARICH-TRACKS-043: an empty tracks list falls through to points: a fresh import has points long before the job has run', async () => {
    const h = harness({ capabilities: CAPABILITIES });
    h.listTracks.mockResolvedValue({ features: [], truncated: false });
    h.listPoints.mockResolvedValue({
      points: [point(52.0, 13.0, '2026-05-01T10:00:00Z'), point(52.2, 13.2, '2026-05-01T10:10:00Z')],
      truncated: false,
    });

    const track = await h.service.forWindow(USER, FROM, TO, 0);

    expect(track.source).toBe('points');
    expect(track.days).toHaveLength(1);
    expect(h.listPoints).toHaveBeenCalledWith(CREDS, new Date(FROM), new Date(TO));
  });

  it('DAWARICH-TRACKS-044: a failing tracks endpoint falls through to points instead of failing the overlay', async () => {
    const h = harness({ capabilities: CAPABILITIES });
    h.listTracks.mockRejectedValue(new DawarichError('not_found', 'no such endpoint', 404));
    h.listPoints.mockResolvedValue({
      points: [point(52.0, 13.0, '2026-05-01T10:00:00Z'), point(52.2, 13.2, '2026-05-01T10:10:00Z')],
      truncated: false,
    });

    const track = await h.service.forWindow(USER, FROM, TO, 0);

    expect(track.source).toBe('points');
    expect(track.pointCount).toBe(2);
  });

  it('DAWARICH-TRACKS-045: a failing points endpoint is NOT swallowed: the catch covers tracks only', async () => {
    const h = harness({ capabilities: CAPABILITIES });
    h.listTracks.mockRejectedValue(new DawarichError('not_found', 'no such endpoint', 404));
    h.listPoints.mockRejectedValue(new DawarichError('unauthorized', 'key rejected', 401));

    // A genuinely broken connection has to reach the controller as an error. If
    // this were caught too, a rejected API key would render as "nothing
    // recorded" and nobody would ever find out why the line is missing.
    await expect(h.service.forWindow(USER, FROM, TO, 0)).rejects.toThrow('key rejected');
  });

  it('DAWARICH-TRACKS-046: a failed fetch is not cached, so the next request tries again', async () => {
    const h = harness({ capabilities: { ...CAPABILITIES, tracks: false } });
    h.listPoints.mockRejectedValueOnce(new DawarichError('unreachable', 'timed out'));
    h.listPoints.mockResolvedValue({ points: [], truncated: false });

    await expect(h.service.forWindow(USER, FROM, TO, 0)).rejects.toThrow('timed out');
    await h.service.forWindow(USER, FROM, TO, 0);

    expect(h.listPoints).toHaveBeenCalledTimes(2);
  });

  it('DAWARICH-TRACKS-047: nothing anywhere is an honest empty result that still names the endpoint that answered', async () => {
    const h = harness({ capabilities: CAPABILITIES });

    const track = await h.service.forWindow(USER, FROM, TO, 0);

    // Not EMPTY_TRACK: that one says `tracks` because nothing was asked at all.
    // This one went all the way to points, came back with nothing, and says so.
    expect(track).toEqual({
      days: [],
      source: 'points',
      fetchedAt: NOW_ISO,
      pointCount: 0,
      truncated: false,
    });
  });

  it('DAWARICH-TRACKS-048: a truncated tracks page reaches the caller: the line is incomplete and says so', async () => {
    const h = harness({ capabilities: CAPABILITIES });
    h.listTracks.mockResolvedValue({ features: [feature()], truncated: true });

    const track = await h.service.forWindow(USER, FROM, TO, 0);

    expect(track).toMatchObject({ source: 'tracks', truncated: true });
  });

  it('DAWARICH-TRACKS-049: a truncated points page reaches the caller too', async () => {
    const h = harness({ capabilities: { ...CAPABILITIES, tracks: false } });
    h.listPoints.mockResolvedValue({
      points: [point(52.0, 13.0, '2026-05-01T10:00:00Z'), point(52.2, 13.2, '2026-05-01T10:10:00Z')],
      truncated: true,
    });

    const track = await h.service.forWindow(USER, FROM, TO, 0);

    expect(track).toMatchObject({ source: 'points', truncated: true });
  });

  it('DAWARICH-TRACKS-050: unusable points are dropped rather than drawn, and pointCount counts what was drawn', async () => {
    const h = harness({ capabilities: { ...CAPABILITIES, tracks: false } });
    h.listPoints.mockResolvedValue({
      points: [
        point(52.0, 13.0, '2026-05-01T10:00:00Z'),
        // A latitude that is not a number at all, and one off the planet. Drawn
        // as given, these are a detour to null island and a detour to nowhere.
        { latitude: 'nope', longitude: '13.05', timestamp: unix('2026-05-01T10:05:00Z') },
        { latitude: '95.0', longitude: '13.06', timestamp: unix('2026-05-01T10:06:00Z') },
        point(52.2, 13.2, '2026-05-01T10:10:00Z'),
      ],
      truncated: false,
    });

    const track = await h.service.forWindow(USER, FROM, TO, 0);

    expect(track.pointCount).toBe(2);
    expect(track.days[0]?.segments[0]).toMatchObject({
      points: [
        [52.0, 13.0],
        [52.2, 13.2],
      ],
      // Points carry no mode and no measured distance. Only tracks do.
      mode: null,
      startedAt: '2026-05-01T10:00:00.000Z',
      endedAt: '2026-05-01T10:10:00.000Z',
      distanceMeters: null,
    });
  });

  it('DAWARICH-TRACKS-051: a track feature too thin to draw leaves the day out rather than emitting a one-point line', async () => {
    const h = harness({ capabilities: CAPABILITIES });
    // One coordinate pair is a dot, not a route. The tracks branch is taken
    // anyway because `features.length > 0`, so the empty `days` has to survive
    // it rather than silently falling through to points and asking twice.
    h.listTracks.mockResolvedValue({ features: [feature({}, [[13.0, 52.0]])], truncated: false });

    const track = await h.service.forWindow(USER, FROM, TO, 0);

    expect(track).toMatchObject({ source: 'tracks', days: [], pointCount: 0 });
    expect(h.listPoints).not.toHaveBeenCalled();
  });

  it("DAWARICH-TRACKS-052: the credentials handed to the client are the calling user's", async () => {
    const h = harness();

    await h.service.forWindow(USER, FROM, TO, 0);

    expect(h.getCredentials).toHaveBeenCalledWith(USER);
    expect(h.listTracks.mock.calls[0][0]).toBe(CREDS);
  });

  it('DAWARICH-TRACKS-053: points either side of midnight become two days that meet, and pointCount counts what is drawn', async () => {
    const h = harness({ capabilities: { ...CAPABILITIES, tracks: false } });
    h.listPoints.mockResolvedValue({
      points: [
        point(52.0, 13.0, '2026-05-01T22:00:00Z'),
        point(52.1, 13.1, '2026-05-01T23:00:00Z'),
        // Deliberately well off the line between its neighbours: a point that
        // simplification would drop as redundant would make the second day two
        // points wide and the count below accidentally right.
        point(52.5, 13.1, '2026-05-02T01:00:00Z'),
        point(52.6, 13.2, '2026-05-02T02:00:00Z'),
      ],
      truncated: false,
    });

    const track = await h.service.forWindow(USER, '2026-05-01T00:00:00Z', '2026-05-03T00:00:00Z', 0);

    expect(track.days.map((day) => day.date)).toEqual(['2026-05-01', '2026-05-02']);
    // The last point of the first day opens the second, so the two lines join
    // instead of showing a jump across midnight that nobody made...
    expect(track.days[1]?.segments[0]?.points[0]).toEqual([52.1, 13.1]);
    // ...but it is geometry only. The second day still begins at its own first
    // recorded instant, an hour after midnight, not at the stitch.
    expect(track.days[1]?.segments[0]?.startedAt).toBe('2026-05-02T01:00:00.000Z');
    // Four points upstream, five drawn. The figure beside the overlay describes
    // the line on the map, not the size of the archive behind it.
    expect(track.pointCount).toBe(5);
  });
});
