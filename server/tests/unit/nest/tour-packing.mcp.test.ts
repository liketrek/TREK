/**
 * TourPackingMcp (P2D-XD-01): the packing list a tour points at, over the same
 * service and the same checks as REST. The suite takes its subject from the
 * container over a snapshot test db; the addon gate is the registry's.
 */
import { PackingItems } from '../../../src/db/entities/PackingItems.entity';
import { TourPackingLinks } from '../../../src/db/entities/TourPackingLinks.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { TourPackingMcp } from '../../../src/nest/tours/tour-packing.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePackingItem } from '../../helpers/factories/packing';
import { makePlace } from '../../helpers/factories/places';
import { countRows } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeTour } from '../../helpers/factories/tours';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let mcp: TourPackingMcp;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  mcp = t.get(TourPackingMcp);
  orm = await createTestOrm(db);
});
beforeEach(async () => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
  await setAddonEnabled(orm, 'packing', true);
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

/** A trip with a hike and two items of "Hiking gear", one packed; a user who cannot open the trip. */
async function fixture() {
  const { user } = await makeUser(orm);
  const { user: outsider } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'Alps' });
  const hike = await makePlace(orm, trip.id, { name: 'Ridge' });
  await makeTour(orm, hike.id, { distance: 9 });
  await makePackingItem(orm, trip.id, { name: 'Boots', category: 'Hiking gear', checked: 1, sort_order: 1 });
  await makePackingItem(orm, trip.id, { name: 'Map', category: 'Hiking gear', sort_order: 2 });
  return { user, outsider, trip, hike };
}

describe('TourPackingMcp', () => {
  it('TPL-MCP-001: links a category, reads its items with the tour as context, then lets go of it', async () => {
    const f = await fixture();
    const ids = { tripId: f.trip.id, placeId: f.hike.id };
    expect(read(await mcp.getTourPacking(ids, ctx(f.user.id)))).toMatchObject({
      packing_link: null,
      state: null,
      tour: { name: 'Ridge', tour_type: 'hike', distance_km: 9 },
    });

    const linked = read(await mcp.linkTourPacking({ ...ids, category: 'Hiking gear' }, ctx(f.user.id)));
    expect(linked).toEqual({
      packing_link: { category: 'Hiking gear', linked_at: expect.any(String) },
      previous_link: null,
    });
    expect(read(await mcp.getTourPacking(ids, ctx(f.user.id)))).toMatchObject({
      state: 'ready',
      items: [
        { name: 'Boots', packed: true },
        { name: 'Map', packed: false },
      ],
      packed: 1,
      total: 2,
    });

    // Each answer names what the tour pointed at before, so the change can be taken back.
    expect(read(await mcp.unlinkTourPacking(ids, ctx(f.user.id)))).toEqual({
      packing_link: null,
      previous_link: { category: 'Hiking gear', linked_at: expect.any(String) },
    });
    expect(await countRows(orm, TourPackingLinks)).toBe(0);
    expect(await countRows(orm, PackingItems)).toBe(2);
  });

  it('TPL-MCP-002: refuses a trip the user cannot open, and a write without place_edit, as REST does', async () => {
    const f = await fixture();
    const ids = { tripId: f.trip.id, placeId: f.hike.id };
    const noTrip = { error: 'Trip not found or access denied.' };
    expect(read(await mcp.getTourPacking(ids, ctx(f.outsider.id)))).toEqual(noTrip);
    expect(read(await mcp.linkTourPacking({ ...ids, category: null }, ctx(f.outsider.id)))).toEqual(noTrip);
    expect(read(await mcp.unlinkTourPacking(ids, ctx(f.outsider.id)))).toEqual(noTrip);

    const denied = vi.spyOn(t.get(McpToolGuardsService), 'hasTripPermission').mockResolvedValue(false);
    expect((await mcp.linkTourPacking({ ...ids, category: null }, ctx(f.user.id))).isError).toBe(true);
    expect((await mcp.unlinkTourPacking(ids, ctx(f.user.id))).isError).toBe(true);
    expect(denied).toHaveBeenCalledWith('place_edit', f.trip.id, f.user.id);
    // Reading asks for no permission beyond the trip.
    expect((await mcp.getTourPacking(ids, ctx(f.user.id))).isError).toBeUndefined();
    expect(await countRows(orm, TourPackingLinks)).toBe(0);
  });

  it('TPL-MCP-003: a category the user cannot see is refused through the same service as REST', async () => {
    const f = await fixture();
    await expect(
      mcp.linkTourPacking({ tripId: f.trip.id, placeId: f.hike.id, category: 'Climbing' }, ctx(f.user.id)),
    ).rejects.toThrow('Packing category not found');
    await expect(mcp.getTourPacking({ tripId: f.trip.id, placeId: 999_999 }, ctx(f.user.id))).rejects.toThrow(
      'Tour not found',
    );
  });

  it('TPL-MCP-004: the tools are there only while Tours and Packing are on, and only for the scopes they need', async () => {
    const options = (name: string) => {
      const entry = getEntry(TourPackingMcp as unknown as ClassRef, name);
      if (entry?.kind !== 'tool') throw new Error(`${name} is no tool`);
      return entry.options;
    };
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled').mockResolvedValue(true);
    const gates = ['getTourPacking', 'linkTourPacking', 'unlinkTourPacking'].map((name) => options(name).when);
    const open = () => Promise.all(gates.map((gate) => gate?.(ctx(1), mcp)));
    enabled.mockResolvedValue(true);
    expect(await open()).toEqual([true, true, true]);
    enabled.mockImplementation(async (id: string) => id !== 'packing');
    expect(await open()).toEqual([false, false, false]);
    enabled.mockImplementation(async (id: string) => id !== 'tours');
    expect(await open()).toEqual([false, false, false]);

    const allowed = (name: string, scopes: string[]) => {
      const access = options(name).access;
      return typeof access === 'function' ? access({ userId: 1, scopes } as McpContext) : access;
    };
    expect(allowed('getTourPacking', ['trips:read', 'packing:read'])).toBe(true);
    expect(allowed('getTourPacking', ['trips:read'])).toBe(false);
    expect(allowed('linkTourPacking', ['trips:write', 'packing:read'])).toBe(true);
    expect(allowed('linkTourPacking', ['trips:write'])).toBe(false);
    expect(allowed('linkTourPacking', ['trips:read', 'packing:write'])).toBe(false);
    expect(allowed('unlinkTourPacking', [])).toEqual({ group: 'trips', mode: 'write' });
  });
});
