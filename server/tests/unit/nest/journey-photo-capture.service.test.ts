/**
 * JourneyPhotoCaptureService (#1587): the capture-time backfill as every journey
 * surface runs it, and the refresh that has to follow it so the gallery re-sorts
 * without anyone reloading.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JourneyPhotoCaptureService } from '../../../src/nest/journey/journey-photo-capture.service';
import { PhotoCaptureBackfillService } from '../../../src/nest/memories/photo-capture-backfill.service';
import type { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import type { PhotoResolverService } from '../../../src/nest/memories/photo-resolver.service';
import type { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';
import type { StorageService } from '../../../src/nest/storage/storage.service';

function build(changed: boolean | Error = true) {
  const run = vi.fn(async () => {
    if (changed instanceof Error) throw changed;
    return changed;
  });
  const schedule = vi.fn();
  const broadcastJourneyEvent = vi.fn();
  const journeyIdOfEntry = vi.fn((entryId: number) => (entryId === 4 ? 9 : null));
  const svc = new JourneyPhotoCaptureService(
    { run, schedule } as unknown as PhotoCaptureBackfillService,
    { broadcastJourneyEvent, journeyIdOfEntry } as unknown as JourneyDomainService,
  );
  return { svc, run, schedule, broadcastJourneyEvent, journeyIdOfEntry };
}

beforeEach(() => vi.restoreAllMocks());

describe('JourneyPhotoCaptureService', () => {
  it('JPCAP-001: fills the added photos, then tells everyone on the journey, the importer included', async () => {
    const { svc, run, broadcastJourneyEvent } = build(true);

    svc.scheduleForJourney(9, [{ id: 1, photo_id: 11 }, { id: 2, photo_id: 12 }], 3);

    await vi.waitFor(() => expect(broadcastJourneyEvent).toHaveBeenCalled());
    expect(run).toHaveBeenCalledWith([11, 12], 3);
    // No socket is excluded: the importer's own reload came before the backfill.
    expect(broadcastJourneyEvent).toHaveBeenCalledWith(9, 'journey:photos:updated', {});
  });

  it('JPCAP-002: says nothing when the backfill learned nothing', async () => {
    const { svc, broadcastJourneyEvent } = build(false);

    await expect(svc.fill(9, [11], 3)).resolves.toBe(false);
    expect(broadcastJourneyEvent).not.toHaveBeenCalled();
  });

  it('JPCAP-003: an entry add is reported against the journey that entry belongs to', async () => {
    const { svc, journeyIdOfEntry, broadcastJourneyEvent } = build(true);

    svc.scheduleForEntry(4, [{ id: 1, photo_id: 11 }], 3);

    await vi.waitFor(() => expect(broadcastJourneyEvent).toHaveBeenCalledWith(9, 'journey:photos:updated', {}));
    expect(journeyIdOfEntry).toHaveBeenCalledWith(4);
  });

  it('JPCAP-004: an entry that has gone still gets its photos filled, with no one to tell', async () => {
    const { svc, run, broadcastJourneyEvent } = build(true);

    await expect(svc.fill(null, [11], 3)).resolves.toBe(true);
    expect(run).toHaveBeenCalledWith([11], 3);
    expect(broadcastJourneyEvent).not.toHaveBeenCalled();

    svc.scheduleForEntry(5, [{ id: 1, photo_id: 12 }], 3);
    await vi.waitFor(() => expect(run).toHaveBeenCalledWith([12], 3));
    expect(broadcastJourneyEvent).not.toHaveBeenCalled();
  });

  it('JPCAP-005: rows without a trek photo id are skipped, and an empty batch never starts a run', () => {
    const { svc, run, journeyIdOfEntry } = build(true);

    svc.scheduleForJourney(9, [null, { id: 1 }, { photo_id: 'x' }], 3);
    svc.scheduleForEntry(4, [], 3);

    expect(run).not.toHaveBeenCalled();
    expect(journeyIdOfEntry).not.toHaveBeenCalled();
  });

  it('JPCAP-006: a refresh that could not be sent is logged, never thrown at a detached caller', async () => {
    const { svc, broadcastJourneyEvent } = build(true);
    broadcastJourneyEvent.mockImplementation(() => { throw new Error('socket gone'); });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(svc.fill(9, [11], 3)).resolves.toBe(true);
    expect(error).toHaveBeenCalledWith('[Journey] capture refresh failed for journey 9:', 'socket gone');
  });

  it('JPCAP-007: a backfill that rejects is caught too', async () => {
    const { svc, run, broadcastJourneyEvent } = build(new Error('boom'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(svc.fill(9, [11], 3)).resolves.toBe(false);
    expect(broadcastJourneyEvent).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('[Journey] capture refresh failed for journey 9:', 'boom');

    // Something thrown that is not an Error is logged as it is.
    run.mockRejectedValueOnce('gone');
    await expect(svc.fill(null, [11], 3)).resolves.toBe(false);
    expect(error).toHaveBeenLastCalledWith('[Journey] capture refresh failed for journey null:', 'gone');
  });

  it('JPCAP-008: an upload gets the plain backfill and no refresh, since one request is one file', async () => {
    const { svc, run, schedule, broadcastJourneyEvent, journeyIdOfEntry } = build(true);

    svc.scheduleUpload([{ id: 1, photo_id: 11 }, null, { id: 2 }], 3);
    await new Promise(resolve => setTimeout(resolve, 5));

    expect(schedule).toHaveBeenCalledWith([11], 3);
    expect(run).not.toHaveBeenCalled();
    expect(journeyIdOfEntry).not.toHaveBeenCalled();
    expect(broadcastJourneyEvent).not.toHaveBeenCalled();

    // Nothing with a trek photo id: nothing to schedule.
    schedule.mockClear();
    svc.scheduleUpload([{ id: 3 }], 3);
    expect(schedule).not.toHaveBeenCalled();
  });

  it('JPCAP-009: provider adds from every surface share the user\'s four lookup slots, uploads read their own files, and only the provider adds refresh', async () => {
    // A gallery add (REST or MCP), an entry add and a device upload (REST or
    // plugin RPC) landing together: three detached runs on the one backfill.
    const load = { inFlight: 0, peak: 0 };
    const getPhotoInfo = vi.fn(async () => {
      load.inFlight++;
      load.peak = Math.max(load.peak, load.inFlight);
      await new Promise(resolve => setTimeout(resolve, 5));
      load.inFlight--;
      return { success: true, data: { takenAt: '2026-03-15T08:00:00Z' } };
    });
    const recordCaptureMetadata = vi.fn(() => true);
    // Ids from 30 up are the uploaded files; their EXIF says when they were taken.
    // The storage stub answers with what the EXIF reader makes of such a file.
    const resolve = (id: number) =>
      id >= 30 ? { id, provider: 'local', file_path: `journey/${id}.jpg` } : { id, provider: 'immich' };
    const withLocalFile = vi.fn(async () => ({ takenAt: '2026-03-15T09:00:00.000Z', lat: null, lng: null }));
    const backfill = new PhotoCaptureBackfillService(
      { getPhotoInfo } as unknown as PhotoResolverService,
      { resolve, recordCaptureMetadata } as unknown as TrekPhotosRepository,
      { withLocalFile } as unknown as StorageService,
    );
    const broadcastJourneyEvent = vi.fn();
    const svc = new JourneyPhotoCaptureService(
      backfill,
      { broadcastJourneyEvent, journeyIdOfEntry: () => 9 } as unknown as JourneyDomainService,
    );
    const rows = (from: number) => Array.from({ length: 5 }, (_, i) => ({ photo_id: from + i }));

    svc.scheduleForJourney(9, rows(10), 3);
    svc.scheduleForEntry(4, rows(20), 3);
    svc.scheduleUpload(rows(30), 3);

    await vi.waitFor(() => expect(recordCaptureMetadata).toHaveBeenCalledTimes(15));
    // Ten provider lookups, never more than four at once; the five uploads never asked a provider.
    expect(getPhotoInfo).toHaveBeenCalledTimes(10);
    expect(load.peak).toBe(4);
    expect(withLocalFile).toHaveBeenCalledTimes(5);
    expect(recordCaptureMetadata).toHaveBeenCalledWith(30, { takenAt: '2026-03-15T09:00:00.000Z', lat: null, lng: null });
    // One event per provider batch, none for the upload.
    await vi.waitFor(() => expect(broadcastJourneyEvent).toHaveBeenCalledTimes(2));
    expect(broadcastJourneyEvent).toHaveBeenCalledWith(9, 'journey:photos:updated', {});
  });
});
