/**
 * WandererWatchService (WAN-02): the optional background watch over a user's
 * own wanderer snapshots. The service comes out of ToursModule over a snapshot
 * test db with its real repositories; only the wanderer client (no socket is
 * ever opened) and the notifications (a spy) are replaced.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import { TourSourceHints } from '../../../src/db/entities/TourSourceHints.entity';
import { WandererConnections } from '../../../src/db/entities/WandererConnections.entity';
import { maybe_encrypt_api_key } from '../../../src/nest/common/crypto/apiKeyCrypto';
import { DomainError } from '../../../src/nest/common/domain-error';
import { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { contentHashOf } from '../../../src/nest/tours/tours.helpers';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { WATCH_BACKOFF_BASE_MS } from '../../../src/nest/tours/wanderer-watch.helpers';
import { WandererWatchService } from '../../../src/nest/tours/wanderer-watch.service';
import { WandererClient, WandererError } from '../../../src/nest/wanderer/wanderer.client';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlace } from '../../helpers/factories/places';
import { countRows, deleteRows, findRow, insertRow, updateRows } from '../../helpers/factories/rows';
import { setAddonEnabled, setAppSetting } from '../../helpers/factories/settings';
import { makeTour, makeTourSource } from '../../helpers/factories/tours';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const INSTANCE = 'https://wanderer.example.org';
const ROUTE: [number, number][] = [
  [47.45, 11.1],
  [47.46, 11.11],
];
const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-20T10:00:00Z');
const later = (ms: number) => new Date(NOW.getTime() + ms);

const RECORD = {
  id: 'trail1',
  name: 'Ridge',
  description: 'Up the ridge',
  gpx: 'track.gpx',
  updated: '2026-10-01 10:00:00.000Z',
  author: 'actor1',
};
const client = {
  check: vi.fn(),
  ownActors: vi.fn(),
  search: vi.fn(),
  searchById: vi.fn(),
  trail: vi.fn(),
  gpx: vi.fn(),
};
const notifications = { send: vi.fn() };

const db = createSnapshotTestDb();
let t: TestModule;
let watch: WandererWatchService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [
      { provide: WandererClient, useValue: client },
      { provide: NotificationsService, useValue: notifications },
    ],
  });
  watch = t.get(WandererWatchService);
});
beforeEach(async () => {
  resetTestDb(db);
  vi.clearAllMocks();
  client.ownActors.mockResolvedValue(['actor1']);
  client.trail.mockResolvedValue(RECORD);
  notifications.send.mockResolvedValue({ attempted: 1, delivered: 1 });
  await setAddonEnabled(orm(), 'tours', true);
  await setAppSetting(orm(), 'tours_wanderer_enabled', 'true');
});
afterAll(async () => {
  await t.close();
  db.close();
});

/** A user with a watched connection and one wanderer snapshot, imported as RECORD said then. */
async function fixture(watchEnabled = true) {
  const { user } = await makeUser(orm());
  await insertRow(orm(), WandererConnections, {
    user: user.id,
    url: INSTANCE,
    token: maybe_encrypt_api_key('wanderer_key_abc'),
    watch_enabled: watchEnabled ? 1 : 0,
  });
  const trip = await makeTrip(orm(), user.id, { title: 'Alps' });
  const place = await makePlace(orm(), trip.id, { name: 'Ridge' });
  await makeTour(orm(), place.id, { origin: 'wanderer' });
  await makeTourSource(orm(), place.id, user.id, {
    instance: INSTANCE,
    content_hash: contentHashOf(RECORD.name, RECORD.description, ROUTE),
    external_updated: RECORD.updated,
  });
  return { user, trip, placeId: place.id };
}

const hintRow = (placeId: number) => findRow(orm(), TourSourceHints, { place: placeId });
const connection = (userId: number) => findRow(orm(), WandererConnections, { user: userId });

