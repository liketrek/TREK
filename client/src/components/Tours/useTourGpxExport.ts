import { isAxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import { tourRepo } from '../../repo/tourRepo';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import { copyText } from '../../utils/clipboard';
import { downloadBlob } from '../../utils/fileDownload';
import { canShareFile, canShareText, shareFile, shareText, type FileShareOutcome } from '../../utils/fileShare';
import { useToast } from '../shared/Toast';
import { tourShareText, type TourShareFacts } from './tourShareText';

const GPX_TYPE = 'application/gpx+xml';

/** A tour's GPX file kept for the next share, as the bytes and the name the server gave them. */
interface PreparedFile {
  placeId: number;
  /** The tour's revision the file was read at; a file of another one is no longer the saved tour. */
  revision: number | null;
  blob: Blob;
  name: string;
}

/** The file's name when the server gave none: the tour's, or plain "tour". */
const fallbackName = (name: string) => `${name.trim() || 'tour'}.gpx`;

/** What a tour's GPX export needs to know about the tour. */
export interface TourGpxExportTarget {
  tripId: number | string;
  placeId: number;
  name: string;
  /**
   * P2C-03: the tour's revision, raised by every saved change to it. A kept
   * file belongs to the revision it was read at, so a save (here or arriving
   * live from elsewhere) drops it. Absent in a tour cached before revisions.
   */
  revision?: number | null;
  /** What the short share text says where the platform takes no GPX file: type, distance, ascent, time. */
  facts?: TourShareFacts | null;
}

/** The revision a target names, one value for "none" so an absent and a null one agree. */
const revisionOf = (target: TourGpxExportTarget | null) => target?.revision ?? null;

/** The kept file when it is this tour at this revision, else null. */
const keptFor = (kept: PreparedFile | null, target: TourGpxExportTarget) =>
  kept?.placeId === target.placeId && kept.revision === revisionOf(target) ? kept : null;

/** Holds the guard while a share sheet is open, so a second tap in the meantime is ignored. */
async function withSheetOpen(guard: { current: boolean }, open: () => Promise<FileShareOutcome>) {
  guard.current = true;
  try {
    return await open();
  } finally {
    guard.current = false;
  }
}

/**
 * PR1-06A, IO-01: a saved tour handed over as a GPX file, started on purpose:
 * downloaded, or given to the system's share sheet where the platform takes
 * GPX files. Both use the same file, the server's (the saved line, as saved),
 * so an unsaved edit in the planner is not in it. One export at a time per
 * caller; a dialog closed mid-download cancels it. Nothing about the tour
 * changes either way.
 *
 * The share sheet only opens from inside the tap that asks for it, and a tap
 * that first waits on the network has often run out by the time the file is
 * there. So where sharing is offered, the file of `prefetch` (the tour on
 * screen, null while it has unsaved changes) is fetched ahead, quietly, and a
 * tap hands it to the sheet before anything is awaited. A file a tap had to
 * fetch is kept for the next one the same way.
 *
 * Where the platform takes no GPX file (desktop Chrome, mostly), the share
 * hands on a short text instead: the tour's name, type, distance, ascent, time
 * and its trip, to the share sheet where there is one for text, otherwise to
 * the clipboard with a toast that says so. So the share is always offered;
 * `sharesFile` tells which of the two it is.
 */
export function useTourGpxExport(prefetch: TourGpxExportTarget | null = null) {
  const { t } = useTranslation();
  const toast = useToast();
  const [exportingId, setExportingId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // The tour's file at hand for a share, so the tap opens the sheet without waiting on the network.
  const preparedRef = useRef<PreparedFile | null>(null);
  // An open share sheet: a second tap while it is open would only make the browser refuse.
  const sharingRef = useRef(false);
  const [sharesFile] = useState(() => canShareFile('tour.gpx', GPX_TYPE));
  const [sharesText] = useState(canShareText);
  const distanceUnit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';

  useEffect(() => () => abortRef.current?.abort(), []);

  const prefetchTripId = prefetch?.tripId ?? null;
  const prefetchPlaceId = prefetch?.placeId ?? null;
  const prefetchName = prefetch?.name ?? '';
  const prefetchRevision = revisionOf(prefetch);
  useEffect(() => {
    if (!sharesFile || prefetchTripId === null || prefetchPlaceId === null) return;
    const controller = new AbortController();
    tourRepo.exportGpx(prefetchTripId, prefetchPlaceId, controller.signal).then(
      (result) => {
        if (controller.signal.aborted || !('blob' in result)) return;
        preparedRef.current = {
          placeId: prefetchPlaceId,
          revision: prefetchRevision,
          blob: result.blob,
          name: result.filename ?? fallbackName(prefetchName),
        };
      },
      // Quiet on purpose: a tap then fetches the file itself and says why it could not.
      () => undefined
    );
    return () => {
      controller.abort();
      // Another tour, or the same one with changes the kept file does not hold.
      preparedRef.current = null;
    };
  }, [sharesFile, prefetchTripId, prefetchPlaceId, prefetchName, prefetchRevision]);

  /** The tour's file from the server, or null when there is none to hand over, said in a toast. */
  const fetchFile = useCallback(
    async ({ tripId, placeId, name }: TourGpxExportTarget): Promise<File | null> => {
      if (abortRef.current) return null;
      const controller = new AbortController();
      abortRef.current = controller;
      setExportingId(placeId);
      try {
        const result = await tourRepo.exportGpx(tripId, placeId, controller.signal);
        if (!('blob' in result)) {
          toast.info(t('tours.gpxExport.offline'));
          return null;
        }
        return new File([result.blob], result.filename ?? fallbackName(name), { type: GPX_TYPE });
      } catch (error: unknown) {
        if (controller.signal.aborted) return null;
        const noRoute = isAxiosError(error) && error.response?.status === 422;
        toast.error(t(noRoute ? 'tours.gpxExport.noRoute' : 'tours.gpxExport.failed'));
        return null;
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        if (!controller.signal.aborted) setExportingId(null);
      }
    },
    [t, toast]
  );

  const exportGpx = useCallback(
    async (target: TourGpxExportTarget) => {
      const file = await fetchFile(target);
      if (file) downloadBlob(file, file.name);
    },
    [fetchFile]
  );

  /** The tour as text: to the share sheet where it takes text, else (or when it fails) to the clipboard. */
  const shareSummary = useCallback(
    async (target: TourGpxExportTarget) => {
      if (sharingRef.current) return;
      // The trip's name only when the trip open here is the tour's, read at the tap.
      const trip = useTripStore.getState().trip;
      const tripName = trip && String(trip.id) === String(target.tripId) ? trip.title : null;
      const text = tourShareText({ name: target.name, facts: target.facts ?? null, tripName }, t, distanceUnit);
      if (sharesText) {
        const outcome = await withSheetOpen(sharingRef, () => shareText(target.name, text));
        // Shared, closed on purpose, or a sheet still open: nothing more to do.
        if (outcome === 'shared' || outcome === 'cancelled' || outcome === 'busy') return;
      }
      if (await copyText(text)) {
        toast.success(t('tours.gpxExport.shareCopied'));
      } else {
        toast.error(t('tours.gpxExport.shareCopyFailed'));
      }
    },
    [distanceUnit, sharesText, t, toast]
  );

  const shareGpx = useCallback(
    async (target: TourGpxExportTarget) => {
      if (!sharesFile) {
        await shareSummary(target);
        return;
      }
      if (sharingRef.current) return;
      const prepared = keptFor(preparedRef.current, target);
      // A fresh File for every sheet, so no share is handed one an earlier sheet still holds.
      // It goes to the sheet before anything is awaited, inside the tap that asked.
      const file = prepared ? new File([prepared.blob], prepared.name, { type: GPX_TYPE }) : await fetchFile(target);
      if (!file) return;
      if (!prepared) {
        preparedRef.current = { placeId: target.placeId, revision: revisionOf(target), blob: file, name: file.name };
      }
      const outcome = await withSheetOpen(sharingRef, () => shareFile(file, target.name));
      // A closed sheet is the user's choice and a sheet still open is no failure: neither says anything.
      if (outcome === 'needs-gesture' && !prepared) {
        toast.info(t('tours.gpxExport.shareReady'));
      } else if (outcome === 'failed' || outcome === 'needs-gesture') {
        toast.error(t('tours.gpxExport.shareFailed'));
      }
    },
    [fetchFile, shareSummary, sharesFile, t, toast]
  );

  return { exportGpx, shareGpx, sharesFile, exportingId, exporting: exportingId !== null };
}
