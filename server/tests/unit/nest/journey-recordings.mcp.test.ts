/**
 * JourneyRecordingsMcp (JRN-01): the recorded days a journey keeps over MCP,
 * on the same service and journey access as REST. The suite takes its subject
 * from the container over a snapshot test db; only the read from Dawarich is
 * replaced. A tool answers what a day covers and never its geometry.
 */
import { JourneyRecordedDays } from '../../../src/db/entities/JourneyRecordedDays.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { DawarichTracksService, type RecordedDayFetch } from '../../../src/nest/integrations/dawarich-tracks.service';
import { JourneyRecordingsMcp } from '../../../src/nest/journey-recordings/journey-recordings.mcp';
import { JourneyRecordingsModule } from '../../../src/nest/journey-recordings/journey-recordings.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney } from '../../helpers/factories/journeys';
import { countRows } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const fetchDay = vi.fn<(...args: unknown[]) => Promise<RecordedDayFetch>>();
let t: TestModule;
let orm: TestOrm;
let mcp: JourneyRecordingsMcp;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [JourneyRecordingsModule],
    overrides: [{ provide: DawarichTracksService, useValue: { fetchDay } }],
  });
  mcp = t.get(JourneyRecordingsMcp);
  orm = await createTestOrm(db);
});
beforeEach(async () => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
  fetchDay.mockReset();
  await setAddonEnabled(orm, 'journey', true);
  await setAddonEnabled(orm, 'dawarich', true);
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

const DAY: RecordedDayFetch = {
  segments: [
    {
      points: [
        [45.434, 12.3388],
        [45.4364, 12.3218],
      ],
      mode: 'walking',
      startedAt: '2026-05-14T09:00:00+02:00',
      endedAt: '2026-05-14T09:40:00+02:00',
      distanceMeters: 1500,
    },
  ],
  sourceKind: 'tracks',
  utcOffsetMinutes: 120,
  offsetSource: 'source',
  sourceOffsetMinutes: 120,
  window: { from: '2026-05-13T22:00:00.000Z', to: '2026-05-14T22:00:00.000Z' },
  fetchedAt: '2026-05-15T07:00:00.000Z',
  truncated: false,
};

async function fixture() {
  const { user: owner } = await makeUser(orm);
  const { user: viewer } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id, { title: 'Venice' });
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  return { owner, viewer, journey };
}

describe('JourneyRecordingsMcp', () => {
  it('JRNREC-MCP-001: previews, keeps, lists and drops a day, answering without geometry', async () => {
    const f = await fixture();
    fetchDay.mockResolvedValue(DAY);

    const preview = read(
      await mcp.previewRecordedDay(
        { journeyId: f.journey.id, date: '2026-05-14', utcOffsetMinutes: 0, useSourceOffset: true },
        ctx(f.owner.id),
      ),
    );
    expect(preview).toMatchObject({
      journey: { id: f.journey.id, title: 'Venice' },
      utcOffsetMinutes: 120,
      stats: { distanceMeters: 1500, segmentCount: 1 },
      stored: null,
      audience: 1,
    });
    expect(preview.segments).toBeUndefined();

    const saved = read(
      await mcp.saveRecordedDay(
        { journeyId: f.journey.id, date: '2026-05-14', utcOffsetMinutes: 120, expectedHash: preview.contentHash },
        ctx(f.owner.id),
      ),
    );
    expect(saved.outcome).toBe('created');
    expect(saved.day).toMatchObject({ date: '2026-05-14', sourceKind: 'tracks' });
    expect(saved.day.segments).toBeUndefined();

    const listed = read(await mcp.listRecordedDays({ journeyId: f.journey.id }, ctx(f.viewer.id)));
    expect(listed.days).toHaveLength(1);
    expect(listed.days[0].segments).toBeUndefined();

    const again = read(
      await mcp.previewRecordedDay(
        { journeyId: f.journey.id, date: '2026-05-14', utcOffsetMinutes: 0, useSourceOffset: true },
        ctx(f.owner.id),
      ),
    );
    expect(again).toMatchObject({ sameAsStored: true, stored: { date: '2026-05-14' } });
    expect(again.stored.segments).toBeUndefined();

    expect(read(await mcp.deleteRecordedDay({ journeyId: f.journey.id, date: '2026-05-14' }, ctx(f.owner.id)))).toEqual(
      { success: true },
    );
    expect(await countRows(orm, JourneyRecordedDays, {})).toBe(0);
  });

  it('JRNREC-MCP-002: refuses what REST refuses: a viewer keeps nothing, a stranger reads nothing', async () => {
    const f = await fixture();
    const { user: stranger } = await makeUser(orm);
    fetchDay.mockResolvedValue(DAY);

    await expect(
      mcp.saveRecordedDay(
        { journeyId: f.journey.id, date: '2026-05-14', utcOffsetMinutes: 120, expectedHash: 'a'.repeat(64) },
        ctx(f.viewer.id),
      ),
    ).rejects.toThrow('Not allowed');
    await expect(mcp.listRecordedDays({ journeyId: f.journey.id }, ctx(stranger.id))).rejects.toThrow(
      'Journey not found',
    );
    expect(await countRows(orm, JourneyRecordedDays, {})).toBe(0);
  });

  it('JRNREC-MCP-003: reading and dropping need the Journey addon, previewing and keeping need Dawarich too', async () => {
    const options = (name: string) => {
      const entry = getEntry(JourneyRecordingsMcp as unknown as ClassRef, name);
      if (entry?.kind !== 'tool') throw new Error(`${name} is no tool`);
      return entry.options;
    };
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled').mockResolvedValue(true);
    const ALL = ['listRecordedDays', 'deleteRecordedDay', 'previewRecordedDay', 'saveRecordedDay', 'getRecordingPrep'];
    const gates = () => Promise.all(ALL.map((name) => options(name).when?.(ctx(1), mcp)));
    expect(await gates()).toEqual([true, true, true, true, true]);

    enabled.mockImplementation(async (id: string) => id !== 'dawarich');
    expect(await gates()).toEqual([true, true, false, false, false]);

    enabled.mockImplementation(async (id: string) => id !== 'journey');
    expect(await gates()).toEqual([false, false, false, false, false]);

    expect(options('listRecordedDays').access).toEqual({ group: 'journey', mode: 'read' });
    expect(options('previewRecordedDay').access).toEqual({ group: 'journey', mode: 'read' });
    expect(options('saveRecordedDay').access).toEqual({ group: 'journey', mode: 'write' });
    expect(options('deleteRecordedDay').access).toEqual({ group: 'journey', mode: 'write' });
    expect(options('getRecordingPrep').access).toEqual({ group: 'journey', mode: 'read' });
  });

  it('JRNREC-MCP-004: reads how the journey prepares its days for the caller, and refuses a reader as REST does', async () => {
    const f = await fixture();

    expect(read(await mcp.getRecordingPrep({ journeyId: f.journey.id }, ctx(f.owner.id)))).toEqual({
      enabled: false,
      connection: 'not_connected',
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastError: null,
    });
    await expect(mcp.getRecordingPrep({ journeyId: f.journey.id }, ctx(f.viewer.id))).rejects.toThrow('Not allowed');
  });
});
