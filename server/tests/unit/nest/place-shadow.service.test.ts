/**
 * PlaceShadowService against real rows (Plan 3c Task 1).
 *
 * The interesting parts of this service ARE the SQL — the id-paged export, the
 * rank bucketing, the age-based retention — so a mocked repository would
 * assert that values were passed along and prove nothing about what they do.
 * Rebuilt off the real migrated schema snapshot (`createSnapshotTestDb()` +
 * `createTestOrm()`, the harness every other converted repository test uses)
 * rather than the legacy hand-written `SCHEMA`/`dbFacade` — R8's rewrite list.
 */
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import { PlaceShadowPicks } from '../../../src/db/entities/PlaceShadowPicks.entity';
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { PlaceShadowPicksRepository } from '../../../src/db/repositories/PlaceShadowPicks.repository';
import { dbNow } from '../../../src/db/types';
import { PlaceShadowService, RETENTION_DAYS } from '../../../src/nest/place-shadow/place-shadow.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, findRow, findRows, updateRows } from '../../helpers/factories/rows';
import { setAppSetting } from '../../helpers/factories/settings';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import type { PlaceShadowPickRequest } from '@trek/shared';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let svc: PlaceShadowService;

const PICK: PlaceShadowPickRequest = {
  query: 'losteria rostock',
  lang: 'de',
  biasLat: 54.0887,
  biasLng: 12.1404,
  source: 'search:nominatim',
  liveRank: 0,
  liveCount: 8,
  pickedName: "L'Osteria",
  pickedLat: 54.0891,
  pickedLng: 12.1372,
  pickedPlaceId: 'osm:node/1',
};

function enable(on = true) {
  return setAppSetting(t, 'place_shadow_enabled', on ? 'true' : 'false');
}

/** A timestamp in the stored datetime('now') format, `days` days back. */
function daysAgo(days: number): string {
  return dbNow(new Date(Date.now() - days * 86_400_000));
}

