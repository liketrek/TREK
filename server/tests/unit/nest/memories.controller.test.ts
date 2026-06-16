import { describe, it, expect, vi } from 'vitest';
import type { Response } from 'express';
import type { Request } from 'express';
import { UnifiedMemoriesController } from '../../../src/nest/memories/unified.controller';
import { ImmichMemoriesController } from '../../../src/nest/memories/immich.controller';
import { SynologyMemoriesController } from '../../../src/nest/memories/synology.controller';
import type { MemoriesService } from '../../../src/nest/memories/memories.service';
import type { User } from '../../../src/types';

const { getClientIp } = vi.hoisted(() => ({ getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../src/services/auditLog', () => ({ getClientIp }));

const user = { id: 7, role: 'user', email: 'u@example.test' } as User;

function makeService(overrides: Partial<MemoriesService> = {}): MemoriesService {
  return { ...overrides } as unknown as MemoriesService;
}

type MockRes = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  statusCode: number;
};

function makeRes(): MockRes {
  const res = {
    statusCode: 200,
    status: vi.fn(function (this: unknown, c: number) {
      (res as { statusCode: number }).statusCode = c;
      return res;
    }),
    json: vi.fn(function () {
      return res;
    }),
  };
  return res as unknown as MockRes;
}

// ─────────────────────────────────────────────────────────────────────────────
describe('UnifiedMemoriesController (parity with /api/integrations/memories/unified)', () => {
  describe('GET /trips/:tripId/photos', () => {
    it('returns the photos on success', () => {
      const svc = makeService({ listTripPhotos: vi.fn().mockReturnValue({ data: [{ id: 1 }] }) });
      const res = makeRes();
      new UnifiedMemoriesController(svc).listPhotos(user, '5', res);
      expect(svc.listTripPhotos).toHaveBeenCalledWith('5', 7);
      expect(res.json).toHaveBeenCalledWith({ photos: [{ id: 1 }] });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('maps the error envelope to its status + message', () => {
      const svc = makeService({ listTripPhotos: vi.fn().mockReturnValue({ error: { status: 404, message: 'Trip not found' } }) });
      const res = makeRes();
      new UnifiedMemoriesController(svc).listPhotos(user, '5', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Trip not found' });
    });
  });

  describe('POST /trips/:tripId/photos', () => {
    it('defaults shared to true and selections to [] when both are absent', async () => {
      const addTripPhotos = vi.fn().mockResolvedValue({ data: { added: 3 } });
      const svc = makeService({ addTripPhotos });
      const res = makeRes();
      await new UnifiedMemoriesController(svc).addPhotos(user, '5', {}, 'sock', res);
      expect(addTripPhotos).toHaveBeenCalledWith('5', 7, true, [], 'sock');
      expect(res.json).toHaveBeenCalledWith({ success: true, added: 3 });
    });

    it('coerces a falsy shared flag and forwards an array of selections', async () => {
      const addTripPhotos = vi.fn().mockResolvedValue({ data: { added: 0 } });
      const svc = makeService({ addTripPhotos });
      const selections = [{ provider: 'immich', asset_ids: ['a'] }];
      await new UnifiedMemoriesController(svc).addPhotos(user, '5', { shared: 0, selections }, 'sock', makeRes());
      expect(addTripPhotos).toHaveBeenCalledWith('5', 7, false, selections, 'sock');
    });

    it('ignores a non-array selections payload', async () => {
      const addTripPhotos = vi.fn().mockResolvedValue({ data: { added: 0 } });
      const svc = makeService({ addTripPhotos });
      await new UnifiedMemoriesController(svc).addPhotos(user, '5', { selections: 'nope', shared: true }, 'sock', makeRes());
      expect(addTripPhotos).toHaveBeenCalledWith('5', 7, true, [], 'sock');
    });

    it('maps the error envelope', async () => {
      const svc = makeService({ addTripPhotos: vi.fn().mockResolvedValue({ error: { status: 403, message: 'No access' } }) });
      const res = makeRes();
      await new UnifiedMemoriesController(svc).addPhotos(user, '5', {}, 'sock', res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No access' });
    });
  });

  describe('PUT /trips/:tripId/photos/sharing', () => {
    it('coerces photo_id to a number and forwards shared', async () => {
      const setTripPhotoSharing = vi.fn().mockResolvedValue({ data: {} });
      const svc = makeService({ setTripPhotoSharing });
      const res = makeRes();
      await new UnifiedMemoriesController(svc).setSharing(user, '5', { photo_id: '9', shared: true }, res);
      expect(setTripPhotoSharing).toHaveBeenCalledWith('5', 7, 9, true);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('maps the error envelope', async () => {
      const svc = makeService({ setTripPhotoSharing: vi.fn().mockResolvedValue({ error: { status: 404, message: 'Photo not found' } }) });
      const res = makeRes();
      await new UnifiedMemoriesController(svc).setSharing(user, '5', { photo_id: '9', shared: false }, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Photo not found' });
    });
  });

  describe('DELETE /trips/:tripId/photos', () => {
    it('removes the photo on success', () => {
      const removeTripPhoto = vi.fn().mockReturnValue({ data: {} });
      const svc = makeService({ removeTripPhoto });
      const res = makeRes();
      new UnifiedMemoriesController(svc).removePhoto(user, '5', { photo_id: 11 }, res);
      expect(removeTripPhoto).toHaveBeenCalledWith('5', 7, 11);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('maps the error envelope', () => {
      const svc = makeService({ removeTripPhoto: vi.fn().mockReturnValue({ error: { status: 404, message: 'Photo not found' } }) });
      const res = makeRes();
      new UnifiedMemoriesController(svc).removePhoto(user, '5', { photo_id: 11 }, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Photo not found' });
    });
  });

  describe('GET /trips/:tripId/album-links', () => {
    it('returns the links on success', () => {
      const svc = makeService({ listTripAlbumLinks: vi.fn().mockReturnValue({ data: [{ id: 'l1' }] }) });
      const res = makeRes();
      new UnifiedMemoriesController(svc).listAlbumLinks(user, '5', res);
      expect(res.json).toHaveBeenCalledWith({ links: [{ id: 'l1' }] });
    });

    it('maps the error envelope', () => {
      const svc = makeService({ listTripAlbumLinks: vi.fn().mockReturnValue({ error: { status: 404, message: 'Trip not found' } }) });
      const res = makeRes();
      new UnifiedMemoriesController(svc).listAlbumLinks(user, '5', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Trip not found' });
    });
  });

  describe('POST /trips/:tripId/album-links', () => {
    it('forwards a coerced passphrase when present', () => {
      const createTripAlbumLink = vi.fn().mockReturnValue({ data: {} });
      const svc = makeService({ createTripAlbumLink });
      const res = makeRes();
      new UnifiedMemoriesController(svc).createAlbumLink(
        user,
        '5',
        { provider: 'synologyphotos', album_id: 'a1', album_name: 'Trip', passphrase: 123 },
        res,
      );
      expect(createTripAlbumLink).toHaveBeenCalledWith('5', 7, 'synologyphotos', 'a1', 'Trip', '123');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('passes undefined when the passphrase is absent or empty', () => {
      const createTripAlbumLink = vi.fn().mockReturnValue({ data: {} });
      const svc = makeService({ createTripAlbumLink });
      new UnifiedMemoriesController(svc).createAlbumLink(user, '5', { provider: 'immich', album_id: 'a1', album_name: 'Trip', passphrase: '' }, makeRes());
      expect(createTripAlbumLink).toHaveBeenCalledWith('5', 7, 'immich', 'a1', 'Trip', undefined);
    });

    it('maps the error envelope', () => {
      const svc = makeService({ createTripAlbumLink: vi.fn().mockReturnValue({ error: { status: 400, message: 'Invalid provider' } }) });
      const res = makeRes();
      new UnifiedMemoriesController(svc).createAlbumLink(user, '5', {}, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid provider' });
    });
  });

  describe('DELETE /trips/:tripId/album-links/:linkId', () => {
    it('removes the link on success', () => {
      const removeAlbumLink = vi.fn().mockReturnValue({ data: {} });
      const svc = makeService({ removeAlbumLink });
      const res = makeRes();
      new UnifiedMemoriesController(svc).removeAlbumLink(user, '5', 'l1', res);
      expect(removeAlbumLink).toHaveBeenCalledWith('5', 'l1', 7);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('maps the error envelope', () => {
      const svc = makeService({ removeAlbumLink: vi.fn().mockReturnValue({ error: { status: 404, message: 'Link not found' } }) });
      const res = makeRes();
      new UnifiedMemoriesController(svc).removeAlbumLink(user, '5', 'l1', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Link not found' });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ImmichMemoriesController (parity with /api/integrations/memories/immich)', () => {
  describe('GET /settings', () => {
    it('delegates to the service', () => {
      const immichGetConnectionSettings = vi.fn().mockReturnValue({ immich_url: 'u' });
      const svc = makeService({ immichGetConnectionSettings });
      expect(new ImmichMemoriesController(svc).getSettings(user)).toEqual({ immich_url: 'u' });
      expect(immichGetConnectionSettings).toHaveBeenCalledWith(7);
    });
  });

  describe('PUT /settings', () => {
    const req = {} as Request;

    it('400 when the save fails', async () => {
      const svc = makeService({ immichSaveSettings: vi.fn().mockResolvedValue({ success: false, error: 'Bad URL' }) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).putSettings(user, { immich_url: 'x', immich_api_key: 'k' }, req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad URL' });
    });

    it('applies auto_upload when it is a boolean and returns success', async () => {
      const immichSaveSettings = vi.fn().mockResolvedValue({ success: true });
      const immichSetAutoUpload = vi.fn();
      const svc = makeService({ immichSaveSettings, immichSetAutoUpload });
      const res = makeRes();
      await new ImmichMemoriesController(svc).putSettings(user, { immich_url: 'x', immich_api_key: 'k', auto_upload: true }, req, res);
      expect(immichSaveSettings).toHaveBeenCalledWith(7, 'x', 'k', '1.2.3.4');
      expect(immichSetAutoUpload).toHaveBeenCalledWith(7, true);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('skips auto_upload when it is not a boolean', async () => {
      const immichSaveSettings = vi.fn().mockResolvedValue({ success: true });
      const immichSetAutoUpload = vi.fn();
      const svc = makeService({ immichSaveSettings, immichSetAutoUpload });
      await new ImmichMemoriesController(svc).putSettings(user, { auto_upload: 'yes' as unknown as boolean }, req, makeRes());
      expect(immichSetAutoUpload).not.toHaveBeenCalled();
    });

    it('returns the warning when the save carries one', async () => {
      const svc = makeService({ immichSaveSettings: vi.fn().mockResolvedValue({ success: true, warning: 'Unverified TLS' }) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).putSettings(user, {}, req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, warning: 'Unverified TLS' });
    });
  });

  describe('GET /status', () => {
    it('delegates to the service', async () => {
      const svc = makeService({ immichGetConnectionStatus: vi.fn().mockResolvedValue({ connected: true }) });
      await expect(new ImmichMemoriesController(svc).getStatus(user)).resolves.toEqual({ connected: true });
    });
  });

  describe('POST /test', () => {
    it('short-circuits to a 200 envelope when url is missing', async () => {
      const immichTestConnection = vi.fn();
      const svc = makeService({ immichTestConnection });
      expect(await new ImmichMemoriesController(svc).test({ immich_api_key: 'k' })).toEqual({ connected: false, error: 'URL and API key required' });
      expect(immichTestConnection).not.toHaveBeenCalled();
    });

    it('short-circuits when the api key is missing', async () => {
      const immichTestConnection = vi.fn();
      const svc = makeService({ immichTestConnection });
      expect(await new ImmichMemoriesController(svc).test({ immich_url: 'u' })).toEqual({ connected: false, error: 'URL and API key required' });
      expect(immichTestConnection).not.toHaveBeenCalled();
    });

    it('delegates when both are present', async () => {
      const immichTestConnection = vi.fn().mockResolvedValue({ connected: true });
      const svc = makeService({ immichTestConnection });
      expect(await new ImmichMemoriesController(svc).test({ immich_url: 'u', immich_api_key: 'k' })).toEqual({ connected: true });
      expect(immichTestConnection).toHaveBeenCalledWith('u', 'k');
    });
  });

  describe('GET /browse', () => {
    it('returns the buckets on success', async () => {
      const svc = makeService({ immichBrowseTimeline: vi.fn().mockResolvedValue({ buckets: [{ id: 'b' }] }) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).browse(user, res);
      expect(res.json).toHaveBeenCalledWith({ buckets: [{ id: 'b' }] });
    });

    it('maps the error with its status', async () => {
      const svc = makeService({ immichBrowseTimeline: vi.fn().mockResolvedValue({ error: 'Not connected', status: 412 }) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).browse(user, res);
      expect(res.status).toHaveBeenCalledWith(412);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not connected' });
    });
  });

  describe('POST /search', () => {
    it('clamps page to >=1 and size to <=200 and defaults both', async () => {
      const immichSearchPhotos = vi.fn().mockResolvedValue({ assets: [{ id: 'a' }], hasMore: true });
      const svc = makeService({ immichSearchPhotos });
      const res = makeRes();
      await new ImmichMemoriesController(svc).search(user, { from: 'f', to: 't' }, res);
      expect(immichSearchPhotos).toHaveBeenCalledWith(7, 'f', 't', 1, 50);
      expect(res.json).toHaveBeenCalledWith({ assets: [{ id: 'a' }], hasMore: true });
    });

    it('floors a sub-1 page to 1 and caps an oversized size at 200', async () => {
      const immichSearchPhotos = vi.fn().mockResolvedValue({});
      const svc = makeService({ immichSearchPhotos });
      await new ImmichMemoriesController(svc).search(user, { page: 0, size: 9999 }, makeRes());
      expect(immichSearchPhotos).toHaveBeenCalledWith(7, undefined, undefined, 1, 200);
    });

    it('honours an explicit page and size within range', async () => {
      const immichSearchPhotos = vi.fn().mockResolvedValue({});
      const svc = makeService({ immichSearchPhotos });
      await new ImmichMemoriesController(svc).search(user, { page: 3, size: 25 }, makeRes());
      expect(immichSearchPhotos).toHaveBeenCalledWith(7, undefined, undefined, 3, 25);
    });

    it('defaults assets to [] and hasMore to false when omitted', async () => {
      const svc = makeService({ immichSearchPhotos: vi.fn().mockResolvedValue({}) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).search(user, {}, res);
      expect(res.json).toHaveBeenCalledWith({ assets: [], hasMore: false });
    });

    it('maps the error envelope', async () => {
      const svc = makeService({ immichSearchPhotos: vi.fn().mockResolvedValue({ error: 'down', status: 502 }) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).search(user, {}, res);
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({ error: 'down' });
    });
  });

  describe('GET /assets/:tripId/:assetId/:ownerId/info', () => {
    it('400 on an invalid asset id', async () => {
      const immichIsValidAssetId = vi.fn().mockReturnValue(false);
      const svc = makeService({ immichIsValidAssetId });
      const res = makeRes();
      await new ImmichMemoriesController(svc).assetInfo(user, '5', 'bad', '2', res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid asset ID' });
    });

    it('403 when access is denied', async () => {
      const svc = makeService({
        immichIsValidAssetId: vi.fn().mockReturnValue(true),
        canAccessUserPhoto: vi.fn().mockReturnValue(false),
      });
      const res = makeRes();
      await new ImmichMemoriesController(svc).assetInfo(user, '5', 'a', '2', res);
      expect(svc.canAccessUserPhoto).toHaveBeenCalledWith(7, 2, '5', 'a', 'immich');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('maps a service error after the guards pass', async () => {
      const svc = makeService({
        immichIsValidAssetId: vi.fn().mockReturnValue(true),
        canAccessUserPhoto: vi.fn().mockReturnValue(true),
        immichGetAssetInfo: vi.fn().mockResolvedValue({ error: 'Asset gone', status: 404 }),
      });
      const res = makeRes();
      await new ImmichMemoriesController(svc).assetInfo(user, '5', 'a', '2', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Asset gone' });
    });

    it('returns the asset data on success', async () => {
      const svc = makeService({
        immichIsValidAssetId: vi.fn().mockReturnValue(true),
        canAccessUserPhoto: vi.fn().mockReturnValue(true),
        immichGetAssetInfo: vi.fn().mockResolvedValue({ data: { id: 'a', takenAt: 't' } }),
      });
      const res = makeRes();
      await new ImmichMemoriesController(svc).assetInfo(user, '5', 'a', '2', res);
      expect(res.json).toHaveBeenCalledWith({ id: 'a', takenAt: 't' });
    });
  });

  describe('GET /assets/.../thumbnail + /original', () => {
    it('thumbnail: 400 on invalid id', async () => {
      const svc = makeService({ immichIsValidAssetId: vi.fn().mockReturnValue(false) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).assetThumbnail(user, '5', 'bad', '2', res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('thumbnail: 403 when access denied', async () => {
      const svc = makeService({
        immichIsValidAssetId: vi.fn().mockReturnValue(true),
        canAccessUserPhoto: vi.fn().mockReturnValue(false),
      });
      const res = makeRes();
      await new ImmichMemoriesController(svc).assetThumbnail(user, '5', 'a', '2', res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('thumbnail: streams with kind=thumbnail when allowed', async () => {
      const immichStreamAsset = vi.fn().mockResolvedValue(undefined);
      const svc = makeService({
        immichIsValidAssetId: vi.fn().mockReturnValue(true),
        canAccessUserPhoto: vi.fn().mockReturnValue(true),
        immichStreamAsset,
      });
      const res = makeRes();
      await new ImmichMemoriesController(svc).assetThumbnail(user, '5', 'a', '2', res);
      expect(immichStreamAsset).toHaveBeenCalledWith(res, 7, 'a', 'thumbnail', 2);
    });

    it('original: 400 on invalid id', async () => {
      const svc = makeService({ immichIsValidAssetId: vi.fn().mockReturnValue(false) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).assetOriginal(user, '5', 'bad', '2', res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('original: 403 when access denied', async () => {
      const svc = makeService({
        immichIsValidAssetId: vi.fn().mockReturnValue(true),
        canAccessUserPhoto: vi.fn().mockReturnValue(false),
      });
      const res = makeRes();
      await new ImmichMemoriesController(svc).assetOriginal(user, '5', 'a', '2', res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('original: streams with kind=original when allowed', async () => {
      const immichStreamAsset = vi.fn().mockResolvedValue(undefined);
      const svc = makeService({
        immichIsValidAssetId: vi.fn().mockReturnValue(true),
        canAccessUserPhoto: vi.fn().mockReturnValue(true),
        immichStreamAsset,
      });
      const res = makeRes();
      await new ImmichMemoriesController(svc).assetOriginal(user, '5', 'a', '2', res);
      expect(immichStreamAsset).toHaveBeenCalledWith(res, 7, 'a', 'original', 2);
    });
  });

  describe('GET /albums + /albums/:albumId/photos', () => {
    it('albums: returns the list on success', async () => {
      const svc = makeService({ immichListAlbums: vi.fn().mockResolvedValue({ albums: [{ id: 'a' }] }) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).albums(user, res);
      expect(res.json).toHaveBeenCalledWith({ albums: [{ id: 'a' }] });
    });

    it('albums: maps the error envelope', async () => {
      const svc = makeService({ immichListAlbums: vi.fn().mockResolvedValue({ error: 'nope', status: 500 }) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).albums(user, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'nope' });
    });

    it('albumPhotos: returns the assets on success', async () => {
      const svc = makeService({ immichGetAlbumPhotos: vi.fn().mockResolvedValue({ assets: [{ id: 'p' }] }) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).albumPhotos(user, 'al1', res);
      expect(svc.immichGetAlbumPhotos).toHaveBeenCalledWith(7, 'al1');
      expect(res.json).toHaveBeenCalledWith({ assets: [{ id: 'p' }] });
    });

    it('albumPhotos: maps the error envelope', async () => {
      const svc = makeService({ immichGetAlbumPhotos: vi.fn().mockResolvedValue({ error: 'gone', status: 404 }) });
      const res = makeRes();
      await new ImmichMemoriesController(svc).albumPhotos(user, 'al1', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'gone' });
    });
  });

  describe('POST /trips/:tripId/album-links/:linkId/sync', () => {
    it('maps the error envelope without broadcasting', async () => {
      const broadcast = vi.fn();
      const svc = makeService({ immichSyncAlbumAssets: vi.fn().mockResolvedValue({ error: 'Link gone', status: 404 }), broadcast });
      const res = makeRes();
      await new ImmichMemoriesController(svc).sync(user, '5', 'l1', 'sock', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Link gone' });
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('broadcasts when at least one asset was added', async () => {
      const broadcast = vi.fn();
      const svc = makeService({ immichSyncAlbumAssets: vi.fn().mockResolvedValue({ added: 2, total: 10 }), broadcast });
      const res = makeRes();
      await new ImmichMemoriesController(svc).sync(user, '5', 'l1', 'sock', res);
      expect(res.json).toHaveBeenCalledWith({ success: true, added: 2, total: 10 });
      expect(broadcast).toHaveBeenCalledWith('5', 'memories:updated', { userId: 7 }, 'sock');
    });

    it('does not broadcast when nothing was added', async () => {
      const broadcast = vi.fn();
      const svc = makeService({ immichSyncAlbumAssets: vi.fn().mockResolvedValue({ added: 0, total: 10 }), broadcast });
      const res = makeRes();
      await new ImmichMemoriesController(svc).sync(user, '5', 'l1', 'sock', res);
      expect(res.json).toHaveBeenCalledWith({ success: true, added: 0, total: 10 });
      expect(broadcast).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('SynologyMemoriesController (parity with /api/integrations/memories/synologyphotos)', () => {
  describe('GET /settings + /status', () => {
    it('settings: returns the data on success', async () => {
      const svc = makeService({ synologyGetSettings: vi.fn().mockResolvedValue({ success: true, data: { synology_url: 'u' } }) });
      const res = makeRes();
      await new SynologyMemoriesController(svc).getSettings(user, res);
      expect(res.json).toHaveBeenCalledWith({ synology_url: 'u' });
    });

    it('settings: maps the error envelope', async () => {
      const svc = makeService({ synologyGetSettings: vi.fn().mockResolvedValue({ success: false, error: { status: 500, message: 'DB error' } }) });
      const res = makeRes();
      await new SynologyMemoriesController(svc).getSettings(user, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
    });

    it('status: delegates', async () => {
      const svc = makeService({ synologyGetStatus: vi.fn().mockResolvedValue({ success: true, data: { connected: true } }) });
      const res = makeRes();
      await new SynologyMemoriesController(svc).getStatus(user, res);
      expect(res.json).toHaveBeenCalledWith({ connected: true });
    });
  });

  describe('PUT /settings', () => {
    it('400 when the url is missing', async () => {
      const synologyUpdateSettings = vi.fn();
      const svc = makeService({ synologyUpdateSettings });
      const res = makeRes();
      await new SynologyMemoriesController(svc).putSettings(user, { synology_username: 'admin' }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'URL and username are required' });
      expect(synologyUpdateSettings).not.toHaveBeenCalled();
    });

    it('400 when the username is missing', async () => {
      const synologyUpdateSettings = vi.fn();
      const svc = makeService({ synologyUpdateSettings });
      const res = makeRes();
      await new SynologyMemoriesController(svc).putSettings(user, { synology_url: 'http://nas' }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(synologyUpdateSettings).not.toHaveBeenCalled();
    });

    it('delegates with trimmed values and the boolean skip-ssl flag (true keyword)', async () => {
      const synologyUpdateSettings = vi.fn().mockResolvedValue({ success: true, data: {} });
      const svc = makeService({ synologyUpdateSettings });
      const res = makeRes();
      await new SynologyMemoriesController(
        svc,
      ).putSettings(user, { synology_url: '  http://nas  ', synology_username: ' admin ', synology_password: ' pw ', synology_skip_ssl: 'true' }, res);
      expect(synologyUpdateSettings).toHaveBeenCalledWith(7, 'http://nas', 'admin', 'pw', true);
      expect(res.json).toHaveBeenCalledWith({});
    });

    it('treats a literal-true skip-ssl flag as true and other values as false', async () => {
      const synologyUpdateSettings = vi.fn().mockResolvedValue({ success: true, data: {} });
      const svc = makeService({ synologyUpdateSettings });
      await new SynologyMemoriesController(svc).putSettings(user, { synology_url: 'u', synology_username: 'a', synology_skip_ssl: true }, makeRes());
      expect(synologyUpdateSettings).toHaveBeenCalledWith(7, 'u', 'a', '', true);

      const svc2 = makeService({ synologyUpdateSettings: vi.fn().mockResolvedValue({ success: true, data: {} }) });
      await new SynologyMemoriesController(svc2).putSettings(user, { synology_url: 'u', synology_username: 'a', synology_skip_ssl: 'no' }, makeRes());
      expect(svc2.synologyUpdateSettings).toHaveBeenCalledWith(7, 'u', 'a', '', false);
    });
  });

  describe('POST /test', () => {
    it('reports a single missing field with "is required"', async () => {
      const synologyTestConnection = vi.fn();
      const svc = makeService({ synologyTestConnection });
      const res = makeRes();
      await new SynologyMemoriesController(svc).test(user, { synology_url: 'u', synology_username: 'a' }, res);
      expect(res.json).toHaveBeenCalledWith({ connected: false, error: 'Password is required' });
      expect(synologyTestConnection).not.toHaveBeenCalled();
    });

    it('reports multiple missing fields with "are required"', async () => {
      const svc = makeService({ synologyTestConnection: vi.fn() });
      const res = makeRes();
      await new SynologyMemoriesController(svc).test(user, {}, res);
      expect(res.json).toHaveBeenCalledWith({ connected: false, error: 'URL, Username, Password are required' });
    });

    it('delegates when every field is present (otp + skip-ssl forwarded)', async () => {
      const synologyTestConnection = vi.fn().mockResolvedValue({ success: true, data: { connected: true } });
      const svc = makeService({ synologyTestConnection });
      const res = makeRes();
      await new SynologyMemoriesController(
        svc,
      ).test(user, { synology_url: 'u', synology_username: 'a', synology_password: 'p', synology_otp: '123', synology_skip_ssl: true }, res);
      expect(synologyTestConnection).toHaveBeenCalledWith(7, 'u', 'a', 'p', '123', true);
      expect(res.json).toHaveBeenCalledWith({ connected: true });
    });
  });

  describe('GET /albums + /albums/:albumId/photos', () => {
    it('albums: delegates', async () => {
      const svc = makeService({ synologyListAlbums: vi.fn().mockResolvedValue({ success: true, data: { albums: [] } }) });
      const res = makeRes();
      await new SynologyMemoriesController(svc).albums(user, res);
      expect(res.json).toHaveBeenCalledWith({ albums: [] });
    });

    it('albumPhotos: forwards a coerced passphrase when present', async () => {
      const synologyGetAlbumPhotos = vi.fn().mockResolvedValue({ success: true, data: { assets: [] } });
      const svc = makeService({ synologyGetAlbumPhotos });
      const res = makeRes();
      await new SynologyMemoriesController(svc).albumPhotos(user, 'al1', 'secret', res);
      expect(synologyGetAlbumPhotos).toHaveBeenCalledWith(7, 'al1', 'secret');
      expect(res.json).toHaveBeenCalledWith({ assets: [] });
    });

    it('albumPhotos: passes undefined when the passphrase query is absent', async () => {
      const synologyGetAlbumPhotos = vi.fn().mockResolvedValue({ success: true, data: { assets: [] } });
      const svc = makeService({ synologyGetAlbumPhotos });
      await new SynologyMemoriesController(svc).albumPhotos(user, 'al1', undefined, makeRes());
      expect(synologyGetAlbumPhotos).toHaveBeenCalledWith(7, 'al1', undefined);
    });
  });

  describe('POST /trips/:tripId/album-links/:linkId/sync', () => {
    it('delegates and unwraps the success envelope', async () => {
      const synologySyncAlbumLink = vi.fn().mockResolvedValue({ success: true, data: { added: 1, total: 2 } });
      const svc = makeService({ synologySyncAlbumLink });
      const res = makeRes();
      await new SynologyMemoriesController(svc).sync(user, '5', 'l1', 'sock', res);
      expect(synologySyncAlbumLink).toHaveBeenCalledWith(7, '5', 'l1', 'sock');
      expect(res.json).toHaveBeenCalledWith({ added: 1, total: 2 });
    });
  });

  describe('POST /search', () => {
    it('uses the default offset/limit when nothing is provided', async () => {
      const synologySearchPhotos = vi.fn().mockResolvedValue({ success: true, data: { assets: [] } });
      const svc = makeService({ synologySearchPhotos });
      await new SynologyMemoriesController(svc).search(user, {}, makeRes());
      expect(synologySearchPhotos).toHaveBeenCalledWith(7, undefined, undefined, 0, 100);
    });

    it('forwards from/to and uses size as the limit when size > 0', async () => {
      const synologySearchPhotos = vi.fn().mockResolvedValue({ success: true, data: { assets: [] } });
      const svc = makeService({ synologySearchPhotos });
      await new SynologyMemoriesController(svc).search(user, { from: '2024-01-01', to: '2024-02-01', size: 30 }, makeRes());
      expect(synologySearchPhotos).toHaveBeenCalledWith(7, '2024-01-01', '2024-02-01', 0, 30);
    });

    it('derives the offset from a 1-based page using the limit', async () => {
      const synologySearchPhotos = vi.fn().mockResolvedValue({ success: true, data: { assets: [] } });
      const svc = makeService({ synologySearchPhotos });
      await new SynologyMemoriesController(svc).search(user, { page: 3, limit: 20 }, makeRes());
      // page-1 = 2, offset = 2 * 20 = 40
      expect(synologySearchPhotos).toHaveBeenCalledWith(7, undefined, undefined, 40, 20);
    });

    it('keeps the explicit offset when page resolves to <= 0', async () => {
      const synologySearchPhotos = vi.fn().mockResolvedValue({ success: true, data: { assets: [] } });
      const svc = makeService({ synologySearchPhotos });
      await new SynologyMemoriesController(svc).search(user, { page: 1, offset: 5, limit: 10 }, makeRes());
      expect(synologySearchPhotos).toHaveBeenCalledWith(7, undefined, undefined, 5, 10);
    });

    it('falls back to defaults when numeric fields are non-finite', async () => {
      const synologySearchPhotos = vi.fn().mockResolvedValue({ success: true, data: { assets: [] } });
      const svc = makeService({ synologySearchPhotos });
      await new SynologyMemoriesController(svc).search(user, { offset: 'x', limit: 'y', page: 'z', size: 'q' }, makeRes());
      expect(synologySearchPhotos).toHaveBeenCalledWith(7, undefined, undefined, 0, 100);
    });
  });

  describe('GET /assets/:tripId/:photoId/:ownerId/info', () => {
    it('403 when access is denied', async () => {
      const svc = makeService({ canAccessUserPhoto: vi.fn().mockReturnValue(false) });
      const res = makeRes();
      await new SynologyMemoriesController(svc).assetInfo(user, '5', 'p1', '2', undefined, res);
      expect(svc.canAccessUserPhoto).toHaveBeenCalledWith(7, 2, '5', 'p1', 'synologyphotos');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "You don't have access to this photo" });
    });

    it('delegates with the coerced passphrase when access is granted', async () => {
      const synologyGetAssetInfo = vi.fn().mockResolvedValue({ success: true, data: { id: 'p1' } });
      const svc = makeService({ canAccessUserPhoto: vi.fn().mockReturnValue(true), synologyGetAssetInfo });
      const res = makeRes();
      await new SynologyMemoriesController(svc).assetInfo(user, '5', 'p1', '2', 'secret', res);
      expect(synologyGetAssetInfo).toHaveBeenCalledWith(7, 'p1', 2, 'secret');
      expect(res.json).toHaveBeenCalledWith({ id: 'p1' });
    });

    it('passes undefined passphrase when the query is absent', async () => {
      const synologyGetAssetInfo = vi.fn().mockResolvedValue({ success: true, data: { id: 'p1' } });
      const svc = makeService({ canAccessUserPhoto: vi.fn().mockReturnValue(true), synologyGetAssetInfo });
      await new SynologyMemoriesController(svc).assetInfo(user, '5', 'p1', '2', undefined, makeRes());
      expect(synologyGetAssetInfo).toHaveBeenCalledWith(7, 'p1', 2, undefined);
    });
  });

  describe('GET /assets/:tripId/:photoId/:ownerId/:kind', () => {
    it('400 on an invalid kind', async () => {
      const synologyStreamAsset = vi.fn();
      const svc = makeService({ synologyStreamAsset });
      const res = makeRes();
      await new SynologyMemoriesController(svc).asset(user, '5', 'p1', '2', 'preview', undefined, undefined, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid asset kind' });
      expect(synologyStreamAsset).not.toHaveBeenCalled();
    });

    it('403 when access is denied for a valid kind', async () => {
      const svc = makeService({ canAccessUserPhoto: vi.fn().mockReturnValue(false) });
      const res = makeRes();
      await new SynologyMemoriesController(svc).asset(user, '5', 'p1', '2', 'thumbnail', undefined, undefined, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "You don't have access to this photo" });
    });

    it('streams a thumbnail, defaulting size to "sm" when omitted', async () => {
      const synologyStreamAsset = vi.fn().mockResolvedValue(undefined);
      const svc = makeService({ canAccessUserPhoto: vi.fn().mockReturnValue(true), synologyStreamAsset });
      const res = makeRes();
      await new SynologyMemoriesController(svc).asset(user, '5', 'p1', '2', 'thumbnail', undefined, undefined, res);
      expect(synologyStreamAsset).toHaveBeenCalledWith(res, 7, 2, 'p1', 'thumbnail', 'sm', undefined);
    });

    it('keeps a whitelisted size and forwards the passphrase for an original', async () => {
      const synologyStreamAsset = vi.fn().mockResolvedValue(undefined);
      const svc = makeService({ canAccessUserPhoto: vi.fn().mockReturnValue(true), synologyStreamAsset });
      const res = makeRes();
      await new SynologyMemoriesController(svc).asset(user, '5', 'p1', '2', 'original', 'xl', 'secret', res);
      expect(synologyStreamAsset).toHaveBeenCalledWith(res, 7, 2, 'p1', 'original', 'xl', 'secret');
    });

    it('coerces a non-whitelisted size back to "sm"', async () => {
      const synologyStreamAsset = vi.fn().mockResolvedValue(undefined);
      const svc = makeService({ canAccessUserPhoto: vi.fn().mockReturnValue(true), synologyStreamAsset });
      const res = makeRes();
      await new SynologyMemoriesController(svc).asset(user, '5', 'p1', '2', 'thumbnail', 'huge', undefined, res);
      expect(synologyStreamAsset).toHaveBeenCalledWith(res, 7, 2, 'p1', 'thumbnail', 'sm', undefined);
    });
  });
});
