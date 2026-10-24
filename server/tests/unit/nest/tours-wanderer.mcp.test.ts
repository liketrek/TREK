/**
 * ToursWandererMcp: the trip-side wanderer routes over MCP. Each tool checks
 * trip access and 'place_edit' as the REST guards do, then hands the same
 * values to ToursWandererService, a stub in this suite (its own suite reads
 * a stubbed instance); the trip and its members are seeded through the ORM
 * factories over a snapshot test db.
 */
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { ToursWandererMcp } from '../../../src/nest/tours/tours-wanderer.mcp';
import { ToursWandererService } from '../../../src/nest/tours/tours-wanderer.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { insertRow } from '../../helpers/factories/rows';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// WANDERER-MCP-001 to WANDERER-MCP-006

const db = createSnapshotTestDb();
const search = vi.fn<ToursWandererService['search']>();
const preview = vi.fn<ToursWandererService['preview']>();
const importTrail = vi.fn<ToursWandererService['import']>();
const checkSource = vi.fn<ToursWandererService['checkSource']>();
const hasTripPermission = vi.fn<McpToolGuardsService['hasTripPermission']>();
const isWandererAvailable = vi.fn<AddonsService['isWandererAvailable']>();
let t: TestModule;
let mcp: ToursWandererMcp;
const orm = () => t.get(MikroORM);

const TRAIL = {
  id: 'trail-1',
  name: 'Herzogstand',
  description: null,
  location: 'Kochel',
  distanceM: 9000,
  durationS: 14_400,
  elevationGainM: 800,
  elevationLossM: 800,
  difficulty: 'moderate' as const,
  public: true,
  author: null,
  line: [
    [47.6, 11.3],
    [47.62, 11.33],
  ] as Array<[number, number]>,
  externalUrl: 'https://wanderer.example/trails/trail-1',
  importedAs: [],
};

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [
      { provide: ToursWandererService, useValue: { search, preview, import: importTrail, checkSource } },
      { provide: McpToolGuardsService, useValue: { hasTripPermission } },
    ],
  });
  mcp = t.get(ToursWandererMcp);
  vi.spyOn(t.get(AddonsService), 'isWandererAvailable').mockImplementation(isWandererAvailable);
});
beforeEach(() => {
  resetTestDb(db);
  hasTripPermission.mockReset().mockResolvedValue(true);
  isWandererAvailable.mockReset().mockResolvedValue(true);
  search.mockReset().mockResolvedValue({ trails: [TRAIL], total: 1, page: 1, pageSize: 20 });
  preview.mockReset().mockResolvedValue({
    trail: TRAIL,
    distanceKm: 9.1,
    elevationGainM: 812,
    elevationLossM: 812,
    hasElevation: true,
    points: 900,
    line: TRAIL.line,
    contentHash: 'h'.repeat(32),
    state: 'new',
    snapshot: null,
    changes: [],
  });
  importTrail.mockReset();
  checkSource.mockReset();
});
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

async function tripOf() {
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  return { userId: user.id, tripId: trip.id };
}

