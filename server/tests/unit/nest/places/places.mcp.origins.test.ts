/**
 * The MCP side of the origin tracking, beside the REST interceptor: what the
 * assistant writes into a place is recorded as the agent's, a trip file made
 * the picture as an attachment, and an import as the import, so none of it is
 * ever shared as a user's correction.
 */
import type { McpContext } from '../../../../src/nest-mcp';
import { PlacesMcp } from '../../../../src/nest/places/places.mcp';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const ctx = { userId: 5 } as McpContext;
const BEFORE = { website: null, phone: null, email: null, opening_hours: null, description: null, image: null };

const places = {
  create: vi.fn(async (_trip: string, input: Record<string, unknown>) => ({ id: 21, ...input })),
  update: vi.fn(async (_trip: string, id: string) => ({ id: Number(id), name: 'Updated' })),
  setImageFromFile: vi.fn(async (_trip: string, id: string) => ({ id: Number(id) })),
  updateMany: vi.fn(async (_trip: string, ids: number[]) => ids.map((id) => ({ id }))),
  importGpx: vi.fn(async () => ({ places: [{ id: 31 }, { id: 32 }], count: 2, skipped: 0 })),
  onCreated: vi.fn(async () => undefined),
  onUpdated: vi.fn(async () => undefined),
};
const origins = {
  valuesBefore: vi.fn(async () => BEFORE),
  record: vi.fn(async () => undefined),
  recordImported: vi.fn(async () => undefined),
};
const guards = { hasTripPermission: vi.fn(async () => true), safeBroadcast: vi.fn() };
const tripAccess = { findAccessible: vi.fn(async () => ({ id: 1, user_id: 5 })) };

const mcp = new PlacesMcp(
  places as never,
  {} as never,
  tripAccess as never,
  {} as never,
  {} as never,
  guards as never,
  {} as never,
  origins as never,
);

beforeEach(() => vi.clearAllMocks());

describe('PlacesMcp origin tracking', () => {
  it('PMO-001: a place the assistant creates is the agent own', async () => {
    await mcp.createPlace({ tripId: 1, name: 'Café', website: 'https://cafe.example' }, ctx);
    expect(origins.record).toHaveBeenCalledWith(21, null, { kind: 'fixed', origin: 'agent' });
  });

  it('PMO-002: an update reads the place first and records the agent', async () => {
    await mcp.updatePlace({ tripId: 1, placeId: 8, phone: '+49 1' }, ctx);
    expect(origins.valuesBefore).toHaveBeenCalledWith(8);
    expect(origins.record).toHaveBeenCalledWith(8, BEFORE, { kind: 'fixed', origin: 'agent' });
  });

  it('PMO-003: a trip file made the picture is an attachment', async () => {
    await mcp.setPlaceImageFromFile({ tripId: 1, placeId: 8, fileId: 4 }, ctx);
    expect(origins.record).toHaveBeenCalledWith(8, BEFORE, { kind: 'fixed', origin: 'attachment', field: 'image' });
  });

  it('PMO-004: a bulk update records every place it changed as the agent', async () => {
    await mcp.bulkUpdatePlaces({ tripId: 1, placeIds: [8, 9], website: 'https://all.example' }, ctx);
    expect(origins.valuesBefore).toHaveBeenCalledTimes(2);
    expect(origins.record).toHaveBeenCalledWith(9, BEFORE, { kind: 'fixed', origin: 'agent' });
  });

  it('PMO-005: an imported GPX is the import', async () => {
    await mcp.importGpx(
      { tripId: 1, gpx: '<gpx/>', name: 'Track', importTracks: true, importRoutes: false, importWaypoints: true },
      ctx,
    );
    expect(origins.recordImported).toHaveBeenCalledWith([31, 32]);
  });

  it('PMO-006: no access, no permission: nothing is recorded', async () => {
    guards.hasTripPermission.mockResolvedValueOnce(false);
    await mcp.createPlace({ tripId: 1, name: 'Café' }, ctx);
    expect(origins.record).not.toHaveBeenCalled();
  });
});
