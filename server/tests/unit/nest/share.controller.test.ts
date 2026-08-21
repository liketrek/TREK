import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { PassThrough } from 'node:stream';

import { TripShareController, SharedController } from '../../../src/nest/share/share.controller';
import type { ShareService } from '../../../src/nest/share/share.service';
import type { StorageService } from '../../../src/nest/storage/storage.service';
import type { User } from '../../../src/types';

// Only the shared place-photo proxy consumes storage.
const getStream = vi.fn();
const storageStub = { getStream } as unknown as StorageService;

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;

function svc(o: Partial<ShareService> = {}): ShareService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue({ user_id: 1 }),
    canManage: vi.fn().mockReturnValue(true),
    ...o,
  } as unknown as ShareService;
}

function res() {
  const r = { statusCode: 200, status: vi.fn((c: number) => { r.statusCode = c; return r; }) };
  return r as unknown as Response & { statusCode: number };
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());

describe('TripShareController', () => {
  it('POST 404 without access, 403 without share_manage', () => {
    expect(thrown(() => new TripShareController(svc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) })).create(user, '5', {}, res()))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    expect(thrown(() => new TripShareController(svc({ canManage: vi.fn().mockReturnValue(false) })).create(user, '5', {}, res()))).toEqual({ status: 403, body: { error: 'No permission' } });
  });

  it('POST answers 201 on create, 200 on update', () => {
    const createdRes = res();
    const c1 = new TripShareController(svc({ createOrUpdate: vi.fn().mockReturnValue({ token: 't', created: true }) } as Partial<ShareService>));
    expect(c1.create(user, '5', { share_map: true }, createdRes)).toEqual({ token: 't' });
    expect(createdRes.statusCode).toBe(201);

    const updatedRes = res();
    const c2 = new TripShareController(svc({ createOrUpdate: vi.fn().mockReturnValue({ token: 't', created: false }) } as Partial<ShareService>));
    expect(c2.create(user, '5', {}, updatedRes)).toEqual({ token: 't' });
    expect(updatedRes.statusCode).toBe(200);
  });

  it('GET 404 without access, 403 without share_manage, returns info or a null token', () => {
    expect(thrown(() => new TripShareController(svc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) })).get(user, '5'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    // Reading returns the token itself, so it needs the same permission as
    // creating it — a member with plain trip access must not get a copy.
    const get = vi.fn();
    expect(thrown(() => new TripShareController(svc({ canManage: vi.fn().mockReturnValue(false), get } as Partial<ShareService>)).get(user, '5'))).toEqual({ status: 403, body: { error: 'No permission' } });
    expect(get).not.toHaveBeenCalled();
    expect(new TripShareController(svc({ get: vi.fn().mockReturnValue({ token: 't' }) } as Partial<ShareService>)).get(user, '5')).toEqual({ token: 't' });
    expect(new TripShareController(svc({ get: vi.fn().mockReturnValue(null) } as Partial<ShareService>)).get(user, '5')).toEqual({ token: null });
  });

  it('DELETE 403 without share_manage, else removes', () => {
    expect(thrown(() => new TripShareController(svc({ canManage: vi.fn().mockReturnValue(false) })).remove(user, '5'))).toEqual({ status: 403, body: { error: 'No permission' } });
    const remove = vi.fn();
    expect(new TripShareController(svc({ remove } as Partial<ShareService>)).remove(user, '5')).toEqual({ success: true });
    expect(remove).toHaveBeenCalledWith('5');
  });
});