beforeAll(async () => {
  t = await createTestOrm(testDb);
  const picks: PlaceShadowPicksRepository = t.repo(PlaceShadowPicks);
  const appSettings: AppSettingsRepository = t.repo(AppSettings);
  svc = new PlaceShadowService(picks, appSettings);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('PlaceShadowService', () => {
  describe('the switch', () => {
    it('is off when the setting row is absent', async () => {
      expect(await svc.enabled()).toBe(false);
      expect(await svc.record(PICK)).toBe(false);
      expect(await countRows(t, PlaceShadowPicks)).toBe(0);
    });

    it('is off for any value that is not exactly "true"', async () => {
      for (const value of ['false', '1', 'yes', 'TRUE', '']) {
        await setAppSetting(t, 'place_shadow_enabled', value);
        expect(await svc.enabled(), `value ${JSON.stringify(value)}`).toBe(false);
      }
    });

    it('writes once switched on', async () => {
      await enable();
      expect(await svc.record(PICK)).toBe(true);
      expect((await svc.summary()).total).toBe(1);
    });
  });

  describe('record', () => {
    beforeEach(() => enable());

    it('rounds every coordinate to three decimals', async () => {
      await svc.record({ ...PICK, pickedLat: 54.0891234, pickedLng: 12.1372987, biasLat: 54.08871, biasLng: 12.14049 });
      const row = (await findRow(t, PlaceShadowPicks, {}))!;
      expect(row.picked_lat).toBe(54.089);
      expect(row.picked_lng).toBe(12.137);
      expect(row.bias_lat).toBe(54.089);
      expect(row.bias_lng).toBe(12.14);
    });

    it('stores an absent bias and place id as NULL rather than inventing zeroes', async () => {
      await svc.record({ ...PICK, biasLat: undefined, biasLng: undefined, pickedPlaceId: undefined });
      const row = (await findRow(t, PlaceShadowPicks, {}))!;
      expect(row.bias_lat).toBeNull();
      expect(row.bias_lng).toBeNull();
      expect(row.picked_place_id).toBeNull();
    });

    it('drops a row whose rank is outside the list it claims to come from', async () => {
      expect(await svc.record({ ...PICK, liveRank: 8, liveCount: 8 })).toBe(false);
      expect(await svc.record({ ...PICK, liveRank: 99, liveCount: 3 })).toBe(false);
      expect((await svc.summary()).total).toBe(0);
      // The boundary case one below is a legitimate last-result pick.
      expect(await svc.record({ ...PICK, liveRank: 7, liveCount: 8 })).toBe(true);
    });
  });

  describe('summary', () => {
    beforeEach(async () => {
      await enable();
      const ranks = [0, 0, 0, 1, 4, 5, 9, 10, 42];
      // Sequential, not Promise.all: the rows are inserted in rank order and the
      // export/paging assertions below read that order back.
      for (const [i, rank] of ranks.entries()) {
        await svc.record({
          ...PICK,
          liveRank: rank,
          liveCount: 50,
          source: i % 2 ? 'search:nominatim' : 'autocomplete:google',
        });
      }
    });

    it('buckets the live rank instead of averaging it', async () => {
      expect((await svc.summary()).liveRankBuckets).toEqual([
        { bucket: '1', count: 3 },
        { bucket: '2-5', count: 2 },
        { bucket: '6-10', count: 2 },
        { bucket: '11+', count: 2 },
      ]);
    });

    it('reports the top-one and top-five shares over the whole corpus', async () => {
      const s = await svc.summary();
      expect(s.total).toBe(9);
      expect(s.liveTopOneShare).toBeCloseTo(3 / 9, 6);
      expect(s.liveTopFiveShare).toBeCloseTo(5 / 9, 6);
    });

    it('counts by source, busiest first', async () => {
      expect((await svc.summary()).bySource).toEqual([
        { source: 'autocomplete:google', count: 5 },
        { source: 'search:nominatim', count: 4 },
      ]);
    });

    it('answers on an empty corpus without dividing by zero', async () => {
      testDb.exec('DELETE FROM place_shadow_picks');
      const s = await svc.summary();
      expect(s).toMatchObject({ total: 0, liveTopOneShare: 0, liveTopFiveShare: 0, oldest: null, newest: null });
      expect(s.retentionDays).toBe(RETENTION_DAYS);
    });

    it('reports the switch state it was asked about', async () => {
      expect((await svc.summary()).enabled).toBe(true);
      await enable(false);
      expect((await svc.summary()).enabled).toBe(false);
    });
  });

  describe('export', () => {
    beforeEach(async () => {
      await enable();
      for (let i = 0; i < 7; i++) await svc.record({ ...PICK, query: `q${i}` });
    });

    it('pages by id and hands back the cursor for the next page', async () => {
      const first = await svc.export(undefined, 3);
      expect(first.rows.map((r) => r.query)).toEqual(['q0', 'q1', 'q2']);
      expect(first.nextAfter).toBe(first.rows[2].id);

      const second = await svc.export(first.nextAfter ?? undefined, 3);
      expect(second.rows.map((r) => r.query)).toEqual(['q3', 'q4', 'q5']);

      const third = await svc.export(second.nextAfter ?? undefined, 3);
      expect(third.rows.map((r) => r.query)).toEqual(['q6']);
      // Nothing beyond, so no cursor — that is how a reader knows to stop.
      expect(third.nextAfter).toBeNull();
    });

    it('maps snake_case columns onto the camelCase contract', async () => {
      const row = (await svc.export(undefined, 1)).rows[0];
      expect(row).toMatchObject({
        query: 'q0',
        lang: 'de',
        source: 'search:nominatim',
        liveRank: 0,
        liveCount: 8,
        pickedName: "L'Osteria",
        pickedPlaceId: 'osm:node/1',
      });
      expect(typeof row.createdAt).toBe('string');
    });

    it('stamps the version so an evaluator can refuse a dump it does not know', async () => {
      expect((await svc.export()).version).toBe(1);
    });
  });

  describe('retention and wipe', () => {
    beforeEach(() => enable());

    it('removes only rows past the window', async () => {
      await svc.record(PICK);
      await svc.record(PICK);
      // `resetTestDb` never resets `sqlite_sequence` (ids keep growing across
      // tests in this file, by design — see its own docstring), so the
      // "first" row's id is read back rather than hardcoded as `1`.
      const [first] = await findRows(t, PlaceShadowPicks, {}, { id: 'asc' });
      await updateRows(t, PlaceShadowPicks, { id: first.id }, { created_at: daysAgo(200) });
      expect(await svc.purgeExpired()).toBe(1);
      expect((await svc.summary()).total).toBe(1);
    });

    it('keeps a row that is one day short of the window', async () => {
      await svc.record(PICK);
      await updateRows(t, PlaceShadowPicks, {}, { created_at: daysAgo(RETENTION_DAYS - 1) });
      expect(await svc.purgeExpired()).toBe(0);
    });

    it('runs even while the log is switched off, so old rows still age out', async () => {
      await svc.record(PICK);
      await updateRows(t, PlaceShadowPicks, {}, { created_at: daysAgo(200) });
      await enable(false);
      expect(await svc.purgeExpired()).toBe(1);
    });

    it('clear() empties the table and reports how many went', async () => {
      await svc.record(PICK);
      await svc.record(PICK);
      expect(await svc.clear()).toBe(2);
      expect((await svc.summary()).total).toBe(0);
    });
  });
});
