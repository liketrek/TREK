/**
 * Unit tests for FeedsService — FEED-SVC-001 through FEED-SVC-022. The domain had
 * no unit suite before the SQL statements moved into `TripsRepository`/
 * `UsersRepository` (Plan 3d Task 5); everything rested on
 * tests/e2e/feeds.e2e.test.ts, which drives the HTTP surface and therefore only
 * ever merges a single trip's calendar. These cases pin what the e2e cannot reach
 * — the merge rules buildUserIcs applies across several trips (TZID dedupe, a
 * failing trip being skipped, header vs body folding), the second-call branches
 * of the token lifecycle, and the R4 hole (`generateTripToken` returning a URL
 * for an unstored token past the guard).
 *
 * `TripsRepository`/`UsersRepository` are real, against a real migrated-and-
 * seeded in-memory SQLite DB (`createSnapshotTestDb()`, the `Trips.repository
 * .test.ts` precedent) — `tripId`/`userId` are real `number`s now (the route
 * guard resolves and validates the trip id before `FeedsService` ever runs; see
 * `feeds.controller.ts`'s `@Trip()` usage), so there is no raw-string seam left
 * to stub around.
 *
 * buildUserIcs/buildTripIcs consume CalendarService.buildTripCalendar's PARTS
 * instead of scanning a finished ICS document back apart, so the calendar is a
 * stub here and the parts are the test's own.
 */
import { Trips } from '../../../src/db/entities/Trips.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { CalendarService, TripCalendar } from '../../../src/nest/calendar/calendar.service';
import {
  FeedsPublicController,
  TripFeedTokenController,
  UserFeedTokenController,
} from '../../../src/nest/feeds/feeds.controller';
import { FeedsModule } from '../../../src/nest/feeds/feeds.module';
import { FeedsService } from '../../../src/nest/feeds/feeds.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { findRow, updateRows } from '../../helpers/factories/rows';
import { expectRegisteredProvider, expectRegisteredController } from '../../helpers/module-providers';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const BASE = 'https://trek.example.test';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let tripsRepo: TripsRepository;
let usersRepo: UsersRepository;
let svc: FeedsService;

const buildTripCalendar = vi.fn();

// ── Calendar parts the stub hands back ────────────────────────────────────────

const vevent = (summary: string) =>
  `BEGIN:VEVENT\r\nUID:trek-trip-${summary}@trek\r\nDTSTAMP:20260101T000000Z\r\n` +
  `DTSTART;VALUE=DATE:20260101\r\nDTEND;VALUE=DATE:20260102\r\nSUMMARY:${summary}\r\nEND:VEVENT\r\n`;

const vtimezone = (tzid: string, tzname = tzid) =>
  `BEGIN:VTIMEZONE\r\nTZID:${tzid}\r\nBEGIN:STANDARD\r\nDTSTART:19700101T000000\r\n` +
  `TZOFFSETFROM:+0900\r\nTZOFFSETTO:+0900\r\nTZNAME:${tzname}\r\nEND:STANDARD\r\nEND:VTIMEZONE\r\n`;

const calendarParts = (overrides: Partial<TripCalendar> = {}): TripCalendar => ({
  calName: 'Sample',
  filename: 'sample.ics',
  timezones: new Map<string, string>(),
  events: [vevent('Sample')],
  ...overrides,
});

beforeAll(async () => {
  t = await createTestOrm(testDb);
  tripsRepo = t.repo(Trips);
  usersRepo = t.repo(Users);
  svc = new FeedsService(tripsRepo, usersRepo, { buildTripCalendar } as unknown as CalendarService);
});

beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  buildTripCalendar.mockReset();
  buildTripCalendar.mockImplementation(() => calendarParts());
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

async function seedTrip(token?: string) {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  if (token) await updateRows(t, Trips, { id: trip.id }, { feed_token: token });
  return { user, trip };
}

async function seedUserWithToken(token: string, overrides: Partial<{ username: string }> = {}) {
  const { user } = createUser(testDb, overrides);
  await updateRows(t, Users, { id: user.id }, { feed_token: token });
  return user;
}

// ── Trip feed token ───────────────────────────────────────────────────────────

