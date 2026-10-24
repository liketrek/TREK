/**
 * DawarichAtlasMcp (DAWARICH-ATLAS-MCP-001..014): the bucket list and the
 * Atlas checked against the Dawarich recordings over MCP, the twins of
 * /api/integrations/dawarich/bucket-list/* and /atlas/*.
 *
 * The subject comes out of the DawarichModule container over a snapshot test
 * db, so the wishes, the ticks and the Atlas marks are real rows and the
 * scoping to the caller is the repositories' own. Only the two seams that
 * would leave the process are stubbed: DawarichService hands out the stored
 * credentials (their encryption is its own suite's business), and
 * DawarichClient answers for the instance, so nothing reaches the network.
 */
import { ADDON_IDS } from '../../../src/addons';
import { BucketList } from '../../../src/db/entities/BucketList.entity';
import { VisitedCountries } from '../../../src/db/entities/VisitedCountries.entity';
import { trekMcpErrorMapper } from '../../../src/mcp/nest-mcp-policy';
import { errorResult, type McpContext, type McpTextResult, type ToolOptions } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { toolOutputForProvider } from '../../../src/nest/assistant/assistant-output';
import { DomainError } from '../../../src/nest/common/domain-error';
import { DawarichAtlasMcp } from '../../../src/nest/integrations/dawarich-atlas.mcp';
import { DawarichSuggestionsService } from '../../../src/nest/integrations/dawarich-suggestions.service';
import { DawarichClient, DawarichError } from '../../../src/nest/integrations/dawarich.client';
import { DawarichModule } from '../../../src/nest/integrations/dawarich.module';
import { DawarichService } from '../../../src/nest/integrations/dawarich.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeBucketListItem, markCountryVisited } from '../../helpers/factories/atlas';
import { countRows, findRow } from '../../helpers/factories/rows';
import { makeUser } from '../../helpers/factories/users';
import { callGatedTool } from '../../helpers/mcp-gate';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z, type ZodRawShape } from 'zod';

const CREDS = { baseUrl: 'https://dawarich.example.com', apiKey: 'test-key', allowInsecureTls: false };

const dawarichStub = { getCredentials: vi.fn() };
const clientStub = { findVisitsNear: vi.fn(), listVisitedCities: vi.fn() };

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let mcp: DawarichAtlasMcp;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [DawarichModule],
    overrides: [
      { provide: DawarichService, useValue: dawarichStub },
      { provide: DawarichClient, useValue: clientStub },
    ],
  });
  mcp = t.get(DawarichAtlasMcp);
  orm = await createTestOrm(db);
});
beforeEach(() => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
  dawarichStub.getCredentials.mockReset().mockResolvedValue(CREDS);
  clientStub.findVisitsNear.mockReset().mockResolvedValue([]);
  clientStub.listVisitedCities.mockReset().mockResolvedValue([]);
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId, scopes: null, isStaticToken: false }) as McpContext;

function read(result: McpTextResult) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

function toolOptions(method: string): ToolOptions {
  const entry = getEntry(DawarichAtlasMcp as unknown as ClassRef, method);
  if (entry?.kind !== 'tool') throw new Error(`${method} is no tool`);
  return entry.options;
}

function inputSchema(method: string) {
  return z.object(toolOptions(method).inputSchema as ZodRawShape);
}

/** A stay of the given length, the given distance off a wish, starting at `at`. */
function stay(at: string, minutes: number, distance: number) {
  return {
    timestamp: 1_757_000_000,
    distance_meters: distance,
    points_count: 30,
    visit_details: { start_time: at, duration_minutes: minutes },
  };
}

/** The owner's wishes: two with coordinates, one without; and a stranger's wish next to them. */
async function fixture() {
  const { user: owner } = await makeUser(orm);
  const { user: stranger } = await makeUser(orm);
  const alhambra = await makeBucketListItem(orm, owner.id, { name: 'Alhambra', lat: 37.176, lng: -3.588 });
  const petra = await makeBucketListItem(orm, owner.id, { name: 'Petra', lat: 30.328, lng: 35.444 });
  await makeBucketListItem(orm, owner.id, { name: 'Somewhere warm' });
  const theirs = await makeBucketListItem(orm, stranger.id, { name: 'Kyoto', lat: 35.011, lng: 135.768 });
  return { owner, stranger, alhambra, petra, theirs };
}

