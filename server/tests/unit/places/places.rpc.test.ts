/**
 * The place plugin surface after it moved onto @PluginMethod.
 *
 * The delete path carries an ordering constraint that is easy to lose in a move and
 * silent when broken, so it gets its own cases: the journey hook has to run BEFORE
 * the row is deleted, and the id has to be scoped to the trip before the hook runs
 * at all.
 */
import { describe, it, expect, vi } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { PlacesRpc } from '../../../src/nest/places/places.rpc';
import { PlacesModule } from '../../../src/nest/places/places.module';
import type { PlacesService } from '../../../src/nest/places/places.service';
import type { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });

/**
 * Trip 1 belongs to user 42; place 7 sits on it.
 *
 * The doubles keep their vi.fn types here and only wear the service type at the
 * constructor. Stamping the service type onto the object itself puts the real method
 * signature in front of the mock, and the cases below read .mock off these methods.
 */
function build(opts: { canEdit?: boolean; journeyThrows?: boolean } = {}) {
  // update/remove are async in production (they may delete a storage object), so the
  // doubles return promises: an un-awaited call in the RPC handler would compare a
  // Promise against null/false instead of the resolved value, and these mocks pin
  // that regression down rather than papering over it with a synchronous return.
  const places = {
    create: vi.fn((_t: string, i: Record<string, unknown>) => ({ id: 10, ...i })),
    update: vi.fn((_t: string, id: string) => Promise.resolve(id === '7' ? { id: 7, name: 'updated' } : null)),
    get: vi.fn((_t: string, id: string) => (id === '7' ? { id: 7 } : undefined)),
    remove: vi.fn((_t: string, id: string) => Promise.resolve(id === '7')),
    linkedExpenseIds: vi.fn(() => []),
  };
  const journey = {
    onPlaceCreated: vi.fn(() => { if (opts.journeyThrows) throw new Error('journey down'); }),
    onPlaceUpdated: vi.fn(() => { if (opts.journeyThrows) throw new Error('journey down'); }),
    onPlaceDeleted: vi.fn(() => { if (opts.journeyThrows) throw new Error('journey down'); }),
  };
  const realtime = { broadcast: vi.fn() };
  const guards = new PluginGuards(
    {
      canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined)),
      prepare: vi.fn(() => ({ get: () => ({ role: 'user' }) })),
    } as unknown as DatabaseService,
    { checkPermission: vi.fn(() => opts.canEdit ?? true) } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
  );
  // Each double covers only the methods PlacesRpc reaches for, hence the cast.
  const rpc = new PlacesRpc(
    places as unknown as PlacesService,
    journey as unknown as JourneyDomainService,
    realtime as unknown as RealtimeService,
    guards,
  );
  const host = (...grants: string[]) => new PluginRpcHost('p', new Set(grants), makeDeps(), createTestPluginRegistry([rpc]));
  return { places, journey, realtime, host };
}

