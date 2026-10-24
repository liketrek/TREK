import type { PaddleRegion, PaddleRegionCatalogEntry, PaddleRegionPending } from '@trek/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNetworkMode } from '../../../hooks/useNetworkMode';
import { useTranslation } from '../../../i18n';
import { paddleRegionErrorCode, paddleRegionRepo } from '../../../repo/paddleRegionRepo';
import { useAddonStore } from '../../../store/addonStore';
import { getApiErrorMessage } from '../../../types';
import { useToast } from '../../shared/Toast';
import { isReading } from './paddleRegionsModel';
import { usePaddleAutoLoad } from './usePaddleAutoLoad';

/** How often the list is asked again while a region waits or is read. */
export const PADDLE_REGIONS_POLL_MS = import.meta.env.MODE === 'test' ? 50 : 3000;
/** How long typing rests before Geofabrik's list is searched. */
export const CATALOG_SEARCH_DEBOUNCE_MS = import.meta.env.MODE === 'test' ? 10 : 350;

type Translate = ReturnType<typeof useTranslation>['t'];

function errorText(t: Translate, err: unknown): string {
  const code = paddleRegionErrorCode(err);
  if (code === 'offline') return t('admin.paddleRegions.offline');
  if (code === 'catalog_unavailable') return t('admin.paddleRegions.catalogUnavailable');
  return getApiErrorMessage(err, t('common.error'));
}

/**
 * The regions as the server holds them, with those paddlers asked for, asked
 * again every few seconds while any of them is read, and on `reload` after a
 * change. Every answer is set
 * from the request's own callback, so a slow one never overwrites a newer.
 */
function useRegionList(active: boolean, offline: boolean, t: Translate) {
  const [regions, setRegions] = useState<PaddleRegion[]>([]);
  const [requests, setRequests] = useState<PaddleRegionPending[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asked, setAsked] = useState(0);
  useEffect(() => {
    if (!active || offline) return;
    let cancelled = false;
    paddleRegionRepo.list().then(
      (list) => {
        if (cancelled) return;
        setRegions(list.regions);
        setRequests(list.requests);
        setError(null);
        setLoaded(true);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(errorText(t, err));
        setLoaded(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [active, offline, t, asked]);
  const reading = regions.some(isReading);
  useEffect(() => {
    if (!active || offline || !reading) return;
    const timer = window.setInterval(() => setAsked((n) => n + 1), PADDLE_REGIONS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [active, offline, reading]);
  const reload = useCallback(() => setAsked((n) => n + 1), []);
  return { regions, requests, loading: !loaded && !offline, error, reload };
}

/** Geofabrik's list searched as the admin types, the last search winning. */
function useCatalogSearch(offline: boolean, t: Translate) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{
    needle: string;
    hits: PaddleRegionCatalogEntry[] | null;
    error: string | null;
  } | null>(null);
  const needle = query.trim();
  const wanted = !offline && needle.length >= 2;
  useEffect(() => {
    if (!wanted) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      paddleRegionRepo
        .catalog(needle, controller.signal)
        .then((hits) => {
          if (!controller.signal.aborted) setResult({ needle, hits, error: null });
        })
        .catch((err: unknown) => {
          if (!controller.signal.aborted) setResult({ needle, hits: null, error: errorText(t, err) });
        });
    }, CATALOG_SEARCH_DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [needle, wanted, t]);
  // An answer counts only for the words it was asked for.
  const current = wanted && result?.needle === needle ? result : null;
  return { query, setQuery, hits: current?.hits ?? null, searching: wanted && !current, error: current?.error ?? null };
}

/**
 * PAD-05A in the admin area: the regions TREK reads paddle data for, a search
 * in Geofabrik's list to add one, reading a region again and removing it
 * after a confirmation. Shown only while the Tours addon is on; the status of
 * a read follows without reloading the page. PAD-11C: how TREK loads regions
 * for paddlers by itself, and the regions they asked for, to load or decline.
 */
export function usePaddleRegionsAdmin() {
  const { t } = useTranslation();
  const toast = useToast();
  const { offline } = useNetworkMode();
  const toursOn = useAddonStore((state) => state.isEnabled('tours'));
  const list = useRegionList(toursOn, offline, t);
  const autoLoad = usePaddleAutoLoad(toursOn, offline);
  const search = useCatalogSearch(offline, t);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<PaddleRegion | null>(null);
  const pending = useRef(false);
  const { reload } = list;

  const run = useCallback(
    async (id: string, action: () => Promise<unknown>, done?: string) => {
      if (pending.current) return;
      pending.current = true;
      setBusyId(id);
      try {
        await action();
        if (done) toast.success(done);
      } catch (err) {
        toast.error(errorText(t, err));
      } finally {
        pending.current = false;
        setBusyId(null);
        reload();
      }
    },
    [reload, t, toast]
  );

  const { setQuery } = search;
  const add = useCallback(
    (id: string) =>
      run(
        id,
        async () => {
          await paddleRegionRepo.add(id);
          setQuery('');
        },
        t('admin.paddleRegions.toast.added')
      ),
    [run, setQuery, t]
  );
  const refresh = useCallback((id: string) => run(id, () => paddleRegionRepo.refresh(id)), [run]);
  /** A paddler's request let through: the region is added like any other. */
  const approve = useCallback(
    (id: string) => run(id, () => paddleRegionRepo.add(id), t('admin.paddleRegions.toast.added')),
    [run, t]
  );
  const decline = useCallback((id: string) => run(id, () => paddleRegionRepo.decline(id)), [run]);
  const confirmRemove = useCallback(() => {
    const region = removing;
    setRemoving(null);
    if (region) void run(region.id, () => paddleRegionRepo.remove(region.id), t('admin.paddleRegions.toast.removed'));
  }, [removing, run, t]);
  const added = useMemo(() => new Set(list.regions.map((region) => region.id)), [list.regions]);

  return {
    toursOn,
    offline,
    regions: list.regions,
    requests: list.requests,
    autoLoad,
    loading: list.loading,
    error: list.error,
    retry: reload,
    search,
    added,
    busyId,
    add,
    refresh,
    approve,
    decline,
    removing,
    askRemove: setRemoving,
    cancelRemove: () => setRemoving(null),
    confirmRemove,
  };
}
