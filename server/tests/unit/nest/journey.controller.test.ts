import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';

import { JourneyController } from '../../../src/nest/journey/journey.controller';
import { JourneyPublicController } from '../../../src/nest/journey/journey-public.controller';
import { JourneyAddonGuard } from '../../../src/nest/journey/journey-addon.guard';
import type { JourneyService } from '../../../src/nest/journey/journey.service';
import type { User } from '../../../src/types';

const user = { id: 1, username: 'u', role: 'user', email: 'u@example.test' } as User;

function svc(o: Partial<JourneyService> = {}): JourneyService {
  return { journeyAddonEnabled: vi.fn().mockReturnValue(true), ...o } as unknown as JourneyService;
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

beforeEach(() => vi.clearAllMocks());

describe('JourneyAddonGuard', () => {
  it('404 when the addon is disabled, passes when enabled', () => {
    expect(thrown(() => new JourneyAddonGuard(svc({ journeyAddonEnabled: vi.fn().mockReturnValue(false) })).canActivate())).toEqual({ status: 404, body: { error: 'Journey addon is not enabled' } });
    expect(new JourneyAddonGuard(svc()).canActivate()).toBe(true);
  });
});

describe('JourneyController', () => {
  it('GET / lists; POST / 400 without title, else creates', () => {
    expect(new JourneyController(svc({ listJourneys: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<JourneyService>)).list(user)).toEqual({ journeys: [{ id: 1 }] });
    expect(thrown(() => new JourneyController(svc()).create(user, { title: '   ' }))).toEqual({ status: 400, body: { error: 'Title is required' } });
    const createJourney = vi.fn().mockReturnValue({ id: 9 });
    expect(new JourneyController(svc({ createJourney } as Partial<JourneyService>)).create(user, { title: ' Trip ', trip_ids: [1, '2'] })).toEqual({ id: 9 });
    expect(createJourney).toHaveBeenCalledWith(1, { title: 'Trip', subtitle: undefined, trip_ids: [1, 2] });
  });

  it('GET /suggestions + /available-trips', () => {
    expect(new JourneyController(svc({ getSuggestions: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<JourneyService>)).suggestions(user)).toEqual({ trips: [{ id: 1 }] });
    expect(new JourneyController(svc({ listUserTrips: vi.fn().mockReturnValue([{ id: 2 }]) } as Partial<JourneyService>)).availableTrips(user)).toEqual({ trips: [{ id: 2 }] });
  });

  it('PATCH/DELETE entries map 404', () => {
    expect(thrown(() => new JourneyController(svc({ updateEntry: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).updateEntry(user, '3', {}))).toEqual({ status: 404, body: { error: 'Entry not found' } });
    expect(new JourneyController(svc({ updateEntry: vi.fn().mockReturnValue({ id: 3 }) } as Partial<JourneyService>)).updateEntry(user, '3', { title: 'x' })).toEqual({ id: 3 });
    expect(thrown(() => new JourneyController(svc({ deleteEntry: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).deleteEntry(user, '3'))).toEqual({ status: 404, body: { error: 'Entry not found' } });
    expect(new JourneyController(svc({ deleteEntry: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).deleteEntry(user, '3')).toEqual({ success: true });
  });

  it('provider-photos: batch, single 400/403, success', () => {
    const batch = svc({ addProviderPhoto: vi.fn().mockReturnValue({ id: 1 }) } as Partial<JourneyService>);
    expect(new JourneyController(batch).providerPhotos(user, '3', { provider: 'immich', asset_ids: ['a', 'b'] })).toEqual({ photos: [{ id: 1 }, { id: 1 }], added: 2 });
    expect(thrown(() => new JourneyController(svc()).providerPhotos(user, '3', { provider: 'immich' }))).toEqual({ status: 400, body: { error: 'provider and asset_id required' } });
    expect(thrown(() => new JourneyController(svc({ addProviderPhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).providerPhotos(user, '3', { provider: 'immich', asset_id: 'a' }))).toEqual({ status: 403, body: { error: 'Not allowed or duplicate' } });
  });

  it('link-photo: 400 without id (accepts legacy photo_id), 403, success', () => {
    expect(thrown(() => new JourneyController(svc()).linkPhoto(user, '3', {}))).toEqual({ status: 400, body: { error: 'journey_photo_id required' } });
    const linkPhotoToEntry = vi.fn().mockReturnValue({ id: 5 });
    const c = new JourneyController(svc({ linkPhotoToEntry } as Partial<JourneyService>));
    expect(c.linkPhoto(user, '3', { photo_id: 5 })).toEqual({ id: 5 });
    expect(linkPhotoToEntry).toHaveBeenCalledWith(3, 5, 1);
    // accepts the canonical journey_photo_id, 403 when the service refuses
    expect(thrown(() => new JourneyController(svc({ linkPhotoToEntry: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).linkPhoto(user, '3', { journey_photo_id: 9 }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it('unlink photo (204) maps 404; delete photo 404 then unlinks file', () => {
    expect(thrown(() => new JourneyController(svc({ unlinkPhotoFromEntry: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).unlinkPhoto(user, '3', '7'))).toEqual({ status: 404, body: { error: 'Not found or not allowed' } });
    expect(new JourneyController(svc({ unlinkPhotoFromEntry: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).unlinkPhoto(user, '3', '7')).toBeUndefined();
    expect(thrown(() => new JourneyController(svc({ deletePhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).deletePhoto(user, '7'))).toEqual({ status: 404, body: { error: 'Photo not found' } });
    expect(new JourneyController(svc({ deletePhoto: vi.fn().mockReturnValue({ id: 7, file_path: null }) } as Partial<JourneyService>)).deletePhoto(user, '7')).toEqual({ success: true });
  });

  it('gallery upload 400 no files / 403 not allowed, else returns photos', () => {
    expect(thrown(() => new JourneyController(svc()).uploadGalleryPhotos(user, '3', undefined))).toEqual({ status: 400, body: { error: 'No files uploaded' } });
    expect(thrown(() => new JourneyController(svc({ uploadGalleryPhotos: vi.fn().mockReturnValue([]) } as Partial<JourneyService>)).uploadGalleryPhotos(user, '3', [{ filename: 'a.jpg' } as Express.Multer.File]))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(new JourneyController(svc({ uploadGalleryPhotos: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<JourneyService>)).uploadGalleryPhotos(user, '3', [{ filename: 'a.jpg' } as Express.Multer.File])).toEqual({ photos: [{ id: 1 }] });
  });

  it('gallery video: 400 no video, 403 not allowed, else stores the clip + poster (#823)', () => {
    const files = { video: [{ filename: 'v.mp4' } as Express.Multer.File], poster: [{ filename: 'p.jpg' } as Express.Multer.File] };
    expect(thrown(() => new JourneyController(svc()).uploadGalleryVideo(user, '3', {}, {}))).toEqual({ status: 400, body: { error: 'No video uploaded' } });
    // Rejected with real paths → the cleanup unlinks the orphaned bytes (the files
    // don't exist, so the best-effort catch swallows it).
    const withPaths = { video: [{ filename: 'v.mp4', path: '/nonexistent/v.mp4' } as Express.Multer.File], poster: [{ filename: 'p.jpg', path: '/nonexistent/p.jpg' } as Express.Multer.File] };
    expect(thrown(() => new JourneyController(svc({ uploadGalleryPhotos: vi.fn().mockReturnValue([]) } as Partial<JourneyService>)).uploadGalleryVideo(user, '3', withPaths, { duration_ms: 'abc' }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    const up = vi.fn().mockReturnValue([{ id: 7 }]);
    expect(new JourneyController(svc({ uploadGalleryPhotos: up } as Partial<JourneyService>)).uploadGalleryVideo(user, '3', files, { duration_ms: '4200' })).toEqual({ photos: [{ id: 7 }] });
    expect(up).toHaveBeenCalledWith(3, 1, [{ path: 'journey/v.mp4', thumbnail: 'journey/p.jpg', mediaType: 'video', durationMs: 4200 }]);

    // No poster + no duration → thumbnail undefined, durationMs null.
    const up2 = vi.fn().mockReturnValue([{ id: 8 }]);
    new JourneyController(svc({ uploadGalleryPhotos: up2 } as Partial<JourneyService>)).uploadGalleryVideo(user, '3', { video: [{ filename: 'v2.mp4' } as Express.Multer.File] }, {});
    expect(up2).toHaveBeenCalledWith(3, 1, [{ path: 'journey/v2.mp4', thumbnail: undefined, mediaType: 'video', durationMs: null }]);
  });

  it('provider-photos forwards per-asset media_types for gallery and entries (#823)', () => {
    const add = vi.fn().mockReturnValue({ id: 1 });
    new JourneyController(svc({ addProviderPhotoToGallery: add } as Partial<JourneyService>)).galleryProviderPhotos(user, '9', { provider: 'immich', asset_ids: ['a', 'b'], media_types: ['video', 'image'] });
    expect(add).toHaveBeenNthCalledWith(1, 9, 1, 'immich', 'a', undefined, undefined, 'video');
    expect(add).toHaveBeenNthCalledWith(2, 9, 1, 'immich', 'b', undefined, undefined, 'image');
    const addOne = vi.fn().mockReturnValue({ id: 2 });
    new JourneyController(svc({ addProviderPhotoToGallery: addOne } as Partial<JourneyService>)).galleryProviderPhotos(user, '9', { provider: 'immich', asset_id: 'c', media_type: 'video' });
    expect(addOne).toHaveBeenCalledWith(9, 1, 'immich', 'c', undefined, undefined, 'video');

    // Entry path mirrors the gallery path.
    const eAdd = vi.fn().mockReturnValue({ id: 3 });
    new JourneyController(svc({ addProviderPhoto: eAdd } as Partial<JourneyService>)).providerPhotos(user, '4', { provider: 'immich', asset_ids: ['x'], media_types: ['video'], caption: 'c' });
    expect(eAdd).toHaveBeenNthCalledWith(1, 4, 1, 'immich', 'x', 'c', undefined, 'video');
    const eOne = vi.fn().mockReturnValue({ id: 4 });
    new JourneyController(svc({ addProviderPhoto: eOne } as Partial<JourneyService>)).providerPhotos(user, '4', { provider: 'immich', asset_id: 'y', media_type: 'video' });
    expect(eOne).toHaveBeenCalledWith(4, 1, 'immich', 'y', undefined, undefined, 'video');
  });

  it('GET/PATCH/DELETE /:id map 404', () => {
    expect(thrown(() => new JourneyController(svc({ getJourneyFull: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).get(user, '9'))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(new JourneyController(svc({ getJourneyFull: vi.fn().mockReturnValue({ id: 9 }) } as Partial<JourneyService>)).get(user, '9')).toEqual({ id: 9 });
    expect(thrown(() => new JourneyController(svc({ updateJourney: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).update(user, '9', {}))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(thrown(() => new JourneyController(svc({ deleteJourney: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).remove(user, '9'))).toEqual({ status: 404, body: { error: 'Journey not found' } });
  });

  it('trips: POST 400 without trip_id / 403, DELETE 403', () => {
    expect(thrown(() => new JourneyController(svc()).addTrip(user, '9', {}))).toEqual({ status: 400, body: { error: 'trip_id required' } });
    expect(thrown(() => new JourneyController(svc({ addTripToJourney: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).addTrip(user, '9', { trip_id: 2 }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(new JourneyController(svc({ addTripToJourney: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).addTrip(user, '9', { trip_id: 2 })).toEqual({ success: true });
    expect(thrown(() => new JourneyController(svc({ removeTripFromJourney: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).removeTrip(user, '9', '2'))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it('entries under journey: list 404, create 400/404, reorder 400/403', () => {
    expect(thrown(() => new JourneyController(svc({ listEntries: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).listEntries(user, '9'))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(new JourneyController(svc({ listEntries: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<JourneyService>)).listEntries(user, '9')).toEqual({ entries: [{ id: 1 }] });
    expect(thrown(() => new JourneyController(svc()).createEntry(user, '9', {}))).toEqual({ status: 400, body: { error: 'entry_date is required' } });
    expect(thrown(() => new JourneyController(svc({ createEntry: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).createEntry(user, '9', { entry_date: '2026-01-01' }))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(thrown(() => new JourneyController(svc()).reorderEntries(user, '9', { orderedIds: 'no' }))).toEqual({ status: 400, body: { error: 'orderedIds must be an array of numbers' } });
    expect(thrown(() => new JourneyController(svc({ reorderEntries: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).reorderEntries(user, '9', { orderedIds: [1, 2] }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it('contributors: add 400/403, update 403, remove 403', () => {
    expect(thrown(() => new JourneyController(svc()).addContributor(user, '9', {}))).toEqual({ status: 400, body: { error: 'user_id required' } });
    expect(thrown(() => new JourneyController(svc({ addContributor: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).addContributor(user, '9', { user_id: 2 }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(new JourneyController(svc({ addContributor: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).addContributor(user, '9', { user_id: 2 })).toEqual({ success: true });
    expect(thrown(() => new JourneyController(svc({ updateContributorRole: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).updateContributor(user, '9', '2', { role: 'editor' }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(thrown(() => new JourneyController(svc({ removeContributor: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).removeContributor(user, '9', '2'))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it('preferences 403, share-link get/set/delete', () => {
    expect(thrown(() => new JourneyController(svc({ updateJourneyPreferences: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).preferences(user, '9', {}))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(new JourneyController(svc({ getJourneyShareLink: vi.fn().mockReturnValue({ token: 'abc' }) } as Partial<JourneyService>)).getShareLink(user, '9')).toEqual({ link: { token: 'abc' } });
    expect(thrown(() => new JourneyController(svc({ createOrUpdateJourneyShareLink: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).setShareLink(user, '9', {}))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(new JourneyController(svc({ createOrUpdateJourneyShareLink: vi.fn().mockReturnValue({ token: 'abc' }) } as Partial<JourneyService>)).setShareLink(user, '9', { share_timeline: true })).toEqual({ token: 'abc' });
    expect(thrown(() => new JourneyController(svc({ deleteJourneyShareLink: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).deleteShareLink(user, '9'))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it('entry photo upload mirrors to Immich only when opted in', async () => {
    const addPhoto = vi.fn().mockReturnValue({ id: 5 });
    const uploadToImmich = vi.fn().mockResolvedValue('immich-1');
    const setPhotoProvider = vi.fn();
    const s = svc({ addPhoto, immichAutoUploadEnabled: vi.fn().mockReturnValue(true), uploadToImmich, setPhotoProvider } as Partial<JourneyService>);
    const res = await new JourneyController(s).uploadEntryPhotos(user, '3', [{ filename: 'a.jpg', originalname: 'a.jpg' } as Express.Multer.File], {});
    expect(setPhotoProvider).toHaveBeenCalledWith(5, 'immich', 'immich-1', 1);
    expect(res).toEqual({ photos: [{ id: 5, provider: 'immich', asset_id: 'immich-1', owner_id: 1 }] });

    const noOptIn = svc({ addPhoto: vi.fn().mockReturnValue({ id: 6 }), immichAutoUploadEnabled: vi.fn().mockReturnValue(false), uploadToImmich } as Partial<JourneyService>);
    await new JourneyController(noOptIn).uploadEntryPhotos(user, '3', [{ filename: 'b.jpg', originalname: 'b.jpg' } as Express.Multer.File], {});
    expect(uploadToImmich).toHaveBeenCalledTimes(1); // only the opted-in upload above
  });

  it('entry photo upload: 400 no files, 403 when nothing added, swallows immich errors and empty ids', async () => {
    expect(await thrownAsync(() => new JourneyController(svc()).uploadEntryPhotos(user, '3', undefined, {}))).toEqual({ status: 400, body: { error: 'No files uploaded' } });
    expect(await thrownAsync(() => new JourneyController(svc({ addPhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).uploadEntryPhotos(user, '3', [{ filename: 'a.jpg', originalname: 'a.jpg' } as Express.Multer.File], {}))).toEqual({ status: 403, body: { error: 'Not allowed' } });

    // opted in but the immich upload throws → best-effort, the local photo still wins
    const setPhotoProvider = vi.fn();
    const blowsUp = svc({ addPhoto: vi.fn().mockReturnValue({ id: 8 }), immichAutoUploadEnabled: vi.fn().mockReturnValue(true), uploadToImmich: vi.fn().mockRejectedValue(new Error('immich down')), setPhotoProvider } as Partial<JourneyService>);
    expect(await new JourneyController(blowsUp).uploadEntryPhotos(user, '3', [{ filename: 'a.jpg', originalname: 'a.jpg' } as Express.Multer.File], { caption: 'c' })).toEqual({ photos: [{ id: 8 }] });
    expect(setPhotoProvider).not.toHaveBeenCalled();

    // opted in but immich returns a falsy id → no provider stamping
    const noId = svc({ addPhoto: vi.fn().mockReturnValue({ id: 9 }), immichAutoUploadEnabled: vi.fn().mockReturnValue(true), uploadToImmich: vi.fn().mockResolvedValue(''), setPhotoProvider } as Partial<JourneyService>);
    expect(await new JourneyController(noId).uploadEntryPhotos(user, '3', [{ filename: 'a.jpg', originalname: 'a.jpg' } as Express.Multer.File], {})).toEqual({ photos: [{ id: 9 }] });
  });

  it('provider-photos batch passes the passphrase through when present', () => {
    const addProviderPhoto = vi.fn().mockReturnValue({ id: 1 });
    new JourneyController(svc({ addProviderPhoto } as Partial<JourneyService>)).providerPhotos(user, '3', { provider: 'immich', asset_ids: ['a'], caption: 'cap', passphrase: 'secret' });
    expect(addProviderPhoto).toHaveBeenCalledWith(3, 1, 'immich', 'a', 'cap', 'secret', 'image');
    // single-photo success path
    expect(new JourneyController(svc({ addProviderPhoto: vi.fn().mockReturnValue({ id: 2 }) } as Partial<JourneyService>)).providerPhotos(user, '3', { provider: 'immich', asset_id: 'a' })).toEqual({ id: 2 });
  });

  it('PATCH photos: 404 then returns the updated photo', () => {
    expect(thrown(() => new JourneyController(svc({ updatePhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).updatePhoto(user, '7', { caption: 'x' }))).toEqual({ status: 404, body: { error: 'Photo not found' } });
    expect(new JourneyController(svc({ updatePhoto: vi.fn().mockReturnValue({ id: 7 }) } as Partial<JourneyService>)).updatePhoto(user, '7', { caption: 'x' })).toEqual({ id: 7 });
  });

  it('DELETE photo unlinks the file when a path exists', () => {
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
    try {
      expect(new JourneyController(svc({ deletePhoto: vi.fn().mockReturnValue({ id: 7, file_path: 'journey/a.jpg' }) } as Partial<JourneyService>)).deletePhoto(user, '7')).toEqual({ success: true });
      expect(unlinkSpy).toHaveBeenCalledTimes(1);
      // a vanished file is swallowed
      unlinkSpy.mockImplementationOnce(() => { throw new Error('ENOENT'); });
      expect(new JourneyController(svc({ deletePhoto: vi.fn().mockReturnValue({ id: 8, file_path: 'journey/b.jpg' }) } as Partial<JourneyService>)).deletePhoto(user, '8')).toEqual({ success: true });
    } finally {
      unlinkSpy.mockRestore();
    }
  });

  it('gallery provider-photos: batch (with passphrase), single 400/403, success', () => {
    const addProviderPhotoToGallery = vi.fn().mockReturnValue({ id: 1 });
    const batch = new JourneyController(svc({ addProviderPhotoToGallery } as Partial<JourneyService>));
    expect(batch.galleryProviderPhotos(user, '9', { provider: 'immich', asset_ids: ['a', 'b'], passphrase: 'pw' })).toEqual({ photos: [{ id: 1 }, { id: 1 }], added: 2 });
    expect(addProviderPhotoToGallery).toHaveBeenCalledWith(9, 1, 'immich', 'a', undefined, 'pw', 'image');
    expect(thrown(() => new JourneyController(svc()).galleryProviderPhotos(user, '9', { provider: 'immich' }))).toEqual({ status: 400, body: { error: 'provider and asset_id required' } });
    expect(thrown(() => new JourneyController(svc({ addProviderPhotoToGallery: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).galleryProviderPhotos(user, '9', { provider: 'immich', asset_id: 'a' }))).toEqual({ status: 403, body: { error: 'Not allowed or duplicate' } });
    expect(new JourneyController(svc({ addProviderPhotoToGallery: vi.fn().mockReturnValue({ id: 3 }) } as Partial<JourneyService>)).galleryProviderPhotos(user, '9', { provider: 'immich', asset_id: 'a' })).toEqual({ id: 3 });
  });

  it('DELETE gallery photo: 404, then unlinks the file when present', () => {
    expect(thrown(() => new JourneyController(svc({ deleteGalleryPhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).deleteGalleryPhoto(user, '7'))).toEqual({ status: 404, body: { error: 'Photo not found or not allowed' } });
    // no file_path → nothing to unlink, returns void
    expect(new JourneyController(svc({ deleteGalleryPhoto: vi.fn().mockReturnValue({ id: 7, file_path: null }) } as Partial<JourneyService>)).deleteGalleryPhoto(user, '7')).toBeUndefined();
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
    try {
      new JourneyController(svc({ deleteGalleryPhoto: vi.fn().mockReturnValue({ id: 8, file_path: 'journey/g.jpg' }) } as Partial<JourneyService>)).deleteGalleryPhoto(user, '8');
      expect(unlinkSpy).toHaveBeenCalledTimes(1);
      unlinkSpy.mockImplementationOnce(() => { throw new Error('ENOENT'); });
      expect(new JourneyController(svc({ deleteGalleryPhoto: vi.fn().mockReturnValue({ id: 9, file_path: 'journey/h.jpg' }) } as Partial<JourneyService>)).deleteGalleryPhoto(user, '9')).toBeUndefined();
    } finally {
      unlinkSpy.mockRestore();
    }
  });

  it('PATCH /:id returns the updated journey on success', () => {
    expect(new JourneyController(svc({ updateJourney: vi.fn().mockReturnValue({ id: 9 }) } as Partial<JourneyService>)).update(user, '9', { title: 'x' })).toEqual({ id: 9 });
  });

  it('cover upload: 400 without file, 404 when the journey is gone, else returns the journey', () => {
    expect(thrown(() => new JourneyController(svc()).cover(user, '9', undefined))).toEqual({ status: 400, body: { error: 'No file uploaded' } });
    expect(thrown(() => new JourneyController(svc({ updateJourney: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).cover(user, '9', { filename: 'c.jpg' } as Express.Multer.File))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    const updateJourney = vi.fn().mockReturnValue({ id: 9, cover_image: 'journey/c.jpg' });
    expect(new JourneyController(svc({ updateJourney } as Partial<JourneyService>)).cover(user, '9', { filename: 'c.jpg' } as Express.Multer.File)).toEqual({ id: 9, cover_image: 'journey/c.jpg' });
    expect(updateJourney).toHaveBeenCalledWith(9, 1, { cover_image: 'journey/c.jpg' });
  });

  it('DELETE /:id and trips/contributors success paths', () => {
    expect(new JourneyController(svc({ deleteJourney: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).remove(user, '9')).toEqual({ success: true });
    expect(new JourneyController(svc({ removeTripFromJourney: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).removeTrip(user, '9', '2')).toEqual({ success: true });
    expect(new JourneyController(svc({ updateContributorRole: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).updateContributor(user, '9', '2', { role: 'editor' })).toEqual({ success: true });
    expect(new JourneyController(svc({ removeContributor: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).removeContributor(user, '9', '2')).toEqual({ success: true });
  });

  it('addContributor defaults the role to viewer when omitted', () => {
    const addContributor = vi.fn().mockReturnValue(true);
    new JourneyController(svc({ addContributor } as Partial<JourneyService>)).addContributor(user, '9', { user_id: 2 });
    expect(addContributor).toHaveBeenCalledWith(9, 1, 2, 'viewer');
  });

  it('createEntry returns the entry when the journey exists', () => {
    expect(new JourneyController(svc({ createEntry: vi.fn().mockReturnValue({ id: 4 }) } as Partial<JourneyService>)).createEntry(user, '9', { entry_date: '2026-01-01' })).toEqual({ id: 4 });
  });

  it('reorderEntries succeeds for a numeric array', () => {
    expect(new JourneyController(svc({ reorderEntries: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).reorderEntries(user, '9', { orderedIds: [3, 1, 2] })).toEqual({ success: true });
  });

  it('preferences returns the result on success', () => {
    expect(new JourneyController(svc({ updateJourneyPreferences: vi.fn().mockReturnValue({ ok: true }) } as Partial<JourneyService>)).preferences(user, '9', { theme: 'dark' })).toEqual({ ok: true });
  });

  it('deleteShareLink returns success when removed', () => {
    expect(new JourneyController(svc({ deleteJourneyShareLink: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).deleteShareLink(user, '9')).toEqual({ success: true });
  });
});

describe('JourneyPublicController', () => {
  it('GET /:token 404 / json', () => {
    expect(thrown(() => new JourneyPublicController(svc({ getPublicJourney: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).get('tok'))).toEqual({ status: 404, body: { error: 'Not found' } });
    expect(new JourneyPublicController(svc({ getPublicJourney: vi.fn().mockReturnValue({ id: 1 }) } as Partial<JourneyService>)).get('tok')).toEqual({ id: 1 });
  });

  it('photo proxy 404 on invalid token, else streams', async () => {
    expect(await thrownAsync(() => new JourneyPublicController(svc({ validateShareTokenForPhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).photo('tok', '7', 'thumbnail', {} as Response))).toEqual({ status: 404, body: { error: 'Not found' } });
    const streamPhoto = vi.fn().mockResolvedValue(undefined);
    const s = svc({ validateShareTokenForPhoto: vi.fn().mockReturnValue({ ownerId: 2 }), streamPhoto } as Partial<JourneyService>);
    await new JourneyPublicController(s).photo('tok', '7', 'original', {} as Response);
    expect(streamPhoto).toHaveBeenCalledWith({}, 2, 7, 'original');
  });

  it('legacy photo proxy: 404 invalid token, immich path streams', async () => {
    expect(await thrownAsync(() => new JourneyPublicController(svc({ validateShareTokenForAsset: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).legacyPhoto('tok', 'immich', 'a1', '2', 'thumbnail', {} as Response))).toEqual({ status: 404, body: { error: 'Not found' } });
    const streamImmichAsset = vi.fn().mockResolvedValue(undefined);
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }), streamImmichAsset } as Partial<JourneyService>);
    await new JourneyPublicController(s).legacyPhoto('tok', 'immich', 'a1', '2', 'original', {} as Response);
    expect(streamImmichAsset).toHaveBeenCalledWith({}, 5, 'a1', 'original', 5);
  });

  it('photo proxy streams thumbnails too', async () => {
    const streamPhoto = vi.fn().mockResolvedValue(undefined);
    const s = svc({ validateShareTokenForPhoto: vi.fn().mockReturnValue({ ownerId: 3 }), streamPhoto } as Partial<JourneyService>);
    await new JourneyPublicController(s).photo('tok', '7', 'thumbnail', {} as Response);
    expect(streamPhoto).toHaveBeenCalledWith({}, 3, 7, 'thumbnail');
  });

  it('legacy photo proxy: synology streams, and a failure becomes a 404 json', async () => {
    const streamSynologyAsset = vi.fn().mockResolvedValue(undefined);
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }), streamSynologyAsset } as Partial<JourneyService>);
    await new JourneyPublicController(s).legacyPhoto('tok', 'synology', 'a1', '2', 'thumbnail', {} as Response);
    expect(streamSynologyAsset).toHaveBeenCalledWith({}, 5, 5, 'a1', 'thumbnail');

    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json } as unknown as Response;
    const failing = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 0 }), streamSynologyAsset: vi.fn().mockRejectedValue(new Error('no synology')) } as Partial<JourneyService>);
    await new JourneyPublicController(failing).legacyPhoto('tok', 'synology', 'a1', '6', 'original', res);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'Provider not supported' });
  });

  it('legacy photo proxy: falls back to the path ownerId when the token has none', async () => {
    const streamImmichAsset = vi.fn().mockResolvedValue(undefined);
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 0 }), streamImmichAsset } as Partial<JourneyService>);
    await new JourneyPublicController(s).legacyPhoto('tok', 'immich', 'a1', '8', 'original', {} as Response);
    expect(streamImmichAsset).toHaveBeenCalledWith({}, 8, 'a1', 'original', 8);
  });

  it('legacy photo proxy: local provider 404s when the resolved file does not exist', async () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    try {
      const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }) } as Partial<JourneyService>);
      expect(await thrownAsync(() => new JourneyPublicController(s).legacyPhoto('tok', 'local', 'gone.jpg', '2', 'thumbnail', {} as Response))).toEqual({ status: 404, body: { error: 'Not found' } });
    } finally {
      existsSpy.mockRestore();
    }
  });

  it('legacy photo proxy: local provider cannot escape uploads/journey via a traversal asset id', async () => {
    // Pretend any path exists so we can inspect exactly what would be served.
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    try {
      const sendFile = vi.fn();
      const res = { set: vi.fn(), sendFile } as unknown as Response;
      const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }) } as Partial<JourneyService>);

      // Express decodes %2F in a single path param to '/', so the handler sees this.
      await new JourneyPublicController(s).legacyPhoto('tok', 'local', '../../files/secret.pdf', '2', 'original', res);

      expect(sendFile).toHaveBeenCalledTimes(1);
      const served = sendFile.mock.calls[0][0] as string;
      // basename() collapses the traversal: the served file stays inside
      // uploads/journey and never reaches the sibling /uploads/files dir.
      expect(path.basename(served)).toBe('secret.pdf');
      expect(served).toMatch(/[\\/]journey[\\/]secret\.pdf$/);
      expect(served).not.toMatch(/[\\/]files[\\/]/);
    } finally {
      existsSpy.mockRestore();
    }
  });
});