describe('SharedController', () => {
  it('404 for an invalid token, else returns the snapshot', () => {
    expect(thrown(() => new SharedController(svc({ getSharedTripData: vi.fn().mockReturnValue(null) } as Partial<ShareService>), storageStub).read('bad'))).toEqual({ status: 404, body: { error: 'Invalid or expired link' } });
    expect(new SharedController(svc({ getSharedTripData: vi.fn().mockReturnValue({ trip: { id: 9 } }) } as Partial<ShareService>), storageStub).read('tok')).toEqual({ trip: { id: 9 } });
  });

  describe('place-photo proxy', () => {
    // A real PassThrough (like storage.service.test.ts's makeRes) rather than
    // a { on, pipe } stub: pipeline() needs authentic stream/eos semantics
    // (close/error/finish wiring) that a bare mock can't satisfy.
    function photoRes() {
      const sink = new PassThrough();
      const chunks: Buffer[] = [];
      sink.on('data', (c: Buffer) => chunks.push(c));
      // Capture the real PassThrough#end BEFORE overwriting the property
      // below — r and sink are the same object (Object.assign mutates and
      // returns its target), so referencing sink.end inside the wrapper
      // would recurse into itself.
      const realEnd = sink.end.bind(sink) as (...a: unknown[]) => unknown;
      const r = Object.assign(sink, {
        statusCode: 200,
        status: vi.fn(function (this: unknown, c: number) { (r as { statusCode: number }).statusCode = c; return r; }),
        json: vi.fn(),
        set: vi.fn(),
        type: vi.fn(),
        end: vi.fn((...args: unknown[]) => realEnd(...args)),
        body: () => Buffer.concat(chunks).toString(),
      });
      return r as unknown as Response & {
        status: ReturnType<typeof vi.fn>;
        json: ReturnType<typeof vi.fn>;
        set: ReturnType<typeof vi.fn>;
        type: ReturnType<typeof vi.fn>;
        end: ReturnType<typeof vi.fn>;
        body: () => string;
      };
    }

    // Braced body on purpose: mockReset() returns the mock, and a function
    // returned from beforeEach is invoked as a teardown callback — which would
    // call getStream() bare and turn a rejecting impl into an unhandled
    // rejection.
    beforeEach(() => {
      getStream.mockReset();
    });

    function controller(key: string | null) {
      return new SharedController(svc({ getSharedPlacePhotoKey: vi.fn().mockReturnValue(key) } as Partial<ShareService>), storageStub);
    }

    // #1727's rationale extended to public share pages: shared payloads keep
    // this URL in place image_urls, so an evicted cache entry means one request
    // per place per shared-page render — an empty 204 instead of 404 noise.
    it('204 without a body when the photo is not cached for the token', async () => {
      const res = photoRes();
      await controller(null).placePhotoBytes('tok', 'p1', res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(res.set).toHaveBeenLastCalledWith('Cache-Control', 'no-store');
      expect(getStream).not.toHaveBeenCalled();
    });

    it('streams the cached bytes with image/jpeg + an immutable cache header on a hit', async () => {
      const stream = new PassThrough();
      stream.end('hello');
      getStream.mockResolvedValue({ stream, stat: { key: 'photos/google/abc.jpg', size: 5, mtimeMs: 0 } });
      const res = photoRes();
      await controller('abc.jpg').placePhotoBytes('tok', 'p1', res);
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=2592000, immutable');
      expect(res.type).toHaveBeenCalledWith('image/jpeg');
      expect(getStream).toHaveBeenCalledWith('photos-google', 'abc.jpg');
      expect(res.body()).toBe('hello');
    });

    it('falls back to an empty 204 when the stream cannot be opened (cache-delete race)', async () => {
      getStream.mockRejectedValue(new Error('storage object not found'));
      const res = photoRes();
      await controller('abc.jpg').placePhotoBytes('tok', 'p1', res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
      // The hit path already asked for a month of immutable caching — that
      // header must not survive onto the empty answer.
      expect(res.set).toHaveBeenLastCalledWith('Cache-Control', 'no-store');
    });

    it('falls back to an empty 204 when the stream errors before headers were sent', async () => {
      const stream = new PassThrough();
      getStream.mockResolvedValue({ stream, stat: { key: 'photos/google/abc.jpg', size: 5, mtimeMs: 0 } });
      const res = photoRes();
      const pending = controller('abc.jpg').placePhotoBytes('tok', 'p1', res);
      // Let pipeline() attach its listeners before erroring the source, so
      // the event isn't missed to a scheduling race.
      await new Promise((resolve) => setImmediate(resolve));
      stream.destroy(new Error('source boom'));
      await pending;
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
      expect(res.set).toHaveBeenLastCalledWith('Cache-Control', 'no-store');
    });

    it('swallows an abort-like error once headers are flushed (client walked away)', async () => {
      const stream = new PassThrough();
      getStream.mockResolvedValue({ stream, stat: { key: 'photos/google/abc.jpg', size: 5, mtimeMs: 0 } });
      const res = photoRes();
      (res as unknown as { headersSent: boolean }).headersSent = true;
      const pending = controller('abc.jpg').placePhotoBytes('tok', 'p1', res);
      await new Promise((resolve) => setImmediate(resolve));
      stream.destroy(Object.assign(new Error('reset'), { code: 'ECONNRESET' }));
      await expect(pending).resolves.toBeUndefined();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(res.end).not.toHaveBeenCalled();
    });

    it('re-throws a real (non-abort) error once headers are flushed', async () => {
      const stream = new PassThrough();
      getStream.mockResolvedValue({ stream, stat: { key: 'photos/google/abc.jpg', size: 5, mtimeMs: 0 } });
      const res = photoRes();
      (res as unknown as { headersSent: boolean }).headersSent = true;
      const pending = controller('abc.jpg').placePhotoBytes('tok', 'p1', res);
      await new Promise((resolve) => setImmediate(resolve));
      stream.destroy(Object.assign(new Error('disk read error'), { code: 'EIO' }));
      await expect(pending).rejects.toThrow('disk read error');
      expect(res.status).not.toHaveBeenCalled();
      expect(res.end).not.toHaveBeenCalled();
    });
  });
});
