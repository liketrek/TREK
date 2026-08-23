import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Response } from 'express';

import { JourneyController } from '../../../src/nest/journey/journey.controller';
import { journeyThumbName } from '../../../src/nest/memories/thumbnail.service';
import type { PhotoCaptureBackfillService } from '../../../src/nest/memories/photo-capture-backfill.service';
import { JourneyPublicController } from '../../../src/nest/journey/journey-public.controller';
import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { ADDON_IDS } from '../../../src/addons';
import type { JourneyService } from '../../../src/nest/journey/journey.service';
import type { JourneyBookService } from '../../../src/nest/journey/journey-book.service';
import type { StorageService } from '../../../src/nest/storage/storage.service';
import type { User } from '../../../src/types';

const user = { id: 1, username: 'u', role: 'user', email: 'u@example.test' } as User;

function svc(o: Partial<JourneyService> = {}): JourneyService {
  return { journeyAddonEnabled: vi.fn().mockReturnValue(true), ...o } as unknown as JourneyService;
}

const storageExists = vi.fn();
const storageSendToResponse = vi.fn();
const storageStub = {
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  exists: storageExists,
  sendToResponse: storageSendToResponse,
} as unknown as StorageService;
// The capture backfill is detached and irrelevant to every case here — it only has
// to exist so the constructor can call it.
const captureBackfillStub = { schedule: vi.fn(), run: vi.fn() } as unknown as PhotoCaptureBackfillService;

/**
 * Build the controller.
 *
 * Storage and the Studio book (#1973) are injected dependencies that almost no
 * case here is about, and naming all four at every call site is what made the
 * previous shape unmaintainable — a fifth dependency would have meant touching
 * ninety lines. Both are stubbed: pass a partial book when the case IS about
 * the book, and reach for `storageStub`'s own mocks when it is about an object
 * being stored or served.
 */
