import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { HttpException } from '@nestjs/common';
import { PlacesController } from '../../../src/nest/places/places.controller';
import type { PlacesService } from '../../../src/nest/places/places.service';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const trip = { user_id: 1 };

function svc(o: Partial<PlacesService> = {}): PlacesService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue(trip), canEdit: vi.fn().mockReturnValue(true), broadcast: vi.fn(),
    onCreated: vi.fn(), onUpdated: vi.fn(), onDeleted: vi.fn(),
    // Trip-scoping reads the delete paths run before firing the journey hook
    // (#1745); default to "everything belongs to the trip".
    get: vi.fn().mockReturnValue({ id: 9 }), scopedIds: vi.fn((_t: string, ids: number[]) => ids),
    ...o,
  } as unknown as PlacesService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}
async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try { await fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

describe('PlacesController (parity with the legacy /api/trips/:tripId/places route)', () => {
  // The trip 404 for this handler is TripAccessGuard's now (see
  // trip-access.guard.test.ts and the places e2e), so it is no longer reachable
  // by calling the method directly.
  it('GET / lists with filters', () => {
    const list = vi.fn().mockReturnValue([{ id: 1 }]);
    expect(new PlacesController(svc({ list } as Partial<PlacesService>), new RuntimeEnvService()).list(user, '5', 'beach', 'cat', 'tag')).toEqual({ places: [{ id: 1 }] });
    expect(list).toHaveBeenCalledWith('5', { search: 'beach', category: 'cat', tag: 'tag' });
  });

  describe('POST / (create)', () => {
    it('400 on an over-long name (length guard before permission)', () => {
      const canEdit = vi.fn().mockReturnValue(false); // would 403 if reached
      expect(thrown(() => new PlacesController(svc({ canEdit }), new RuntimeEnvService()).create(user, '5', { name: 'x'.repeat(201) }))).toEqual({
        status: 400, body: { error: 'name must be 200 characters or less' },
      });
      expect(canEdit).not.toHaveBeenCalled();
    });

    // The legacy 'Place name is required' 400 is gone: placeCreateRequestSchema
    // pins `name`, so the ZodValidationPipe rejects a nameless body before the
    // handler runs (see the e2e suite for the envelope it produces).
    it('403 without place_edit, then creates + hooks', () => {
      expect(thrown(() => new PlacesController(svc({ canEdit: vi.fn().mockReturnValue(false) }), new RuntimeEnvService()).create(user, '5', { name: 'Spot' }))).toEqual({ status: 403, body: { error: 'No permission' } });
      const create = vi.fn().mockReturnValue({ id: 9 }); const broadcast = vi.fn(); const onCreated = vi.fn();
      const s = svc({ create, broadcast, onCreated } as Partial<PlacesService>);
      expect(new PlacesController(s, new RuntimeEnvService()).create(user, '5', { name: 'Spot' }, 'sock')).toEqual({ place: { id: 9 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'place:created', { place: { id: 9 } }, 'sock');
      expect(onCreated).toHaveBeenCalledWith('5', 9);
    });
  });

  describe('POST /import/gpx', () => {
    const file = { buffer: Buffer.from('gpx'), originalname: 'r.gpx' } as Express.Multer.File;
    it('400 without a file', () => {
      expect(thrown(() => new PlacesController(svc(), new RuntimeEnvService()).importGpx(user, '5', undefined, {}))).toEqual({ status: 400, body: { error: 'No file uploaded' } });
    });
    it('400 when all import types are disabled', () => {
      expect(thrown(() => new PlacesController(svc(), new RuntimeEnvService()).importGpx(user, '5', file, { importWaypoints: 'false', importRoutes: 'false', importTracks: 'false' }))).toEqual({
        status: 400, body: { error: 'No import types selected' },
      });
    });
    it('400 when the GPX yields nothing', () => {
      expect(thrown(() => new PlacesController(svc({ importGpx: vi.fn().mockReturnValue(null) } as Partial<PlacesService>), new RuntimeEnvService()).importGpx(user, '5', file, {}))).toEqual({
        status: 400, body: { error: 'No matching places found in GPX file' },
      });
    });
    it('imports and broadcasts per place', () => {
      const broadcast = vi.fn();
      const s = svc({ importGpx: vi.fn().mockReturnValue({ places: [{ id: 1 }, { id: 2 }], count: 2, skipped: 0 }), broadcast } as Partial<PlacesService>);
      expect(new PlacesController(s, new RuntimeEnvService()).importGpx(user, '5', file, {}, 'sock')).toEqual({ places: [{ id: 1 }, { id: 2 }], count: 2, skipped: 0 });
      expect(broadcast).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /import/map', () => {
    const file = { buffer: Buffer.from('<kml/>'), originalname: 'm.kml' } as Express.Multer.File;
    it('400 without a file', async () => {
      expect(await thrownAsync(() => new PlacesController(svc(), new RuntimeEnvService()).importMap(user, '5', undefined, {}))).toEqual({ status: 400, body: { error: 'No file uploaded' } });
    });
    it('403 without place_edit (permission runs before the file check)', async () => {
      const importMapFile = vi.fn();
      const s = svc({ canEdit: vi.fn().mockReturnValue(false), importMapFile } as Partial<PlacesService>);
      expect(await thrownAsync(() => new PlacesController(s, new RuntimeEnvService()).importMap(user, '5', file, {}))).toEqual({ status: 403, body: { error: 'No permission' } });
      expect(importMapFile).not.toHaveBeenCalled();
    });
    it('400 when both import types are disabled', async () => {
      expect(await thrownAsync(() => new PlacesController(svc(), new RuntimeEnvService()).importMap(user, '5', file, { importPoints: 'false', importPaths: 'false' }))).toEqual({
        status: 400, body: { error: 'No import types selected' },
      });
    });
    it('400 when the map file has no Placemarks (and carries the summary through)', async () => {
      const summary = { totalPlacemarks: 0 };
      const s = svc({ importMapFile: vi.fn().mockResolvedValue({ places: [], summary }) } as Partial<PlacesService>);
      expect(await thrownAsync(() => new PlacesController(s, new RuntimeEnvService()).importMap(user, '5', file, {}))).toEqual({
        status: 400, body: { error: 'No valid Placemarks found in map file', summary },
      });
    });
    it('imports, broadcasts per place + returns the service result', async () => {
      const broadcast = vi.fn();
      const result = { places: [{ id: 1 }, { id: 2 }], summary: { totalPlacemarks: 2 }, count: 2 };
      const s = svc({ importMapFile: vi.fn().mockResolvedValue(result), broadcast } as Partial<PlacesService>);
      expect(await new PlacesController(s, new RuntimeEnvService()).importMap(user, '5', file, {}, 'sock')).toEqual(result);
      expect(broadcast).toHaveBeenCalledTimes(2);
      expect(broadcast).toHaveBeenCalledWith('5', 'place:created', { place: { id: 1 } }, 'sock');
    });
    it('passes a missing summary through (no zero-placemark guard) and still imports', async () => {
      const result = { places: [{ id: 7 }] };
      const s = svc({ importMapFile: vi.fn().mockResolvedValue(result), broadcast: vi.fn() } as Partial<PlacesService>);
      expect(await new PlacesController(s, new RuntimeEnvService()).importMap(user, '5', file, {})).toEqual(result);
    });
    it('wraps a thrown Error from the service in a 400 with its message', async () => {
      const s = svc({ importMapFile: vi.fn().mockRejectedValue(new Error('bad kml')) } as Partial<PlacesService>);
      expect(await thrownAsync(() => new PlacesController(s, new RuntimeEnvService()).importMap(user, '5', file, {}))).toEqual({ status: 400, body: { error: 'bad kml' } });
    });
    it('falls back to a generic 400 message for a non-Error rejection', async () => {
      const s = svc({ importMapFile: vi.fn().mockRejectedValue('boom') } as Partial<PlacesService>);
      expect(await thrownAsync(() => new PlacesController(s, new RuntimeEnvService()).importMap(user, '5', file, {}))).toEqual({ status: 400, body: { error: 'Failed to import map file' } });
    });
    it('re-throws an HttpException raised inside the try untouched', async () => {
      const s = svc({ importMapFile: vi.fn().mockRejectedValue(new HttpException({ error: 'teapot' }, 418)) } as Partial<PlacesService>);
      expect(await thrownAsync(() => new PlacesController(s, new RuntimeEnvService()).importMap(user, '5', file, {}))).toEqual({ status: 418, body: { error: 'teapot' } });
    });
  });

  describe('POST /import/google-list + naver-list', () => {
    // The legacy 'URL is required' 400 is gone: placeImportListRequestSchema
    // pins `url`, so the ZodValidationPipe rejects a urlless body before the
    // handler runs.
    it('maps a service { error, status } to the same response', async () => {
      const s = svc({ importGoogleList: vi.fn().mockResolvedValue({ error: 'List is empty', status: 400 }) } as Partial<PlacesService>);
      expect(await thrownAsync(() => new PlacesController(s, new RuntimeEnvService()).importGoogle(user, '5', { url: 'http://x' }))).toEqual({ status: 400, body: { error: 'List is empty' } });
    });
    it('imports a naver list and returns the count + listName', async () => {
      const s = svc({ importNaverList: vi.fn().mockResolvedValue({ places: [{ id: 1 }], listName: 'Trip', skipped: 2 }), broadcast: vi.fn() } as Partial<PlacesService>);
      expect(await new PlacesController(s, new RuntimeEnvService()).importNaver(user, '5', { url: 'http://x' })).toEqual({ places: [{ id: 1 }], count: 1, listName: 'Trip', skipped: 2 });
    });
    it('forwards the enrich flag + userId and broadcasts each imported place', async () => {
      const importGoogleList = vi.fn().mockResolvedValue({ places: [{ id: 1 }, { id: 2 }], listName: 'L', skipped: 0 });
      const broadcast = vi.fn();
      const s = svc({ importGoogleList, broadcast } as Partial<PlacesService>);
      expect(await new PlacesController(s, new RuntimeEnvService()).importGoogle(user, '5', { url: 'http://x', enrich: true }, 'sock')).toEqual({ places: [{ id: 1 }, { id: 2 }], count: 2, listName: 'L', skipped: 0 });
      expect(importGoogleList).toHaveBeenCalledWith('5', 'http://x', { enrich: true, userId: 1 });
      expect(broadcast).toHaveBeenCalledTimes(2);
    });
    it('wraps a thrown Error in the provider-specific 400 (Google)', async () => {
      const s = svc({ importGoogleList: vi.fn().mockRejectedValue(new Error('network down')) } as Partial<PlacesService>);
      expect(await thrownAsync(() => new PlacesController(s, new RuntimeEnvService()).importGoogle(user, '5', { url: 'http://x' }))).toEqual({
        status: 400, body: { error: 'Failed to import Google Maps list. Make sure the list is shared publicly.' },
      });
    });
    it('wraps a non-Error rejection in the provider-specific 400 (Naver)', async () => {
      const s = svc({ importNaverList: vi.fn().mockRejectedValue('weird') } as Partial<PlacesService>);
      expect(await thrownAsync(() => new PlacesController(s, new RuntimeEnvService()).importNaver(user, '5', { url: 'http://x' }))).toEqual({
        status: 400, body: { error: 'Failed to import Naver Maps list. Make sure the list is shared publicly.' },
      });
    });
  });

  describe('POST /bulk-delete', () => {
    // The legacy 'ids must be an array of numbers' 400 is gone:
    // placeBulkDeleteRequestSchema types the array, so the pipe rejects a bad
    // element before the handler runs.
    it('returns empty for an empty list without touching the service', () => {
      const removeMany = vi.fn();
      expect(new PlacesController(svc({ removeMany } as Partial<PlacesService>), new RuntimeEnvService()).bulkDelete(user, '5', { ids: [] })).toEqual({ deleted: [], count: 0 });
      expect(removeMany).not.toHaveBeenCalled();
    });
    it('deletes, fires hooks + broadcasts per deleted id', () => {
      const removeMany = vi.fn().mockReturnValue([1, 2]); const onDeleted = vi.fn(); const broadcast = vi.fn();
      const scopedIds = vi.fn().mockReturnValue([1, 2]);
      const s = svc({ removeMany, onDeleted, broadcast, scopedIds } as Partial<PlacesService>);
      expect(new PlacesController(s, new RuntimeEnvService()).bulkDelete(user, '5', { ids: [1, 2] }, 'sock')).toEqual({ deleted: [1, 2], count: 2 });
      expect(onDeleted).toHaveBeenCalledTimes(2);
      expect(broadcast).toHaveBeenCalledTimes(2);
    });

    // #1745: the hook keys on the place id alone, so an id from another trip
    // would detach that trip's journey entries even though removeMany skips it.
    it('fires the journey hook only for ids that belong to the trip, ahead of the delete', () => {
      const removeMany = vi.fn().mockReturnValue([1]);
      const scopedIds = vi.fn().mockReturnValue([1]);
      const onDeleted = vi.fn();
      const s = svc({ removeMany, scopedIds, onDeleted, broadcast: vi.fn() } as Partial<PlacesService>);
      new PlacesController(s, new RuntimeEnvService()).bulkDelete(user, '5', { ids: [1, 99] });
      expect(scopedIds).toHaveBeenCalledWith('5', [1, 99]);
      expect(onDeleted).toHaveBeenCalledTimes(1);
      expect(onDeleted).toHaveBeenCalledWith(1);
      expect(onDeleted.mock.invocationCallOrder[0]).toBeLessThan(removeMany.mock.invocationCallOrder[0]);
    });
  });

  describe('POST /bulk-update', () => {
    it('404 when trip not accessible, 403 without place_edit (before any write)', () => {
      expect(thrown(() => new PlacesController(svc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) }), new RuntimeEnvService()).bulkUpdate(user, '5', { ids: [1], category_id: 3 }))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(thrown(() => new PlacesController(svc({ canEdit: vi.fn().mockReturnValue(false) }), new RuntimeEnvService()).bulkUpdate(user, '5', { ids: [1], category_id: 3 }))).toEqual({ status: 403, body: { error: 'No permission' } });
    });
    // Same as bulk-delete: placeBulkUpdateRequestSchema types `ids`, so the
    // pipe owns that 400 now. `.min(1)` was deliberately left off the schema so
    // the empty-list short-circuit below stays reachable.
    it('400 when no patch field is present', () => {
      expect(thrown(() => new PlacesController(svc(), new RuntimeEnvService()).bulkUpdate(user, '5', { ids: [1] }))).toEqual({ status: 400, body: { error: 'Provide at least one field to update' } });
    });
    it('returns empty for an empty list without touching the service', () => {
      const updateMany = vi.fn();
      expect(new PlacesController(svc({ updateMany } as Partial<PlacesService>), new RuntimeEnvService()).bulkUpdate(user, '5', { ids: [] })).toEqual({ updated: [], count: 0 });
      expect(updateMany).not.toHaveBeenCalled();
    });
    it('updates, fires hooks + broadcasts per updated place', () => {
      const updateMany = vi.fn().mockReturnValue([{ id: 1 }, { id: 2 }]); const onUpdated = vi.fn(); const broadcast = vi.fn();
      const s = svc({ updateMany, onUpdated, broadcast } as Partial<PlacesService>);
      expect(new PlacesController(s, new RuntimeEnvService()).bulkUpdate(user, '5', { ids: [1, 2], category_id: 3 }, 'sock')).toEqual({ updated: [1, 2], count: 2 });
      expect(updateMany).toHaveBeenCalledWith('5', [1, 2], { category_id: 3 });
      expect(onUpdated).toHaveBeenCalledTimes(2);
      expect(broadcast).toHaveBeenCalledWith('5', 'place:updated', { place: { id: 1 } }, 'sock');
    });
    it('passes category_id: null through to clear the category', () => {
      const updateMany = vi.fn().mockReturnValue([{ id: 1 }]);
      const s = svc({ updateMany } as Partial<PlacesService>);
      expect(new PlacesController(s, new RuntimeEnvService()).bulkUpdate(user, '5', { ids: [1], category_id: null })).toEqual({ updated: [1], count: 1 });
      expect(updateMany).toHaveBeenCalledWith('5', [1], { category_id: null });
    });
  });

  it('GET /:id returns the place when found, 404 when missing', () => {
    expect(thrown(() => new PlacesController(svc({ get: vi.fn().mockReturnValue(undefined) } as Partial<PlacesService>), new RuntimeEnvService()).get(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Place not found' } });
    const s = svc({ get: vi.fn().mockReturnValue({ id: 9 }) } as Partial<PlacesService>);
    expect(new PlacesController(s, new RuntimeEnvService()).get(user, '5', '9')).toEqual({ place: { id: 9 } });
  });

  it('PUT /:id 404 when missing, else updates + hooks', () => {
    expect(thrown(() => new PlacesController(svc({ update: vi.fn().mockReturnValue(null) } as Partial<PlacesService>), new RuntimeEnvService()).update(user, '5', '9', { name: 'X' }))).toEqual({ status: 404, body: { error: 'Place not found' } });
    const update = vi.fn().mockReturnValue({ id: 9 }); const onUpdated = vi.fn(); const broadcast = vi.fn();
    const s = svc({ update, onUpdated, broadcast } as Partial<PlacesService>);
    expect(new PlacesController(s, new RuntimeEnvService()).update(user, '5', '9', { name: 'X' }, 'sock')).toEqual({ place: { id: 9 } });
    expect(onUpdated).toHaveBeenCalledWith(9);
  });

  describe('route_color (#776)', () => {
    it('400s on anything that is not a hex colour, before the permission check', () => {
      const canEdit = vi.fn().mockReturnValue(false); // would 403 if it got that far
      const err = { status: 400, body: { error: 'route_color must be a hex colour like #4f46e5' } };
      expect(thrown(() => new PlacesController(svc({ canEdit }), new RuntimeEnvService()).update(user, '5', '9', { route_color: 'red' }))).toEqual(err);
      expect(thrown(() => new PlacesController(svc({ canEdit }), new RuntimeEnvService()).update(user, '5', '9', { route_color: '#12345' }))).toEqual(err);
      expect(thrown(() => new PlacesController(svc({ canEdit }), new RuntimeEnvService()).update(user, '5', '9', { route_color: 123 }))).toEqual(err);
      expect(thrown(() => new PlacesController(svc({ canEdit }), new RuntimeEnvService()).create(user, '5', { name: 'T', route_color: 'red' }))).toEqual(err);
      expect(canEdit).not.toHaveBeenCalled();
    });

    it('passes a valid hex through, and null through as the reset to auto', () => {
      const update = vi.fn().mockReturnValue({ id: 9, route_color: '#e11d48' });
      const broadcast = vi.fn();
      const s = svc({ update, broadcast } as Partial<PlacesService>);
      expect(new PlacesController(s, new RuntimeEnvService()).update(user, '5', '9', { route_color: '#e11d48' }, 'sock'))
        .toEqual({ place: { id: 9, route_color: '#e11d48' } });
      expect(update).toHaveBeenCalledWith('5', '9', expect.objectContaining({ route_color: '#e11d48' }), undefined);
      // The colour has to reach the other members too, not just the DB.
      expect(broadcast).toHaveBeenCalledWith('5', 'place:updated', { place: { id: 9, route_color: '#e11d48' } }, 'sock');

      new PlacesController(svc({ update } as Partial<PlacesService>), new RuntimeEnvService()).update(user, '5', '9', { route_color: null });
      expect(update).toHaveBeenLastCalledWith('5', '9', expect.objectContaining({ route_color: null }), undefined);
    });

    it('accepts the short #abc form', () => {
      const update = vi.fn().mockReturnValue({ id: 9 });
      expect(new PlacesController(svc({ update } as Partial<PlacesService>), new RuntimeEnvService()).update(user, '5', '9', { route_color: '#abc' })).toEqual({ place: { id: 9 } });
    });
  });

  it('PUT /:id forwards the base-version token and 409s on a conflict (#1135)', () => {
    const update = vi.fn().mockReturnValue({ conflict: true, server: { id: 9, name: 'Theirs' } });
    const onUpdated = vi.fn(); const broadcast = vi.fn();
    const s = svc({ update, onUpdated, broadcast } as Partial<PlacesService>);
    expect(thrown(() => new PlacesController(s, new RuntimeEnvService()).update(user, '5', '9', { name: 'Mine' }, 'sock', '2026-01-01 00:00:00'))).toEqual({
      status: 409, body: { error: 'conflict', server: { id: 9, name: 'Theirs' } },
    });
    expect(update).toHaveBeenCalledWith('5', '9', expect.objectContaining({ name: 'Mine' }), '2026-01-01 00:00:00');
    expect(broadcast).not.toHaveBeenCalled();
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it('DELETE /:id fires the hook then 404 / success', () => {
    const onDeleted = vi.fn();
    const remove = vi.fn().mockReturnValue(false);
    expect(thrown(() => new PlacesController(svc({ remove, onDeleted } as Partial<PlacesService>), new RuntimeEnvService()).remove(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Place not found' } });
    expect(onDeleted).toHaveBeenCalledWith(9);
    expect(onDeleted.mock.invocationCallOrder[0]).toBeLessThan(remove.mock.invocationCallOrder[0]);
    const s = svc({ remove: vi.fn().mockReturnValue(true), broadcast: vi.fn() } as Partial<PlacesService>);
    expect(new PlacesController(s, new RuntimeEnvService()).remove(user, '5', '9')).toEqual({ success: true });
  });

  // #1745: a place on another trip must 404 without the hook ever running —
  // onPlaceDeleted keys on the place id alone, so it would detach that trip's
  // journey entries.
  it('DELETE /:id 404s a foreign place before the journey hook runs', () => {
    const onDeleted = vi.fn(); const remove = vi.fn();
    const s = svc({ get: vi.fn().mockReturnValue(null), onDeleted, remove } as Partial<PlacesService>);
    expect(thrown(() => new PlacesController(s, new RuntimeEnvService()).remove(user, '5', '99'))).toEqual({ status: 404, body: { error: 'Place not found' } });
    expect(onDeleted).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('GET /:id/image maps service error + returns photos', async () => {
    const s = svc({ searchImage: vi.fn().mockResolvedValue({ photos: [{ url: 'x' }] }) } as Partial<PlacesService>);
    expect(await new PlacesController(s, new RuntimeEnvService()).image(user, '5', '9')).toEqual({ photos: [{ url: 'x' }] });
    const e = svc({ searchImage: vi.fn().mockResolvedValue({ error: 'No key', status: 400 }) } as Partial<PlacesService>);
    expect(await thrownAsync(() => new PlacesController(e, new RuntimeEnvService()).image(user, '5', '9'))).toEqual({ status: 400, body: { error: 'No key' } });
  });

  it('GET /:id/image turns an unexpected throw into a 500, but re-throws an HttpException as-is', async () => {
    const boom = svc({ searchImage: vi.fn().mockRejectedValue(new Error('Unsplash down')) } as Partial<PlacesService>);
    expect(await thrownAsync(() => new PlacesController(boom, new RuntimeEnvService()).image(user, '5', '9'))).toEqual({ status: 500, body: { error: 'Error searching for image' } });
    const http = svc({ searchImage: vi.fn().mockRejectedValue(new HttpException({ error: 'rate limited' }, 429)) } as Partial<PlacesService>);
    expect(await thrownAsync(() => new PlacesController(http, new RuntimeEnvService()).image(user, '5', '9'))).toEqual({ status: 429, body: { error: 'rate limited' } });
  });

  describe('POST /:id/image (custom place image #1136)', () => {
    const file = { filename: 'abc.jpg' } as Express.Multer.File;

    it('404 when the trip is not accessible, 403 without place_edit', () => {
      expect(thrown(() => new PlacesController(svc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) }), new RuntimeEnvService()).uploadImage(user, '5', '9', file))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(thrown(() => new PlacesController(svc({ canEdit: vi.fn().mockReturnValue(false) }), new RuntimeEnvService()).uploadImage(user, '5', '9', file))).toEqual({ status: 403, body: { error: 'No permission' } });
    });

    it('400 when no file was uploaded', () => {
      expect(thrown(() => new PlacesController(svc(), new RuntimeEnvService()).uploadImage(user, '5', '9', undefined))).toEqual({ status: 400, body: { error: 'No image uploaded' } });
    });

    it('404 when the place is missing (service returns null)', () => {
      expect(thrown(() => new PlacesController(svc({ update: vi.fn().mockReturnValue(null) } as Partial<PlacesService>), new RuntimeEnvService()).uploadImage(user, '5', '9', file))).toEqual({ status: 404, body: { error: 'Place not found' } });
    });

    it('stores the uploaded file as image_url, broadcasts + fires the update hook', () => {
      const update = vi.fn().mockReturnValue({ id: 9 }); const onUpdated = vi.fn(); const broadcast = vi.fn();
      const s = svc({ update, onUpdated, broadcast } as Partial<PlacesService>);
      expect(new PlacesController(s, new RuntimeEnvService()).uploadImage(user, '5', '9', file, 'sock')).toEqual({ place: { id: 9 } });
      expect(update).toHaveBeenCalledWith('5', '9', { image_url: '/uploads/places/abc.jpg' });
      expect(broadcast).toHaveBeenCalledWith('5', 'place:updated', { place: { id: 9 } }, 'sock');
      expect(onUpdated).toHaveBeenCalledWith(9);
    });

    it('403 in demo mode for a demo account', () => {
      const prev = process.env.DEMO_MODE;
      process.env.DEMO_MODE = 'true';
      const demo = { ...user, email: 'demo@trek.app' } as User;
      try {
        expect(thrown(() => new PlacesController(svc(), new RuntimeEnvService()).uploadImage(demo, '5', '9', file))).toEqual({
          status: 403, body: { error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' },
        });
      } finally {
        if (prev === undefined) delete process.env.DEMO_MODE;
        else process.env.DEMO_MODE = prev;
      }
    });
  });
});
