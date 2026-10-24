/**
 * JourneyDayImportMcp (JRN-02): a recorded day taken into a journey with its
 * stays over MCP, on the same service, refusals and journey access as REST.
 * The suite takes its subject from the container over a snapshot test db;
 * only the caller's Dawarich connection and the visits it answers are replaced.
 */
import { DawarichVisitSuggestions } from '../../../src/db/entities/DawarichVisitSuggestions.entity';
import { JourneyEntries } from '../../../src/db/entities/JourneyEntries.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { DawarichClient, type DawarichVisitRaw } from '../../../src/nest/integrations/dawarich.client';
import { DawarichService } from '../../../src/nest/integrations/dawarich.service';
import { JourneyDayImportMcp } from '../../../src/nest/journey-recordings/journey-day-import.mcp';
import { JourneyRecordingsModule } from '../../../src/nest/journey-recordings/journey-recordings.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney } from '../../helpers/factories/journeys';
import { countRows, findRows } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const listVisits = vi.fn();
let t: TestModule;
let orm: TestOrm;
let mcp: JourneyDayImportMcp;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [JourneyRecordingsModule],
    overrides: [
      { provide: DawarichClient, useValue: { listVisits } },
      {
        provide: DawarichService,
        useValue: {
          getCredentials: async () => ({
            baseUrl: 'https://dawarich.example.com',
            apiKey: 'k',
            allowInsecureTls: false,
          }),
          getConnection: async () => ({ lastSyncAt: null }),
        },
      },
    ],
  });
  mcp = t.get(JourneyDayImportMcp);
  orm = await createTestOrm(db);
});
beforeEach(async () => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
  listVisits.mockReset();
  await setAddonEnabled(orm, 'journey', true);
  await setAddonEnabled(orm, 'dawarich', true);
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;
const DAY = '2026-05-14';

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

function visit(id: number, name: string, from: string, to: string): DawarichVisitRaw {
  return {
    id,
    area_id: null,
    started_at: `${DAY}T${from}:00+02:00`,
    ended_at: `${DAY}T${to}:00+02:00`,
    duration: null,
    name,
    status: 'confirmed',
    confidence: null,
    confidence_band: null,
    place: { latitude: 45.434, longitude: 12.3388, id: null },
  };
}

async function fixture() {
  const { user: owner } = await makeUser(orm);
  const { user: viewer } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id, { title: 'Venice' });
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  listVisits.mockResolvedValue({
    visits: [visit(101, 'Piazza San Marco', '09:10', '10:05'), visit(102, 'Rialto', '13:00', '13:30')],
    truncated: false,
  });
  return { owner, viewer, journey };
}

describe('JourneyDayImportMcp', () => {
  it('JRNDAY-MCP-001: reviews the day and takes a stay over as a draft, the other one left out', async () => {
    const f = await fixture();

    const review = read(await mcp.reviewDayStays({ journeyId: f.journey.id, date: DAY }, ctx(f.owner.id)));
    expect(review).toMatchObject({ journey: { id: f.journey.id, title: 'Venice' }, fresh: true, audience: 1 });
    const [markus, rialto] = review.stays as Array<{ suggestionId: number; status: string }>;
    expect([markus?.status, rialto?.status]).toEqual(['open', 'open']);

    const result = read(
      await mcp.takeOverDayStays(
        {
          journeyId: f.journey.id,
          date: DAY,
          groups: [{ kind: 'single', stays: [{ suggestionId: markus?.suggestionId ?? 0, name: 'San Marco' }] }],
          skipSuggestionIds: [rialto?.suggestionId ?? 0],
        },
        ctx(f.owner.id),
      ),
    );
    expect(result).toMatchObject({ entries: [{ title: 'San Marco', stayCount: 1 }], alreadyTaken: [] });
    expect(await findRows(orm, JourneyEntries, { journey: f.journey.id })).toEqual([
      expect.objectContaining({ title: 'San Marco', is_draft: 1 }),
    ]);
    expect((await findRows(orm, DawarichVisitSuggestions, { state: 'dismissed' })).map((row) => row.name)).toEqual([
      'Rialto',
    ]);
  });

  it('JRNDAY-MCP-002: refuses what REST refuses: a viewer reviews nothing, a malformed group writes nothing', async () => {
    const f = await fixture();
    await expect(mcp.reviewDayStays({ journeyId: f.journey.id, date: DAY }, ctx(f.viewer.id))).rejects.toThrow(
      'Not allowed',
    );
    await mcp.reviewDayStays({ journeyId: f.journey.id, date: DAY }, ctx(f.owner.id));
    const [first] = await findRows(orm, DawarichVisitSuggestions, { user: f.owner.id });

    await expect(
      mcp.takeOverDayStays(
        {
          journeyId: f.journey.id,
          date: DAY,
          groups: [{ kind: 'report', stays: [{ suggestionId: first?.id ?? 0 }], title: 'Day' }],
        },
        ctx(f.owner.id),
      ),
    ).rejects.toThrow('This take-over cannot be written');
    expect(await countRows(orm, JourneyEntries, {})).toBe(0);
  });

  it('JRNDAY-MCP-003: both tools need the Journey and the Dawarich addon; reviewing reads, taking over writes', async () => {
    const options = (name: string) => {
      const entry = getEntry(JourneyDayImportMcp as unknown as ClassRef, name);
      if (entry?.kind !== 'tool') throw new Error(`${name} is no tool`);
      return entry.options;
    };
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled').mockResolvedValue(true);
    const ALL = ['reviewDayStays', 'takeOverDayStays'];
    const gates = () => Promise.all(ALL.map((name) => options(name).when?.(ctx(1), mcp)));
    expect(await gates()).toEqual([true, true]);

    enabled.mockImplementation(async (id: string) => id !== 'dawarich');
    expect(await gates()).toEqual([false, false]);

    enabled.mockImplementation(async (id: string) => id !== 'journey');
    expect(await gates()).toEqual([false, false]);

    expect(options('reviewDayStays').access).toEqual({ group: 'journey', mode: 'read' });
    expect(options('takeOverDayStays').access).toEqual({ group: 'journey', mode: 'write' });
  });
});
