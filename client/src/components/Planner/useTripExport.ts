import { useCallback, useEffect, useRef, useState } from 'react';

import { useRoadtripSettings } from '../../hooks/useRoadtripSettings';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { AssignmentsMap, Category, Day, DayNote, Place, Reservation, Trip } from '../../types';
import { importChunk } from '../../utils/chunkReload';
import type { ViasByDay } from '../../utils/dayRouteVias';
import { downloadBlob } from '../../utils/fileDownload';
import type { TourStageStops } from '../Map/dayTourProjection';
import { hasPersonalPlan } from '../PDF/pdfScope';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** A running export: a PDF of the plan or of my plan, the calendar file, a GPX scope, or the places as KML. */
export type ExportJob = 'pdf' | 'pdf:mine' | 'ics' | 'kml' | `gpx:${string}`;

/** What a trip export prints, as both shells hold it. */
export interface TripExportData {
  trip: Trip | null;
  days: Day[];
  places: Place[];
  assignments: AssignmentsMap;
  categories: Category[];
  reservations: Reservation[];
  dayNotes: Record<string, DayNote[]>;
  /** The road trip's vias and the multi-day tour stages, so the PDF map routes what the planner map does. */
  viasByDay?: ViasByDay;
  tourStageStops?: TourStageStops;
}

/** How far the PDF's route map has got: legs answered or given up on, out of all of them. */
interface PdfRouting {
  done: number;
  total: number;
}

export interface TripExportOptions {
  tripId: number;
  /**
   * Whether the dialog or sheet is shown. Closing it, or leaving the trip, gives up a
   * PDF still routing: its legs stop going out and the document never opens.
   */
  open: boolean;
  data: TripExportData;
  t: Translate;
  locale: string;
  toast: { error: (message: string) => void; info: (message: string) => void };
  /**
   * The desktop runs one export at a time, so any running one holds every row; the
   * phone holds back only another PDF, calendar file or GPX file while the same kind
   * still runs.
   */
  exclusive: boolean;
  /** Runs once a calendar or GPX file is saved, and once the PDF is out when closeAfterPdf is set. */
  onExported: () => void;
  /** The phone prints no PDF until the trip has loaded; the desktop hands the PDF builder what it has. */
  requireTrip: boolean;
  /** The desktop closes after the PDF as well; the phone sheet stays open. */
  closeAfterPdf: boolean;
  /** The desktop also logs a failed PDF to the console. */
  logPdfErrors: boolean;
}

/**
 * Hands the downloaded file on: a browser download, or the share sheet inside
 * the native app (utils/fileDownload.ts).
 */
export function saveBlob(blob: Blob, filename: string) {
  downloadBlob(blob, filename);
}

/** The day notes as one list, each carrying the day it belongs to. */
export function flatDayNotes(dayNotes: Record<string, DayNote[]>) {
  return Object.entries(dayNotes).flatMap(([dayId, notes]) => notes.map((n) => ({ ...n, day_id: Number(dayId) })));
}

/**
 * The PDF's routing round as the export rows show it. A cold month-long trip routes for
 * minutes, one leg a second against the shared router, so the row counts the legs and
 * offers to print without the ones still to come; those are marked in the document (#2876).
 */
function usePdfRouting(open: boolean) {
  const [progress, setProgress] = useState<PdfRouting | null>(null);
  const controller = useRef<{ routing: AbortController; job: AbortController } | null>(null);

  const start = () => {
    const routing = new AbortController();
    const running = { routing, job: new AbortController() };
    controller.current = running;
    // A leg already on its way still reports after a skip; the row stays quiet about it.
    const onProgress = (done: number, total: number) =>
      setProgress(!routing.signal.aborted && done < total ? { done, total } : null);
    return { signal: routing.signal, onProgress, givenUp: running.job.signal };
  };
  const finish = () => {
    controller.current = null;
    setProgress(null);
  };
  const skip = () => {
    controller.current?.routing.abort();
    setProgress(null);
  };
  // Unlike a skip, nobody is left to print for: the export ends without a document.
  const giveUp = useCallback(() => {
    controller.current?.routing.abort();
    controller.current?.job.abort();
  }, []);
  useEffect(() => {
    if (!open) giveUp();
  }, [open, giveUp]);
  useEffect(() => giveUp, [giveUp]);

  return { progress, start, finish, skip };
}

/**
 * Every way a trip leaves TREK, behind the desktop export dialog and the phone's
 * export sheet: the day plan as a PDF (the whole plan, or my plan once somebody
 * has been given a part of the trip, #2168), the bookings as an .ics file, the
 * map data as GPX and the places as KML for Google My Maps.
 */
