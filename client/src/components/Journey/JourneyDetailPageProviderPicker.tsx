import { Calendar, Camera, Check, ChevronRight, Loader2, Play, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { memoriesApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import {
  fetchRemainingProviderPages,
  groupPhotosByDate,
  PROVIDER_SEARCH_LAST_PAGE,
  PROVIDER_SEARCH_PAGE_SIZE,
  sortByCaptureTimeAsc,
  sortProviderPhotos,
  utcOffsetMinutesForDay,
  type GeoPoint,
  type ProviderPhotoAsset,
} from '../../pages/journeyDetail/JourneyDetailPage.helpers';
import type { JourneyEntry, JourneyTrip } from '../../store/journeyStore';
import { DatePicker } from './JourneyDetailPageDatePicker';
import { ScrollTrigger } from './JourneyDetailPageScrollTrigger';

export type ProviderPhotoGroup = { assetIds: string[]; passphrase?: string; mediaTypes?: string[] };

/** A tile as the search and album routes answer it; only what a pick needs is spelled out. */
type PickerAsset = ProviderPhotoAsset & { mediaType?: string };

/**
 * One picked asset. The capture times ride along only to order the ids at
 * submit (#1587): a pick survives tab and album switches, and by then the asset
 * may no longer be in the loaded list to look them up in.
 */
type SelectedAsset = {
  albumId?: string;
  passphrase?: string;
  mediaType?: string;
  takenAt?: string | null;
  localTakenAt?: string | null;
};

export function ProviderPicker({
  provider,
  userId,
  entries,
  trips,
  existingAssetIds,
  onClose,
  onAdd,
  initialDate,
  contextLocation,
  initialEntryId,
  embedded = false,
}: {
  provider: string;
  userId: number;
  entries: JourneyEntry[];
  trips: JourneyTrip[];
  existingAssetIds: Set<string>;
  onClose: () => void;
  onAdd: (groups: ProviderPhotoGroup[], entryId: number | null) => Promise<void>;
  initialDate?: string;
  contextLocation?: (GeoPoint & { name?: string }) | null;
  initialEntryId?: number | null;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'day' | 'trip' | 'custom' | 'all' | 'album'>(initialDate ? 'day' : 'trip');
  const [photos, setPhotos] = useState<any[]>([]);
  const [albums, setAlbums] = useState<
    Array<{ id: string; albumName: string; assetCount: number; passphrase?: string }>
  >([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedAlbumPassphrase, setSelectedAlbumPassphrase] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [selected, setSelected] = useState<Map<string, SelectedAsset>>(new Map());
  // "Select all" is loading the pages that were still missing (#1587).
  const [draining, setDraining] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [targetEntryId, setTargetEntryId] = useState<number | null>(initialEntryId ?? null);
  const [addToOpen, setAddToOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // compute trip range
  const tripRange = useMemo(() => {
    let from = '',
      to = '';
    for (const t of trips) {
      if (t.start_date && (!from || t.start_date < from)) from = t.start_date;
      if (t.end_date && (!to || t.end_date > to)) to = t.end_date;
    }
    return { from, to };
  }, [trips]);

  const cancelPending = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    return abortRef.current.signal;
  };

  // Closing the picker cancels whatever it is still loading, a "Select all" that
  // is working through the remaining pages included.
  useEffect(() => () => abortRef.current?.abort(), []);

  // The body of one page of a search. Shared by the page a search opens with,
  // the pages scrolled into view and the ones "Select all" loads, so every page
  // asks for the same days in the same zone (#1587).
  //
  // The bounds are calendar days as this browser reads them, so the zone they
  // are meant in travels with them. Without it the server can only take them
  // as UTC days and a reader outside UTC gets somebody else's 24 hours
  // (#2336). A single offset leaves a one-hour sliver at the far end of a
  // multi-day range that crosses a DST change, and none at all for a single
  // day, which is the case this fixes.
  const searchRequest = (from: string, to: string, page: number) => ({
    from,
    to,
    page,
    size: PROVIDER_SEARCH_PAGE_SIZE,
    utc_offset_minutes: utcOffsetMinutesForDay(from || to),
  });

  const searchPhotos = async (from: string, to: string, page: number = 1, append: boolean = false) => {
    const signal = cancelPending();
    if (page === 1) {
      setLoading(true);
      setPhotos([]);
      // A search shows no album, so none may colour its picks, its thumbnails or
      // its paging. Left set, a trip search after an album never paged again.
      setSelectedAlbum(null);
      setSelectedAlbumPassphrase(undefined);
    } else {
      setLoadingMore(true);
    }
    setSearchFrom(from);
    setSearchTo(to);
    setSearchPage(page);
    try {
      const data = await memoriesApi.search(provider, searchRequest(from, to, page), signal);
      const assets = data.assets || [];
      setPhotos((prev) => (append ? [...prev, ...assets] : assets));
      setHasMore(!!data.hasMore);
    } catch {
      // A cancelled request is about to be replaced by the next one, so leave
      // its paging state alone.
      if (!signal.aborted) setHasMore(false);
    }
    if (!signal.aborted) {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadAlbumPhotos = async (album: { id: string; passphrase?: string }) => {
    const signal = cancelPending();
    setLoading(true);
    setPhotos([]);
    setHasMore(false);
    try {
      const assets = (await memoriesApi.albumPhotos(provider, album.id, album.passphrase, signal)).assets || [];
      setPhotos(assets);
    } catch {
      /* ignore */
    }
    if (!signal.aborted) setLoading(false);
  };

  const loadAlbums = async () => {
    try {
      setAlbums((await memoriesApi.albums(provider)).albums || []);
    } catch {}
  };

  // load on mount / filter change
  useEffect(() => {
    if (filter === 'day' && initialDate) {
      searchPhotos(initialDate, initialDate);
    } else if (filter === 'trip' && tripRange.from && tripRange.to) {
      searchPhotos(tripRange.from, tripRange.to);
    } else if (filter === 'all') {
      searchPhotos('', '');
    } else if (filter === 'album' && albums.length === 0) {
      loadAlbums();
    }
  }, [filter]);

  const handleCustomSearch = () => {
    if (customFrom && customTo) searchPhotos(customFrom, customTo);
  };

  // Sorted here rather than in the two fetches above. contextLocation is live
  // editor state: the place search and "use my location" write it while this
  // picker stays mounted, and its key is only provider plus date, so a fetch-time
  // sort would leave the grid frozen while the caption already says "near Rome".
  // It also keeps the ranking global instead of per page, which a sort inside
  // the appending search cannot do.
  const sortedPhotos = useMemo(
    () => sortProviderPhotos(photos, contextLocation),
    [photos, contextLocation?.lat, contextLocation?.lng],
  );

  // Albums come back whole, so they never page.
  const morePagesPending = hasMore && !selectedAlbum;
  const dateBounded = Boolean(searchFrom || searchTo);
  // A date-bounded search ends at PROVIDER_SEARCH_LAST_PAGE, scrolled or loaded
  // by "Select all" (#1587). Past it the server's scan ceiling could only answer
  // an empty page with no more to come, so the picker stops asking and keeps
  // what the server last said: the count keeps its "+".
  const canLoadMore = morePagesPending && !(dateBounded && searchPage >= PROVIDER_SEARCH_LAST_PAGE);
  // A date-bounded search is a trip or a day, so "Select all" loads the rest of
  // it first (#1587). The All Photos tab is the whole library: there it stays
  // "everything loaded so far", and the count says there is more.
  const selectAllLoadsRest = canLoadMore && dateBounded;

  const loadMorePhotos = () => {
    if (loadingMore || !canLoadMore) return;
    searchPhotos(searchFrom, searchTo, searchPage + 1, true);
  };

  const selectionEntry = (asset: PickerAsset | undefined): SelectedAsset => ({
    albumId: selectedAlbum ?? undefined,
    passphrase: selectedAlbumPassphrase,
    mediaType: asset?.mediaType,
    takenAt: asset?.takenAt ?? null,
    localTakenAt: asset?.localTakenAt ?? null,
  });

  const toggleAsset = (id: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, selectionEntry(photos.find((p) => p.id === id)));
      }
      return next;
    });
  };

  // Adds to what is picked rather than replacing it: picks made on another tab
  // or in an album survive a "Select all" here.
  const addToSelection = (assets: PickerAsset[]) => {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const asset of assets) {
        if (existingAssetIds.has(asset.id) || next.has(asset.id)) continue;
        next.set(asset.id, selectionEntry(asset));
      }
      return next;
    });
  };

  const removeFromSelection = (assets: PickerAsset[]) => {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const asset of assets) next.delete(asset.id);
      return next;
    });
  };

  const selectAll = async (inView: PickerAsset[]) => {
    const controller = abortRef.current;
    if (!selectAllLoadsRest || !controller) {
      addToSelection(inView);
      return;
    }
    // The search's own controller: a new search, a tab switch or closing the
    // picker aborts it, and with it this run.
    const signal = controller.signal;
    const loaded: PickerAsset[] = [];
    setDraining(true);
    setLoadingMore(true);
    try {
      await fetchRemainingProviderPages<PickerAsset>(
        (page) => memoriesApi.search(provider, searchRequest(searchFrom, searchTo, page), signal),
        searchPage + 1,
        signal,
        (assets, page, more) => {
          loaded.push(...assets);
          setPhotos((prev) => [...prev, ...assets]);
          setSearchPage(page);
          setHasMore(more);
        },
      );
    } catch {
      // A page that failed leaves the rest pending: what did arrive is still
      // selected below, the count keeps its "+", and pressing again carries on
      // from the page that failed.
    } finally {
      setDraining(false);
      setLoadingMore(false);
    }
    if (!signal.aborted) addToSelection([...inView, ...loaded]);
  };

  // Leaving a tab ends a "Select all" that is still loading its pages.
  const switchTab = (id: typeof filter) => {
    if (draining && id !== filter) cancelPending();
    setFilter(id);
  };

  // While Select all is still loading pages, the selection holds only the picks
  // from before it: an Add then would send those and drop the rest (#1587).
  const addDisabled = selected.size === 0 || adding || draining;

  const targetLabel = targetEntryId
    ? entries.find((e) => e.id === targetEntryId)?.title ||
      entries.find((e) => e.id === targetEntryId)?.entry_date ||
      t('journey.stats.entries')
    : t('journey.picker.newGallery');

  return (
    <div
      data-testid={embedded ? 'journey-provider-picker-embedded' : undefined}
      className={
        embedded
          ? 'flex h-full min-h-0 w-full flex-col overflow-hidden'
          : 'fixed inset-0 z-[9999] flex items-end justify-center overscroll-none bg-[rgba(9,9,11,0.75)] md:items-center md:p-5'
      }
      role="presentation"
      onClick={embedded ? undefined : onClose}
      onTouchMove={(e) => {
        if (!embedded && e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className={
          embedded
            ? 'flex h-full w-full flex-col overflow-hidden bg-white dark:bg-zinc-900'
            : 'flex max-h-[calc(100dvh-var(--bottom-nav-h)-20px)] w-full max-w-[720px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.2)] md:max-h-[85vh] md:max-w-[960px] md:rounded-2xl dark:bg-zinc-900'
        }
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {!embedded && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
            <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white">
              {provider === 'immich' ? 'Immich' : provider === 'synologyphotos' ? 'Synology Photos' : provider}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filter bar. Embedded in the entry editor this sits in a panel a few hundred
            pixels tall, so its padding is the difference between three rows of
            thumbnails and two. */}
        <div className={`flex-shrink-0 border-b border-zinc-200 dark:border-zinc-700 ${embedded ? 'px-3 py-2' : 'px-6 py-3'}`}>
          {/* Tabs */}
          <div className={`flex gap-1.5 ${embedded && filter === 'day' ? '' : 'mb-3'}`}>
            {[
              ...(initialDate ? [{ id: 'day' as const, label: t('journey.picker.day') || 'This day' }] : []),
              { id: 'trip' as const, label: t('journey.picker.tripPeriod') },
              { id: 'custom' as const, label: t('journey.picker.dateRange') },
              { id: 'all' as const, label: t('journey.picker.allPhotos'), short: t('common.all') },
              { id: 'album' as const, label: t('journey.picker.albums') },
            ].map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => switchTab(f.id)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {f.short ? (
                  <>
                    <span className="hidden sm:inline">{f.label}</span>
                    <span className="sm:hidden">{f.short}</span>
                  </>
                ) : (
                  f.label
                )}
              </button>
            ))}
          </div>

          {/* Filter content — always visible row */}
          {(!embedded || filter !== 'day') && (
            <div className="flex min-h-[36px] items-center">
              {filter === 'day' && initialDate && (
                <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                  <Calendar size={13} className="text-zinc-400" />
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {new Date(initialDate + 'T00:00:00').toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {contextLocation?.name && <span className="text-zinc-400">· near {contextLocation.name}</span>}
                </div>
              )}
              {filter === 'trip' && (
                <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                  {tripRange.from && tripRange.to ? (
                    <>
                      <Calendar size={13} className="text-zinc-400" />
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {new Date(tripRange.from + 'T00:00:00').toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-zinc-400">&mdash;</span>
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {new Date(tripRange.to + 'T00:00:00').toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="ml-1 text-zinc-400">
                        (
                        {Math.ceil((new Date(tripRange.to).getTime() - new Date(tripRange.from).getTime()) / 86400000) +
                          1}{' '}
                        days)
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-400">{t('journey.trips.noTripsLinkedSettings')}</span>
                  )}
                </div>
              )}

              {filter === 'custom' && (
                <div className="flex flex-1 items-center gap-2">
                  <div className="flex-1">
                    <DatePicker value={customFrom} onChange={setCustomFrom} />
                  </div>
                  <span className="text-[12px] text-zinc-400">&mdash;</span>
                  <div className="flex-1">
                    <DatePicker value={customTo} onChange={setCustomTo} />
                  </div>
                  <button
                    type="button"
                    onClick={handleCustomSearch}
                    className="flex-shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    {t('journey.picker.search')}
                  </button>
                </div>
              )}

              {filter === 'album' && (
                <div className="flex flex-1 gap-2 overflow-x-auto">
                  {albums.map((a: any) => (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => {
                        setSelectedAlbum(a.id);
                        setSelectedAlbumPassphrase(a.passphrase);
                        loadAlbumPhotos(a);
                      }}
                      className={`flex-shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                        selectedAlbum === a.id
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {a.albumName || a.name || 'Album'}
                      {a.assetCount != null ? ` (${a.assetCount})` : ''}
                    </button>
                  ))}
                  {albums.length === 0 && !loading && (
                    <span className="text-[12px] text-zinc-400">{t('journey.picker.noAlbums')}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add-to entry selector */}
        {!embedded && (
          <div className="flex-shrink-0 border-b border-zinc-200 bg-zinc-50 px-6 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="relative flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">
                {t('journey.picker.addTo')}
              </span>
              <button
                type="button"
                onClick={() => setAddToOpen(!addToOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <span className={targetEntryId ? '' : 'font-semibold'}>{targetLabel}</span>
                <ChevronRight size={12} className="rotate-90 text-zinc-400" />
              </button>
              {addToOpen && (
                <>
                  <div className="fixed inset-0 z-[9]" role="presentation" onClick={() => setAddToOpen(false)} />
                  <div className="absolute top-full left-12 z-10 mt-1 max-h-[240px] min-w-[200px] overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetEntryId(null);
                        setAddToOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] ${
                        !targetEntryId
                          ? 'bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-700 dark:text-white'
                          : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Camera size={12} />
                      {t('journey.picker.newGallery')}
                    </button>
                    {entries.filter(
                      (e) => e.type !== 'skeleton' && e.title !== 'Gallery' && e.title !== '[Trip Photos]'
                    ).length > 0 && <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-700" />}
                    {entries
                      .filter((e) => e.type !== 'skeleton' && e.title !== 'Gallery' && e.title !== '[Trip Photos]')
                      .map((e) => (
                        <button
                          type="button"
                          key={e.id}
                          onClick={() => {
                            setTargetEntryId(e.id);
                            setAddToOpen(false);
                          }}
                          className={`w-full truncate px-3 py-2 text-left text-[12px] ${
                            targetEntryId === e.id
                              ? 'bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-700 dark:text-white'
                              : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {e.title ||
                            e.location_name ||
                            new Date(e.entry_date + 'T12:00:00').toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                            })}
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Select all bar — sticky above grid */}
        {!loading &&
          sortedPhotos.length > 0 &&
          (() => {
            const selectable = sortedPhotos.filter((a: any) => !existingAssetIds.has(a.id));
            // Pages still to load on a trip or a day mean not everything is picked yet.
            const allSelected =
              selectable.length > 0 && !selectAllLoadsRest && selectable.every((a) => selected.has(a.id));
            // Every photo in view may already be in the journey while the rest of
            // the trip is not: the button is what loads that rest, so it stays.
            if (selectable.length === 0 && !selectAllLoadsRest) return null;
            return (
              <div className="flex-shrink-0 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                <button
                  type="button"
                  disabled={loadingMore}
                  aria-busy={draining}
                  onClick={() => {
                    if (allSelected) {
                      removeFromSelection(selectable);
                    } else {
                      void selectAll(selectable);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {draining ? (
                    <Loader2 size={14} className="animate-spin text-content-muted" aria-hidden="true" />
                  ) : (
                    <div
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                        allSelected
                          ? 'border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white'
                          : 'border-zinc-300 dark:border-zinc-600'
                      }`}
                    >
                      {allSelected && <Check size={9} className="text-white dark:text-zinc-900" strokeWidth={3} />}
                    </div>
                  )}
                  {allSelected ? t('journey.picker.deselectAll') : t('journey.picker.selectAll')} ({selectable.length}
                  {morePagesPending ? '+' : ''})
                </button>
              </div>
            );
          })()}

        {/* Photo grid */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
          ) : (
            <div>
              {sortedPhotos.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-zinc-500">
                    {filter === 'trip' && !tripRange.from
                      ? t('journey.trips.noTripsLinkedSettings')
                      : morePagesPending
                        ? t('common.loading')
                        : t('journey.detail.noPhotos')}
                  </p>
                </div>
              ) : (
                <div>
                  {groupPhotosByDate(sortedPhotos).map((group) => (
                    <div key={group.date}>
                      {(!embedded || filter !== 'day') && (
                        <p className="mt-4 mb-2 text-[11px] font-medium text-zinc-500 first:mt-0 dark:text-zinc-400">
                          {group.label}
                        </p>
                      )}
                      <div className="mb-1 grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
                        {group.assets.map((asset: any) => {
                          const isSelected = selected.has(asset.id);
                          const alreadyAdded = existingAssetIds.has(asset.id);
                          return (
                            <button
                              type="button"
                              key={asset.id}
                              disabled={alreadyAdded}
                              aria-pressed={isSelected}
                              aria-label={asset.city || group.label}
                              onClick={() => !alreadyAdded && toggleAsset(asset.id)}
                              className={`relative block aspect-square w-full overflow-hidden rounded-lg ${
                                alreadyAdded
                                  ? 'cursor-not-allowed opacity-40'
                                  : isSelected
                                    ? 'cursor-pointer ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-900'
                                    : 'cursor-pointer'
                              }`}
                            >
                              <img
                                src={`/api/integrations/memories/${provider}/assets/0/${asset.id}/${userId}/thumbnail${selectedAlbumPassphrase ? `?passphrase=${encodeURIComponent(selectedAlbumPassphrase)}` : ''}`}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  const original = `/api/integrations/memories/${provider}/assets/0/${asset.id}/${userId}/original${selectedAlbumPassphrase ? `?passphrase=${encodeURIComponent(selectedAlbumPassphrase)}` : ''}`;
                                  if (!img.src.includes('/original')) img.src = original;
                                }}
                              />
                              {alreadyAdded && (
                                <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-500 text-white">
                                  <Check size={12} />
                                </div>
                              )}
                              {isSelected && !alreadyAdded && (
                                <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                                  <Check size={12} />
                                </div>
                              )}
                              {asset.mediaType === 'video' && (
                                <div className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-black/60">
                                  <Play size={8} className="ml-px text-white" fill="currentColor" />
                                </div>
                              )}
                              {asset.city && (
                                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/50 to-transparent p-1">
                                  <p className="truncate text-[8px] text-white">{asset.city}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Outside the empty/grid choice on purpose: a page whose photos all
                  belong to a neighbouring day leaves the grid empty, and a sentinel
                  that only exists next to photos would never ask for the next page
                  (#2336). */}
              {canLoadMore && <ScrollTrigger onVisible={loadMorePhotos} loading={loadingMore} />}
            </div>
          )}
        </div>

        {/* Footer. The count used to sit here as its own pill as well as on the Add
            button; one of the two was always saying it twice, and inside the entry
            editor the row it took cost the grid a row of thumbnails (discussion
            #2299). Embedded, the whole bar is tighter for the same reason. */}
        <div className={`flex flex-shrink-0 items-center justify-end border-t border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50 ${embedded ? 'px-3 py-2' : 'px-6 py-4'}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-3.5 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (adding) return;
                setAdding(true);
                try {
                  const groupMap = new Map<string | undefined, Array<SelectedAsset & { assetId: string }>>();
                  for (const [assetId, pick] of selected.entries()) {
                    const g = groupMap.get(pick.passphrase) || [];
                    g.push({ ...pick, assetId });
                    groupMap.set(pick.passphrase, g);
                  }
                  // Oldest first, so an entry numbers its new photos in the order
                  // they were taken rather than the grid's newest-first (#1587).
                  const groups = [...groupMap.entries()].map(([passphrase, picks]) => {
                    const ordered = sortByCaptureTimeAsc(picks);
                    return {
                      assetIds: ordered.map((p) => p.assetId),
                      mediaTypes: ordered.map((p) => (p.mediaType === 'video' ? 'video' : 'image')),
                      passphrase,
                    };
                  });
                  await onAdd(groups, targetEntryId);
                } finally {
                  setAdding(false);
                }
              }}
              disabled={addDisabled}
              className="rounded-lg bg-zinc-900 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {adding ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-white dark:border-t-zinc-900" />
              ) : (
                <>
                  {t('common.add')} {selected.size > 0 ? `(${selected.size})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