describe('trip feed token lifecycle', () => {
  it('FEED-SVC-001: reports no URL while the trip has no token', async () => {
    const { user, trip } = await seedTrip();

    expect(await svc.getTripToken(trip.id, user.id, BASE)).toEqual({ feed_url: null });
  });

  it('FEED-SVC-002: reports the absolute feed URL once a token exists', async () => {
    const { user, trip } = await seedTrip('tok-trip');

    expect(await svc.getTripToken(trip.id, user.id, BASE)).toEqual({
      feed_url: `${BASE}/api/feed/trip/tok-trip.ics`,
    });
  });

  it('FEED-SVC-003: a trailing slash on the base is stripped, never doubled into //api', async () => {
    // APP_URL is user-supplied config; pasted with a trailing slash it would
    // otherwise produce https://host//api/feed/... which some clients reject.
    const { user, trip } = await seedTrip('tok-trip');

    expect((await svc.getTripToken(trip.id, user.id, `${BASE}/`)).feed_url).toBe(`${BASE}/api/feed/trip/tok-trip.ics`);
  });

  it('FEED-SVC-004: a user without access gets null, not the token of a foreign trip', async () => {
    // The token is the credential for the public feed, so leaking it through the
    // authenticated GET would hand a stranger the whole trip.
    const { trip } = await seedTrip('tok-trip');
    const { user: outsider } = createUser(testDb);

    expect(await svc.getTripToken(trip.id, outsider.id, BASE)).toEqual({ feed_url: null });
  });

  // Membership is what the service checks, and that stays true: whether the
  // caller may manage the credential at all is decided one layer up, by
  // TripAccessGuard + @RequirePermission('share_manage') on the controller.
  it('FEED-SVC-005: a trip shared with the user as a member resolves too', async () => {
    const { trip } = await seedTrip('tok-trip');
    const { user: member } = createUser(testDb);
    addTripMember(testDb, trip.id, member.id);

    expect((await svc.getTripToken(trip.id, member.id, BASE)).feed_url).toBe(`${BASE}/api/feed/trip/tok-trip.ics`);
  });

  it('FEED-SVC-006: generate mints a token once and stays idempotent', async () => {
    // Enabling twice must not invalidate a URL the user already handed to their
    // calendar client — that is what rotate is for.
    const { user, trip } = await seedTrip();

    const first = await svc.generateTripToken(trip.id, user.id, BASE);
    const second = await svc.generateTripToken(trip.id, user.id, BASE);

    expect(first.feed_url).toMatch(new RegExp(`^${BASE}/api/feed/trip/[0-9a-f-]+\\.ics$`));
    expect(second.feed_url).toBe(first.feed_url);
  });

  it('FEED-SVC-007: rotate issues a fresh token and the previous URL stops resolving', async () => {
    const { user, trip } = await seedTrip();
    const before = (await svc.generateTripToken(trip.id, user.id, BASE)).feed_url;
    const oldToken = before.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    const after = (await svc.rotateTripToken(trip.id, user.id, BASE)).feed_url;

    expect(after).not.toBe(before);
    expect(await svc.buildTripIcs(oldToken)).toBeNull();
  });

  it('FEED-SVC-008: disable clears the column so the public URL dies', async () => {
    const { user, trip } = await seedTrip();
    const url = (await svc.generateTripToken(trip.id, user.id, BASE)).feed_url;
    const token = url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    await svc.disableTripToken(trip.id, user.id);

    expect(await svc.getTripToken(trip.id, user.id, BASE)).toEqual({ feed_url: null });
    expect(await svc.buildTripIcs(token)).toBeNull();
  });

  it('FEED-SVC-008b: the writes refuse a trip the acting user cannot reach', async () => {
    // The route guard is what enforces share_manage; this is the second lock, so
    // a caller reaching the service another way cannot mint or clear a token on
    // a trip id it merely guessed.
    const { user, trip } = await seedTrip();
    const { user: outsider } = createUser(testDb);
    const mine = (await svc.generateTripToken(trip.id, user.id, BASE)).feed_url;
    const myToken = mine.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    await svc.rotateTripToken(trip.id, outsider.id, BASE);
    expect((await svc.getTripToken(trip.id, user.id, BASE)).feed_url).toBe(mine);

    await svc.disableTripToken(trip.id, outsider.id);
    expect(await svc.buildTripIcs(myToken)).not.toBeNull();
  });

  // R4 (inventory §18.7, plan ruling R4 — mirrored, not fixed): FD1 finds no
  // row for a trip the acting user cannot reach, a fresh token is minted
  // anyway, and FD2's write (`setFeedTokenIfReachable`) affects 0 rows — but
  // `generateTripToken` still hands back a URL for that never-stored token.
  // Named for the hole, per the task brief; see the task report for the
  // one-line fix proposal (compare the affected count and 404/refuse on 0).
  it('R4 HOLE — generateTripToken returns a feed_url for a token it never stored, for a trip the caller cannot reach', async () => {
    const { trip } = await seedTrip(); // no token yet
    const { user: stranger } = createUser(testDb);

    const result = await svc.generateTripToken(trip.id, stranger.id, BASE);

    // A URL came back...
    expect(result.feed_url).toMatch(new RegExp(`^${BASE}/api/feed/trip/[0-9a-f-]+\\.ics$`));
    // ...but the column was never written (setFeedTokenIfReachable affected 0
    // rows: the stranger fails REACHABLE), so the URL 404s for anyone who tries it.
    const mintedToken = result.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];
    expect((await findRow(t, Trips, { id: trip.id }))?.feed_token).toBeNull();
    expect(await svc.buildTripIcs(mintedToken)).toBeNull();
    // Proven directly at the repository too — the affected count IS the 0-row signal.
    expect(await tripsRepo.setFeedTokenIfReachable(trip.id, stranger.id, mintedToken)).toBe(0);
  });

  // R7 (task-7-review.md L4 / 3d ledger's carry): FD1 (`getFeedTokenIfReachable`,
  // the "does one exist" check) and FD2 (`setFeedTokenIfReachable`, the write)
  // are two un-transacted statements. Two concurrent `generateTripToken` calls
  // for the same reachable trip with no existing token both read "none" at
  // FD1, so both mint a DISTINCT token, and both write — the last write wins
  // (FD2 is an unconditional UPDATE, not a conflict-checked upsert), so only
  // one of the two minted URLs ever resolves. Pinning today's actual outcome
  // (same class as `roadtrip.service.test.ts`'s R7 vias pin), not a fix.
  it("R7: two concurrent generateTripToken calls both mint, but only the last write survives — the other caller's URL never resolves (unserialized FD1-then-FD2)", async () => {
    const { user, trip } = await seedTrip(); // no token yet

    const [r1, r2] = await Promise.all([
      svc.generateTripToken(trip.id, user.id, BASE),
      svc.generateTripToken(trip.id, user.id, BASE),
    ]);

    const token1 = r1.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];
    const token2 = r2.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];
    // FD1 saw no token for either caller, so two distinct tokens were minted.
    expect(token1).not.toBe(token2);

    const stored = (await findRow(t, Trips, { id: trip.id }))?.feed_token;
    expect([token1, token2]).toContain(stored);
    const loser = stored === token1 ? token2 : token1;
    // The loser's URL is well-formed, but resolves nothing.
    expect(await svc.buildTripIcs(loser)).toBeNull();
    expect(await svc.buildTripIcs(stored!)).not.toBeNull();
  });
});