describe('DawarichAtlasMcp surface', () => {
  it('DAWARICH-ATLAS-MCP-001: exactly the five bucket-list and Atlas tools, none asking for a credential', () => {
    const methods = Object.getOwnPropertyNames(DawarichAtlasMcp.prototype).filter(
      (name) => getEntry(DawarichAtlasMcp as unknown as ClassRef, name) !== undefined,
    );
    expect(methods.map((method) => toolOptions(method).name).sort()).toEqual([
      'accept_atlas_countries',
      'clear_bucket_list_visit',
      'confirm_bucket_list_visits',
      'scan_bucket_list_visits',
      'suggest_atlas_countries',
    ]);
    for (const method of methods) {
      expect(Object.keys(toolOptions(method).inputSchema ?? {}).filter((key) => /url|key|token/i.test(key))).toEqual(
        [],
      );
    }
  });

  it.each([
    ['scanBucketList', 'read', true, true, true],
    ['suggestAtlasCountries', 'read', true, true, true],
    ['confirmBucketVisits', 'write', false, true, false],
    ['clearBucketVisit', 'write', false, true, false],
    ['acceptAtlasCountries', 'write', false, true, false],
  ])(
    'DAWARICH-ATLAS-MCP-002: %s claims atlas:%s and advertises readOnly=%s idempotent=%s openWorld=%s',
    (method, mode, readOnly, idempotent, openWorld) => {
      const options = toolOptions(method);
      expect(options.access).toEqual({ group: 'atlas', mode });
      expect(options.annotations).toMatchObject({
        readOnlyHint: readOnly,
        idempotentHint: idempotent,
        openWorldHint: openWorld,
      });
    },
  );

  it('DAWARICH-ATLAS-MCP-003: every tool rides the Dawarich addon, and clearing a visit is announced as a removal', async () => {
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled').mockResolvedValue(false);
    const methods = ['scanBucketList', 'confirmBucketVisits', 'clearBucketVisit', 'acceptAtlasCountries'];
    expect(await Promise.all(methods.map((method) => toolOptions(method).when?.(ctx(1), mcp)))).toEqual(
      methods.map(() => false),
    );
    expect(enabled).toHaveBeenCalledWith(ADDON_IDS.DAWARICH);
    enabled.mockResolvedValue(true);
    expect(await toolOptions('suggestAtlasCountries').when?.(ctx(1), mcp)).toBe(true);
    expect(toolOptions('clearBucketVisit').annotations).toMatchObject({ destructiveHint: true });
  });

  it('DAWARICH-ATLAS-MCP-004: the inputs are the route bodies: 1 to 200 wish ids, one wish, 1 to 300 two-letter codes, both window ends', () => {
    expect(inputSchema('scanBucketList').safeParse({}).success).toBe(true);
    const confirm = inputSchema('confirmBucketVisits');
    expect(confirm.safeParse({ itemIds: [1, 2], visitedAt: '2024-04-02' }).success).toBe(true);
    expect(confirm.safeParse({ itemIds: [] }).success).toBe(false);
    expect(confirm.safeParse({ itemIds: Array.from({ length: 201 }, (_, i) => i + 1) }).success).toBe(false);
    expect(confirm.safeParse({ itemIds: [0] }).success).toBe(false);
    expect(inputSchema('clearBucketVisit').safeParse({ itemId: 3 }).success).toBe(true);
    expect(inputSchema('clearBucketVisit').safeParse({ itemId: -3 }).success).toBe(false);
    const accept = inputSchema('acceptAtlasCountries');
    expect(accept.safeParse({ countryCodes: ['PT', 'es'] }).success).toBe(true);
    expect(accept.safeParse({ countryCodes: ['PRT'] }).success).toBe(false);
    expect(accept.safeParse({ countryCodes: [] }).success).toBe(false);
    const window = inputSchema('suggestAtlasCountries');
    expect(window.safeParse({ from: '2026-01-01', to: '2026-02-01' }).success).toBe(true);
    expect(window.safeParse({ from: '2026-01-01' }).success).toBe(false);
  });

  it('DAWARICH-ATLAS-MCP-005: the two reads pass the demo gate, the three writes are refused for the demo account and write nothing', async () => {
    const f = await fixture();
    const isDemoUser = vi.fn().mockResolvedValue(true);

    const call = ([method, args]: [string, unknown]) => callGatedTool(mcp, method, args, ctx(f.owner.id), isDemoUser);

    const reads: [string, unknown][] = [
      ['scanBucketList', {}],
      ['suggestAtlasCountries', { from: '2026-01-01', to: '2026-02-01' }],
    ];
    const answered = (await Promise.all(reads.map(call))) as McpTextResult[];
    expect(answered.map((answer) => answer.isError)).toEqual([undefined, undefined]);
    expect(isDemoUser).not.toHaveBeenCalled();

    const writes: [string, unknown][] = [
      ['confirmBucketVisits', { itemIds: [f.alhambra.id] }],
      ['clearBucketVisit', { itemId: f.alhambra.id }],
      ['acceptAtlasCountries', { countryCodes: ['PT'] }],
    ];
    expect(await Promise.all(writes.map(call))).toEqual(
      writes.map(() => errorResult('Write operations are disabled in demo mode.')),
    );
    expect((await findRow(orm, BucketList, { id: f.alhambra.id }))?.visited_at).toBeNull();
    expect(await countRows(orm, VisitedCountries, { user: f.owner.id })).toBe(0);
  });
});

