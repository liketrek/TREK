/**
 * WandererConnectionsRepository and TourSourcesRepository: a user's wanderer
 * connection, and the provenance rows of tours imported through it.
 */
import { TourSources } from '../../../../src/db/entities/TourSources.entity';
import { WandererConnections } from '../../../../src/db/entities/WandererConnections.entity';
import type { TourSourcesRepository } from '../../../../src/db/repositories/TourSources.repository';
import type { WandererConnectionsRepository } from '../../../../src/db/repositories/WandererConnections.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createPlace, createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createTour } from '../../../helpers/tours-repos';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let connections: WandererConnectionsRepository;
let sources: TourSourcesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  connections = t.repo(WandererConnections);
  sources = t.repo(TourSources);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('WandererConnectionsRepository', () => {
  it('WANDREPO-001: no row reads as null', async () => {
    const { user } = createUser(testDb);
    expect(await connections.findRow(user.id)).toBeNull();
  });

  it('WANDREPO-002: saves, keeps the token when none is given, drops it on null, and forgets the check on a new host', async () => {
    const { user } = createUser(testDb);
    await connections.save(user.id, {
      url: 'https://a.example',
      allowInsecureTls: true,
      token: 'enc-1',
      hostChanged: false,
    });
    expect(await connections.findRow(user.id)).toMatchObject({
      url: 'https://a.example',
      token: 'enc-1',
      allow_insecure_tls: 1,
    });

    await connections.recordCheck(user.id, false, 'unauthorized');
    await connections.save(user.id, { url: 'https://a.example/', allowInsecureTls: false, hostChanged: false });
    expect(await connections.findRow(user.id)).toMatchObject({
      token: 'enc-1',
      allow_insecure_tls: 0,
      last_check_ok: 0,
      last_check_error: 'unauthorized',
    });

    await connections.save(user.id, {
      url: 'https://b.example',
      allowInsecureTls: false,
      token: null,
      hostChanged: true,
    });
    expect(await connections.findRow(user.id)).toMatchObject({
      url: 'https://b.example',
      token: null,
      last_checked_at: null,
      last_check_ok: null,
      last_check_error: null,
    });
  });

  it('WANDREPO-003: records a passing check and removes only its own row', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const saveFor = (id: number) =>
      connections.save(id, { url: 'https://a.example', allowInsecureTls: false, token: 't', hostChanged: false });
    await saveFor(user.id);
    await saveFor(other.id);
    await connections.recordCheck(user.id, true, null);
    expect(await connections.findRow(user.id)).toMatchObject({ last_check_ok: 1, last_check_error: null });
    expect((await connections.findRow(user.id))?.last_checked_at).toEqual(expect.any(String));

    await connections.remove(user.id);
    expect(await connections.findRow(user.id)).toBeNull();
    expect(await connections.findRow(other.id)).not.toBeNull();
  });

  const connect = (id: number) =>
    connections.save(id, { url: 'https://a.example', allowInsecureTls: false, token: 'enc', hostChanged: false });

  it('WANDREPO-004: a new token forgets what the last check said about the old one', async () => {
    const { user } = createUser(testDb);
    await connect(user.id);
    await connections.recordCheck(user.id, false, 'unauthorized');
    await connect(user.id);
    expect(await connections.findRow(user.id)).toMatchObject({ last_check_ok: null, last_check_error: null });
  });

  it('WANDREPO-005: the watch is off by default, and switching it on starts without an old pause', async () => {
    const { user } = createUser(testDb);
    expect(await connections.findWatch(user.id)).toBeUndefined();
    await connect(user.id);
    expect(await connections.findWatch(user.id)).toEqual({
      watch_enabled: 0,
      watch_last_run_at: null,
      watch_failures: 0,
      watch_paused_until: null,
    });

    await connections.recordWatchRun(user.id, {
      lastRunAt: '2026-10-19 10:00:00',
      failures: 2,
      pausedUntil: '2026-10-19 12:00:00',
    });
    await connections.setWatch(user.id, true);
    expect(await connections.findWatch(user.id)).toEqual({
      watch_enabled: 1,
      watch_last_run_at: '2026-10-19 10:00:00',
      watch_failures: 0,
      watch_paused_until: null,
    });
    await connections.setWatch(user.id, false);
    expect((await connections.findWatch(user.id))?.watch_enabled).toBe(0);
  });

  it('WANDREPO-006: only switched-on connections with an accepted token and no pause are watchable, longest waiting first', async () => {
    const ids = Array.from({ length: 6 }, () => createUser(testDb).user.id);
    await Promise.all(
      ids.map(async (id) => {
        await connect(id);
        await connections.setWatch(id, true);
      }),
    );
    const [never, ranEarly, ranLate, off, refused, paused] = ids;
    await connections.recordWatchRun(ranEarly, { lastRunAt: '2026-10-19 08:00:00', failures: 0, pausedUntil: null });
    await connections.recordWatchRun(ranLate, { lastRunAt: '2026-10-19 09:00:00', failures: 0, pausedUntil: null });
    await connections.setWatch(off, false);
    await connections.recordCheck(refused, false, 'unauthorized');
    await connections.recordWatchRun(paused, {
      lastRunAt: '2026-10-19 07:00:00',
      failures: 1,
      pausedUntil: '2026-10-19 11:00:00',
    });

    expect(await connections.listWatchable('2026-10-19 10:00:00', 10)).toEqual([never, ranEarly, ranLate]);
    expect(await connections.listWatchable('2026-10-19 12:00:00', 10)).toEqual([never, paused, ranEarly, ranLate]);
    expect(await connections.listWatchable('2026-10-19 12:00:00', 2)).toEqual([never, paused]);
  });
});

describe('TourSourcesRepository', () => {
  function importedTour(tripId: number, name: string): number {
    const place = createPlace(testDb, tripId, { name });
    createTour(testDb, place.id);
    return place.id;
  }

  const source = (placeId: number, externalId: string, importedBy: number, contentHash = 'c1') => ({
    place_id: placeId,
    provider: 'wanderer',
    instance: 'https://a.example',
    external_id: externalId,
    external_url: `https://a.example/trail/view/@me/${externalId}`,
    external_updated: null,
    content_hash: contentHash,
    local_hash: 'l1',
    imported_by: importedBy,
  });

  it('TOURSRC-001: asking about no trails asks nothing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await sources.listSnapshots(trip.id, 'wanderer', 'https://a.example', [])).toEqual([]);
  });

  it('TOURSRC-002: lists the snapshots of the asked trails in this trip and instance, newest first', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const first = importedTour(trip.id, 'Ridge');
    const second = importedTour(trip.id, 'Ridge (new)');
    const foreign = importedTour(other.id, 'Ridge elsewhere');
    const unasked = importedTour(trip.id, 'Gorge');
    await sources.insertSource(source(first, 'trail1', user.id, 'c1'));
    await sources.insertSource(source(second, 'trail1', user.id, 'c2'));
    await sources.insertSource(source(foreign, 'trail1', user.id));
    await sources.insertSource(source(unasked, 'trail2', user.id));

    const rows = await sources.listSnapshots(trip.id, 'wanderer', 'https://a.example', ['trail1']);
    expect(rows.map((row) => [row.place_id, row.content_hash, row.name])).toEqual([
      [second, 'c2', 'Ridge (new)'],
      [first, 'c1', 'Ridge'],
    ]);
    expect(await sources.listSnapshots(trip.id, 'wanderer', 'https://b.example', ['trail1'])).toEqual([]);
  });
});