// ── User (all-trips) feed token ───────────────────────────────────────────────

describe('user feed token lifecycle', () => {
  it('FEED-SVC-009: reports null before and the absolute URL after generation', async () => {
    const { user } = createUser(testDb);

    expect(await svc.getUserToken(user.id, BASE)).toEqual({ feed_url: null });

    const generated = (await svc.generateUserToken(user.id, BASE)).feed_url;

    expect(generated).toMatch(new RegExp(`^${BASE}/api/feed/user/[0-9a-f-]+\\.ics$`));
    expect((await svc.getUserToken(user.id, BASE)).feed_url).toBe(generated);
  });

  it('FEED-SVC-010: generate is idempotent — the existing URL is returned unchanged', async () => {
    const { user } = createUser(testDb);

    const first = await svc.generateUserToken(user.id, BASE);
    const second = await svc.generateUserToken(user.id, BASE);

    expect(second.feed_url).toBe(first.feed_url);
  });

  it('FEED-SVC-011: rotate issues a fresh token and the previous URL stops resolving', async () => {
    const { user } = createUser(testDb);
    const before = (await svc.generateUserToken(user.id, BASE)).feed_url;
    const oldToken = before.match(/user\/([0-9a-f-]+)\.ics$/)![1];

    const after = (await svc.rotateUserToken(user.id, BASE)).feed_url;

    expect(after).not.toBe(before);
    expect(await svc.buildUserIcs(oldToken)).toBeNull();
  });

  it('FEED-SVC-012: disable clears the column so the public URL dies', async () => {
    const { user } = createUser(testDb);
    const url = (await svc.generateUserToken(user.id, BASE)).feed_url;
    const token = url.match(/user\/([0-9a-f-]+)\.ics$/)![1];

    await svc.disableUserToken(user.id);

    expect(await svc.getUserToken(user.id, BASE)).toEqual({ feed_url: null });
    expect(await svc.buildUserIcs(token)).toBeNull();
  });
});

