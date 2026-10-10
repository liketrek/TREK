import { useState } from 'react';

import { useRoadtripSettings } from '../../hooks/useRoadtripSettings';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { AssignmentsMap, Category, Day, DayNote, Place, Reservation, Trip } from '../../types';
import { importChunk } from '../../utils/chunkReload';
import { hasPersonalPlan } from '../PDF/pdfScope';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** A running export: a PDF of the plan or of my plan, the calendar file, or a GPX scope. */
export type ExportJob = 'pdf' | 'pdf:mine' | 'ics' | `gpx:${string}`;

/** What a trip export prints, as both shells hold it. */
export interface TripExportData {
  trip: Trip | null;
  days: Day[];
  places: Place[];
  assignments: AssignmentsMap;
  categories: Category[];
  reservations: Reservation[];
  dayNotes: Record<string, DayNote[]>;
}

export interface TripExportOptions {
  tripId: number;
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
 * Hands the browser a downloaded file. Firefox and Safari cancel the download when
 * the object URL is revoked before they picked the blob up, hence the delay.
 */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}

/** The day notes as one list, each carrying the day it belongs to. */
export function flatDayNotes(dayNotes: Record<string, DayNote[]>) {
  return Object.entries(dayNotes).flatMap(([dayId, notes]) => notes.map((n) => ({ ...n, day_id: Number(dayId) })));
}

/**
 * Every way a trip leaves TREK, behind the desktop export dialog and the phone's
 * export sheet: the day plan as a PDF (the whole plan, or my plan once somebody
 * has been given a part of the trip, #2168), the bookings as an .ics file and the
 * map data as GPX.
 */
export function useTripExport({
  tripId,
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

  const exportPdf = async (mine = false) => {
    const job: ExportJob = mine ? 'pdf:mine' : 'pdf';
    if ((requireTrip && !data.trip) || running[laneOf(job)]) return;
    begin(job);
    const flatNotes = flatDayNotes(data.dayNotes);
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
      });
      if (closeAfterPdf) onExported();
    } catch (e) {
      if (logPdfErrors) console.error('PDF error:', e);
      toast.error(`${t('dayplan.pdfError')}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
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

  /** One GPX scope; `query` narrows what the file carries, empty for everything. */
  const downloadGpx = async (key: string, query: string) => {
    const job: ExportJob = `gpx:${key}`;
    if (running[laneOf(job)]) return;
    begin(job);
    try {
      const res = await fetch(`/api/trips/${tripId}/places/export.gpx${query}`, { credentials: 'include' });
      // 404 here means the selection is empty, which is worth its own message:
      // "nothing happened" and "the download broke" look identical otherwise.
      if (res.status === 404) {
        toast.info(t('dayplan.gpxEmpty'));
        return;
      }
      if (!res.ok) throw new Error();
      saveBlob(await res.blob(), `${fileBase}.gpx`);
      onExported();
    } catch {
      toast.error(t('dayplan.gpxFailed'));
    } finally {
      end(job);
    }
  };

  return {
    fileBase,
    offerMine,
    isRunning,
    anyRunning: Object.keys(running).length > 0,
    exportPdf,
    downloadIcs,
    downloadGpx,
  };
}
