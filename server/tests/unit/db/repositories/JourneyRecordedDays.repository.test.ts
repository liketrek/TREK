/**
 * `JourneyRecordedDaysRepository` (JRN-01): a day a journey keeps written
 * whole, read back with the name of whose recording it is, one version per
 * journey, day and source with a second write replacing the first in place,
 * removed on its own, gone with its journey and kept past its importer.
 */
import { JourneyRecordedDays } from '../../../../src/db/entities/JourneyRecordedDays.entity';
import { Journeys } from '../../../../src/db/entities/Journeys.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type {
  JourneyRecordedDaysRepository,
  JourneyRecordedDayWrite,
} from '../../../../src/db/repositories/JourneyRecordedDays.repository';
import { dbNow } from '../../../../src/db/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeJourney } from '../../../helpers/factories/journeys';
import { countRows, deleteRows, updateRows } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let days: JourneyRecordedDaysRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  days = t.repo(JourneyRecordedDays);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function journey() {
  const { user } = await makeUser(t, { username: 'marta' });
  const j = await makeJourney(t, user.id);
  return { user, journey: j };
}

function day(journeyId: number, importedBy: number | null, overrides: Partial<JourneyRecordedDayWrite> = {}) {
  return {
    journey_id: journeyId,
    local_date: '2026-05-14',
    source: 'dawarich',
    source_kind: 'tracks',
    utc_offset_minutes: 120,
    window_from: '2026-05-13T22:00:00.000Z',
    window_to: '2026-05-14T22:00:00.000Z',
    segments: '[{"points":[[45.43,12.33],[45.44,12.34]],"mode":"walking"}]',
    point_count: 2,
    distance_m: 1300,
    content_hash: 'a'.repeat(64),
    truncated: 0,
    fetched_at: '2026-05-15T08:00:00.000Z',
    imported_by: importedBy,
    ...overrides,
  } satisfies JourneyRecordedDayWrite;
}

describe('JourneyRecordedDaysRepository', () => {
  it('JRDAYS-001: keeps a day whole and reads it back with the name of whose recording it is', async () => {
    const { user, journey: j } = await journey();
    const id = await days.upsertDay(day(j.id, user.id));

    const row = await days.findDay(j.id, '2026-05-14', 'dawarich');
    expect(row).toMatchObject({
      id,
      journey_id: j.id,
      local_date: '2026-05-14',
      source_kind: 'tracks',
      utc_offset_minutes: 120,
      window_from: '2026-05-13T22:00:00.000Z',
      point_count: 2,
      distance_m: 1300,
      truncated: 0,
      imported_by: user.id,
      imported_by_username: 'marta',
    });
    expect(row?.created_at).toEqual(expect.any(String));
    expect(await days.findDay(j.id, '2026-05-15', 'dawarich')).toBeUndefined();
  });

  it('JRDAYS-002: a second write of the same day replaces the first in place, keeping its id', async () => {
    const { user, journey: j } = await journey();
    const first = await days.upsertDay(day(j.id, user.id));
    const second = await days.upsertDay(
      day(j.id, user.id, { content_hash: 'b'.repeat(64), point_count: 40, source_kind: 'points', distance_m: null }),
    );

    expect(second).toBe(first);
    expect(await countRows(t, JourneyRecordedDays, {})).toBe(1);
    expect(await days.findDay(j.id, '2026-05-14', 'dawarich')).toMatchObject({
      content_hash: 'b'.repeat(64),
      point_count: 40,
      source_kind: 'points',
      distance_m: null,
    });
  });

  it('JRDAYS-007: a write that keeps only while none is kept leaves the version there first and says so', async () => {
    const { user, journey: j } = await journey();
    const first = await days.insertDayIfAbsent(day(j.id, user.id));
    expect(first).toEqual(expect.any(Number));

    expect(await days.insertDayIfAbsent(day(j.id, user.id, { content_hash: 'b'.repeat(64) }))).toBeUndefined();
    expect(await countRows(t, JourneyRecordedDays, {})).toBe(1);
    expect(await days.findDay(j.id, '2026-05-14', 'dawarich')).toMatchObject({
      id: first,
      content_hash: 'a'.repeat(64),
    });
  });

  it('JRDAYS-003: lists the days of one journey earliest first, and only its own', async () => {
    const { user, journey: j } = await journey();
    const other = await makeJourney(t, user.id);
    await days.upsertDay(day(j.id, user.id, { local_date: '2026-05-16' }));
    await days.upsertDay(day(j.id, user.id, { local_date: '2026-05-14' }));
    await days.upsertDay(day(other.id, user.id, { local_date: '2026-05-15' }));

    expect((await days.listForJourney(j.id)).map((row) => row.local_date)).toEqual(['2026-05-14', '2026-05-16']);
    expect(await days.listForJourney(9999)).toEqual([]);
  });

  it('JRDAYS-004: removes one day and says whether there was one', async () => {
    const { user, journey: j } = await journey();
    await days.upsertDay(day(j.id, user.id));
    await days.upsertDay(day(j.id, user.id, { local_date: '2026-05-15' }));

    expect(await days.deleteDay(j.id, '2026-05-14', 'dawarich')).toBe(true);
    expect(await days.deleteDay(j.id, '2026-05-14', 'dawarich')).toBe(false);
    expect((await days.listForJourney(j.id)).map((row) => row.local_date)).toEqual(['2026-05-15']);
  });

  it('JRDAYS-005: a day goes with its journey and outlives the account that took it over', async () => {
    const { journey: j } = await journey();
    const { user: editor } = await makeUser(t);
    await days.upsertDay(day(j.id, editor.id));

    await deleteRows(t, Users, { id: editor.id });
    expect(await days.findDay(j.id, '2026-05-14', 'dawarich')).toMatchObject({
      imported_by: null,
      imported_by_username: null,
    });

    await deleteRows(t, Journeys, { id: j.id });
    expect(await countRows(t, JourneyRecordedDays, {})).toBe(0);
  });

  it('JRDAYS-006: a replacing write stamps the time it was kept again', async () => {
    const { user, journey: j } = await journey();
    await days.upsertDay(day(j.id, user.id));
    const longAgo = dbNow(new Date('2020-01-01T00:00:00Z'));
    await updateRows(t, JourneyRecordedDays, { journey: j.id }, { created_at: longAgo, updated_at: longAgo });

    await days.upsertDay(day(j.id, user.id, { content_hash: 'c'.repeat(64) }));

    const row = await days.findDay(j.id, '2026-05-14', 'dawarich');
    expect(row?.created_at).toBe(longAgo);
    expect(row?.updated_at).not.toBe(longAgo);
  });
});