function ctl(service: JourneyService, books: Partial<JourneyBookService> = {}): JourneyController {
  return new JourneyController(service, storageStub, books as JourneyBookService, captureBackfillStub);
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

describe('JourneyController', () => {
  it('GET / lists; POST / 400 without title, else creates', () => {
    expect(ctl(svc({ listJourneys: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<JourneyService>)).list(user)).toEqual({ journeys: [{ id: 1 }] });
    expect(thrown(() => ctl(svc()).create(user, { title: '   ' }))).toEqual({ status: 400, body: { error: 'Title is required' } });
    const createJourney = vi.fn().mockReturnValue({ id: 9 });
    expect(ctl(svc({ createJourney } as Partial<JourneyService>)).create(user, { title: ' Trip ', trip_ids: [1, '2'] })).toEqual({ id: 9 });
    expect(createJourney).toHaveBeenCalledWith(1, { title: 'Trip', subtitle: undefined, trip_ids: [1, 2] });
  });

  it('GET /suggestions + /available-trips', () => {
    expect(ctl(svc({ getSuggestions: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<JourneyService>)).suggestions(user)).toEqual({ trips: [{ id: 1 }] });
    expect(ctl(svc({ listUserTrips: vi.fn().mockReturnValue([{ id: 2 }]) } as Partial<JourneyService>)).availableTrips(user)).toEqual({ trips: [{ id: 2 }] });
  });

  it('PATCH/DELETE entries map 404', () => {
    expect(thrown(() => ctl(svc({ updateEntry: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).updateEntry(user, '3', {}))).toEqual({ status: 404, body: { error: 'Entry not found' } });
    expect(ctl(svc({ updateEntry: vi.fn().mockReturnValue({ id: 3 }) } as Partial<JourneyService>)).updateEntry(user, '3', { title: 'x' })).toEqual({ id: 3 });
    expect(thrown(() => ctl(svc({ deleteEntry: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).deleteEntry(user, '3'))).toEqual({ status: 404, body: { error: 'Entry not found' } });
    expect(ctl(svc({ deleteEntry: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).deleteEntry(user, '3')).toEqual({ success: true });
  });

  it('provider-photos: batch, single 400/403, success', () => {
    const batch = svc({ addProviderPhoto: vi.fn().mockReturnValue({ id: 1 }) } as Partial<JourneyService>);
    expect(ctl(batch).providerPhotos(user, '3', { provider: 'immich', asset_ids: ['a', 'b'] })).toEqual({ photos: [{ id: 1 }, { id: 1 }], added: 2 });
    expect(thrown(() => ctl(svc()).providerPhotos(user, '3', { provider: 'immich' }))).toEqual({ status: 400, body: { error: 'provider and asset_id required' } });
    expect(thrown(() => ctl(svc({ addProviderPhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).providerPhotos(user, '3', { provider: 'immich', asset_id: 'a' }))).toEqual({ status: 403, body: { error: 'Not allowed or duplicate' } });
  });

  it('link-photo: 400 without id (accepts legacy photo_id), 403, success', () => {
    expect(thrown(() => ctl(svc()).linkPhoto(user, '3', {}))).toEqual({ status: 400, body: { error: 'journey_photo_id required' } });
    const linkPhotoToEntry = vi.fn().mockReturnValue({ id: 5 });
    const c = ctl(svc({ linkPhotoToEntry } as Partial<JourneyService>));
    expect(c.linkPhoto(user, '3', { photo_id: 5 })).toEqual({ id: 5 });
    expect(linkPhotoToEntry).toHaveBeenCalledWith(3, 5, 1);
    // accepts the canonical journey_photo_id, 403 when the service refuses
    expect(thrown(() => ctl(svc({ linkPhotoToEntry: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).linkPhoto(user, '3', { journey_photo_id: 9 }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it('unlink photo (204) maps 404; delete photo 404 then removes the object', async () => {
    expect(thrown(() => ctl(svc({ unlinkPhotoFromEntry: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).unlinkPhoto(user, '3', '7'))).toEqual({ status: 404, body: { error: 'Not found or not allowed' } });
    expect(ctl(svc({ unlinkPhotoFromEntry: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).unlinkPhoto(user, '3', '7')).toBeUndefined();
    expect(await thrownAsync(() => ctl(svc({ deletePhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).deletePhoto(user, '7'))).toEqual({ status: 404, body: { error: 'Photo not found' } });
    expect(await ctl(svc({ deletePhoto: vi.fn().mockReturnValue({ id: 7, file_path: null }) } as Partial<JourneyService>)).deletePhoto(user, '7')).toEqual({ success: true });
  });

  it('gallery upload 400 no files / 403 not allowed, else commits + returns photos', async () => {
    expect(await thrownAsync(() => ctl(svc()).uploadGalleryPhotos(user, '3', undefined))).toEqual({ status: 400, body: { error: 'No files uploaded' } });
    expect(await thrownAsync(() => ctl(svc({ uploadGalleryPhotos: vi.fn().mockReturnValue([]) } as Partial<JourneyService>)).uploadGalleryPhotos(user, '3', [{ filename: 'a.jpg' } as Express.Multer.File]))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(await ctl(svc({ uploadGalleryPhotos: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<JourneyService>)).uploadGalleryPhotos(user, '3', [{ filename: 'a.jpg' } as Express.Multer.File])).toEqual({ photos: [{ id: 1 }] });
    expect(storageStub.put).toHaveBeenCalledWith('journey', 'a.jpg', { tmpPath: undefined });
  });

  it('gallery video: 400 no video, 403 not allowed, else stores the clip + poster (#823)', async () => {
    const files = { video: [{ filename: 'v.mp4' } as Express.Multer.File], poster: [{ filename: 'p.jpg' } as Express.Multer.File] };
    expect(await thrownAsync(() => ctl(svc()).uploadGalleryVideo(user, '3', {}, {}))).toEqual({ status: 400, body: { error: 'No video uploaded' } });
    // Not-allowed after commit → the final objects are deleted through storage
    // (the pre-commit unlink would miss them: file.path is already consumed).
    const withPaths = { video: [{ filename: 'v.mp4', path: '/nonexistent/v.mp4' } as Express.Multer.File], poster: [{ filename: 'p.jpg', path: '/nonexistent/p.jpg' } as Express.Multer.File] };
    expect(await thrownAsync(() => ctl(svc({ uploadGalleryPhotos: vi.fn().mockReturnValue([]) } as Partial<JourneyService>)).uploadGalleryVideo(user, '3', withPaths, { duration_ms: 'abc' }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(storageStub.delete).toHaveBeenCalledWith('journey', 'v.mp4');
    expect(storageStub.delete).toHaveBeenCalledWith('journey', 'p.jpg');
    const up = vi.fn().mockReturnValue([{ id: 7 }]);
    expect(await ctl(svc({ uploadGalleryPhotos: up } as Partial<JourneyService>)).uploadGalleryVideo(user, '3', files, { duration_ms: '4200' })).toEqual({ photos: [{ id: 7 }] });
    expect(up).toHaveBeenCalledWith(3, 1, [{ path: 'journey/v.mp4', thumbnail: 'journey/p.jpg', mediaType: 'video', durationMs: 4200 }]);

    // No poster + no duration → thumbnail undefined, durationMs null.
    const up2 = vi.fn().mockReturnValue([{ id: 8 }]);
    await ctl(svc({ uploadGalleryPhotos: up2 } as Partial<JourneyService>)).uploadGalleryVideo(user, '3', { video: [{ filename: 'v2.mp4' } as Express.Multer.File] }, {});
    expect(up2).toHaveBeenCalledWith(3, 1, [{ path: 'journey/v2.mp4', thumbnail: undefined, mediaType: 'video', durationMs: null }]);
  });

  it('provider-photos forwards per-asset media_types for gallery and entries (#823)', () => {
    const add = vi.fn().mockReturnValue({ id: 1 });
    ctl(svc({ addProviderPhotoToGallery: add } as Partial<JourneyService>)).galleryProviderPhotos(user, '9', { provider: 'immich', asset_ids: ['a', 'b'], media_types: ['video', 'image'] });
    expect(add).toHaveBeenNthCalledWith(1, 9, 1, 'immich', 'a', undefined, undefined, 'video');
    expect(add).toHaveBeenNthCalledWith(2, 9, 1, 'immich', 'b', undefined, undefined, 'image');
    const addOne = vi.fn().mockReturnValue({ id: 2 });
    ctl(svc({ addProviderPhotoToGallery: addOne } as Partial<JourneyService>)).galleryProviderPhotos(user, '9', { provider: 'immich', asset_id: 'c', media_type: 'video' });
    expect(addOne).toHaveBeenCalledWith(9, 1, 'immich', 'c', undefined, undefined, 'video');

    // Entry path mirrors the gallery path.
    const eAdd = vi.fn().mockReturnValue({ id: 3 });
    ctl(svc({ addProviderPhoto: eAdd } as Partial<JourneyService>)).providerPhotos(user, '4', { provider: 'immich', asset_ids: ['x'], media_types: ['video'], caption: 'c' });
    expect(eAdd).toHaveBeenNthCalledWith(1, 4, 1, 'immich', 'x', 'c', undefined, 'video');
    const eOne = vi.fn().mockReturnValue({ id: 4 });
    ctl(svc({ addProviderPhoto: eOne } as Partial<JourneyService>)).providerPhotos(user, '4', { provider: 'immich', asset_id: 'y', media_type: 'video' });
    expect(eOne).toHaveBeenCalledWith(4, 1, 'immich', 'y', undefined, undefined, 'video');
  });

  it('GET/PATCH/DELETE /:id map 404', () => {
    expect(thrown(() => ctl(svc({ getJourneyFull: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).get(user, '9'))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(ctl(svc({ getJourneyFull: vi.fn().mockReturnValue({ id: 9 }) } as Partial<JourneyService>)).get(user, '9')).toEqual({ id: 9 });
    expect(thrown(() => ctl(svc({ updateJourney: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).update(user, '9', {}))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(thrown(() => ctl(svc({ deleteJourney: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).remove(user, '9'))).toEqual({ status: 404, body: { error: 'Journey not found' } });
  });

  it('trips: POST 400 without trip_id / 403, DELETE 403', () => {
    expect(thrown(() => ctl(svc()).addTrip(user, '9', {}))).toEqual({ status: 400, body: { error: 'trip_id required' } });
    expect(thrown(() => ctl(svc({ addTripToJourney: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).addTrip(user, '9', { trip_id: 2 }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(ctl(svc({ addTripToJourney: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).addTrip(user, '9', { trip_id: 2 })).toEqual({ success: true });
    expect(thrown(() => ctl(svc({ removeTripFromJourney: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).removeTrip(user, '9', '2'))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it('entries under journey: list 404, create 400/404, reorder 400/403', () => {
    expect(thrown(() => ctl(svc({ listEntries: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).listEntries(user, '9'))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(ctl(svc({ listEntries: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<JourneyService>)).listEntries(user, '9')).toEqual({ entries: [{ id: 1 }] });
    expect(thrown(() => ctl(svc()).createEntry(user, '9', {}))).toEqual({ status: 400, body: { error: 'entry_date is required' } });
    expect(thrown(() => ctl(svc({ createEntry: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).createEntry(user, '9', { entry_date: '2026-01-01' }))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(thrown(() => ctl(svc()).reorderEntries(user, '9', { orderedIds: 'no' }))).toEqual({ status: 400, body: { error: 'orderedIds must be an array of numbers' } });
    expect(thrown(() => ctl(svc({ reorderEntries: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).reorderEntries(user, '9', { orderedIds: [1, 2] }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it('contributors: add 400/403, update 403, remove 403', () => {
    expect(thrown(() => ctl(svc()).addContributor(user, '9', {}))).toEqual({ status: 400, body: { error: 'user_id required' } });
    expect(thrown(() => ctl(svc({ addContributor: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).addContributor(user, '9', { user_id: 2 }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(ctl(svc({ addContributor: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).addContributor(user, '9', { user_id: 2 })).toEqual({ success: true });
    expect(thrown(() => ctl(svc({ updateContributorRole: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).updateContributor(user, '9', '2', { role: 'editor' }))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(thrown(() => ctl(svc({ removeContributor: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).removeContributor(user, '9', '2'))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it('preferences 403, share-link get/set/delete', () => {
    expect(thrown(() => ctl(svc({ updateJourneyPreferences: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).preferences(user, '9', {}))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(ctl(svc({ getJourneyShareLink: vi.fn().mockReturnValue({ allowed: true, link: { token: 'abc' } }) } as Partial<JourneyService>)).getShareLink(user, '9')).toEqual({ link: { token: 'abc' } });
    // An owner whose journey has no link gets the null; a non-owner gets the
    // same refusal set/delete give, so the client can tell the two apart.
    expect(ctl(svc({ getJourneyShareLink: vi.fn().mockReturnValue({ allowed: true, link: null }) } as Partial<JourneyService>)).getShareLink(user, '9')).toEqual({ link: null });
    expect(thrown(() => ctl(svc({ getJourneyShareLink: vi.fn().mockReturnValue({ allowed: false }) } as Partial<JourneyService>)).getShareLink(user, '9'))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    expect(thrown(() => ctl(svc({ createOrUpdateJourneyShareLink: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).setShareLink(user, '9', {}))).toEqual({ status: 403, body: { error: 'Not allowed' } });
    const setLink = vi.fn().mockReturnValue({ token: 'abc' });
    expect(ctl(svc({ createOrUpdateJourneyShareLink: setLink } as Partial<JourneyService>)).setShareLink(user, '9', { share_timeline: true })).toEqual({ token: 'abc' });
    // newest_first is part of the shared contract and the public viewer reads
    // it, so it has to reach the service instead of being dropped here (#1614).
    expect(setLink).toHaveBeenCalledWith(9, 1, { share_timeline: true, share_gallery: undefined, share_map: undefined, newest_first: undefined });
    const withOrder = vi.fn().mockReturnValue({ token: 'abc' });
    ctl(svc({ createOrUpdateJourneyShareLink: withOrder } as Partial<JourneyService>)).setShareLink(user, '9', { newest_first: true });
    expect(withOrder).toHaveBeenCalledWith(9, 1, { share_timeline: undefined, share_gallery: undefined, share_map: undefined, newest_first: true });
    expect(thrown(() => ctl(svc({ deleteJourneyShareLink: vi.fn().mockReturnValue(false) } as Partial<JourneyService>)).deleteShareLink(user, '9'))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it('takes the committed bytes back out when the upload is refused', async () => {
    // The commit happens before the authorization result is known (the Immich
    // mirror reads the final path), so every refusal after it has to delete the
    // object again. Nothing sweeps orphans.
    const file = { filename: 'a.jpg', originalname: 'a.jpg' } as Express.Multer.File;
    await thrownAsync(() => ctl(svc({ addPhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).uploadEntryPhotos(user, '3', [file], {}));
    expect(storageStub.delete).toHaveBeenCalledWith('journey', 'a.jpg');

    vi.clearAllMocks();
    await thrownAsync(() => ctl(svc({ uploadGalleryPhotos: vi.fn().mockReturnValue([]) } as Partial<JourneyService>)).uploadGalleryPhotos(user, '3', [{ filename: 'g.jpg' } as Express.Multer.File]));
    expect(storageStub.delete).toHaveBeenCalledWith('journey', 'g.jpg');

    vi.clearAllMocks();
    await thrownAsync(() => ctl(svc({ updateJourney: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).cover(user, '9', { filename: 'c.jpg' } as Express.Multer.File));
    expect(storageStub.delete).toHaveBeenCalledWith('journey', 'c.jpg');
  });

  it('drops the files of a partly refused entry batch, keeping the accepted ones', async () => {
    // A 200 with fewer photos than files still leaves unreferenced objects behind.
    const addPhoto = vi.fn().mockReturnValueOnce({ id: 5 }).mockReturnValueOnce(null);
    const immichAutoUploadEnabled = vi.fn().mockReturnValue(false);
    const files = [
      { filename: 'ok.jpg', originalname: 'ok.jpg' } as Express.Multer.File,
      { filename: 'no.jpg', originalname: 'no.jpg' } as Express.Multer.File,
    ];
    const res = await ctl(svc({ addPhoto, immichAutoUploadEnabled } as Partial<JourneyService>)).uploadEntryPhotos(user, '3', files, {});
    expect(res).toEqual({ photos: [{ id: 5 }] });
    expect(storageStub.delete).toHaveBeenCalledWith('journey', 'no.jpg');
    expect(storageStub.delete).not.toHaveBeenCalledWith('journey', 'ok.jpg');
  });

  it('entry photo upload mirrors to Immich only when opted in', async () => {
    const addPhoto = vi.fn().mockReturnValue({ id: 5 });
    const uploadToImmich = vi.fn().mockResolvedValue('immich-1');
    const setPhotoProvider = vi.fn();
    const s = svc({ addPhoto, immichAutoUploadEnabled: vi.fn().mockReturnValue(true), uploadToImmich, setPhotoProvider } as Partial<JourneyService>);
    const res = await ctl(s).uploadEntryPhotos(user, '3', [{ filename: 'a.jpg', originalname: 'a.jpg' } as Express.Multer.File], {});
    expect(setPhotoProvider).toHaveBeenCalledWith(5, 'immich', 'immich-1', 1);
    expect(res).toEqual({ photos: [{ id: 5, provider: 'immich', asset_id: 'immich-1', owner_id: 1 }] });

    const noOptIn = svc({ addPhoto: vi.fn().mockReturnValue({ id: 6 }), immichAutoUploadEnabled: vi.fn().mockReturnValue(false), uploadToImmich } as Partial<JourneyService>);
    await ctl(noOptIn).uploadEntryPhotos(user, '3', [{ filename: 'b.jpg', originalname: 'b.jpg' } as Express.Multer.File], {});
    expect(uploadToImmich).toHaveBeenCalledTimes(1); // only the opted-in upload above
  });

  it('entry photo upload: 400 no files, 403 when nothing added, swallows immich errors and empty ids', async () => {
    expect(await thrownAsync(() => ctl(svc()).uploadEntryPhotos(user, '3', undefined, {}))).toEqual({ status: 400, body: { error: 'No files uploaded' } });
    expect(await thrownAsync(() => ctl(svc({ addPhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).uploadEntryPhotos(user, '3', [{ filename: 'a.jpg', originalname: 'a.jpg' } as Express.Multer.File], {}))).toEqual({ status: 403, body: { error: 'Not allowed' } });

    // opted in but the immich upload throws → best-effort, the local photo still wins
    const setPhotoProvider = vi.fn();
    const blowsUp = svc({ addPhoto: vi.fn().mockReturnValue({ id: 8 }), immichAutoUploadEnabled: vi.fn().mockReturnValue(true), uploadToImmich: vi.fn().mockRejectedValue(new Error('immich down')), setPhotoProvider } as Partial<JourneyService>);
    expect(await ctl(blowsUp).uploadEntryPhotos(user, '3', [{ filename: 'a.jpg', originalname: 'a.jpg' } as Express.Multer.File], { caption: 'c' })).toEqual({ photos: [{ id: 8 }] });
    expect(setPhotoProvider).not.toHaveBeenCalled();

    // opted in but immich returns a falsy id → no provider stamping
    const noId = svc({ addPhoto: vi.fn().mockReturnValue({ id: 9 }), immichAutoUploadEnabled: vi.fn().mockReturnValue(true), uploadToImmich: vi.fn().mockResolvedValue(''), setPhotoProvider } as Partial<JourneyService>);
    expect(await ctl(noId).uploadEntryPhotos(user, '3', [{ filename: 'a.jpg', originalname: 'a.jpg' } as Express.Multer.File], {})).toEqual({ photos: [{ id: 9 }] });
  });

  it('provider-photos batch passes the passphrase through when present', () => {
    const addProviderPhoto = vi.fn().mockReturnValue({ id: 1 });
    ctl(svc({ addProviderPhoto } as Partial<JourneyService>)).providerPhotos(user, '3', { provider: 'immich', asset_ids: ['a'], caption: 'cap', passphrase: 'secret' });
    expect(addProviderPhoto).toHaveBeenCalledWith(3, 1, 'immich', 'a', 'cap', 'secret', 'image');
    // single-photo success path
    expect(ctl(svc({ addProviderPhoto: vi.fn().mockReturnValue({ id: 2 }) } as Partial<JourneyService>)).providerPhotos(user, '3', { provider: 'immich', asset_id: 'a' })).toEqual({ id: 2 });
  });

  it('PATCH photos: 404 then returns the updated photo', () => {
    expect(thrown(() => ctl(svc({ updatePhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).updatePhoto(user, '7', { caption: 'x' }))).toEqual({ status: 404, body: { error: 'Photo not found' } });
    expect(ctl(svc({ updatePhoto: vi.fn().mockReturnValue({ id: 7 }) } as Partial<JourneyService>)).updatePhoto(user, '7', { caption: 'x' })).toEqual({ id: 7 });
  });

  it('DELETE photo removes the storage object when a path exists', async () => {
    expect(await ctl(svc({ deletePhoto: vi.fn().mockReturnValue({ id: 7, file_path: 'journey/a.jpg' }) } as Partial<JourneyService>)).deletePhoto(user, '7')).toEqual({ success: true });
    expect(storageStub.delete).toHaveBeenCalledWith('journey', 'a.jpg');
    // ...and the derived thumb goes with it (spec fix #2).
    expect(storageStub.delete).toHaveBeenCalledWith('journey', journeyThumbName('journey/a.jpg'));
    // a vanished object is swallowed
    (storageStub.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('ENOENT'));
    expect(await ctl(svc({ deletePhoto: vi.fn().mockReturnValue({ id: 8, file_path: 'journey/b.jpg' }) } as Partial<JourneyService>)).deletePhoto(user, '8')).toEqual({ success: true });
    // a file_path outside the journey category never reaches storage
    (storageStub.delete as ReturnType<typeof vi.fn>).mockClear();
    expect(await ctl(svc({ deletePhoto: vi.fn().mockReturnValue({ id: 9, file_path: 'elsewhere/x.jpg' }) } as Partial<JourneyService>)).deletePhoto(user, '9')).toEqual({ success: true });
    expect(storageStub.delete).not.toHaveBeenCalled();
  });

  it('gallery provider-photos: batch (with passphrase), single 400/403, success', () => {
    const addProviderPhotoToGallery = vi.fn().mockReturnValue({ id: 1 });
    const batch = ctl(svc({ addProviderPhotoToGallery } as Partial<JourneyService>));
    expect(batch.galleryProviderPhotos(user, '9', { provider: 'immich', asset_ids: ['a', 'b'], passphrase: 'pw' })).toEqual({ photos: [{ id: 1 }, { id: 1 }], added: 2 });
    expect(addProviderPhotoToGallery).toHaveBeenCalledWith(9, 1, 'immich', 'a', undefined, 'pw', 'image');
    expect(thrown(() => ctl(svc()).galleryProviderPhotos(user, '9', { provider: 'immich' }))).toEqual({ status: 400, body: { error: 'provider and asset_id required' } });
    expect(thrown(() => ctl(svc({ addProviderPhotoToGallery: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).galleryProviderPhotos(user, '9', { provider: 'immich', asset_id: 'a' }))).toEqual({ status: 403, body: { error: 'Not allowed or duplicate' } });
    expect(ctl(svc({ addProviderPhotoToGallery: vi.fn().mockReturnValue({ id: 3 }) } as Partial<JourneyService>)).galleryProviderPhotos(user, '9', { provider: 'immich', asset_id: 'a' })).toEqual({ id: 3 });
  });

  it('DELETE gallery photo: 404, then removes the object when present', async () => {
    expect(await thrownAsync(() => ctl(svc({ deleteGalleryPhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).deleteGalleryPhoto(user, '7'))).toEqual({ status: 404, body: { error: 'Photo not found or not allowed' } });
    // no file_path → nothing to delete, returns void
    expect(await ctl(svc({ deleteGalleryPhoto: vi.fn().mockReturnValue({ id: 7, file_path: null }) } as Partial<JourneyService>)).deleteGalleryPhoto(user, '7')).toBeUndefined();
    await ctl(svc({ deleteGalleryPhoto: vi.fn().mockReturnValue({ id: 8, file_path: 'journey/g.jpg' }) } as Partial<JourneyService>)).deleteGalleryPhoto(user, '8');
    expect(storageStub.delete).toHaveBeenCalledWith('journey', 'g.jpg');
    expect(storageStub.delete).toHaveBeenCalledWith('journey', journeyThumbName('journey/g.jpg'));
    (storageStub.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('ENOENT'));
    expect(await ctl(svc({ deleteGalleryPhoto: vi.fn().mockReturnValue({ id: 9, file_path: 'journey/h.jpg' }) } as Partial<JourneyService>)).deleteGalleryPhoto(user, '9')).toBeUndefined();
  });

  it('DELETE gallery video also reclaims its uploaded poster (spec fix #2 extension)', async () => {
    (storageStub.delete as ReturnType<typeof vi.fn>).mockClear();
    await ctl(
      svc({ deleteGalleryPhoto: vi.fn().mockReturnValue({ id: 10, file_path: 'journey/clip.mp4', thumbnail_path: 'journey/poster.jpg' }) } as Partial<JourneyService>),
    ).deleteGalleryPhoto(user, '10');
    expect(storageStub.delete).toHaveBeenCalledWith('journey', 'clip.mp4');
    expect(storageStub.delete).toHaveBeenCalledWith('journey', journeyThumbName('journey/clip.mp4'));
    expect(storageStub.delete).toHaveBeenCalledWith('journey', 'poster.jpg');
  });

  it('PATCH /:id returns the updated journey on success', () => {
    expect(ctl(svc({ updateJourney: vi.fn().mockReturnValue({ id: 9 }) } as Partial<JourneyService>)).update(user, '9', { title: 'x' })).toEqual({ id: 9 });
  });

  it('cover upload: 400 without file, 404 when the journey is gone, else commits + returns the journey', async () => {
    expect(await thrownAsync(() => ctl(svc()).cover(user, '9', undefined))).toEqual({ status: 400, body: { error: 'No file uploaded' } });
    expect(await thrownAsync(() => ctl(svc({ updateJourney: vi.fn().mockReturnValue(null) } as Partial<JourneyService>)).cover(user, '9', { filename: 'c.jpg' } as Express.Multer.File))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    const updateJourney = vi.fn().mockReturnValue({ id: 9, cover_image: 'journey/c.jpg' });
    expect(await ctl(svc({ updateJourney } as Partial<JourneyService>)).cover(user, '9', { filename: 'c.jpg' } as Express.Multer.File)).toEqual({ id: 9, cover_image: 'journey/c.jpg' });
    expect(storageStub.put).toHaveBeenCalledWith('journey', 'c.jpg', { tmpPath: undefined });
    expect(updateJourney).toHaveBeenCalledWith(9, 1, { cover_image: 'journey/c.jpg' });
  });

  it('DELETE /:id and trips/contributors success paths', () => {
    expect(ctl(svc({ deleteJourney: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).remove(user, '9')).toEqual({ success: true });
    expect(ctl(svc({ removeTripFromJourney: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).removeTrip(user, '9', '2')).toEqual({ success: true });
    expect(ctl(svc({ updateContributorRole: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).updateContributor(user, '9', '2', { role: 'editor' })).toEqual({ success: true });
    expect(ctl(svc({ removeContributor: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).removeContributor(user, '9', '2')).toEqual({ success: true });
  });

  it('addContributor defaults the role to viewer when omitted', () => {
    const addContributor = vi.fn().mockReturnValue(true);
    ctl(svc({ addContributor } as Partial<JourneyService>)).addContributor(user, '9', { user_id: 2 });
    expect(addContributor).toHaveBeenCalledWith(9, 1, 2, 'viewer');
  });

  it('createEntry returns the entry when the journey exists', () => {
    expect(ctl(svc({ createEntry: vi.fn().mockReturnValue({ id: 4 }) } as Partial<JourneyService>)).createEntry(user, '9', { entry_date: '2026-01-01' })).toEqual({ id: 4 });
  });

  it('reorderEntries succeeds for a numeric array', () => {
    expect(ctl(svc({ reorderEntries: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).reorderEntries(user, '9', { orderedIds: [3, 1, 2] })).toEqual({ success: true });
  });

  it('preferences returns the result on success', () => {
    expect(ctl(svc({ updateJourneyPreferences: vi.fn().mockReturnValue({ ok: true }) } as Partial<JourneyService>)).preferences(user, '9', { theme: 'dark' })).toEqual({ ok: true });
  });

  it('deleteShareLink returns success when removed', () => {
    expect(ctl(svc({ deleteJourneyShareLink: vi.fn().mockReturnValue(true) } as Partial<JourneyService>)).deleteShareLink(user, '9')).toEqual({ success: true });
  });
  /*
   * The Studio book (#1973). Its access shape is the same as everything around
   * it — the service answers null for a journey the caller cannot see, and that
   * is a 404 rather than a 403, so the route cannot be used to find out which
   * journeys exist.
   */
  it('book: 404 vs a journey with no book yet, and the save status codes', () => {
    // A journey with no book yet is not an error: Studio opens on it, lays a
    // book out and saves. 404 here would make "no book" and "no journey"
    // indistinguishable to the client.
    expect(ctl(svc(), { getBook: vi.fn().mockReturnValue(null), canOpen: vi.fn().mockReturnValue(true) }).getBook(user, '9')).toEqual({ book: null });
    expect(thrown(() => ctl(svc(), { getBook: vi.fn().mockReturnValue(null), canOpen: vi.fn().mockReturnValue(false) }).getBook(user, '9'))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(ctl(svc(), { getBook: vi.fn().mockReturnValue({ id: 3, version: 4 }), canOpen: vi.fn() }).getBook(user, '9')).toEqual({ book: { id: 3, version: 4 } });

    // A refused save says which refusal it was. Out of reach entirely is still
    // 404; a viewer who can open the journey but may not write it gets 403, so
    // the editor can say why instead of claiming the journey vanished.
    expect(thrown(() => ctl(svc(), { saveBook: vi.fn().mockReturnValue(null), canOpen: vi.fn().mockReturnValue(false) }).saveBook(user, '9', { document: {} } as never))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(thrown(() => ctl(svc(), { saveBook: vi.fn().mockReturnValue(null), canOpen: vi.fn().mockReturnValue(true) }).saveBook(user, '9', { document: {} } as never))).toEqual({ status: 403, body: { error: 'Not allowed' } });

    // The record comes back bare, not in an envelope — the contract in
    // shared/src/book/book-store.schema.ts is the record itself.
    const broadcastSaved = vi.fn();
    const saveBook = vi.fn().mockReturnValue({ record: { id: 3, version: 5 } });
    expect(ctl(svc(), { saveBook, broadcastSaved }).saveBook(user, '9', { title: 'T', document: { v: 1 }, baseVersion: 4 } as never, 'sock-7')).toEqual({ id: 3, version: 5 });
    expect(saveBook).toHaveBeenCalledWith(9, 1, { title: 'T', document: { v: 1 }, baseVersion: 4 });
    // Forwarded so the client that just saved does not process its own change.
    expect(broadcastSaved).toHaveBeenCalledWith(9, 1, { id: 3, version: 5 }, 'sock-7');

    // A missing title is '' rather than undefined: the column is NOT NULL and
    // an untitled book is an ordinary thing to have.
    const untitled = vi.fn().mockReturnValue({ record: { id: 3, version: 1 } });
    ctl(svc(), { saveBook: untitled, broadcastSaved: vi.fn() }).saveBook(user, '9', { document: {} } as never);
    expect(untitled.mock.calls[0][2].title).toBe('');
  });

  it('book: a conflict is a 409 that carries the other version', () => {
    /*
     * Two people editing is the normal case, not an exception. A bare 409 would
     * make showing what the other version is a second round trip, at exactly
     * the moment someone is worried about losing work.
     */
    const broadcastSaved = vi.fn();
    const saveBook = vi.fn().mockReturnValue({ conflict: { id: 3, version: 6, title: 'Theirs' } });
    expect(thrown(() => ctl(svc(), { saveBook, broadcastSaved }).saveBook(user, '9', { document: {}, baseVersion: 4 } as never))).toEqual({
      status: 409,
      body: { error: 'Book was changed by someone else', current: { id: 3, version: 6, title: 'Theirs' } },
    });
    // Nothing was written, so nobody is told anything moved.
    expect(broadcastSaved).not.toHaveBeenCalled();
  });

  it('book: delete answers 204, 403 for a viewer, or 404 out of reach', () => {
    expect(ctl(svc(), { deleteBook: vi.fn().mockReturnValue(true) }).deleteBook(user, '9')).toBeUndefined();
    // False means there was nothing to delete, which is still a 204 — deleting
    // a book that is already gone is not a failure.
    expect(ctl(svc(), { deleteBook: vi.fn().mockReturnValue(false) }).deleteBook(user, '9')).toBeUndefined();
    expect(thrown(() => ctl(svc(), { deleteBook: vi.fn().mockReturnValue(null), canOpen: vi.fn().mockReturnValue(false) }).deleteBook(user, '9'))).toEqual({ status: 404, body: { error: 'Journey not found' } });
    expect(thrown(() => ctl(svc(), { deleteBook: vi.fn().mockReturnValue(null), canOpen: vi.fn().mockReturnValue(true) }).deleteBook(user, '9'))).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });
});

describe('JourneyPublicController', () => {
  it('is addon-gated like the authenticated surface', () => {
    // Turning the Journey addon off is meant to take the feature away; without
    // this, already-published journeys stayed publicly readable.
    expect(Reflect.getMetadata(REQUIRE_ADDON, JourneyPublicController)).toEqual({ addonId: ADDON_IDS.JOURNEY, label: 'Journey' });
    expect((Reflect.getMetadata('__guards__', JourneyPublicController) ?? [])[0]).toBe(AddonGuard);
  });

  it('GET /:token 404 / json', () => {
    expect(thrown(() => new JourneyPublicController(svc({ getPublicJourney: vi.fn().mockReturnValue(null) } as Partial<JourneyService>), storageStub).get('tok'))).toEqual({ status: 404, body: { error: 'Not found' } });
    expect(new JourneyPublicController(svc({ getPublicJourney: vi.fn().mockReturnValue({ id: 1 }) } as Partial<JourneyService>), storageStub).get('tok')).toEqual({ id: 1 });
  });

  it('photo proxy 404 on invalid token, else streams', async () => {
    expect(await thrownAsync(() => new JourneyPublicController(svc({ validateShareTokenForPhoto: vi.fn().mockReturnValue(null) } as Partial<JourneyService>), storageStub).photo('tok', '7', 'thumbnail', {} as Response))).toEqual({ status: 404, body: { error: 'Not found' } });
    const streamPhoto = vi.fn().mockResolvedValue(undefined);
    const s = svc({ validateShareTokenForPhoto: vi.fn().mockReturnValue({ ownerId: 2 }), streamPhoto } as Partial<JourneyService>);
    await new JourneyPublicController(s, storageStub).photo('tok', '7', 'original', {} as Response);
    expect(streamPhoto).toHaveBeenCalledWith({}, 2, 7, 'original');
  });

  it('legacy photo proxy: 404 invalid token, immich path streams', async () => {
    expect(await thrownAsync(() => new JourneyPublicController(svc({ validateShareTokenForAsset: vi.fn().mockReturnValue(null) } as Partial<JourneyService>), storageStub).legacyPhoto('tok', 'immich', 'a1', 'thumbnail', {} as Response))).toEqual({ status: 404, body: { error: 'Not found' } });
    // One call for every provider now, with the ids in a ref instead of in a
    // per-provider argument order.
    const streamProviderAsset = vi.fn().mockResolvedValue(undefined);
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }), streamProviderAsset } as Partial<JourneyService>);
    await new JourneyPublicController(s, storageStub).legacyPhoto('tok', 'immich', 'a1', 'original', {} as Response);
    expect(streamProviderAsset).toHaveBeenCalledWith({}, 'immich', { userId: 5, ownerId: 5, assetId: 'a1' }, 'original');
  });

  it('photo proxy streams thumbnails too', async () => {
    const streamPhoto = vi.fn().mockResolvedValue(undefined);
    const s = svc({ validateShareTokenForPhoto: vi.fn().mockReturnValue({ ownerId: 3 }), streamPhoto } as Partial<JourneyService>);
    await new JourneyPublicController(s, storageStub).photo('tok', '7', 'thumbnail', {} as Response);
    expect(streamPhoto).toHaveBeenCalledWith({}, 3, 7, 'thumbnail');
  });

  it('legacy photo proxy: synology streams, and a failure becomes a 404 json', async () => {
    const streamProviderAsset = vi.fn().mockResolvedValue(undefined);
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }), streamProviderAsset } as Partial<JourneyService>);
    await new JourneyPublicController(s, storageStub).legacyPhoto('tok', 'synologyphotos', 'a1', 'thumbnail', {} as Response);
    expect(streamProviderAsset).toHaveBeenCalledWith({}, 'synologyphotos', { userId: 5, ownerId: 5, assetId: 'a1' }, 'thumbnail');

    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json } as unknown as Response;
    const failing = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 0 }), streamProviderAsset: vi.fn().mockRejectedValue(new Error('no synology')) } as Partial<JourneyService>);
    await new JourneyPublicController(failing, storageStub).legacyPhoto('tok', 'synologyphotos', 'a1', 'original', res);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'Provider not supported' });
  });

  it('legacy photo proxy: an unregistered provider 404s instead of being handed to synology', async () => {
    // The old if/else sent everything that was not immich to synology, which
    // 404'd from inside its own id parser. The registry can tell "no such
    // backend" apart from "that backend failed".
    const streamProviderAsset = vi.fn().mockReturnValue(null);
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json } as unknown as Response;
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }), streamProviderAsset } as Partial<JourneyService>);
    await new JourneyPublicController(s, storageStub).legacyPhoto('tok', 'photoprism', 'a1', 'original', res);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'Provider not supported' });
  });

  it('legacy photo proxy: ignores the path ownerId, taking the owner off the token', async () => {
    // Whose provider credentials get tried is not something an anonymous caller
    // may choose from the URL. The share service resolves it, falling back to
    // the journey owner when the photo row carries no owner_id.
    const streamProviderAsset = vi.fn().mockResolvedValue(undefined);
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 3 }), streamProviderAsset } as Partial<JourneyService>);
    await new JourneyPublicController(s, storageStub).legacyPhoto('tok', 'immich', 'a1', 'original', {} as Response);
    expect(streamProviderAsset).toHaveBeenCalledWith({}, 'immich', { userId: 3, ownerId: 3, assetId: 'a1' }, 'original');
  });

  it('legacy photo proxy: local provider 404s when the object does not exist', async () => {
    storageExists.mockResolvedValue(false);
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }) } as Partial<JourneyService>);
    expect(await thrownAsync(() => new JourneyPublicController(s, storageStub).legacyPhoto('tok', 'local', 'gone.jpg', 'thumbnail', {} as Response))).toEqual({ status: 404, body: { error: 'Not found' } });
    expect(storageSendToResponse).not.toHaveBeenCalled();
  });

  it('legacy photo proxy: local provider serves through storage with the day cache header', async () => {
    storageExists.mockResolvedValue(true);
    storageSendToResponse.mockResolvedValue(undefined);
    const set = vi.fn();
    const res = { set } as unknown as Response;
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }) } as Partial<JourneyService>);
    await new JourneyPublicController(s, storageStub).legacyPhoto('tok', 'local', 'photo.jpg', 'original', res);
    expect(storageExists).toHaveBeenCalledWith('journey', 'photo.jpg');
    expect(set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
    expect(storageSendToResponse).toHaveBeenCalledWith('journey', 'photo.jpg', res);
  });

  it('legacy photo proxy: local provider cannot escape uploads/journey via a traversal asset id', async () => {
    storageExists.mockResolvedValue(true);
    storageSendToResponse.mockResolvedValue(undefined);
    const res = { set: vi.fn() } as unknown as Response;
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }) } as Partial<JourneyService>);

    // Express decodes %2F in a single path param to '/', so the handler sees this.
    await new JourneyPublicController(s, storageStub).legacyPhoto('tok', 'local', '../../files/secret.pdf', 'original', res);

    // basename() collapses the traversal before the storage lookup, and central
    // key validation (storage-keys.ts) rejects anything that still carries a
    // path — the asset can never address the sibling files/ category.
    expect(storageExists).toHaveBeenCalledWith('journey', 'secret.pdf');
    expect(storageSendToResponse).toHaveBeenCalledWith('journey', 'secret.pdf', res);
  });

  it('legacy photo proxy: a bare traversal asset id reads as a miss, not a crash', async () => {
    // '..' survives basename(); storage.exists rejects it as an invalid key,
    // which the handler reads as a miss.
    storageExists.mockRejectedValue(new Error('invalid storage key: journey/..'));
    const s = svc({ validateShareTokenForAsset: vi.fn().mockReturnValue({ ownerId: 5 }) } as Partial<JourneyService>);
    expect(await thrownAsync(() => new JourneyPublicController(s, storageStub).legacyPhoto('tok', 'local', '..', 'original', {} as Response))).toEqual({ status: 404, body: { error: 'Not found' } });
    expect(storageSendToResponse).not.toHaveBeenCalled();
  });
});
