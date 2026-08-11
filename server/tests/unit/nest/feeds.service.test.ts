/**
 * Unit tests for FeedsService — FEED-SVC-001 through FEED-SVC-021. The domain had
 * no unit suite at all: everything rested on tests/e2e/feeds.e2e.test.ts, which
 * drives the HTTP surface and therefore only ever merges a single trip's calendar.
 * These cases pin what the e2e cannot reach — the merge rules buildUserIcs applies
 * across several trips (TZID dedupe, a failing trip being skipped, header vs body
 * folding) and the second-call branches of the token lifecycle.
 *
 * buildUserIcs/buildTripIcs consume CalendarService.buildTripCalendar's PARTS now
 * instead of scanning a finished ICS document back apart, so the calendar is a stub
 * here and the parts are the test's own. The token lookups are real SQL against an
 * in-memory SQLite DB (same harness as calendar.service.test.ts).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: number | string, userId: number) =>
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: number | string, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { FeedsService } from '../../../src/nest/feeds/feeds.service';
import { FeedsModule } from '../../../src/nest/feeds/feeds.module';
import {
  FeedsPublicController,
  TripFeedTokenController,
  UserFeedTokenController,
} from '../../../src/nest/feeds/feeds.controller';
import type { CalendarService, TripCalendar } from '../../../src/nest/calendar/calendar.service';
import { expectRegisteredProvider, expectRegisteredController } from '../../helpers/module-providers';

const BASE = 'https://trek.example.test';

const buildTripCalendar = vi.fn();
const svc = new FeedsService(
  new DatabaseService(testDb),
  { buildTripCalendar } as unknown as CalendarService,
);

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

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  buildTripCalendar.mockReset();
  buildTripCalendar.mockImplementation(() => calendarParts());
});

afterAll(() => {
  testDb.close();
});

function seedTrip(token?: string) {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  if (token) testDb.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run(token, trip.id);
  return { user, trip, tripId: String(trip.id) };
}

function seedUserWithToken(token: string, overrides: Partial<{ username: string }> = {}) {
  const { user } = createUser(testDb, overrides);
  testDb.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run(token, user.id);
  return user;
}

// ── Trip feed token ───────────────────────────────────────────────────────────

describe('trip feed token lifecycle', () => {
  it('FEED-SVC-001: reports no URL while the trip has no token', () => {
    const { user, tripId } = seedTrip();

    expect(svc.getTripToken(tripId, user.id, BASE)).toEqual({ feed_url: null });
  });

  it('FEED-SVC-002: reports the absolute feed URL once a token exists', () => {
    const { user, tripId } = seedTrip('tok-trip');

    expect(svc.getTripToken(tripId, user.id, BASE)).toEqual({
      feed_url: `${BASE}/api/feed/trip/tok-trip.ics`,
    });
  });

  it('FEED-SVC-003: a trailing slash on the base is stripped, never doubled into //api', () => {
    // APP_URL is user-supplied config; pasted with a trailing slash it would
    // otherwise produce https://host//api/feed/... which some clients reject.
    const { user, tripId } = seedTrip('tok-trip');

    expect(svc.getTripToken(tripId, user.id, `${BASE}/`).feed_url).toBe(
      `${BASE}/api/feed/trip/tok-trip.ics`,
    );
  });

  it('FEED-SVC-004: a user without access gets null, not the token of a foreign trip', () => {
    // The token is the credential for the public feed, so leaking it through the
    // authenticated GET would hand a stranger the whole trip.
    const { tripId } = seedTrip('tok-trip');
    const { user: outsider } = createUser(testDb);

    expect(svc.getTripToken(tripId, outsider.id, BASE)).toEqual({ feed_url: null });
  });

  // Membership is what the service checks, and that stays true: whether the
  // caller may manage the credential at all is decided one layer up, by
  // TripAccessGuard + @RequirePermission('share_manage') on the controller.
  it('FEED-SVC-005: a trip shared with the user as a member resolves too', () => {
    const { trip, tripId } = seedTrip('tok-trip');
    const { user: member } = createUser(testDb);
    addTripMember(testDb, trip.id, member.id);

    expect(svc.getTripToken(tripId, member.id, BASE).feed_url).toBe(
      `${BASE}/api/feed/trip/tok-trip.ics`,
    );
  });

  it('FEED-SVC-006: generate mints a token once and stays idempotent', () => {
    // Enabling twice must not invalidate a URL the user already handed to their
    // calendar client — that is what rotate is for.
    const { user, tripId } = seedTrip();

    const first = svc.generateTripToken(tripId, user.id, BASE);
    const second = svc.generateTripToken(tripId, user.id, BASE);

    expect(first.feed_url).toMatch(new RegExp(`^${BASE}/api/feed/trip/[0-9a-f-]+\\.ics$`));
    expect(second.feed_url).toBe(first.feed_url);
  });

  it('FEED-SVC-007: rotate issues a fresh token and the previous URL stops resolving', () => {
    const { user, tripId } = seedTrip();
    const before = svc.generateTripToken(tripId, user.id, BASE).feed_url;
    const oldToken = before.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    const after = svc.rotateTripToken(tripId, user.id, BASE).feed_url;

    expect(after).not.toBe(before);
    expect(svc.buildTripIcs(oldToken)).toBeNull();
  });

  it('FEED-SVC-008: disable clears the column so the public URL dies', () => {
    const { user, tripId } = seedTrip();
    const url = svc.generateTripToken(tripId, user.id, BASE).feed_url;
    const token = url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    svc.disableTripToken(tripId, user.id);

    expect(svc.getTripToken(tripId, user.id, BASE)).toEqual({ feed_url: null });
    expect(svc.buildTripIcs(token)).toBeNull();
  });

  it('FEED-SVC-008b: the writes refuse a trip the acting user cannot reach', () => {
    // The route guard is what enforces share_manage; this is the second lock, so
    // a caller reaching the service another way cannot mint or clear a token on
    // a trip id it merely guessed.
    const { user, tripId } = seedTrip();
    const { user: outsider } = createUser(testDb);
    const mine = svc.generateTripToken(tripId, user.id, BASE).feed_url;
    const myToken = mine.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    svc.rotateTripToken(tripId, outsider.id, BASE);
    expect(svc.getTripToken(tripId, user.id, BASE).feed_url).toBe(mine);

    svc.disableTripToken(tripId, outsider.id);
    expect(svc.buildTripIcs(myToken)).not.toBeNull();
  });
});

// ── User (all-trips) feed token ───────────────────────────────────────────────

describe('user feed token lifecycle', () => {
  it('FEED-SVC-009: reports null before and the absolute URL after generation', () => {
    const { user } = createUser(testDb);

    expect(svc.getUserToken(user.id, BASE)).toEqual({ feed_url: null });

    const generated = svc.generateUserToken(user.id, BASE).feed_url;

    expect(generated).toMatch(new RegExp(`^${BASE}/api/feed/user/[0-9a-f-]+\\.ics$`));
    expect(svc.getUserToken(user.id, BASE).feed_url).toBe(generated);
  });

  it('FEED-SVC-010: generate is idempotent — the existing URL is returned unchanged', () => {
    const { user } = createUser(testDb);

    const first = svc.generateUserToken(user.id, BASE);
    const second = svc.generateUserToken(user.id, BASE);

    expect(second.feed_url).toBe(first.feed_url);
  });

  it('FEED-SVC-011: rotate issues a fresh token and the previous URL stops resolving', () => {
    const { user } = createUser(testDb);
    const before = svc.generateUserToken(user.id, BASE).feed_url;
    const oldToken = before.match(/user\/([0-9a-f-]+)\.ics$/)![1];

    const after = svc.rotateUserToken(user.id, BASE).feed_url;

    expect(after).not.toBe(before);
    expect(svc.buildUserIcs(oldToken)).toBeNull();
  });

  it('FEED-SVC-012: disable clears the column so the public URL dies', () => {
    const { user } = createUser(testDb);
    const url = svc.generateUserToken(user.id, BASE).feed_url;
    const token = url.match(/user\/([0-9a-f-]+)\.ics$/)![1];

    svc.disableUserToken(user.id);

    expect(svc.getUserToken(user.id, BASE)).toEqual({ feed_url: null });
    expect(svc.buildUserIcs(token)).toBeNull();
  });
});

// ── buildTripIcs ──────────────────────────────────────────────────────────────

describe('buildTripIcs', () => {
  it('FEED-SVC-013: an unknown token yields null without asking the calendar', () => {
    seedTrip('tok-trip');

    expect(svc.buildTripIcs('00000000-0000-0000-0000-000000000000')).toBeNull();
    expect(buildTripCalendar).not.toHaveBeenCalled();
  });

  it('FEED-SVC-014: a calendar that throws yields null instead of propagating', () => {
    // The public feed is unauthenticated: a trip the calendar cannot render (a row
    // deleted mid-request, unparseable data) has to come back as a 404, not a 500
    // that a subscribing client retries hourly forever.
    seedTrip('tok-trip');
    buildTripCalendar.mockImplementation(() => {
      throw new Error('calendar exploded');
    });

    expect(svc.buildTripIcs('tok-trip')).toBeNull();
  });

  it('FEED-SVC-015: the refresh hints sit in the preamble, ahead of X-WR-CALNAME and every component', () => {
    // REFRESH-INTERVAL/X-PUBLISHED-TTL are calendar properties: RFC 5545 puts them
    // before the first component, and clients that scan only the preamble stop
    // re-fetching if they slip behind a VTIMEZONE. The document is concatenated from
    // the calendar's parts now, so the order is an assembly decision, not a given.
    const { trip } = seedTrip('tok-trip');
    buildTripCalendar.mockImplementation(() =>
      calendarParts({
        calName: 'Golden Trip',
        filename: 'golden-trip.ics',
        timezones: new Map([['Asia/Tokyo', vtimezone('Asia/Tokyo')]]),
      }),
    );

    const result = svc.buildTripIcs('tok-trip');

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
  it('FEED-SVC-016: an unknown token yields null without asking the calendar', () => {
    seedUserWithToken('tok-user');

    expect(svc.buildUserIcs('00000000-0000-0000-0000-000000000000')).toBeNull();
    expect(buildTripCalendar).not.toHaveBeenCalled();
  });

  it('FEED-SVC-017: a trip whose calendar throws is skipped, the rest are still emitted', () => {
    // One unrenderable trip must not take the whole all-trips subscription down —
    // the user would silently lose every calendar entry because of a single bad row.
    const user = seedUserWithToken('tok-user');
    const good = createTrip(testDb, user.id, { start_date: '2026-01-01' });
    const broken = createTrip(testDb, user.id, { start_date: '2026-02-01' });
    const alsoGood = createTrip(testDb, user.id, { start_date: '2026-03-01' });
    buildTripCalendar.mockImplementation((id: number) => {
      if (id === broken.id) throw new Error('calendar exploded');
      return calendarParts({ events: [vevent(`Trip${id}`)] });
    });

    const result = svc.buildUserIcs('tok-user');

    expect(buildTripCalendar).toHaveBeenCalledTimes(3);
    expect(result!.ics).toContain(`SUMMARY:Trip${good.id}\r\n`);
    expect(result!.ics).toContain(`SUMMARY:Trip${alsoGood.id}\r\n`);
    expect(result!.ics).not.toContain(`SUMMARY:Trip${broken.id}\r\n`);
    expect(result!.ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('FEED-SVC-018: a TZID shared by two trips is defined exactly once, ahead of every VEVENT', () => {
    // Two VTIMEZONE blocks with the same TZID make the document invalid and clients
    // drop the events referencing it; a block emitted after the VEVENT that uses it
    // does not resolve either (#1453). First definition wins.
    const user = seedUserWithToken('tok-user');
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

    const { ics } = svc.buildUserIcs('tok-user')!;

    expect(ics.split('BEGIN:VTIMEZONE').length - 1).toBe(1);
    expect(ics).toContain('TZNAME:Asia/Tokyo\r\n');
    expect(ics).not.toContain('Second/Definition');
    expect(ics.indexOf('BEGIN:VTIMEZONE')).toBeLessThan(ics.indexOf('BEGIN:VEVENT'));
  });

  it('FEED-SVC-019: the header is never folded, the body always is', () => {
    // Folding is applied to the body only, on purpose: a long display name would
    // otherwise wrap X-WR-CALNAME across two physical lines, which several clients
    // render as a truncated calendar title. The body still has to fold — RFC 5545
    // caps a content line at 75 octets.
    const username = 'Ferdinand-Bartholomew-'.repeat(5);
    const user = seedUserWithToken('tok-user', { username });
    createTrip(testDb, user.id, { start_date: '2026-01-01' });
    const longSummary = 'A'.repeat(120);
    buildTripCalendar.mockImplementation(() => calendarParts({ events: [vevent(longSummary)] }));

    const { ics, calName } = svc.buildUserIcs('tok-user')!;

    expect(calName).toBe(`${username} – All Trips`);
    const preamble = ics.slice(0, ics.indexOf('BEGIN:VEVENT'));
    expect(preamble).toContain(`X-WR-CALNAME:${calName}\r\n`);
    expect(preamble.split('\r\n').filter((line) => line.startsWith(' '))).toEqual([]);
    // The body is folded and unfolds back to the original content line.
    expect(ics).toContain('\r\n ');
    expect(ics.replace(/\r\n /g, '')).toContain(`SUMMARY:${longSummary}\r\n`);
  });

  it('FEED-SVC-020: the display name is escaped for the header but returned raw', () => {
    // An unescaped ; or , ends the property value early, so the calendar shows up
    // under a truncated name. The returned calName feeds the HTTP layer, not ICS,
    // and must stay verbatim.
    const user = seedUserWithToken('tok-user', { username: 'Alice; Bob, Co\\Ltd' });
    createTrip(testDb, user.id, { start_date: '2026-01-01' });

    const { ics, calName } = svc.buildUserIcs('tok-user')!;

    expect(calName).toBe('Alice; Bob, Co\\Ltd – All Trips');
    expect(ics).toContain('X-WR-CALNAME:Alice\\; Bob\\, Co\\\\Ltd – All Trips\r\n');
  });
});

describe('FeedsService wiring', () => {
  it('FEED-SVC-021: the module registers the service and all three controllers', () => {
    expectRegisteredProvider(FeedsModule, FeedsService);
    expectRegisteredController(FeedsModule, FeedsPublicController);
    expectRegisteredController(FeedsModule, TripFeedTokenController);
    expectRegisteredController(FeedsModule, UserFeedTokenController);
  });
});