describe('wanderer over MCP', () => {
  it('WANDERER-MCP-001: a search hands its words on and answers the trails without their lines', async () => {
    const { userId, tripId } = await tripOf();
    const answer = read(await mcp.searchTrails({ tripId, q: 'Herzogstand' }, ctx(userId)));
    expect(search).toHaveBeenCalledWith(String(tripId), userId, { q: 'Herzogstand', page: 1, bbox: undefined });
    expect(answer.trails[0]).toMatchObject({ id: 'trail-1', name: 'Herzogstand' });
    expect(answer.trails[0].line).toBeUndefined();
    expect(hasTripPermission).toHaveBeenCalledWith('place_edit', tripId, userId);
  });

  it('WANDERER-MCP-002: a preview answers its line for drawing only when asked, as line_geometry', async () => {
    const { userId, tripId } = await tripOf();
    const plain = read(await mcp.previewTrail({ tripId, trailId: 'trail-1' }, ctx(userId)));
    expect(plain.line).toBeUndefined();
    expect(plain.line_geometry).toBeUndefined();
    expect(plain.trail.line).toBeUndefined();
    expect(plain.contentHash).toBe('h'.repeat(32));
    const drawn = read(await mcp.previewTrail({ tripId, trailId: 'trail-1', include_geometry: true }, ctx(userId)));
    expect(drawn.line_geometry).toEqual(TRAIL.line);
  });

  it('WANDERER-MCP-003: the import and the source check run through the service with the caller’s rights', async () => {
    const { userId, tripId } = await tripOf();
    importTrail.mockResolvedValue({ tour: { place_id: 9 } } as never);
    const imported = read(
      await mcp.importTrail({ tripId, trailId: 'trail-1', contentHash: 'h'.repeat(32) }, ctx(userId)),
    );
    expect(imported.tour.place_id).toBe(9);
    expect(importTrail).toHaveBeenCalledWith(String(tripId), userId, {
      trailId: 'trail-1',
      contentHash: 'h'.repeat(32),
    });
    checkSource.mockResolvedValue({
      state: 'unchanged',
      changes: [],
      externalUpdated: null,
      importedUpdated: null,
      editedLocally: false,
      reimport: null,
    });
    const checked = read(await mcp.checkSource({ tripId, placeId: 9 }, ctx(userId)));
    expect(checked.state).toBe('unchanged');
    expect(checkSource).toHaveBeenCalledWith(String(tripId), userId, '9');
  });

  it('WANDERER-MCP-004: without place editing permission nothing is read or written', async () => {
    const { userId, tripId } = await tripOf();
    hasTripPermission.mockResolvedValue(false);
    expect(read(await mcp.searchTrails({ tripId }, ctx(userId))).error).toBeDefined();
    expect(
      read(await mcp.importTrail({ tripId, trailId: 'x', contentHash: 'h'.repeat(32) }, ctx(userId))).error,
    ).toBeDefined();
    expect(search).not.toHaveBeenCalled();
    expect(importTrail).not.toHaveBeenCalled();
  });

  it('WANDERER-MCP-005: a trip the caller cannot see is not found', async () => {
    const { tripId } = await tripOf();
    const { user: stranger } = await makeUser(orm());
    expect(read(await mcp.previewTrail({ tripId, trailId: 'trail-1' }, ctx(stranger.id))).error).toBeDefined();
    expect(preview).not.toHaveBeenCalled();
    // A member who may not edit places is refused as well.
    await insertRow(orm(), TripMembers, { trip: tripId, user: stranger.id });
    hasTripPermission.mockResolvedValue(false);
    expect(read(await mcp.previewTrail({ tripId, trailId: 'trail-1' }, ctx(stranger.id))).error).toBeDefined();
    expect(preview).not.toHaveBeenCalled();
  });

  it('WANDERER-MCP-006: the tools are offered only while wanderer is allowed under Tours', async () => {
    const methods = ['searchTrails', 'previewTrail', 'importTrail', 'checkSource'];
    const options = methods.map((method) => {
      const entry = getEntry(ToursWandererMcp as unknown as ClassRef, method);
      if (!entry || entry.kind !== 'tool') throw new Error(`${method} is no MCP tool`);
      return entry.options;
    });
    expect(options.map((tool) => [tool.name, tool.annotations?.readOnlyHint, tool.access])).toEqual([
      ['search_wanderer_trails', true, { group: 'trips', mode: 'read' }],
      ['preview_wanderer_trail', true, { group: 'trips', mode: 'read' }],
      ['import_wanderer_trail', false, { group: 'trips', mode: 'write' }],
      ['check_tour_source', true, { group: 'trips', mode: 'read' }],
    ]);
    const gate = options[0]?.when;
    expect(await gate?.(ctx(1), mcp)).toBe(true);
    isWandererAvailable.mockResolvedValue(false);
    expect(await gate?.(ctx(1), mcp)).toBe(false);
  });
});
