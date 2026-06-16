import { describe, it, expect, vi, beforeEach } from 'vitest';

// The MemoriesService is a thin pass-through over the legacy services/memories/*
// helpers. Mock each legacy module so we can assert the wrapper forwards every
// argument unchanged (and exercise the optional-param call sites).

const unified = vi.hoisted(() => ({
  listTripPhotos: vi.fn(() => ({ data: [] })),
  listTripAlbumLinks: vi.fn(() => ({ data: [] })),
  createTripAlbumLink: vi.fn(() => ({ data: {} })),
  removeAlbumLink: vi.fn(() => ({ data: {} })),
  addTripPhotos: vi.fn(async () => ({ data: { added: 0 } })),
  removeTripPhoto: vi.fn(() => ({ data: {} })),
  setTripPhotoSharing: vi.fn(async () => ({ data: {} })),
}));
vi.mock('../../../src/services/memories/unifiedService', () => unified);

const immich = vi.hoisted(() => ({
  getConnectionSettings: vi.fn(() => ({})),
  saveImmichSettings: vi.fn(async () => ({ success: true })),
  setImmichAutoUpload: vi.fn(),
  testConnection: vi.fn(async () => ({ connected: true })),
  getConnectionStatus: vi.fn(async () => ({ connected: true })),
  browseTimeline: vi.fn(async () => ({ buckets: [] })),
  searchPhotos: vi.fn(async () => ({ assets: [] })),
  streamImmichAsset: vi.fn(async () => undefined),
  listAlbums: vi.fn(async () => ({ albums: [] })),
  getAlbumPhotos: vi.fn(async () => ({ assets: [] })),
  syncAlbumAssets: vi.fn(async () => ({ added: 0, total: 0 })),
  getAssetInfo: vi.fn(async () => ({ data: {} })),
  isValidAssetId: vi.fn(() => true),
}));
vi.mock('../../../src/services/memories/immichService', () => immich);

const synology = vi.hoisted(() => ({
  getSynologySettings: vi.fn(async () => ({ success: true, data: {} })),
  updateSynologySettings: vi.fn(async () => ({ success: true, data: {} })),
  getSynologyStatus: vi.fn(async () => ({ success: true, data: {} })),
  testSynologyConnection: vi.fn(async () => ({ success: true, data: {} })),
  listSynologyAlbums: vi.fn(async () => ({ success: true, data: {} })),
  getSynologyAlbumPhotos: vi.fn(async () => ({ success: true, data: {} })),
  syncSynologyAlbumLink: vi.fn(async () => ({ success: true, data: {} })),
  searchSynologyPhotos: vi.fn(async () => ({ success: true, data: {} })),
  getSynologyAssetInfo: vi.fn(async () => ({ success: true, data: {} })),
  streamSynologyAsset: vi.fn(async () => undefined),
}));
vi.mock('../../../src/services/memories/synologyService', () => synology);

const helpers = vi.hoisted(() => ({ canAccessUserPhoto: vi.fn(() => true) }));
vi.mock('../../../src/services/memories/helpersService', () => helpers);

const ws = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ws);

import { MemoriesService } from '../../../src/nest/memories/memories.service';

const res = {} as import('express').Response;