export function useTripExport({
  tripId,
  open,
  data,
  t,
  locale,
  toast,
  exclusive,
  onExported,
  requireTrip,
  closeAfterPdf,
  logPdfErrors,
}: TripExportOptions) {
  // Which export is working, per lane, so a row can say so instead of looking inert
  // while a 226 kB PDF builder is fetched and a document is rendered.
  const [running, setRunning] = useState<Record<string, ExportJob>>({});
  const pdfRouting = usePdfRouting(open);
  // The PDF is built outside React, so it cannot read these itself (#2066).
  const timeFormat = useSettingsStore((s) => s.settings.time_format) || '24h';
  const distanceUnit = useSettingsStore((s) => s.settings.distance_unit);
  // The export gets the store's assignments and applies the day plan's own filter to
  // them, so it needs the same switch the plan reads.
  const showServiceStops = useRoadtripSettings((s) => s.roadtrip_service_stops_in_days !== false, tripId);
  const myId = useAuthStore((s) => s.user?.id);
  const offerMine = myId != null && hasPersonalPlan(data.assignments, data.reservations);
  const fileBase = data.trip?.title || 'trip';

  const laneOf = (job: ExportJob) => (exclusive ? 'all' : job.split(':')[0]);
  const isRunning = (job: ExportJob) => running[laneOf(job)] === job;
  const begin = (job: ExportJob) => setRunning((prev) => ({ ...prev, [laneOf(job)]: job }));
  const end = (job: ExportJob) =>
    setRunning((prev) => {
      const next = { ...prev };
      delete next[laneOf(job)];
      return next;
    });

  /** What a PDF row says while its route map is still being routed, instead of its own line. */
  const pdfRoutingLabel = (job: ExportJob) =>
    isRunning(job) && pdfRouting.progress ? t('dayplan.pdfRouting', { ...pdfRouting.progress }) : null;

  const exportPdf = async (mine = false) => {
    const job: ExportJob = mine ? 'pdf:mine' : 'pdf';
    if ((requireTrip && !data.trip) || running[laneOf(job)]) return;
    begin(job);
    const flatNotes = flatDayNotes(data.dayNotes);
    const { givenUp, ...routing } = pdfRouting.start();
    try {
      // Loaded on click: the PDF builder is ~226 kB, so every trip used to pay for it
      // whether or not anyone exported. A missing chunk lands in the catch and shows
      // the same error the export already had.
      const { downloadTripPDF } = await importChunk(() => import('../PDF/TripPDF'));
      await downloadTripPDF({
        trip: data.trip,
        days: data.days,
        places: data.places,
        assignments: data.assignments,
        categories: data.categories,
        dayNotes: flatNotes,
        reservations: data.reservations,
        t,
        locale,
        timeFormat,
        distanceUnit,
        showServiceStops,
        onlyUserId: mine ? myId : undefined,
        route: { viasByDay: data.viasByDay, tourStageStops: data.tourStageStops, ...routing },
        signal: givenUp,
      });
      if (closeAfterPdf && !givenUp.aborted) onExported();
    } catch (e) {
      if (logPdfErrors) console.error('PDF error:', e);
      toast.error(`${t('dayplan.pdfError')}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      pdfRouting.finish();
      end(job);
    }
  };

  const downloadIcs = async () => {
    const job: ExportJob = 'ics';
    if (running[laneOf(job)]) return;
    begin(job);
    try {
      const res = await fetch(`/api/trips/${tripId}/export.ics`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      saveBlob(await res.blob(), `${fileBase}.ics`);
      onExported();
    } catch {
      toast.error(t('planner.icsExportFailed'));
    } finally {
      end(job);
    }
  };

  /** One map file the server writes, saved as `<trip>.<extension>`; `failed` is what a broken download says. */
  const downloadMapFile = async (job: ExportJob, path: string, extension: string, failed: string) => {
    if (running[laneOf(job)]) return;
    begin(job);
    try {
      const res = await fetch(`/api/trips/${tripId}/places/${path}`, { credentials: 'include' });
      // 404 here means the selection is empty, which is worth its own message:
      // "nothing happened" and "the download broke" look identical otherwise.
      if (res.status === 404) {
        toast.info(t('dayplan.gpxEmpty'));
        return;
      }
      if (!res.ok) throw new Error();
      saveBlob(await res.blob(), `${fileBase}.${extension}`);
      onExported();
    } catch {
      toast.error(failed);
    } finally {
      end(job);
    }
  };

  /** One GPX scope; `query` narrows what the file carries, empty for everything. */
  const downloadGpx = (key: string, query: string) =>
    downloadMapFile(`gpx:${key}`, `export.gpx${query}`, 'gpx', t('dayplan.gpxFailed'));

  /** The places as pins for Google My Maps (#1866), which takes a KML file as a layer. */
  const downloadKml = () => downloadMapFile('kml', 'export.kml', 'kml', t('dayplan.kmlFailed'));

  return {
    fileBase,
    offerMine,
    isRunning,
    anyRunning: Object.keys(running).length > 0,
    exportPdf,
    pdfRouting: pdfRouting.progress,
    pdfRoutingLabel,
    skipPdfRouting: pdfRouting.skip,
    downloadIcs,
    downloadGpx,
    downloadKml,
  };
}
