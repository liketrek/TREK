import type { TourListItem, WandererBbox, WandererImportPreview, WandererTrailSummary } from '@trek/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { wandererErrorCode, wandererRepo } from '../../../repo/wandererRepo';
import { useToast } from '../../shared/Toast';
import { wandererErrorText } from './wandererErrors';

/** Typing settles for this long before the search goes out. */
const SEARCH_DEBOUNCE_MS = 350;

export type WandererBrowserError = ReturnType<typeof wandererErrorCode>;

const isAbort = (error: unknown) => {
  const e = error as { name?: string; code?: string } | null;
  return e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED' || e?.name === 'AbortError';
};

/**
 * The search half: a text, or the part of the map in view, and the trails it
 * found, a page at a time. Every answer that arrives after a newer question is
 * dropped, so a slow search never paints over the one typed after it.
 */
function useWandererSearch(tripId: number, active: boolean) {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState<WandererBbox | null>(null);
  const [trails, setTrails] = useState<WandererTrailSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<WandererBrowserError | null>(null);
  const viewport = useRef<WandererBbox | null>(null);
  const searchAbort = useRef<AbortController | null>(null);

  const runSearch = useCallback(
    async (q: string, bbox: WandererBbox | null, nextPage: number) => {
      searchAbort.current?.abort();
      const controller = new AbortController();
      searchAbort.current = controller;
      setSearching(true);
      setSearchError(null);
      try {
        const result = await wandererRepo.search(
          tripId,
          { q, page: nextPage, ...(bbox ? { bbox } : {}) },
          controller.signal
        );
        if (controller.signal.aborted) return;
        setTrails((current) => (nextPage === 1 ? result.trails : [...current, ...result.trails]));
        setTotal(result.total);
        setPage(nextPage);
      } catch (error: unknown) {
        if (isAbort(error) || controller.signal.aborted) return;
        setSearchError(wandererErrorCode(error));
        if (nextPage === 1) setTrails([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    },
    [tripId]
  );

  // A new text or a new area starts over at the first page, once typing settles.
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      void runSearch(query.trim(), area, 1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [active, area, query, runSearch]);

  useEffect(() => () => searchAbort.current?.abort(), []);

  return {
    query,
    setQuery,
    area,
    /** Search the part of the map in view; a second press goes back to searching everywhere. */
    toggleArea: useCallback(() => setArea((current) => (current ? null : viewport.current)), []),
    onViewportChange: useCallback((bounds: WandererBbox) => {
      viewport.current = bounds;
    }, []),
    trails,
    total,
    hasMore: trails.length < total,
    loadMore: useCallback(() => {
      if (!searching) void runSearch(query.trim(), area, page + 1);
    }, [area, page, query, runSearch, searching]),
    searching,
    searchError,
    retry: useCallback(() => {
      void runSearch(query.trim(), area, 1);
    }, [area, query, runSearch]),
    abortSearch: useCallback(() => searchAbort.current?.abort(), []),
  };
}

/**
 * The preview half: picking a trail fetches its preview (the full GPX measured,
 * and how it stands to a snapshot already in the trip), and the import writes it
 * as a tour of the trip only after the user confirms.
 */
function useWandererPreview(tripId: number, onImported: (tour: TourListItem) => Promise<void> | void) {
  const { t } = useTranslation();
  const toast = useToast();
  const [selected, setSelected] = useState<WandererTrailSummary | null>(null);
  const [preview, setPreview] = useState<WandererImportPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<WandererBrowserError | null>(null);
  const [importing, setImporting] = useState(false);
  const previewAbort = useRef<AbortController | null>(null);

  const select = useCallback(
    async (trail: WandererTrailSummary) => {
      previewAbort.current?.abort();
      const controller = new AbortController();
      previewAbort.current = controller;
      setSelected(trail);
      setPreview(null);
      setPreviewError(null);
      setPreviewing(true);
      try {
        const result = await wandererRepo.preview(tripId, trail.id, controller.signal);
        if (!controller.signal.aborted) setPreview(result);
      } catch (error: unknown) {
        if (isAbort(error) || controller.signal.aborted) return;
        setPreviewError(wandererErrorCode(error));
      } finally {
        if (!controller.signal.aborted) setPreviewing(false);
      }
    },
    [tripId]
  );

  const backToList = useCallback(() => {
    previewAbort.current?.abort();
    setSelected(null);
    setPreview(null);
    setPreviewError(null);
    setPreviewing(false);
  }, []);

  useEffect(() => () => previewAbort.current?.abort(), []);

  /** Writes the previewed trail; true once it is in, so the caller can close. */
  const importSelected = useCallback(async () => {
    if (!preview || importing) return false;
    setImporting(true);
    try {
      const { tour } = await wandererRepo.importTrail(tripId, {
        trailId: preview.trail.id,
        contentHash: preview.contentHash,
      });
      toast.success(t('wanderer.import.done', { name: tour.name }));
      if (tour.caution) toast.info(t('tours.import.caution'));
      await onImported(tour);
      return true;
    } catch (error: unknown) {
      const code = wandererErrorCode(error);
      if (code === 'preview_stale' && selected) {
        toast.info(t('wanderer.import.stale'));
        void select(selected);
      } else {
        toast.error(wandererErrorText(t, code));
      }
      return false;
    } finally {
      setImporting(false);
    }
  }, [importing, onImported, preview, select, selected, t, toast, tripId]);

  // The trail on the map: the preview's full line once it is in, the list's sketch until then.
  // Read as plain pairs, since a workspace without strict mode sees the contract's tuples as optional.
  const sourceLine = preview?.line ?? selected?.line ?? null;
  const line = useMemo(
    () => sourceLine?.map((point) => [Number(point[0]), Number(point[1])] as [number, number]) ?? null,
    [sourceLine]
  );

  return { selected, select, backToList, preview, previewing, previewError, importing, importSelected, line };
}

/**
 * Whether the signed-in user has connected their own wanderer, asked each time
 * the workspace offers it: the entry to the trails shows only for someone who
 * has trails to bring in. A failed answer counts as not connected.
 */
function useWandererConnected(active: boolean): boolean {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    wandererRepo.getSettings().then(
      (connection) => {
        if (!cancelled) setConnected(connection.connected);
      },
      () => {
        if (!cancelled) setConnected(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [active]);
  return active && connected;
}

interface WandererBrowserOptions {
  tripId: number;
  /** The tours tab is on screen and the user may add tours. */
  enabled: boolean;
  /** The new tour, once the import wrote it, for the lists and the map to take it in. */
  onImported: (tour: TourListItem) => Promise<void> | void;
  /** Open a tour of the trip, for a snapshot that is already here. */
  onOpenTour: (placeId: number) => void;
}

/**
 * Browsing the user's wanderer trails from the tours workspace, in place of the
 * editor rail: the search, one trail's preview on the map, and its import.
 */
export function useWandererBrowser({ tripId, enabled, onImported, onOpenTour }: WandererBrowserOptions) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const connected = useWandererConnected(enabled);
  const search = useWandererSearch(tripId, open && enabled);
  const preview = useWandererPreview(tripId, onImported);
  const { abortSearch } = search;
  const { backToList } = preview;

  const close = useCallback(() => {
    abortSearch();
    backToList();
    setOpen(false);
  }, [abortSearch, backToList]);

  // Leaving the tab closes the browser, so coming back starts from the workspace.
  useEffect(() => {
    if (!enabled) return;
    return close;
  }, [close, enabled]);

  const { importSelected } = preview;
  return {
    ...search,
    ...preview,
    errorText: useCallback((code: WandererBrowserError) => wandererErrorText(t, code), [t]),
    /** The browser may be offered here: wanderer is allowed and the user has connected their own. */
    enabled: connected,
    open,
    openBrowser: useCallback(() => setOpen(true), []),
    close,
    importSelected: useCallback(async () => {
      if (await importSelected()) close();
    }, [close, importSelected]),
    openSnapshot: useCallback(
      (placeId: number) => {
        close();
        onOpenTour(placeId);
      },
      [close, onOpenTour]
    ),
  };
}

export type WandererBrowser = ReturnType<typeof useWandererBrowser>;