describe('MemoriesService (delegation wrapper over services/memories/*)', () => {
  let svc: MemoriesService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new MemoriesService();
  });

  it('access check + broadcast forward verbatim', () => {
    helpers.canAccessUserPhoto.mockReturnValue(false);
    expect(svc.canAccessUserPhoto(1, 2, '5', 'a', 'immich')).toBe(false);
    expect(helpers.canAccessUserPhoto).toHaveBeenCalledWith(1, 2, '5', 'a', 'immich');

    svc.broadcast('5', 'memories:updated', { userId: 1 }, 'sock');
    expect(ws.broadcast).toHaveBeenCalledWith('5', 'memories:updated', { userId: 1 }, 'sock');
  });

  it('broadcast forwards an absent socket id as undefined', () => {
    svc.broadcast('5', 'memories:updated', { userId: 1 });
    expect(ws.broadcast).toHaveBeenCalledWith('5', 'memories:updated', { userId: 1 }, undefined);
  });

  it('unified methods delegate', async () => {
    svc.listTripPhotos('5', 7);
    expect(unified.listTripPhotos).toHaveBeenCalledWith('5', 7);

    const selections = [{ provider: 'immich', asset_ids: ['a'] }];
    await svc.addTripPhotos('5', 7, true, selections, 'sock');
    expect(unified.addTripPhotos).toHaveBeenCalledWith('5', 7, true, selections, 'sock');

    await svc.setTripPhotoSharing('5', 7, 9, false);
    expect(unified.setTripPhotoSharing).toHaveBeenCalledWith('5', 7, 9, false);

    svc.removeTripPhoto('5', 7, 9);
    expect(unified.removeTripPhoto).toHaveBeenCalledWith('5', 7, 9);

    svc.listTripAlbumLinks('5', 7);
    expect(unified.listTripAlbumLinks).toHaveBeenCalledWith('5', 7);

    svc.removeAlbumLink('5', 'l1', 7);
    expect(unified.removeAlbumLink).toHaveBeenCalledWith('5', 'l1', 7);
  });

  it('createTripAlbumLink forwards a passphrase when present and omits it when absent', () => {
    svc.createTripAlbumLink('5', 7, 'immich', 'a1', 'Trip', 'secret');
    expect(unified.createTripAlbumLink).toHaveBeenCalledWith('5', 7, 'immich', 'a1', 'Trip', 'secret');

    svc.createTripAlbumLink('5', 7, 'immich', 'a1', 'Trip');
    expect(unified.createTripAlbumLink).toHaveBeenLastCalledWith('5', 7, 'immich', 'a1', 'Trip', undefined);
  });

  it('immich methods delegate', async () => {
    svc.immichGetConnectionSettings(7);
    expect(immich.getConnectionSettings).toHaveBeenCalledWith(7);

    await svc.immichSaveSettings(7, 'u', 'k', '1.2.3.4');
    expect(immich.saveImmichSettings).toHaveBeenCalledWith(7, 'u', 'k', '1.2.3.4');

    svc.immichSetAutoUpload(7, true);
    expect(immich.setImmichAutoUpload).toHaveBeenCalledWith(7, true);

    await svc.immichGetConnectionStatus(7);
    expect(immich.getConnectionStatus).toHaveBeenCalledWith(7);

    await svc.immichTestConnection('u', 'k');
    expect(immich.testConnection).toHaveBeenCalledWith('u', 'k');

    await svc.immichBrowseTimeline(7);
    expect(immich.browseTimeline).toHaveBeenCalledWith(7);

    await svc.immichSearchPhotos(7, 'f', 't', 2, 50);
    expect(immich.searchPhotos).toHaveBeenCalledWith(7, 'f', 't', 2, 50);

    expect(svc.immichIsValidAssetId('abc')).toBe(true);
    expect(immich.isValidAssetId).toHaveBeenCalledWith('abc');

    await svc.immichGetAssetInfo(7, 'a', 2);
    expect(immich.getAssetInfo).toHaveBeenCalledWith(7, 'a', 2);

    await svc.immichStreamAsset(res, 7, 'a', 'thumbnail', 2);
    expect(immich.streamImmichAsset).toHaveBeenCalledWith(res, 7, 'a', 'thumbnail', 2);

    await svc.immichListAlbums(7);
    expect(immich.listAlbums).toHaveBeenCalledWith(7);

    await svc.immichGetAlbumPhotos(7, 'al1');
    expect(immich.getAlbumPhotos).toHaveBeenCalledWith(7, 'al1');

    await svc.immichSyncAlbumAssets('5', 'l1', 7, 'sock');
    expect(immich.syncAlbumAssets).toHaveBeenCalledWith('5', 'l1', 7, 'sock');
  });

  it('synology methods delegate', async () => {
    await svc.synologyGetSettings(7);
    expect(synology.getSynologySettings).toHaveBeenCalledWith(7);

    await svc.synologyUpdateSettings(7, 'u', 'a', 'p', true);
    expect(synology.updateSynologySettings).toHaveBeenCalledWith(7, 'u', 'a', 'p', true);

    await svc.synologyGetStatus(7);
    expect(synology.getSynologyStatus).toHaveBeenCalledWith(7);

    await svc.synologyTestConnection(7, 'u', 'a', 'p', '123', false);
    expect(synology.testSynologyConnection).toHaveBeenCalledWith(7, 'u', 'a', 'p', '123', false);

    await svc.synologyListAlbums(7);
    expect(synology.listSynologyAlbums).toHaveBeenCalledWith(7);

    await svc.synologySyncAlbumLink(7, '5', 'l1', 'sock');
    expect(synology.syncSynologyAlbumLink).toHaveBeenCalledWith(7, '5', 'l1', 'sock');

    await svc.synologySearchPhotos(7, 'f', 't', 0, 100);
    expect(synology.searchSynologyPhotos).toHaveBeenCalledWith(7, 'f', 't', 0, 100);
  });

  it('synology album-photos forwards a passphrase when present and omits it when absent', async () => {
    await svc.synologyGetAlbumPhotos(7, 'al1', 'secret');
    expect(synology.getSynologyAlbumPhotos).toHaveBeenCalledWith(7, 'al1', 'secret');

    await svc.synologyGetAlbumPhotos(7, 'al1');
    expect(synology.getSynologyAlbumPhotos).toHaveBeenLastCalledWith(7, 'al1', undefined);
  });

  it('synology asset-info + stream forward a passphrase when present and omit it when absent', async () => {
    await svc.synologyGetAssetInfo(7, 'p1', 2, 'secret');
    expect(synology.getSynologyAssetInfo).toHaveBeenCalledWith(7, 'p1', 2, 'secret');

    await svc.synologyGetAssetInfo(7, 'p1', 2);
    expect(synology.getSynologyAssetInfo).toHaveBeenLastCalledWith(7, 'p1', 2, undefined);

    await svc.synologyStreamAsset(res, 7, 2, 'p1', 'thumbnail', 'sm', 'secret');
    expect(synology.streamSynologyAsset).toHaveBeenCalledWith(res, 7, 2, 'p1', 'thumbnail', 'sm', 'secret');

    await svc.synologyStreamAsset(res, 7, 2, 'p1', 'original', 'xl');
    expect(synology.streamSynologyAsset).toHaveBeenLastCalledWith(res, 7, 2, 'p1', 'original', 'xl', undefined);
  });
});
