import { describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { GoogleRouteService } from '../../../src/nest/roadtrip/google-route.service';
import { safeFetchFollow } from '../../../src/utils/ssrfGuard';

vi.mock('../../../src/utils/ssrfGuard', () => ({ safeFetchFollow: vi.fn() }));

function setup() {
  const maps = { geocodeQuery: vi.fn(), reverseGeocode: vi.fn().mockResolvedValue({ name: null, address: null }) };
  const db = { canAccessTrip: vi.fn(() => ({ user_id: 7 })), get: () => ({ role: 'user' }), transaction: <T>(fn: () => T) => fn() };
  const places = { create: vi.fn((_trip: string, stop: { name: string }) => ({ id: stop.name })), broadcast: vi.fn() };
  const assignments = { dayExists: vi.fn(() => true), createAssignment: vi.fn((dayId: number, placeId: string) => ({ dayId, placeId })), broadcast: vi.fn(), reconcile: vi.fn() };
  const permissions = { checkPermission: vi.fn(() => true) };
  const service = new GoogleRouteService(maps as never, db as never, places as never, assignments as never, permissions as never);
  return { service, maps, db, places, assignments, permissions };
}

const input = { dayId: 3, stops: [{ name: 'Munich', lat: 48, lng: 11 }, { name: 'Rome', lat: 41, lng: 12 }] };

describe('Google route import', () => {
  it('reads coordinates in route order without geocoding or writing', async () => {
    const { service, maps, places } = setup();
    const preview = await service.preview('https://www.google.com/maps/dir/?api=1&origin=48,11&destination=41,12&waypoints=47,11');
    expect(preview.stops.map(stop => stop.lat)).toEqual([48, 47, 41]);
    expect(maps.geocodeQuery).not.toHaveBeenCalled();
    expect(places.create).not.toHaveBeenCalled();
  });

  it('keeps unresolved and dynamic locations visible in their original position', async () => {
    const { service, maps } = setup();
    maps.geocodeQuery.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ lat: 41, lng: 12 });
    const preview = await service.preview('https://www.google.com/maps/dir/Your+location/Munich/Rome');
    expect(preview.stops).toEqual([{ name: 'Your location', lat: null, lng: null }, { name: 'Munich', lat: null, lng: null }, { name: 'Rome', lat: 41, lng: 12 }]);
    expect(maps.geocodeQuery.mock.calls).toEqual([['Munich'], ['Rome']]);
  });

  it('names coordinate stops without moving their supplied positions', async () => {
    const { service, maps } = setup();
    maps.reverseGeocode.mockResolvedValueOnce({ name: 'Munich', address: 'Munich' }).mockRejectedValueOnce(new Error('unavailable'));
    const preview = await service.preview('https://google.com/maps/dir/48,11/41,12');
    expect(preview.stops).toEqual([{ name: 'Munich', lat: 48, lng: 11 }, { name: '41, 12', lat: 41, lng: 12 }]);
    expect(maps.reverseGeocode).toHaveBeenCalledWith('48', '11', undefined, { lane: 'background', timeoutMs: 5000, locality: true });
  });

  it('rejects unrelated URLs and oversized routes without fetching or truncating', async () => {
    const { service, maps } = setup();
    for (const url of ['https://example.com/maps/dir/A/B', 'http://google.com/maps/dir/A/B', 'https://user:pass@google.com/maps/dir/A/B', 'https://google.com/search?q=A']) {
      await expect(service.preview(url)).rejects.toThrow('Http Exception');
    }
    await expect(service.preview(`https://google.com/maps/dir/${Array.from({ length: 31 }, (_, i) => `A${i}`).join('/')}`)).rejects.toThrow();
    expect(maps.geocodeQuery).not.toHaveBeenCalled();
  });

  it('resolves short links through the safe fetcher and checks the destination', async () => {
    const { service } = setup();
    const cancel = vi.fn();
    vi.mocked(safeFetchFollow).mockResolvedValueOnce({ url: 'https://google.com/maps/dir/48,11/41,12', body: { cancel } } as never);
    expect((await service.preview('https://maps.app.goo.gl/example')).stops).toHaveLength(2);
    expect(cancel).toHaveBeenCalled();
    vi.mocked(safeFetchFollow).mockResolvedValueOnce({ url: 'https://example.com/maps/dir/A/B', body: null } as never);
    await expect(service.preview('https://maps.app.goo.gl/example')).rejects.toThrow();
  });

  it('checks membership, both editing permissions and the target day before writing', () => {
    const { service, db, permissions, assignments, places } = setup();
    db.canAccessTrip.mockReturnValueOnce(null as never);
    expect(() => service.import(1, 7, input)).toThrow();
    permissions.checkPermission.mockReturnValueOnce(false);
    expect(() => service.import(1, 7, input)).toThrow();
    assignments.dayExists.mockReturnValueOnce(false);
    expect(() => service.import(1, 7, input)).toThrow();
    expect(places.create).not.toHaveBeenCalled();
    expect(assignments.dayExists).toHaveBeenCalledWith('3', '1');
  });

  it('appends stops in order with car transport and broadcasts after saving', () => {
    const { service, places, assignments, permissions } = setup();
    expect(service.import(1, 7, input)).toEqual({ imported: 2 });
    expect(places.create.mock.calls.map(call => call[1].name)).toEqual(['Munich', 'Rome']);
    expect(places.create).toHaveBeenCalledWith('1', expect.objectContaining({ transport_mode: 'car', duration_minutes: 0 }));
    expect(assignments.createAssignment.mock.calls).toEqual([[3, 'Munich'], [3, 'Rome']]);
    expect(permissions.checkPermission).toHaveBeenCalledWith('day_edit', 'user', 7, 7, false);
    expect(assignments.reconcile).toHaveBeenCalledWith(1, undefined);
  });

  it('rolls back every created stop when any assignment fails and sends no events', () => {
    const { service, db, places, assignments } = setup();
    const sqlite = new Database(':memory:');
    sqlite.exec('CREATE TABLE stops (name TEXT)');
    db.transaction = fn => sqlite.transaction(fn)();
    places.create.mockImplementation((_trip, stop) => {
      sqlite.prepare('INSERT INTO stops VALUES (?)').run(stop.name);
      return { id: stop.name };
    });
    assignments.createAssignment.mockImplementationOnce(() => ({ dayId: 3, placeId: 'Munich' })).mockImplementationOnce(() => { throw new Error('write failed'); });
    try {
      expect(() => service.import(1, 7, input)).toThrow('write failed');
      expect(sqlite.prepare('SELECT * FROM stops').all()).toEqual([]);
      expect(places.broadcast).not.toHaveBeenCalled();
      expect(assignments.broadcast).not.toHaveBeenCalled();
    } finally { sqlite.close(); }
  });
});