describe('scan_bucket_list_visits', () => {
  it("DAWARICH-ATLAS-MCP-006: asks the recordings about the caller's own wishes and ticks nothing off", async () => {
    const f = await fixture();
    clientStub.findVisitsNear.mockImplementation(async (_creds: unknown, lat: number) =>
      lat === 37.176 ? [stay('2024-04-02T10:00:00+02:00', 95, 40)] : [],
    );

    const answer = read(await mcp.scanBucketList({}, ctx(f.owner.id)));

    // Newest wish first, as the Atlas lists them.
    expect(answer).toMatchObject({
      matches: [
        { itemId: f.petra.id, name: 'Petra', match: null, alreadyVisited: false },
        {
          itemId: f.alhambra.id,
          name: 'Alhambra',
          match: { at: '2024-04-02T10:00:00+02:00', minutes: 95, distanceMeters: 40, points: 30 },
          alreadyVisited: false,
        },
      ],
      skippedWithoutCoordinates: 1,
      truncated: false,
    });
    // The stranger's wish is never asked about.
    expect(clientStub.findVisitsNear.mock.calls.map((call) => call[1])).toEqual([30.328, 37.176]);
    expect(dawarichStub.getCredentials).toHaveBeenCalledWith(f.owner.id);
    expect((await findRow(orm, BucketList, { id: f.alhambra.id }))?.visited_at).toBeNull();
  });

  it('DAWARICH-ATLAS-MCP-007: without a connection the scan is the route refusal, and nothing is asked', async () => {
    const f = await fixture();
    dawarichStub.getCredentials.mockResolvedValue(null);

    expect(await mcp.scanBucketList({}, ctx(f.owner.id))).toEqual(errorResult('Dawarich is not connected'));
    expect(clientStub.findVisitsNear).not.toHaveBeenCalled();
  });

  it('DAWARICH-ATLAS-MCP-008: an instance that does not answer ends the scan after one lookup, in TREK words', async () => {
    const f = await fixture();
    clientStub.findVisitsNear.mockRejectedValue(
      new DawarichError('unreachable', 'Could not reach Dawarich', undefined, 'connect ETIMEDOUT 10.0.0.5:443'),
    );

    // The upstream detail stays behind, as it does on the route.
    expect(await mcp.scanBucketList({}, ctx(f.owner.id))).toEqual(errorResult('Could not reach Dawarich'));
    expect(clientStub.findVisitsNear).toHaveBeenCalledTimes(1);
  });
});