describe('WandererWatchService.run', () => {
  it('WWATCH-001: asks nothing while the watch is off, or wanderer is off', async () => {
    await fixture(false);
    await watch.run(NOW);
    expect(client.ownActors).not.toHaveBeenCalled();

    const { user } = await fixture(true);
    await setAppSetting(orm(), 'tours_wanderer_enabled', 'false');
    await watch.run(NOW);
    expect(client.ownActors).not.toHaveBeenCalled();
    expect(await connection(user.id)).toMatchObject({ watch_last_run_at: null });
  });

  it('WWATCH-002: a record as imported writes a quiet look, tells nobody and never fetches a GPX', async () => {
    const { user, placeId } = await fixture();
    const before = await countRows(orm(), Places);
    await watch.run(NOW);
    expect(client.trail).toHaveBeenCalledTimes(1);
    expect(client.gpx).not.toHaveBeenCalled();
    expect(await hintRow(placeId)).toMatchObject({ state: null, checked_at: '2026-10-20 10:00:00' });
    expect(await connection(user.id)).toMatchObject({ watch_last_run_at: '2026-10-20 10:00:00', watch_failures: 0 });
    expect(notifications.send).not.toHaveBeenCalled();
    expect(await countRows(orm(), Places)).toBe(before);
    expect((await watch.status(user.id)).hints).toEqual([]);
  });

  it('WWATCH-003: a moved change time leaves a possible change, told once, and a source rests a day', async () => {
    const { user, trip, placeId } = await fixture();
    client.trail.mockResolvedValue({ ...RECORD, updated: '2026-10-14 08:00:00.000Z' });
    await watch.run(NOW);
    expect(await hintRow(placeId)).toMatchObject({
      state: 'possible_change',
      external_updated: '2026-10-14 08:00:00.000Z',
    });
    expect(notifications.send).toHaveBeenCalledExactlyOnceWith({
      event: 'wanderer_source_hint',
      actorId: null,
      scope: 'user',
      targetId: user.id,
      params: {
        state: 'possible_change',
        tour: 'Ridge',
        trip: 'Alps',
        tripId: String(trip.id),
        placeId: String(placeId),
      },
    });

    await watch.run(later(DAY / 2));
    expect(client.trail).toHaveBeenCalledTimes(1);
    // A second past the day: the stored times keep whole seconds.
    await watch.run(later(DAY + 1000));
    expect(client.trail).toHaveBeenCalledTimes(2);
    expect(notifications.send).toHaveBeenCalledTimes(1);
  });

  it('WWATCH-004: a different name is a proven change, named as such', async () => {
    const { placeId } = await fixture();
    client.trail.mockResolvedValue({ ...RECORD, name: 'Ridge (new)', updated: '2026-10-14' });
    await watch.run(NOW);
    expect(await hintRow(placeId)).toMatchObject({ state: 'changed', changes: '["name"]', reason: null });
    expect(notifications.send.mock.calls[0]?.[0]).toMatchObject({ params: { state: 'changed' } });
  });

  it('WWATCH-005: a trail that is gone or no longer the user own cannot be judged, and the tour stays', async () => {
    const { placeId } = await fixture();
    client.trail.mockRejectedValue(new WandererError('not_found', 'gone'));
    await watch.run(NOW);
    expect(await hintRow(placeId)).toMatchObject({ state: 'unverifiable', reason: 'unavailable' });
    expect(await findRow(orm(), Places, { id: placeId })).not.toBeNull();
  });

  it('WWATCH-006: a failing instance gets nothing written and is left alone for longer each time', async () => {
    const { user, placeId } = await fixture();
    client.trail.mockRejectedValue(new WandererError('server_error', 'HTTP 429'));
    await watch.run(NOW);
    expect(await hintRow(placeId)).toBeNull();
    expect(await connection(user.id)).toMatchObject({ watch_failures: 1, watch_paused_until: '2026-10-20 11:00:00' });

    await watch.run(later(WATCH_BACKOFF_BASE_MS / 2));
    expect(client.trail).toHaveBeenCalledTimes(1);
    await watch.run(later(WATCH_BACKOFF_BASE_MS));
    expect(await connection(user.id)).toMatchObject({ watch_failures: 2, watch_paused_until: '2026-10-20 13:00:00' });

    client.trail.mockResolvedValue(RECORD);
    await watch.run(later(4 * WATCH_BACKOFF_BASE_MS));
    expect(await connection(user.id)).toMatchObject({ watch_failures: 0, watch_paused_until: null });
  });

  it('WWATCH-007: a refused token stops the watch until a new check passes', async () => {
    const { user } = await fixture();
    client.ownActors.mockRejectedValue(new WandererError('unauthorized', 'revoked'));
    await watch.run(NOW);
    expect((await watch.status(user.id)).blocked).toBe(true);
    await watch.run(later(DAY * 3));
    expect(client.ownActors).toHaveBeenCalledTimes(1);
  });

  it('WWATCH-008: a removed connection ends the looks; the snapshot and its hint stay unread', async () => {
    const { user, placeId } = await fixture();
    client.trail.mockResolvedValue({ ...RECORD, updated: '2026-10-14' });
    await watch.run(NOW);
    await deleteRows(orm(), WandererConnections, { user: user.id });
    await watch.run(later(DAY * 2));
    expect(client.trail).toHaveBeenCalledTimes(1);
    expect(await hintRow(placeId)).toMatchObject({ state: 'possible_change' });
    expect(await watch.status(user.id)).toMatchObject({ connected: false, hints: [] });
  });

  it('WWATCH-009: nothing due asks the instance nothing, and a failed notice is only logged', async () => {
    const { user } = await fixture();
    await watch.run(NOW);
    client.ownActors.mockClear();
    await watch.run(later(DAY / 4));
    expect(client.ownActors).not.toHaveBeenCalled();
    expect(await connection(user.id)).toMatchObject({ watch_last_run_at: '2026-10-20 16:00:00' });

    const other = await fixture();
    notifications.send.mockRejectedValue(new Error('smtp down'));
    client.trail.mockResolvedValue({ ...RECORD, updated: '2026-10-14' });
    await expect(watch.run(later(DAY / 2))).resolves.toBeUndefined();
    expect(await hintRow(other.placeId)).toMatchObject({ state: 'possible_change' });
  });

  it('WWATCH-010: a run already going is not started twice', async () => {
    await fixture();
    let release: () => void = () => undefined;
    client.ownActors.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(['actor1']);
        }),
    );
    const first = watch.run(NOW);
    await vi.waitFor(() => expect(client.ownActors).toHaveBeenCalled());
    await watch.run(NOW);
    release();
    await first;
    expect(client.ownActors).toHaveBeenCalledTimes(1);
  });
});

