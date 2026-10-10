import type React from 'react';
import { useEffect, useEffectEvent, useState } from 'react';

import { placesApi } from '../../api/client';
import type { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import type { useToast } from '../shared/Toast';

export interface PlacesImportSummary {
  totalPlacemarks: number;
  createdCount: number;
  skippedCount: number;
  warnings: string[];
  errors: string[];
}

export type GpxImportOption = 'waypoints' | 'routes' | 'tracks';
export type KmlImportOption = 'points' | 'paths';

export interface PlacesFileImportOptions {
  tripId: number;
  t: ReturnType<typeof useTranslation>['t'];
  toast: ReturnType<typeof useToast>;
  loadTrip: (tripId: number) => Promise<unknown>;
  pushUndo?: (label: string, undoFn: () => Promise<void> | void) => void;
  /** Runs after an import with no error and no KML summary left to show. */
  onDone: () => void;
  /**
   * The two shells read an import differently, and each keeps its own reading.
   *
   * `dialog` (desktop): one toast and one undo label for the whole selection, a KML
   * answer counts as skipped only what its summary says, a pick of nothing but
   * unsupported files keeps the last summary on screen, and a clean import resets the
   * dialog before it closes, as Cancel does.
   *
   * `sheet` (phone): a toast per format, the undo step named for both formats when both
   * came in, a KML answer without a summary still counts its top-level skips, a pick of
   * nothing usable clears the summary too, and a clean import hands straight back.
   */
  variant: 'dialog' | 'sheet';
  /** The desktop dialog's opening: each one starts clean, with a file dropped on the sidebar already chosen. */
  open?: boolean;
  initialFile?: File | null;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const extensionOf = (f: File) => f.name.toLowerCase().split('.').pop();

function mergeSummaries(merged: PlacesImportSummary | null, s: PlacesImportSummary): PlacesImportSummary {
  return merged
    ? {
        totalPlacemarks: merged.totalPlacemarks + s.totalPlacemarks,
        createdCount: merged.createdCount + s.createdCount,
        skippedCount: merged.skippedCount + s.skippedCount,
        warnings: [...merged.warnings, ...(s.warnings ?? [])],
        errors: [...merged.errors, ...(s.errors ?? [])],
      }
    : s;
}

/**
 * GPX/KML/KMZ file import into the trip's places: the one logic path behind the desktop
 * dialog and the phone's import step, which render their own markup over it. It checks
 * the files, keeps which kinds of content to bring in, sends each file to its endpoint,
 * reloads the trip, offers an undo step that deletes what came in, and keeps a KML
 * summary or the errors on screen; `variant` keeps the shells' own readings apart.
 */
export function usePlacesFileImport({
  tripId,
  t,
  toast,
  loadTrip,
  pushUndo,
  onDone,
  variant,
  open,
  initialFile,
}: PlacesFileImportOptions) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<PlacesImportSummary | null>(null);
  const [gpxOpts, setGpxOpts] = useState({ waypoints: true, routes: true, tracks: true });
  const [kmlOpts, setKmlOpts] = useState({ points: true, paths: true });
  // The Google pass a list import offers, for the points of a file too (#2536).
  const canEnrich = useAuthStore((s) => s.hasMapsKey);
  const [enrich, setEnrich] = useState(false);

  const validateFile = (f: File): string | null => {
    const ext = extensionOf(f);
    if (ext !== 'gpx' && ext !== 'kml' && ext !== 'kmz') return t('places.importFileUnsupported');
    if (f.size > MAX_FILE_BYTES) return t('places.importFileTooLarge', { maxMb: 10 });
    return null;
  };

  const reset = () => {
    setFiles([]);
    setIsDragOver(false);
    setLoading(false);
    setError('');
    setSummary(null);
  };

  /** The desktop dialog's way out, by Cancel or after a clean import. */
  const close = () => {
    reset();
    onDone();
  };

  // When the dialog opens, reset state and pre-load any file dropped from the sidebar.
  const prepareOpening = useEffectEvent((file: File | null | undefined) => {
    setIsDragOver(false);
    setLoading(false);
    setSummary(null);
    if (file) {
      const err = validateFile(file);
      if (err) {
        setFiles([]);
        setError(err);
      } else {
        setFiles([file]);
        setError('');
      }
    } else {
      setFiles([]);
      setError('');
    }
  });
  useEffect(() => {
    if (!open) return;
    prepareOpening(initialFile);
  }, [open, initialFile]);

  const selectFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    const valid: File[] = [];
    let firstError: string | null = null;
    for (const f of incoming) {
      const validationError = validateFile(f);
      if (validationError) firstError = firstError ?? validationError;
      else valid.push(f);
    }
    if (valid.length === 0 && variant === 'dialog') {
      setError(firstError ?? '');
      setFiles([]);
      return;
    }
    setFiles(valid);
    setError(firstError ?? '');
    setSummary(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (list.length) selectFiles(list);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.target === e.currentTarget) setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const list = Array.from(e.dataTransfer.files);
    if (list.length) selectFiles(list);
  };

  const toggleGpxOpt = (key: GpxImportOption) => setGpxOpts((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleKmlOpt = (key: KmlImportOption) => setKmlOpts((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleImport = async () => {
    if (files.length === 0 || loading) return;
    setLoading(true);
    setError('');
    setSummary(null);

    // Counted per format so a mixed selection can get each half's own label.
    let gpxCreated = 0;
    let kmlCreated = 0;
    let gpxSkipped = 0;
    // A KML answer's skips as its summary counts them, and with the top-level count
    // standing in for a missing summary.
    let kmlSummarySkipped = 0;
    let kmlSkipped = 0;
    const createdIds: number[] = [];
    const gpxIds: number[] = [];
    const kmlIds: number[] = [];
    const errors: string[] = [];
    let mergedSummary: PlacesImportSummary | null = null;
    let importedGpx = false;
    let importedKml = false;

    for (const f of files) {
      const ext = extensionOf(f);
      try {
        if (ext === 'gpx') {
          importedGpx = true;
          const result = await placesApi.importGpx(tripId, f, { ...gpxOpts, enrich: enrich && canEnrich });
          gpxCreated += result.count ?? 0;
          gpxSkipped += result.skipped ?? 0;
          if (result.places?.length > 0) {
            const ids = result.places.map((p: { id: number }) => p.id);
            createdIds.push(...ids);
            gpxIds.push(...ids);
          }
        } else {
          importedKml = true;
          const result = await placesApi.importMapFile(tripId, f, { ...kmlOpts, enrich: enrich && canEnrich });
          kmlCreated += result.count ?? 0;
          if (result.places?.length > 0) {
            const ids = result.places.map((p: { id: number }) => p.id);
            createdIds.push(...ids);
            kmlIds.push(...ids);
          }
          const s = result.summary as PlacesImportSummary | undefined;
          if (s) {
            mergedSummary = mergeSummaries(mergedSummary, s);
            kmlSummarySkipped += s.skippedCount ?? 0;
          }
          kmlSkipped += s?.skippedCount ?? result.skipped ?? 0;
        }
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('places.importFileError');
        errors.push(files.length > 1 ? `${f.name}: ${message}` : message);
      }
    }

    await loadTrip(tripId);

    const sheet = variant === 'sheet';
    const undoIds = sheet ? [...gpxIds, ...kmlIds] : createdIds;
    if (undoIds.length > 0) {
      let undoLabel: string;
      if (!sheet) undoLabel = importedGpx && !importedKml ? t('undo.importGpx') : t('undo.importKeyholeMarkup');
      else if (gpxIds.length > 0 && kmlIds.length > 0) undoLabel = t('undo.importFiles');
      else undoLabel = gpxIds.length > 0 ? t('undo.importGpx') : t('undo.importKeyholeMarkup');
      pushUndo?.(undoLabel, async () => {
        try {
          await placesApi.bulkDelete(tripId, undoIds);
        } catch {
          // best effort: the trip reload below reflects whatever happened
        }
        await loadTrip(tripId);
      });
    }

    if (sheet) {
      if (gpxCreated > 0) toast.success(t('places.gpxImported', { count: gpxCreated }));
      if (kmlCreated > 0) toast.success(t('places.kmlKmzImported', { count: kmlCreated }));
      if (gpxCreated === 0 && kmlCreated === 0 && gpxSkipped + kmlSkipped > 0 && errors.length === 0) {
        toast.warning(t('places.importAllSkipped'));
      }
    } else {
      const totalCreated = gpxCreated + kmlCreated;
      if (totalCreated > 0) {
        const key = importedKml && !importedGpx ? 'places.kmlKmzImported' : 'places.gpxImported';
        toast.success(t(key, { count: totalCreated }));
      } else if (gpxSkipped + kmlSummarySkipped > 0 && errors.length === 0) {
        toast.warning(t('places.importAllSkipped'));
      }
    }

    if (mergedSummary) setSummary(mergedSummary);
    if (errors.length > 0) {
      setError(errors.join('\n'));
      toast.error(errors[0]);
    }

    setLoading(false);

    // Close once everything succeeded and there's no KML summary left to surface.
    if (errors.length === 0 && !mergedSummary) {
      if (sheet) onDone();
      else close();
    }
  };

  const exts = files.map((f) => extensionOf(f) ?? '');
  const isGpx = exts.includes('gpx');
  const isKml = exts.some((e) => e === 'kml' || e === 'kmz');
  const gpxNoneSelected = isGpx && !gpxOpts.waypoints && !gpxOpts.routes && !gpxOpts.tracks;
  const kmlNoneSelected = isKml && !kmlOpts.points && !kmlOpts.paths;
  const canImport = files.length > 0 && !loading && !gpxNoneSelected && !kmlNoneSelected;

  return {
    files,
    loading,
    error,
    summary,
    gpxOpts,
    toggleGpxOpt,
    kmlOpts,
    toggleKmlOpt,
    enrich,
    setEnrich,
    canEnrich,
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
    handleImport,
    close,
    isGpx,
    isKml,
    gpxNoneSelected,
    kmlNoneSelected,
    canImport,
  };
}