// ── buildTripIcs ──────────────────────────────────────────────────────────────

describe('buildTripIcs', () => {
  it('FEED-SVC-013: an unknown token yields null without asking the calendar', async () => {
    await seedTrip('tok-trip');

    expect(await svc.buildTripIcs('00000000-0000-0000-0000-000000000000')).toBeNull();
    expect(buildTripCalendar).not.toHaveBeenCalled();
  });

  it('FEED-SVC-014: a calendar that throws yields null instead of propagating', async () => {
    // The public feed is unauthenticated: a trip the calendar cannot render (a row
    // deleted mid-request, unparseable data) has to come back as a 404, not a 500
    // that a subscribing client retries hourly forever.
    await seedTrip('tok-trip');
    buildTripCalendar.mockImplementation(() => {
      throw new Error('calendar exploded');
    });

    expect(await svc.buildTripIcs('tok-trip')).toBeNull();
  });

  it('FEED-SVC-015: the refresh hints sit in the preamble, ahead of X-WR-CALNAME and every component', async () => {
    // REFRESH-INTERVAL/X-PUBLISHED-TTL are calendar properties: RFC 5545 puts them
    // before the first component, and clients that scan only the preamble stop
    // re-fetching if they slip behind a VTIMEZONE. The document is concatenated from
    // the calendar's parts now, so the order is an assembly decision, not a given.
    const { trip } = await seedTrip('tok-trip');
    buildTripCalendar.mockImplementation(() =>
      calendarParts({
        calName: 'Golden Trip',
        filename: 'golden-trip.ics',
        timezones: new Map([['Asia/Tokyo', vtimezone('Asia/Tokyo')]]),
      }),
    );

    const result = await svc.buildTripIcs('tok-trip');

    expect(result).not.toBeNull();
    expect(result!.filename).toBe('golden-trip.ics');
    expect(result!.ics).toContain(
      'METHOD:PUBLISH\r\nREFRESH-INTERVAL;VALUE=DURATION:PT1H\r\nX-PUBLISHED-TTL:PT1H\r\n' +
        'X-WR-CALNAME:Golden Trip\r\nBEGIN:VTIMEZONE\r\n',
    );
    expect(result!.ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(result!.ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true);
    expect(buildTripCalendar).toHaveBeenCalledWith(trip.id);
  });
});

// ── buildUserIcs ──────────────────────────────────────────────────────────────

describe('buildUserIcs', () => {
  it('FEED-SVC-016: an unknown token yields null without asking the calendar', async () => {
    await seedUserWithToken('tok-user');

    expect(await svc.buildUserIcs('00000000-0000-0000-0000-000000000000')).toBeNull();
    expect(buildTripCalendar).not.toHaveBeenCalled();
  });

  it('FEED-SVC-017: a trip whose calendar throws is skipped, the rest are still emitted', async () => {
    // One unrenderable trip must not take the whole all-trips subscription down —
    // the user would silently lose every calendar entry because of a single bad row.
    const user = await seedUserWithToken('tok-user');
    const good = createTrip(testDb, user.id, { start_date: '2026-01-01' });
    const broken = createTrip(testDb, user.id, { start_date: '2026-02-01' });
    const alsoGood = createTrip(testDb, user.id, { start_date: '2026-03-01' });
    buildTripCalendar.mockImplementation((id: number) => {
      if (id === broken.id) throw new Error('calendar exploded');
      return calendarParts({ events: [vevent(`Trip${id}`)] });
    });

    const result = await svc.buildUserIcs('tok-user');

    expect(buildTripCalendar).toHaveBeenCalledTimes(3);
    expect(result!.ics).toContain(`SUMMARY:Trip${good.id}\r\n`);
    expect(result!.ics).toContain(`SUMMARY:Trip${alsoGood.id}\r\n`);
    expect(result!.ics).not.toContain(`SUMMARY:Trip${broken.id}\r\n`);
    expect(result!.ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('FEED-SVC-018: a TZID shared by two trips is defined exactly once, ahead of every VEVENT', async () => {
    // Two VTIMEZONE blocks with the same TZID make the document invalid and clients
    // drop the events referencing it; a block emitted after the VEVENT that uses it
    // does not resolve either (#1453). First definition wins.
    const user = await seedUserWithToken('tok-user');
    const first = createTrip(testDb, user.id, { start_date: '2026-01-01' });
    createTrip(testDb, user.id, { start_date: '2026-02-01' });
    buildTripCalendar.mockImplementation((id: number) => ({
      calName: `Trip ${id}`,
      filename: `trip-${id}.ics`,
      timezones: new Map([
        ['Asia/Tokyo', vtimezone('Asia/Tokyo', id === first.id ? 'Asia/Tokyo' : 'Second/Definition')],
      ]),
      events: [vevent(`Trip${id}`)],
    }));

    const { ics } = (await svc.buildUserIcs('tok-user'))!;

    expect(ics.split('BEGIN:VTIMEZONE').length - 1).toBe(1);
    expect(ics).toContain('TZNAME:Asia/Tokyo\r\n');
    expect(ics).not.toContain('Second/Definition');
    expect(ics.indexOf('BEGIN:VTIMEZONE')).toBeLessThan(ics.indexOf('BEGIN:VEVENT'));
  });

  it('FEED-SVC-019: the header is never folded, the body always is', async () => {
    // Folding is applied to the body only, on purpose: a long display name would
    // otherwise wrap X-WR-CALNAME across two physical lines, which several clients
    // render as a truncated calendar title. The body still has to fold — RFC 5545
    // caps a content line at 75 octets.
    const username = 'Ferdinand-Bartholomew-'.repeat(5);
    const user = await seedUserWithToken('tok-user', { username });
    createTrip(testDb, user.id, { start_date: '2026-01-01' });
    const longSummary = 'A'.repeat(120);
    buildTripCalendar.mockImplementation(() => calendarParts({ events: [vevent(longSummary)] }));

    const { ics, calName } = (await svc.buildUserIcs('tok-user'))!;

    expect(calName).toBe(`${username} – All Trips`);
    const preamble = ics.slice(0, ics.indexOf('BEGIN:VEVENT'));
    expect(preamble).toContain(`X-WR-CALNAME:${calName}\r\n`);
    expect(preamble.split('\r\n').filter((line) => line.startsWith(' '))).toEqual([]);
    // The body is folded and unfolds back to the original content line.
    expect(ics).toContain('\r\n ');
    expect(ics.replace(/\r\n /g, '')).toContain(`SUMMARY:${longSummary}\r\n`);
  });

  it('FEED-SVC-020: the display name is escaped for the header but returned raw', async () => {
    // An unescaped ; or , ends the property value early, so the calendar shows up
    // under a truncated name. The returned calName feeds the HTTP layer, not ICS,
    // and must stay verbatim.
    const user = await seedUserWithToken('tok-user', { username: 'Alice; Bob, Co\\Ltd' });
    createTrip(testDb, user.id, { start_date: '2026-01-01' });

    const { ics, calName } = (await svc.buildUserIcs('tok-user'))!;

    expect(calName).toBe('Alice; Bob, Co\\Ltd – All Trips');
    expect(ics).toContain('X-WR-CALNAME:Alice\\; Bob\\, Co\\\\Ltd – All Trips\r\n');
  });
});

describe('FeedsService wiring', () => {
  it('FEED-SVC-021: the module registers the service and all three controllers', async () => {
    expectRegisteredProvider(FeedsModule, FeedsService);
    expectRegisteredController(FeedsModule, FeedsPublicController);
    expectRegisteredController(FeedsModule, TripFeedTokenController);
    expectRegisteredController(FeedsModule, UserFeedTokenController);
  });
});