describe('WandererWatchService switch, status and hints', () => {
  it('WWATCH-011: switching on needs a connection; the status lists the open hints with their tour', async () => {
    const { user: stranger } = await makeUser(orm());
    await expect(watch.setEnabled(stranger.id, true, null)).rejects.toBeInstanceOf(DomainError);

    const { user, trip, placeId } = await fixture(false);
    expect(await watch.setEnabled(user.id, true, null)).toMatchObject({ enabled: true, connected: true, hints: [] });
    client.trail.mockResolvedValue({ ...RECORD, updated: '2026-10-14' });
    await watch.run(NOW);
    expect(await watch.status(user.id)).toMatchObject({
      enabled: true,
      lastRunAt: '2026-10-20T10:00:00Z',
      pausedUntil: null,
      blocked: false,
      hints: [
        {
          placeId,
          tripId: trip.id,
          tripTitle: 'Alps',
          tourName: 'Ridge',
          state: 'possible_change',
          changes: [],
          reason: null,
          externalUpdated: '2026-10-14',
          checkedAt: '2026-10-20T10:00:00Z',
        },
      ],
    });
    expect(await watch.setEnabled(user.id, false, null)).toMatchObject({ enabled: false });
    await watch.run(later(DAY * 2));
    expect(client.trail).toHaveBeenCalledTimes(1);
  });

  it('WWATCH-012: the hint of one tour is the caller own, and a manual check clears it', async () => {
    const { user, trip, placeId } = await fixture();
    const { user: member } = await makeUser(orm());
    client.trail.mockResolvedValue({ ...RECORD, name: 'Ridge (new)', updated: '2026-10-14' });
    await watch.run(NOW);

    expect(await watch.hintFor(String(trip.id), user.id, String(placeId))).toEqual({
      hint: expect.objectContaining({ state: 'changed', changes: ['name'] }),
    });
    expect(await watch.hintFor(String(trip.id), member.id, String(placeId))).toEqual({ hint: null });
    expect(await watch.hintFor('x', user.id, String(placeId))).toEqual({ hint: null });

    await watch.noteSeen(placeId, user.id, {
      contentHash: contentHashOf('Ridge (new)', RECORD.description, ROUTE),
      externalUpdated: '2026-10-14',
    });
    expect(await watch.hintFor(String(trip.id), user.id, String(placeId))).toEqual({ hint: null });
    await watch.run(later(DAY * 2));
    expect(await hintRow(placeId)).toMatchObject({ state: null, seen_updated: '2026-10-14' });
    expect(notifications.send).toHaveBeenCalledTimes(1);
  });

  it('WWATCH-013: a stored change list that is broken reads as none', async () => {
    const { user, trip, placeId } = await fixture();
    client.trail.mockResolvedValue({ ...RECORD, name: 'Other' });
    await watch.run(NOW);
    await updateRows(orm(), TourSourceHints, { place: placeId }, { changes: 'not json' });
    expect((await watch.hintFor(String(trip.id), user.id, String(placeId))).hint).toMatchObject({ changes: [] });
  });
});
