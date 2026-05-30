import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  it('GET / lists with filters; 404 when trip not accessible', () => {
    expect(thrown(() => new PlacesController(svc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) })).list(user, '5'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    const list = vi.fn().mockReturnValue([{ id: 1 }]);
    expect(new PlacesController(svc({ list } as Partial<PlacesService>)).list(user, '5', 'beach', 'cat', 'tag')).toEqual({ places: [{ id: 1 }] });
    expect(list).toHaveBeenCalledWith('5', { search: 'beach', category: 'cat', tag: 'tag' });
  });

  describe('POST / (create)', () => {
    it('400 on an over-long name (length guard before permission)', () => {
      const canEdit = vi.fn().mockReturnValue(false); // would 403 if reached
      expect(thrown(() => new PlacesController(svc({ canEdit })).create(user, '5', { name: 'x'.repeat(201) }))).toEqual({
        status: 400, body: { error: 'name must be 200 characters or less' },
      });
      expect(canEdit).not.toHaveBeenCalled();
    });

    it('403 without place_edit, 400 without name, then creates + hooks', () => {
      expect(thrown(() => new PlacesController(svc({ canEdit: vi.fn().mockReturnValue(false) })).create(user, '5', { name: 'Spot' }))).toEqual({ status: 403, body: { error: 'No permission' } });
      expect(thrown(() => new PlacesController(svc()).create(user, '5', {}))).toEqual({ status: 400, body: { error: 'Place name is required' } });
      const create = vi.fn().mockReturnValue({ id: 9 }); const broadcast = vi.fn(); const onCreated = vi.fn();
      const s = svc({ create, broadcast, onCreated } as Partial<PlacesService>);
      expect(new PlacesController(s).create(user, '5', { name: 'Spot' }, 'sock')).toEqual({ place: { id: 9 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'place:created', { place: { id: 9 } }, 'sock');
      expect(onCreated).toHaveBeenCalledWith('5', 9);
    });
  });

  describe('POST /import/gpx', () => {
    const file = { buffer: Buffer.from('gpx'), originalname: 'r.gpx' } as Express.Multer.File;
    it('400 without a file', () => {
      expect(thrown(() => new PlacesController(svc()).importGpx(user, '5', undefined, {}))).toEqual({ status: 400, body: { error: 'No file uploaded' } });
    });
    it('400 when all import types are disabled', () => {
      expect(thrown(() => new PlacesController(svc()).importGpx(user, '5', file, { importWaypoints: 'false', importRoutes: 'false', importTracks: 'false' }))).toEqual({
        status: 400, body: { error: 'No import types selected' },
      });
    });
    it('400 when the GPX yields nothing', () => {
      expect(thrown(() => new PlacesController(svc({ importGpx: vi.fn().mockReturnValue(null) } as Partial<PlacesService>)).importGpx(user, '5', file, {}))).toEqual({
        status: 400, body: { error: 'No matching places found in GPX file' },
      });
    });
    it('imports and broadcasts per place', () => {
      const broadcast = vi.fn();
      const s = svc({ importGpx: vi.fn().mockReturnValue({ places: [{ id: 1 }, { id: 2 }], count: 2, skipped: 0 }), broadcast } as Partial<PlacesService>);
      expect(new PlacesController(s).importGpx(user, '5', file, {}, 'sock')).toEqual({ places: [{ id: 1 }, { id: 2 }], count: 2, skipped: 0 });
      expect(broadcast).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /import/google-list + naver-list', () => {
    it('400 without a url', async () => {
      expect(await thrownAsync(() => new PlacesController(svc()).importGoogle(user, '5', undefined))).toEqual({ status: 400, body: { error: 'URL is required' } });
    });
    it('maps a service { error, status } to the same response', async () => {
      const s = svc({ importGoogleList: vi.fn().mockResolvedValue({ error: 'List is empty', status: 400 }) } as Partial<PlacesService>);
      expect(await thrownAsync(() => new PlacesController(s).importGoogle(user, '5', 'http://x'))).toEqual({ status: 400, body: { error: 'List is empty' } });
    });
    it('imports a naver list and returns the count + listName', async () => {
      const s = svc({ importNaverList: vi.fn().mockResolvedValue({ places: [{ id: 1 }], listName: 'Trip', skipped: 2 }), broadcast: vi.fn() } as Partial<PlacesService>);
      expect(await new PlacesController(s).importNaver(user, '5', 'http://x')).toEqual({ places: [{ id: 1 }], count: 1, listName: 'Trip', skipped: 2 });
    });
  });

  describe('POST /bulk-delete', () => {
    it('400 when ids is not an array of numbers', () => {
      expect(thrown(() => new PlacesController(svc()).bulkDelete(user, '5', ['a']))).toEqual({ status: 400, body: { error: 'ids must be an array of numbers' } });
    });
    it('returns empty for an empty list without touching the service', () => {
      const removeMany = vi.fn();
      expect(new PlacesController(svc({ removeMany } as Partial<PlacesService>)).bulkDelete(user, '5', [])).toEqual({ deleted: [], count: 0 });
      expect(removeMany).not.toHaveBeenCalled();
    });
    it('deletes, fires hooks + broadcasts per deleted id', () => {
      const removeMany = vi.fn().mockReturnValue([1, 2]); const onDeleted = vi.fn(); const broadcast = vi.fn();
      const s = svc({ removeMany, onDeleted, broadcast } as Partial<PlacesService>);
      expect(new PlacesController(s).bulkDelete(user, '5', [1, 2], 'sock')).toEqual({ deleted: [1, 2], count: 2 });
      expect(onDeleted).toHaveBeenCalledTimes(2);
      expect(broadcast).toHaveBeenCalledTimes(2);
    });
  });

  it('GET /:id 404 when missing', () => {
    expect(thrown(() => new PlacesController(svc({ get: vi.fn().mockReturnValue(undefined) } as Partial<PlacesService>)).get(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Place not found' } });
  });

  it('PUT /:id 404 when missing, else updates + hooks', () => {
    expect(thrown(() => new PlacesController(svc({ update: vi.fn().mockReturnValue(null) } as Partial<PlacesService>)).update(user, '5', '9', { name: 'X' }))).toEqual({ status: 404, body: { error: 'Place not found' } });
    const update = vi.fn().mockReturnValue({ id: 9 }); const onUpdated = vi.fn(); const broadcast = vi.fn();
    const s = svc({ update, onUpdated, broadcast } as Partial<PlacesService>);
    expect(new PlacesController(s).update(user, '5', '9', { name: 'X' }, 'sock')).toEqual({ place: { id: 9 } });
    expect(onUpdated).toHaveBeenCalledWith(9);
  });

  it('DELETE /:id fires the hook then 404 / success', () => {
    const onDeleted = vi.fn();
    expect(thrown(() => new PlacesController(svc({ remove: vi.fn().mockReturnValue(false), onDeleted } as Partial<PlacesService>)).remove(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Place not found' } });
    expect(onDeleted).toHaveBeenCalledWith(9);
    const s = svc({ remove: vi.fn().mockReturnValue(true), broadcast: vi.fn() } as Partial<PlacesService>);
    expect(new PlacesController(s).remove(user, '5', '9')).toEqual({ success: true });
  });

  it('GET /:id/image maps service error + returns photos', async () => {
    const s = svc({ searchImage: vi.fn().mockResolvedValue({ photos: [{ url: 'x' }] }) } as Partial<PlacesService>);
    expect(await new PlacesController(s).image(user, '5', '9')).toEqual({ photos: [{ url: 'x' }] });
    const e = svc({ searchImage: vi.fn().mockResolvedValue({ error: 'No key', status: 400 }) } as Partial<PlacesService>);
    expect(await thrownAsync(() => new PlacesController(e).image(user, '5', '9'))).toEqual({ status: 400, body: { error: 'No key' } });
  });
});
