import { GoogleRouteService } from '../../../src/nest/roadtrip/google-route.service';
import { safeFetchFollow } from '../../../src/utils/ssrfGuard';
import { createTestUnitOfWork } from '../../helpers/test-uow';

import Database from 'better-sqlite3';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/utils/ssrfGuard', () => ({ safeFetchFollow: vi.fn() }));

/** The stub db is a bare object, so the UnitOfWork rides its own handle; nothing
 *  in this suite opens a real transaction. */
const routeTestDb = new Database(':memory:');

async function setup() {
  const maps = { geocodeQuery: vi.fn(), reverseGeocode: vi.fn().mockResolvedValue({ name: null, address: null }) };
  const tripsRepo = { findAccessible: vi.fn(async () => ({ user_id: 7 })) };
  const usersRepo = { getRole: vi.fn(async () => 'user') };
  const places = { create: vi.fn((_trip: string, stop: { name: string }) => ({ id: stop.name })), broadcast: vi.fn() };
  const assignments = {
    dayExists: vi.fn(() => true),
    createAssignment: vi.fn((dayId: number, placeId: string) => ({ dayId, placeId })),
    broadcast: vi.fn(),
    reconcile: vi.fn(),
  };
  const permissions = { checkPermission: vi.fn(() => true) };
  const service = new GoogleRouteService(
    maps as never,
    places as never,
    assignments as never,
    permissions as never,
    await createTestUnitOfWork(routeTestDb),
    tripsRepo as never,
    usersRepo as never,
  );
  return { service, maps, tripsRepo, usersRepo, places, assignments, permissions };
}

const input = {
  dayId: 3,
  stops: [
    { name: 'Munich', lat: 48, lng: 11 },
    { name: 'Rome', lat: 41, lng: 12 },
  ],
};

describe('Google route import', () => {
  it('reads coordinates in route order without geocoding or writing', async () => {
    const { service, maps, places } = await setup();
    const preview = await service.preview(
      'https://www.google.com/maps/dir/?api=1&origin=48,11&destination=41,12&waypoints=47,11',
    );
    expect(preview.stops.map((stop) => stop.lat)).toEqual([48, 47, 41]);
    expect(maps.geocodeQuery).not.toHaveBeenCalled();
    expect(places.create).not.toHaveBeenCalled();
  });

  it('keeps unresolved and dynamic locations visible in their original position', async () => {
    const { service, maps } = await setup();
    maps.geocodeQuery.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ lat: 41, lng: 12 });
    const preview = await service.preview('https://www.google.com/maps/dir/Your+location/Munich/Rome');
    expect(preview.stops).toEqual([
      { name: 'Your location', lat: null, lng: null },
      { name: 'Munich', lat: null, lng: null },
      { name: 'Rome', lat: 41, lng: 12 },
    ]);
    expect(maps.geocodeQuery.mock.calls).toEqual([['Munich'], ['Rome']]);
  });

  it('names coordinate stops without moving their supplied positions', async () => {
    const { service, maps } = await setup();
    maps.reverseGeocode
      .mockResolvedValueOnce({ name: 'Munich', address: 'Munich' })
      .mockRejectedValueOnce(new Error('unavailable'));
    const preview = await service.preview('https://google.com/maps/dir/48,11/41,12');
    expect(preview.stops).toEqual([
      { name: 'Munich', lat: 48, lng: 11 },
      { name: '41, 12', lat: 41, lng: 12 },
    ]);
    expect(maps.reverseGeocode).toHaveBeenCalledWith('48', '11', undefined, {
      lane: 'background',
      timeoutMs: 5000,
      locality: true,
    });
  });

  it('rejects unrelated URLs and oversized routes without fetching or truncating', async () => {
    const { service, maps } = await setup();
    for (const url of [
      'https://example.com/maps/dir/A/B',
      'http://google.com/maps/dir/A/B',
      'https://user:pass@google.com/maps/dir/A/B',
      'https://google.com/search?q=A',
    ]) {
      await expect(service.preview(url)).rejects.toThrow('Http Exception');
    }
    await expect(
      service.preview(`https://google.com/maps/dir/${Array.from({ length: 31 }, (_, i) => `A${i}`).join('/')}`),
    ).rejects.toThrow();
    expect(maps.geocodeQuery).not.toHaveBeenCalled();
  });

  it('resolves short links through the safe fetcher and checks the destination', async () => {
    const { service } = await setup();
    const cancel = vi.fn();
    vi.mocked(safeFetchFollow).mockResolvedValueOnce({
      url: 'https://google.com/maps/dir/48,11/41,12',
      body: { cancel },
    } as never);
    expect((await service.preview('https://maps.app.goo.gl/example')).stops).toHaveLength(2);
    expect(cancel).toHaveBeenCalled();
    vi.mocked(safeFetchFollow).mockResolvedValueOnce({ url: 'https://example.com/maps/dir/A/B', body: null } as never);
    await expect(service.preview('https://maps.app.goo.gl/example')).rejects.toThrow();
  });

  it('checks membership, both editing permissions and the target day before writing', async () => {
    const { service, tripsRepo, permissions, assignments, places } = await setup();
    tripsRepo.findAccessible.mockResolvedValueOnce(undefined as never);
    await expect(service.import(1, 7, input)).rejects.toThrow();
    permissions.checkPermission.mockReturnValueOnce(false);
    await expect(service.import(1, 7, input)).rejects.toThrow();
    assignments.dayExists.mockReturnValueOnce(false);
    await expect(service.import(1, 7, input)).rejects.toThrow();
    expect(places.create).not.toHaveBeenCalled();
    expect(assignments.dayExists).toHaveBeenCalledWith('3', '1');
  });

  it('appends stops in order with car transport and broadcasts after saving', async () => {
    const { service, places, assignments, permissions } = await setup();
    expect(await service.import(1, 7, input)).toEqual({ imported: 2 });
    expect(places.create.mock.calls.map((call) => call[1].name)).toEqual(['Munich', 'Rome']);
    expect(places.create).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ transport_mode: 'car', duration_minutes: 0 }),
    );
    expect(assignments.createAssignment.mock.calls).toEqual([
      [3, 'Munich'],
      [3, 'Rome'],
    ]);
    expect(permissions.checkPermission).toHaveBeenCalledWith('day_edit', 'user', 7, 7, false);
    expect(assignments.reconcile).toHaveBeenCalledWith(1, undefined);
  });

  it('rolls back every created stop when any assignment fails and sends no events', async () => {
    // The write goes through this.uow.transactional now, not db.transaction, and
    // the UnitOfWork MikroORM binds in setup() shares routeTestDb's connection —
    // so a raw statement against that same handle is what proves the rollback.
    const { service, places, assignments } = await setup();
    routeTestDb.exec('CREATE TABLE stops (name TEXT)');
    places.create.mockImplementation((_trip, stop) => {
      routeTestDb.prepare('INSERT INTO stops VALUES (?)').run(stop.name);
      return { id: stop.name };
    });
    assignments.createAssignment
      .mockImplementationOnce(() => ({ dayId: 3, placeId: 'Munich' }))
      .mockImplementationOnce(() => {
        throw new Error('write failed');
      });
    try {
      await expect(service.import(1, 7, input)).rejects.toThrow('write failed');
      expect(routeTestDb.prepare('SELECT * FROM stops').all()).toEqual([]);
      expect(places.broadcast).not.toHaveBeenCalled();
      expect(assignments.broadcast).not.toHaveBeenCalled();
    } finally {
      routeTestDb.exec('DROP TABLE stops');
    }
  });
});