describe('PlacesRpc', () => {
  it('PLACES-RPC-001 writes need the grant, the edit right and a bound user', async () => {
    const f = build();
    const host = f.host('db:write:places');
    expect((await host.dispatch(req('places.create', { tripId: 1, input: { name: 'Shrine' } }), 42)).ok).toBe(true);
    expect(((await host.dispatch(req('places.create', { tripId: 2, input: { name: 'x' } }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    const noUser = (await host.dispatch(req('places.create', { tripId: 1, input: { name: 'x' } }), undefined)) as RpcError;
    expect(noUser.error.message).toBe('place writes require an authenticated user context');
    const denied = (await f.host().dispatch(req('places.create', { tripId: 1, input: { name: 'x' } }), 42)) as RpcError;
    expect(denied.error.code).toBe('PERMISSION_DENIED');
  });

  it('PLACES-RPC-002 an invalid place is BAD_PARAMS with the schema message', async () => {
    const f = build();
    const res = (await f.host('db:write:places').dispatch(req('places.create', { tripId: 1, input: {} }), 42)) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    expect(res.error.message).toMatch(/^invalid place: /);
  });

  it('PLACES-RPC-003 an oversized field is capped like the REST controller caps it', async () => {
    const f = build();
    const res = (await f.host('db:write:places').dispatch(
      req('places.create', { tripId: 1, input: { name: 'x'.repeat(201) } }), 42,
    )) as RpcError;
    expect(res.error.message).toBe('name must be 200 characters or fewer');
    expect(f.places.create).not.toHaveBeenCalled();
  });

  it('PLACES-RPC-004 a place on another trip is refused, naming it', async () => {
    const f = build();
    const host = f.host('db:write:places');
    expect(((await host.dispatch(req('places.update', { tripId: 1, placeId: 404, input: { name: 'x' } }), 42)) as RpcError).error.message)
      .toBe('no place 404 on trip 1');
    expect(((await host.dispatch(req('places.delete', { tripId: 1, placeId: 404 }), 42)) as RpcError).error.message)
      .toBe('no place 404 on trip 1');
  });

  it('PLACES-RPC-005 delete runs the journey hook BEFORE the row goes', async () => {
    const f = build();
    await f.host('db:write:places').dispatch(req('places.delete', { tripId: 1, placeId: 7 }), 42);
    // journey_entries.source_place_id is ON DELETE SET NULL. Run the hook afterwards
    // and it finds nothing left to detach, leaving the entries as orphans.
    expect(f.journey.onPlaceDeleted.mock.invocationCallOrder[0]).toBeLessThan(f.places.remove.mock.invocationCallOrder[0]);
  });

  it('PLACES-RPC-006 a foreign place id never reaches the journey hook', async () => {
    const f = build();
    await f.host('db:write:places').dispatch(req('places.delete', { tripId: 1, placeId: 404 }), 42);
    // The hook keys on the place alone, so an unscoped id would detach ANOTHER
    // trip's journey entries even though the delete itself is refused.
    expect(f.journey.onPlaceDeleted).not.toHaveBeenCalled();
  });

  it('PLACES-RPC-007 a broken journey link never fails a write that already succeeded', async () => {
    const f = build({ journeyThrows: true });
    const host = f.host('db:write:places');
    expect((await host.dispatch(req('places.create', { tripId: 1, input: { name: 'Shrine' } }), 42)).ok).toBe(true);
    expect((await host.dispatch(req('places.update', { tripId: 1, placeId: 7, input: { name: 'x' } }), 42)).ok).toBe(true);
    expect((await host.dispatch(req('places.delete', { tripId: 1, placeId: 7 }), 42)).ok).toBe(true);
  });

  it('PLACES-RPC-008 every write broadcasts its event, a refused one broadcasts nothing', async () => {
    const f = build();
    const host = f.host('db:write:places');
    await host.dispatch(req('places.create', { tripId: 1, input: { name: 'Shrine' } }), 42);
    await host.dispatch(req('places.update', { tripId: 1, placeId: 7, input: { name: 'x' } }), 42);
    await host.dispatch(req('places.delete', { tripId: 1, placeId: 7 }), 42);
    expect(f.realtime.broadcast.mock.calls.map((c) => c[1])).toEqual(['place:created', 'place:updated', 'place:deleted']);
    f.realtime.broadcast.mockClear();
    await host.dispatch(req('places.delete', { tripId: 1, placeId: 404 }), 42);
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('PLACES-RPC-009 without the edit right nothing is written', async () => {
    const f = build({ canEdit: false });
    const res = (await f.host('db:write:places').dispatch(req('places.create', { tripId: 1, input: { name: 'x' } }), 42)) as RpcError;
    expect(res.error.message).toBe('no permission to edit trip 1');
    expect(f.places.create).not.toHaveBeenCalled();
  });

  it('PLACES-RPC-010 the class is listed in its module providers', () => {
    expectRegisteredProvider(PlacesModule, PlacesRpc);
  });

  it('PLACES-RPC-011 an update broadcasts the resolved place, not the pending promise', async () => {
    const f = build();
    const host = f.host('db:write:places');
    const res = await host.dispatch(req('places.update', { tripId: 1, placeId: 7, input: { name: 'x' } }), 42);
    expect(res.ok).toBe(true);
    expect((res as { result: unknown }).result).toEqual({ id: 7, name: 'updated' });
    // Not a Promise instance and not [object Promise] — the broadcast payload is the
    // awaited place, exactly what a client-side listener would expect to render.
    expect(f.realtime.broadcast).toHaveBeenCalledWith(1, 'place:updated', { place: { id: 7, name: 'updated' } });
  });

  it('PLACES-RPC-012 a delete that the service refuses is ForbiddenResource, not {deleted: true}', async () => {
    const f = build();
    // place.get finds it (it exists), but the actual delete comes back false — the
    // race the null/false-vs-Promise bug used to paper over by always being truthy.
    f.places.remove.mockImplementationOnce(() => Promise.resolve(false));
    const res = (await f.host('db:write:places').dispatch(req('places.delete', { tripId: 1, placeId: 7 }), 42)) as RpcError;
    expect(res.ok).toBe(false);
    expect(res.error.code).toBe('RESOURCE_FORBIDDEN');
    expect(res.error.message).toBe('no place 7 on trip 1');
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });
});