describe('suggest_atlas_countries', () => {
  it('DAWARICH-ATLAS-MCP-009: reads the window as instants and marks the countries the Atlas has already', async () => {
    const { user } = await makeUser(orm);
    await markCountryVisited(orm, user.id, 'ES');
    clientStub.listVisitedCities.mockResolvedValue([
      { country: 'Portugal', cities: [{ city: 'Lisbon', stayed_for: 300, timestamp: 1_767_225_600 }] },
      { country: 'Spain', cities: [{ city: 'Seville', stayed_for: 90 }] },
      { country: 'Atlantis', cities: [] },
    ]);

    const answer = read(
      await mcp.suggestAtlasCountries({ from: '2026-01-01', to: '2026-02-01T00:00:00Z' }, ctx(user.id)),
    );

    expect(clientStub.listVisitedCities).toHaveBeenCalledWith(
      CREDS,
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-02-01T00:00:00.000Z'),
    );
    expect(answer).toMatchObject({
      countries: [
        {
          countryCode: 'PT',
          sourceName: 'Portugal',
          cities: [{ name: 'Lisbon', minutes: 300, lastSeenAt: '2026-01-01T00:00:00.000Z' }],
          alreadyVisited: false,
        },
        { countryCode: 'ES', sourceName: 'Spain', alreadyVisited: true },
      ],
      unresolved: ['Atlantis'],
    });
  });

  it('DAWARICH-ATLAS-MCP-010: the assistant hands the provider the cities and minutes, never when the user was where', async () => {
    const { user } = await makeUser(orm);
    clientStub.listVisitedCities.mockResolvedValue([
      { country: 'Portugal', cities: [{ city: 'Lisbon', stayed_for: 300, timestamp: 1_767_225_600 }] },
    ]);
    const answer = read(await mcp.suggestAtlasCountries({ from: '2026-01-01', to: '2026-02-01' }, ctx(user.id)));

    const sent = toolOutputForProvider('suggest_atlas_countries', answer) as typeof answer;

    expect(sent.countries).toEqual([
      { countryCode: 'PT', sourceName: 'Portugal', cities: [{ name: 'Lisbon', minutes: 300 }], alreadyVisited: false },
    ]);
    expect(sent).toMatchObject({ unresolved: [], fetchedAt: answer.fetchedAt });
    expect(JSON.stringify(sent)).not.toContain('lastSeenAt');
  });

  it('DAWARICH-ATLAS-MCP-011: an instance that fails is a refusal in TREK words', async () => {
    const { user } = await makeUser(orm);
    clientStub.listVisitedCities.mockRejectedValue(
      new DawarichError('server_error', 'Dawarich answered HTTP 500', 500),
    );

    expect(await mcp.suggestAtlasCountries({ from: '2026-01-01', to: '2026-02-01' }, ctx(user.id))).toEqual(
      errorResult('Dawarich answered HTTP 500'),
    );
  });

  it.each([
    [{ from: '2026-02-01', to: '2026-01-01' }, 'to must be after from'],
    [{ from: 'soon', to: '2026-01-01' }, 'from and to are required ISO timestamps'],
    [{ from: '2024-01-01', to: '2026-01-01' }, 'Window must be 400 days or less'],
  ])(
    'DAWARICH-ATLAS-MCP-012: the window %j answers the route 400 sentence (%s) as the refusal, before the instance is asked',
    async (window, message) => {
      const { user } = await makeUser(orm);
      let thrown: unknown;
      try {
        await mcp.suggestAtlasCountries(window, ctx(user.id));
      } catch (err) {
        thrown = err;
      }
      expect(thrown).toBeInstanceOf(DomainError);
      expect(thrown).toMatchObject({ status: 400, publicMessage: message });
      // What the registry answers the call with.
      expect(trekMcpErrorMapper(thrown)).toEqual(errorResult(message));
      expect(clientStub.listVisitedCities).not.toHaveBeenCalled();
    },
  );
});

describe('the writes', () => {
  it("DAWARICH-ATLAS-MCP-013: ticks off and clears only the caller's own wishes, as the routes do", async () => {
    const f = await fixture();

    const confirmed = read(
      await mcp.confirmBucketVisits(
        { itemIds: [f.alhambra.id, f.theirs.id], visitedAt: '2024-04-02T10:00:00Z' },
        ctx(f.owner.id),
      ),
    );
    expect(confirmed).toEqual({ updated: 1 });
    expect(await findRow(orm, BucketList, { id: f.alhambra.id })).toMatchObject({
      visited_at: '2024-04-02T10:00:00Z',
      visited_source: 'dawarich',
    });
    expect((await findRow(orm, BucketList, { id: f.theirs.id }))?.visited_at).toBeNull();
    // Ticked off already: it keeps its date.
    expect(read(await mcp.confirmBucketVisits({ itemIds: [f.alhambra.id] }, ctx(f.owner.id)))).toEqual({ updated: 0 });

    expect(await mcp.clearBucketVisit({ itemId: f.alhambra.id }, ctx(f.stranger.id))).toEqual(
      errorResult('Bucket-list entry not found'),
    );
    expect((await findRow(orm, BucketList, { id: f.alhambra.id }))?.visited_at).toBe('2024-04-02T10:00:00Z');
    expect(read(await mcp.clearBucketVisit({ itemId: f.alhambra.id }, ctx(f.owner.id)))).toEqual({ success: true });
    expect(await findRow(orm, BucketList, { id: f.alhambra.id })).toMatchObject({
      visited_at: null,
      visited_source: null,
    });
  });

  it('DAWARICH-ATLAS-MCP-014: marks confirmed countries once with their source, and a failure that is no refusal propagates', async () => {
    const { user } = await makeUser(orm);

    expect(read(await mcp.acceptAtlasCountries({ countryCodes: ['PT', 'es'] }, ctx(user.id)))).toEqual({ marked: 2 });
    expect(read(await mcp.acceptAtlasCountries({ countryCodes: ['ES'] }, ctx(user.id)))).toEqual({ marked: 0 });
    expect(await countRows(orm, VisitedCountries, { user: user.id, source: 'dawarich' })).toBe(2);

    vi.spyOn(t.get(DawarichSuggestionsService), 'acceptAtlasCountries').mockRejectedValue(
      new Error('SQLITE_BUSY: database is locked'),
    );
    await expect(mcp.acceptAtlasCountries({ countryCodes: ['FR'] }, ctx(user.id))).rejects.toThrow('SQLITE_BUSY');
  });
});
